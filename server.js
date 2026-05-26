import express from 'express';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Native macOS folder picker endpoint
app.get('/api/pick-folder', (req, res) => {
  // AppleScript command to select a folder
  const script = `osascript -e 'POSIX path of (choose folder with prompt "Select a folder to scan")'`;
  
  exec(script, (err, stdout, stderr) => {
    if (err) {
      console.warn('AppleScript picker cancelled or failed, returning default:', stderr);
      return res.json({ success: false, defaultPath: os.homedir() });
    }
    const selectedPath = stdout.trim();
    res.json({ success: true, path: selectedPath });
  });
});

// SSE-based Scan endpoint
app.get('/api/scan', async (req, res) => {
  const scanPath = req.query.path;
  if (!scanPath) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }

  // Verify path exists
  if (!existsSync(scanPath)) {
    return res.status(400).json({ error: 'Provided path does not exist' });
  }

  // Setup SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let aborted = false;
  let filesScanned = 0;
  let foldersScanned = 0;
  let unreadableItemsCount = 0;
  let lastUpdate = Date.now();

  req.on('close', () => {
    aborted = true;
    console.log(`Scan for ${scanPath} cancelled by client.`);
  });

  const sendProgress = (currentPath) => {
    const now = Date.now();
    if (now - lastUpdate > 100) { // Throttle updates to ~10 per second
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        filesScanned,
        foldersScanned,
        unreadableItemsCount,
        currentPath: path.basename(currentPath)
      })}\n\n`);
      lastUpdate = now;
    }
  };

  const scanNode = async (nodePath) => {
    if (aborted) return null;

    const name = path.basename(nodePath) || nodePath;
    let stats;
    try {
      stats = await fs.lstat(nodePath);
    } catch (err) {
      unreadableItemsCount++;
      return null;
    }

    // Skip symbolic links to prevent infinite loops
    if (stats.isSymbolicLink()) {
      return null;
    }

    if (stats.isFile()) {
      filesScanned++;
      sendProgress(nodePath);
      const ext = path.extname(name).toLowerCase();
      return {
        name,
        size: stats.size,
        type: 'file',
        ext: ext || 'none',
        path: nodePath
      };
    }

    if (stats.isDirectory()) {
      foldersScanned++;
      sendProgress(nodePath);

      let entries = [];
      try {
        entries = await fs.readdir(nodePath, { withFileTypes: true });
      } catch (err) {
        // Permission denied or unreadable folder
        unreadableItemsCount++;
        return {
          name,
          size: 0,
          type: 'directory',
          children: [],
          path: nodePath,
          error: true
        };
      }

      let children = [];
      let totalSize = 0;
      let filesCount = 0;
      let foldersCount = 0;

      for (const entry of entries) {
        if (aborted) return null;
        const childPath = path.join(nodePath, entry.name);
        
        if (entry.isDirectory()) {
          const childNode = await scanNode(childPath);
          if (childNode) {
            children.push(childNode);
            totalSize += childNode.size;
            foldersCount += 1 + (childNode.foldersCount || 0);
            filesCount += childNode.filesCount || 0;
          }
        } else if (entry.isFile()) {
          filesScanned++;
          try {
            const fileStats = await fs.stat(childPath);
            const ext = path.extname(entry.name).toLowerCase();
            const fileNode = {
              name: entry.name,
              size: fileStats.size,
              type: 'file',
              ext: ext || 'none',
              path: childPath
            };
            children.push(fileNode);
            totalSize += fileStats.size;
            filesCount++;
          } catch (e) {
            unreadableItemsCount++;
          }
        }
      }

      // Smart Grouping for high performance:
      // If a folder has a massive number of files, group small ones.
      const subdirs = children.filter(c => c.type === 'directory');
      const files = children.filter(c => c.type === 'file');

      let finalFiles = files;
      if (files.length > 80) {
        // Sort files by size descending
        files.sort((a, b) => b.size - a.size);
        const largeFiles = files.slice(0, 50); // Keep top 50
        const smallFiles = files.slice(50);
        const smallFilesSize = smallFiles.reduce((sum, f) => sum + f.size, 0);

        if (smallFiles.length > 0) {
          largeFiles.push({
            name: `Other small files (${smallFiles.length} items)`,
            size: smallFilesSize,
            type: 'file',
            ext: '.other-small-files',
            path: path.join(nodePath, '__others__'),
            isVirtual: true
          });
        }
        finalFiles = largeFiles;
      }

      const finalChildren = [...subdirs, ...finalFiles];
      finalChildren.sort((a, b) => b.size - a.size);

      return {
        name,
        size: totalSize,
        type: 'directory',
        children: finalChildren,
        filesCount,
        foldersCount,
        path: nodePath
      };
    }

    return null;
  };

  try {
    const rootNode = await scanNode(scanPath);
    if (aborted) return;

    if (!rootNode) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Could not scan directory' })}\n\n`);
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      filesScanned,
      foldersScanned,
      unreadableItemsCount,
      tree: rootNode
    })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Scan error:', err);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }
});

// Reveal in macOS Finder
app.post('/api/reveal', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ success: false, error: 'Path is required' });
  }

  const escapedPath = filePath.replace(/"/g, '\\"');
  exec(`open -R "${escapedPath}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Reveal error:', stderr);
      return res.status(500).json({ success: false, error: 'Could not reveal file in Finder' });
    }
    res.json({ success: true });
  });
});

// Move to trash endpoint
app.post('/api/trash', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ success: false, error: 'Path is required' });
  }

  const escapedPath = filePath.replace(/"/g, '\\"');
  // AppleScript deletes POSIX file (moves it to the Trash natively)
  const script = `osascript -e 'tell application "Finder" to delete POSIX file "${escapedPath}"'`;

  exec(script, (err, stdout, stderr) => {
    if (err) {
      console.warn('Finder Trash script failed, trying fallback to ~/.Trash:', stderr);
      
      // Fallback: Rename file path into user's ~/.Trash folder
      const trashDest = path.join(os.homedir(), '.Trash', path.basename(filePath));
      fs.rename(filePath, trashDest)
        .then(() => {
          res.json({ success: true, method: 'fallback-rename' });
        })
        .catch((renameErr) => {
          console.error('Rename trash error:', renameErr);
          res.status(500).json({ success: false, error: 'Permission denied or file not found' });
        });
    } else {
      res.json({ success: true, method: 'applescript' });
    }
  });
});

// Delete permanently endpoint
app.post('/api/delete', async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ success: false, error: 'Path is required' });
  }

  try {
    await fs.rm(filePath, { recursive: true, force: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete permanently error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend in production or start Vite in dev mode
const setupFrontend = async () => {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }
};

await setupFrontend();

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  MacDirStat is running on: http://localhost:${PORT}`);
  console.log(`  Mode: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}`);
  console.log(`=========================================`);
});
