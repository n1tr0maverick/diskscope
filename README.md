# DiskScope 📊

A high-performance, dark-themed, and glassmorphic disk usage statistics viewer and cleanup tool for macOS, inspired by WinDirStat. 

It provides an interactive visual tree representation of directories and files, along with file extension cumulative data and a custom canvas-based squarified treemap.

---

## 🛡️ Privacy & Local-Only Design

This application has been engineered to run **100% locally and offline**:
* **Zero Telemetry / Analytics**: No user tracking, analytics packages, or data uploads are included.
* **No Remote APIs**: The backend communicates directly with the local file system using Node's `fs` module.
* **Offline-First Styling**: All styles are vanilla CSS, and typography uses macOS native system fonts (`SF Pro`), eliminating calls to external font repositories (like Google Fonts).
* **Native Desktop Integrations**: Uses AppleScript (`osascript`) locally to trigger native macOS directory picker dialogs and native Finder "Move to Trash" commands.

---

## ✨ Features

* **macOS Folder Picker**: Pressing "Select Folder" prompts you with the native Finder directory selector dialog.
* **Real-time SSE Scanner**: Streams disk scanning progress (folders/s speed and path traversal) recursively.
* **Smart Pruning**: Subdirectories with more than 80 files automatically group small items together to conserve memory and render instantaneously in the browser.
* **Interactive Canvas Treemap**: Displays file sizes visually as color-coded squarified blocks. Clicking a block focuses and expands the file in the directory list.
* **Extension Statistics**: Sorts cumulative disk space usage by file extension. Clicking an extension highlights all matching files on the canvas.
* **Desktop Operations**: Right-clicking any item enables you to:
  * *Reveal in Finder*: Opens Finder and highlights the item.
  * *Move to Trash*: Safely trashes it using Finder's native delete hook (enables "Put Back").
  * *Delete Permanently*: Irreversibly deletes files bypassing trash (with system warning dialog).

---

## 🏃 Run Instructions

1. **Install Dependencies** (downloads standard npm modules locally):
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```

3. **Open App**:
   Navigate your browser to:
   👉 **[http://localhost:3000](http://localhost:3000)**
