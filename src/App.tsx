import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { FolderTree } from './components/FolderTree.tsx';
import { Treemap } from './components/Treemap.tsx';
import { ExtensionStats } from './components/ExtensionStats.tsx';
import { ScanProgress } from './components/ScanProgress.tsx';
import { ContextMenu } from './components/ContextMenu.tsx';
import { TreeNode } from './utils/treemapLayout.ts';
import { formatBytes } from './utils/formatters.ts';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [path, setPath] = useState('/Users/admin');
  const [activeScanPath, setActiveScanPath] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [tree, setTree] = useState<TreeNode | null>(null);
  
  // Stats
  const [stats, setStats] = useState<{
    totalSize: number;
    filesCount: number;
    foldersCount: number;
    skippedCount: number;
    duration: number;
  } | null>(null);

  // Scan Progress
  const [progress, setProgress] = useState<{
    currentPath: string;
    filesScanned: number;
    foldersScanned: number;
    unreadableCount: number;
    elapsedTime: number;
  } | null>(null);

  // Interactivity
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [highlightedExtension, setHighlightedExtension] = useState<string | null>(null);
  
  // Custom Overlays
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: any } | null>(null);
  const [confirmDeleteNode, setConfirmDeleteNode] = useState<any | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleSelectFolder = async () => {
    try {
      const response = await fetch('/api/pick-folder');
      const data = await response.json();
      if (data.success && data.path) {
        setPath(data.path);
      }
    } catch (err) {
      console.error('Failed to trigger native folder picker:', err);
    }
  };

  const handleStartScan = () => {
    if (!path.trim()) return;

    // Reset previous states
    setTree(null);
    setStats(null);
    setSelectedPath(null);
    setSelectedNode(null);
    setHighlightedExtension(null);
    setExpandedPaths(new Set([path])); // Start with root expanded
    setActiveScanPath(path);
    setIsScanning(true);

    const startTime = Date.now();
    setProgress({
      currentPath: '',
      filesScanned: 0,
      foldersScanned: 0,
      unreadableCount: 0,
      elapsedTime: 0,
    });

    // Start timer for duration
    progressTimerRef.current = window.setInterval(() => {
      setProgress(prev => prev ? { ...prev, elapsedTime: Date.now() - startTime } : null);
    }, 100);

    const url = `/api/scan?path=${encodeURIComponent(path)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'progress') {
        setProgress(prev => prev ? {
          ...prev,
          currentPath: data.currentPath,
          filesScanned: data.filesScanned,
          foldersScanned: data.foldersScanned,
          unreadableCount: data.unreadableItemsCount,
        } : null);
      } else if (data.type === 'complete') {
        // Stop scanning
        eventSource.close();
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        
        setIsScanning(false);
        setProgress(null);
        setTree(data.tree);
        
        setStats({
          totalSize: data.tree.size,
          filesCount: data.filesScanned,
          foldersCount: data.foldersScanned,
          skippedCount: data.unreadableItemsCount,
          duration: Date.now() - startTime,
        });

        // Trigger confetti burst
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#a855f7', '#22c55e', '#06b6d4', '#eab308']
        });
      } else if (data.type === 'error') {
        eventSource.close();
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsScanning(false);
        setProgress(null);
        alert(`Scan failed: ${data.message}`);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      eventSource.close();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setIsScanning(false);
      setProgress(null);
      alert('Connection to server lost. Scan aborted.');
    };
  };

  const handleCancelScan = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    setIsScanning(false);
    setProgress(null);
  };

  const handleToggleExpand = (folderPath: string) => {
    const nextExpanded = new Set(expandedPaths);
    if (nextExpanded.has(folderPath)) {
      nextExpanded.delete(folderPath);
    } else {
      nextExpanded.add(folderPath);
    }
    setExpandedPaths(nextExpanded);
  };

  // Sync selection: Auto-expand parents when selecting a file from the treemap
  const handleSelectPathFromTreemap = (filePath: string) => {
    setSelectedPath(filePath);
    
    // Auto-expand all parent folder nodes
    const newExpanded = new Set(expandedPaths);
    let parent = filePath;
    while (parent && parent !== activeScanPath && parent !== '/') {
      const idx = parent.lastIndexOf('/');
      if (idx <= 0) break;
      parent = parent.substring(0, idx);
      newExpanded.add(parent);
    }
    newExpanded.add(activeScanPath); // Ensure root path is expanded
    setExpandedPaths(newExpanded);
  };

  const handleSelectNode = (node: any) => {
    setSelectedPath(node.path);
    setSelectedNode(node);
  };

  // Context Menu operations
  const handleContextMenu = (e: React.MouseEvent, node: any) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  const handleReveal = async () => {
    if (!selectedPath) return;
    try {
      await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedPath }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveToTrash = async () => {
    if (!selectedPath) return;
    const isConfirmed = window.confirm(`Are you sure you want to move "${selectedNode?.name || selectedPath}" to the Trash?`);
    if (!isConfirmed) return;

    try {
      const response = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedPath }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Item moved to Trash successfully. Please re-run scan to update stats.');
      } else {
        alert('Failed to move item to Trash: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDeleteNode) return;
    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: confirmDeleteNode.path }),
      });
      const data = await response.json();
      if (data.success) {
        setConfirmDeleteNode(null);
        alert('Item permanently deleted. Please re-run scan to update stats.');
      } else {
        alert('Failed to delete item: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 0%, #0f172a 0%, #030712 100%)',
      gap: '16px',
      overflow: 'hidden',
    }}>
      {/* Header Panel */}
      <Header
        path={path}
        setPath={setPath}
        isScanning={isScanning}
        onSelectFolder={handleSelectFolder}
        onStartScan={handleStartScan}
        stats={stats}
      />

      {/* Main Content Workspace Split */}
      {tree ? (
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr 1fr', // Split top/bottom (50/50)
          gap: '16px',
          flex: 1,
          minHeight: 0,
        }}>
          {/* Top Panel - Split Tree Grid (65%) and Extension Stats (35%) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr',
            gap: '16px',
            minHeight: 0,
          }}>
            <FolderTree
              tree={tree}
              expandedPaths={expandedPaths}
              onToggleExpand={handleToggleExpand}
              selectedPath={selectedPath}
              onSelectNode={handleSelectNode}
              onContextMenu={handleContextMenu}
            />

            <ExtensionStats
              tree={tree}
              highlightedExtension={highlightedExtension}
              onHighlightExtension={setHighlightedExtension}
            />
          </div>

          {/* Bottom Panel - Squarified Treemap Canvas (100% width) */}
          <div style={{ minHeight: 0 }}>
            <Treemap
              tree={tree}
              selectedPath={selectedPath}
              onSelectPath={handleSelectPathFromTreemap}
              highlightedExtension={highlightedExtension}
              onContextMenu={handleContextMenu}
            />
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '4rem',
            animation: 'float 3s ease-in-out infinite',
          }}>
            📂
          </div>
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-brand)', marginBottom: '8px' }}>
              No Folder Scanned
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.9rem' }}>
              Select a directory above and click <strong>Scan</strong> to generate a breakdown of disk space.
            </p>
          </div>
        </div>
      )}

      {/* SSE Scan Progress Modal Overlay */}
      {isScanning && progress && (
        <ScanProgress
          currentPath={progress.currentPath}
          filesScanned={progress.filesScanned}
          foldersScanned={progress.foldersScanned}
          unreadableCount={progress.unreadableCount}
          elapsedTime={progress.elapsedTime}
          onCancel={handleCancelScan}
        />
      )}

      {/* Floating Custom Right-Click Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onReveal={handleReveal}
          onTrash={handleMoveToTrash}
          onDelete={() => setConfirmDeleteNode(contextMenu.node)}
        />
      )}

      {/* Confirm Permanent Delete Dialog Modal */}
      {confirmDeleteNode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.95)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="glass-panel" style={{
            width: '450px',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}>
                <ShieldAlert size={28} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-brand)', color: '#ef4444', marginBottom: '6px' }}>
                  Confirm Permanent Deletion
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Are you absolutely sure you want to permanently delete:
                </p>
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#fff',
                  wordBreak: 'break-all',
                  margin: '10px 0',
                }}>
                  {confirmDeleteNode.path}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#f43f5e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} />
                  This action is irreversible and bypasses the Trash!
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setConfirmDeleteNode(null)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
