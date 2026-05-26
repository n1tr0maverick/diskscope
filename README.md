# DiskScope 📊

A high-performance, dark-themed, and glassmorphic disk usage statistics viewer and cleanup tool for macOS, inspired by WinDirStat. 

DiskScope recursively scans directories and produces a visual, interactive breakdown of your hard drive, combining a hierarchical tree grid, extension category statistics, and a canvas-based squarified treemap.

---

## 🛡️ Privacy & Local-Only Design

DiskScope is engineered to run **100% locally and offline**:
* **Zero Telemetry / Uploads**: No analytics packages, tracking, or data uploads are present.
* **Local Processing**: File scanning is conducted directly on your machine via a local Node.js Express server.
* **Offline styling**: Built with vanilla CSS and native macOS system typography (`SF Pro`), making no requests to external font servers (like Google Fonts).
* **Finder Integration**: AppleScript (`osascript`) commands run strictly local processes to trigger Finder actions.

---

## ⚙️ macOS Prerequisites

Before setting up DiskScope, make sure you have **Node.js** and **npm** installed on your Mac:

### 1. Check if Node.js is installed:
Open the **Terminal** app and run:
```bash
node -v
npm -v
```

### 2. Install Node.js (if not already installed):
* **Option A (Recommended for developers)**: Install via [Homebrew](https://brew.sh):
  ```bash
  brew install node
  ```
* **Option B**: Download the macOS installer directly from the official [Node.js Website](https://nodejs.org/).

---

## 📥 Setup & Installation

1. **Download or Clone** this repository to your local machine.
2. **Open Terminal** and navigate into the project directory:
   ```bash
   cd /path/to/disk-scope
   ```
3. **Install Dependencies** (installs standard Node modules locally):
   ```bash
   npm install
   ```

---

## 🏃 Run Instructions

DiskScope can be run in two modes:

### Mode A: Development Mode (Hot-Reloading)
*Best for editing code. Runs the Express API and Vite Dev Server concurrently.*

1. **Launch the server**:
   ```bash
   npm run dev
   ```
2. **Open the browser**:
   Navigate to 👉 **[http://localhost:3000](http://localhost:3000)**

---

### Mode B: Production Mode (Recommended for Speed)
*Best for scanning large drives. Vite compiles and minifies the React files into a highly optimized static bundle served directly by Express, using minimal system resources.*

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
2. **Start the production server**:
   ```bash
   npm start
   ```
3. **Open the browser**:
   Navigate to 👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 macOS Permissions Note

Because DiskScope communicates with system resources to offer a native experience, you may encounter the following standard macOS dialogs:

1. **"Terminal" would like to control "Finder"**: 
   * *When it happens*: The first time you click "Select Folder" (which triggers AppleScript to open the native Finder directory selector) or right-click to "Move to Trash".
   * *What to do*: Click **OK**. This permits the local script to pop open the Finder folder selector and natively interact with your macOS Trash folder.
2. **Full Disk Access**:
   * *When it happens*: If you attempt to scan system folders like `/Library` or the root drive `/` and the scan returns many unreadable files.
   * *What to do*: If you want DiskScope to analyze system directories, grant your Terminal app "Full Disk Access" in *System Settings > Privacy & Security > Full Disk Access*. (Scanning standard user folders like `Downloads`, `Documents`, or `Desktop` does not require this).

---

## 🕹️ How to Use DiskScope

1. **Pick a Directory**: Click **Select Folder** to launch the native macOS directory picker, or type an absolute path directly in the search bar (e.g., `/Users/yourusername/Downloads`).
2. **Scan**: Click **Scan** to begin. The progress screen will display the scanning throughput (items/second) and elapsed time.
3. **Analyze**:
   * **The Tree Grid (Top Left)**: Shows folders sorted by size. Click the arrows to expand/collapse directories.
   * **Extension Stats (Top Right)**: Groups files by type (Media, Code, Documents, Archives). Click any row (e.g. `.dmg`) to highlight only those files on the canvas below.
   * **The Treemap (Bottom)**: Visualizes files as colored rectangles. The size of the rectangle is proportional to the file size. Hover over a block to see its path. Click a block to automatically expand and select it in the Tree Grid.
4. **Clean Up (Right-Click Menu)**:
   Right-click any row in the Tree Grid or block in the Treemap to activate:
   * **Reveal in Finder**: Highlights the file inside the macOS Finder.
   * **Move to Trash**: Sends the file to the Finder Trash (retains the "Put Back" option).
   * **Delete Permanently**: Irreversibly deletes the file (prompts for safety confirmation first).
