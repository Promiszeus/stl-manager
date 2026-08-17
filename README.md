# 🚀 STL-Manager

**STL-Manager** is a modern, high-performance web application designed to organize, preview, and manage your 3D printing files (STL & 3MF) – featuring an integrated multi-platform online model explorer across major 3D printing repositories!

---

## ✨ Features & Highlights

### 📁 Local Library & Management
* 📂 **Automated Directory Monitoring:** Live-monitors local and network folders, automatically registering new STL and 3MF files into your library.
* 👁️ **Built-in 3D Viewer & High-Res Thumbnails:** Automatically generates multi-angle 3D renders and includes an interactive 3D model inspector right in your browser.
* 🤖 **AI-Powered Visual Similarity Search (Meta DINOv2):** 100% local, offline AI engine that analyzes 3D renders to instantly find visually and geometrically similar models, remixes, and shape variants.
* 🕒 **Windows File Modification Date Sorting:** Sort your models by actual filesystem modification timestamps (`mtime`), date added, file size, or alphabetically.
* 🏷️ **Tag System with Color Customizer:** Categorize models with custom tags and custom colors, with instant 1-click filters for tags or untagged files.
* 🔍 **Smart Duplicate Finder:** Identifies true binary content duplicates using MD5 content hashing to save valuable disk storage.
* 🔪 **Multi-Slicer 1-Click Launch:** Send 3D models directly into your preferred slicer (*PrusaSlicer, Bambu Studio, OrcaSlicer, Cura, etc.*).
* 🎯 **Modern Batch Action Bar:** Sleek floating toolbar for multi-selecting models, batch toggling printed status, or batch deleting.
* ⌨️ **Search Command Palette (`Ctrl + K` / `/`):** Fast, centered popup search with auto-focus, tag filters, category shortcuts, and search history.

### 🌐 Multi-Platform Online Model Hub (MakerWorld Aesthetic)
* 🔍 **Simultaneous Multi-Platform Search:** Search **MakerWorld**, **Printables**, **Cults 3D**, **Thingiverse**, **MakerOnline**, and **Creality Cloud** simultaneously with live result counters and infinite pagination (*"Load More Models"*).
* 🏆 **3D Design Contests Hub:** Explore official 3D design competitions and challenges across MakerWorld, Printables, Cults 3D, and Creality with 1-click contest model searches and direct portal links.
* 🗂️ **Explore Categories & Topics:** Dedicated category cards to explore popular 3D printing themes (*Toys, Art, Tools, Storage, Gaming, Planters, RC etc.*).
* 📈 **Trend Discovery:** 1-Click access to *Daily Trends (24h Top)*, *Monthly Trends*, and *Newest* releases.
* 🔒 **Secure Platform Account Storage (Windows DPAPI):** Store logins and session tokens for MakerWorld, Printables, Cults 3D, Thingiverse, and Creality Cloud encrypted directly with your Windows user credentials – zero plaintext passwords.
* 🌍 **Bilingual Support (DE / EN):** Seamlessly toggle between German (`🇩🇪 Deutsch`) and English (`🇬🇧 English`) with persistent language storage.
* 📱 **Full Responsive Design:** Tailored for Desktop workstations, Tablets, and Smartphones with a floating glassmorphic bottom dock and touch-friendly layouts.

### 🧩 Integrations & Portability
* 🧩 **Browser Extensions (Chrome & Firefox):** Automatically captures and links the original model overview page whenever you download from 3D printing websites.
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

## 🧩 Browser Extensions (Chrome & Firefox Tracker)

The browser extension ensures that downloading a model from MakerWorld, Printables, Thingiverse, Cults3D, etc. automatically associates the original presentation webpage URL with the file in your STL-Manager library.

### 🌐 Google Chrome / Edge / Brave
1. Open your Chromium-based browser.
2. Navigate to `chrome://extensions` in the address bar.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** (top-left).
5. Select the `chrome-extension` folder inside your STL-Manager directory.

### 🦊 Mozilla Firefox
1. Open Mozilla Firefox.
2. Navigate to `about:debugging#/runtime/this-firefox` in the address bar.
3. Click on **Load Temporary Add-on...** (Temporäres Add-on laden...).
4. Select the `manifest.json` file inside the `firefox-extension/` directory.
5. Done! Future downloads in Firefox will have their model source link automatically attached.

---

## 🛠️ Tech Stack

* **Backend:** Python (FastAPI, Uvicorn, ONNX Runtime, Meta DINOv2 AI, Trimesh, PyVista, Pillow, Windows DPAPI)
* **Frontend:** React 19, TypeScript, Vite, Lucide Icons, Three.js
* **Extensions:** Chromium Manifest V3 & Mozilla Firefox WebExtension
