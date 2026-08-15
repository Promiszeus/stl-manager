# 🚀 STL-Manager

**STL-Manager** is a powerful, local web application designed to organize, preview, and manage your 3D printing files (STL & 3MF) – featuring an integrated multi-platform online search across major 3D model repositories!

---

## ✨ Features & Highlights

* 📁 **Automated Directory Monitoring:** Live-monitors any number of folders on your hard drive and instantly adds newly downloaded STL and 3MF files to your library.
* 👁️ **Built-in 3D Viewer & Thumbnails:** Generates high-resolution 3D renders automatically and includes an interactive 3D model inspector right in your browser.
* 🏷️ **Tag System with Color Customizer:** Categorize models with custom tags and colors, with quick filters for tags or untagged files.
* 🔍 **Smart Duplicate Finder:** Identifies true binary content duplicates using MD5 content hashing to save disk space.
* 🔪 **Multi-Slicer Integration:** Launch 3D models with one click directly into your preferred slicer (*PrusaSlicer, Bambu Studio, OrcaSlicer, Cura, etc.*).
* 🌐 **Multi-Platform Online Search:** Search **MakerWorld**, **Printables**, **Cults 3D**, **Thingiverse**, **MakerOnline**, and **Creality Cloud** simultaneously from the persistent sidebar with quick filters and seamless downwards pagination (*"Load More Models"*).
* 🧩 **Chrome Extension:** Automatically captures and links the original model overview page whenever you download from 3D printing websites.
* ⚙️ **Configurable Port (`port.txt`):** Easily customize the server port to whatever you prefer.
* 🔄 **1-Click Auto-Updater (`update.bat`):** Automatically stops the running server, pulls updates from GitHub, updates dependencies, and restarts the server.

---

## 🚀 Getting Started

### 1. Standard Start (Console Window)
Simply double-click **`run_portable.bat`**.
* Launches the server portably using the embedded Python environment.
* Automatically opens your default web browser at `http://localhost:8000`.

---

### 2. Silent Windows Autostart (Background Execution)
If you want STL-Manager to start automatically and **run completely invisibly in the background** on Windows boot:

1. Press **`Windows Key + R`** on your keyboard.
2. Type **`shell:startup`** and press **Enter** (this opens your Windows Startup folder).
3. Open your `STL-Manager` directory, **right-click on `start-manger-hidden.vbs`**, and select **"Create shortcut"**.
4. Move or drag this newly created shortcut into the Startup folder.
5. **Done!** STL-Manager will now launch silently in the background whenever Windows starts.

---

## ⚙️ Custom Port Configuration (`port.txt`)

By default, the server listens on port `8000`. If you wish to change the port (e.g., to `8080` or `9000`):

1. Open the file **`port.txt`** located in the root directory with any text editor.
2. Enter your desired port number (e.g., `8080`) and save the file.
3. Restart the server – `run_portable.bat`, `stop_server.bat`, and the background autostart script will automatically use the new port!

---

## ⏹️ Stopping the Server (`stop_server.bat`)

Double-click **`stop_server.bat`**:
* Dynamically detects and terminates all active STL-Manager / Uvicorn server processes.
* Closes the ports cleanly regardless of the port number configured.

---

## 🔄 Updates (`update.bat`)

To update your STL-Manager to the latest version:

1. Double-click **`update.bat`**.
2. The script will:
   - Automatically stop any running server instance.
   - Download the latest code from GitHub.
   - Install/verify required Python packages.
   - **Automatically restart the server when finished!**
3. Your database (`models.json`), personal settings (`settings.json`), tags, cache, and custom ports remain 100% preserved.

---

## 🧩 Chrome Extension (STL-Manager Tracker)

The browser extension ensures that downloading a model from MakerWorld, Printables, Thingiverse, etc. automatically associates the original presentation webpage URL with the file:

1. Open Google Chrome (or Edge / Brave).
2. Navigate to `chrome://extensions` in the address bar.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** (top-left).
5. Select the `chrome-extension` folder inside your STL-Manager directory.
6. Done! Future downloads will have their web source link automatically attached.

---

## 🛠️ Tech Stack

* **Backend:** Python (FastAPI, Uvicorn, Trimesh, PyVista)
* **Frontend:** React, TypeScript, Vite, Lucide Icons, Three.js
