# STL-Manager 

STL-Manager is a powerful, local 3D model management application designed to seamlessly organize, preview, and interact with your STL files.

## Features

- **Automated Scanning**: Add directories to automatically monitor for new STL files.
- **3D Viewer**: Preview your STL files directly in the browser.
- **Organization**: Categorize your models using custom tags and statuses.
- **Duplicate Detection**: Automatically detects duplicate files using content hashing to save disk space.
- **Slicer Integration**: Open your 3D models directly in your preferred slicer straight from the app.
- **Local First**: Everything runs locally using a Python FastAPI backend and a React (Vite) frontend.

## Getting Started

### 1. Server Installation (Portable)
1. Download or clone this repository.
2. Run `run_portable.bat` to launch the application. This script will automatically use the embedded Python environment and build the frontend if necessary.
3. The server will start and automatically open your browser at `http://localhost:8000`.
4. **First steps:** Click on **Settings** to add the directories where you store your 3D models and specify the path to your slicer executable (e.g., PrusaSlicer or BambuStudio).

### 2. Chrome Extension Installation (Optional but Recommended)
The "STL-Manager Tracker" extension intercepts your downloads from sites like Makerworld or Thingiverse and automatically sends the correct source URL to the STL-Manager. This allows you to revisit the original model page with one click!

1. Open Google Chrome (or Microsoft Edge / Brave).
2. Type `chrome://extensions` in the address bar and hit Enter.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click on **Load unpacked** (top left).
5. Select the `chrome-extension` folder located inside your STL-Manager directory.
6. Done! From now on, whenever you download an STL or 3MF file, the exact URL will be saved in your STL-Manager library.

## Updates

STL-Manager includes a built-in auto-updater so you don't have to manually download ZIP files anymore!

1. Make sure the server is closed.
2. Double-click the **`update.bat`** file in your STL-Manager directory.
3. The script will automatically download the latest version from GitHub and install missing Python dependencies, while keeping your personal settings, cache, and library intact.

## Tech Stack

- **Backend**: Python (FastAPI, Uvicorn)
- **Frontend**: React (Vite)
