# STL-Manager Architecture & Data Flow Reference

## 📁 Project Structure

```
STL-Manager/
├── .agents/skills/stl-manager/ # Workspace Skill configuration
├── backend/                    # Python FastAPI Backend
│   ├── main.py                 # Core API router, static file hosting, lifecycle
│   ├── database.py             # JSON persistence for models & settings
│   ├── scanner.py              # File indexing, watchdog filesystem listener, mtime tracking
│   ├── thumbnailer.py          # 3D mesh render dispatcher
│   ├── render_worker.py        # Offscreen PyVista / Trimesh worker
│   ├── online_search.py        # Multi-platform aggregators (3Drop, Cults, etc.)
│   ├── models.json             # Indexed 3D files registry
│   └── settings.json           # App settings (folders, slicer paths, preferences)
├── frontend/                   # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── App.tsx             # Main layout, library grid, batch toolbar, settings modal
│   │   ├── OnlineSearch.tsx    # Multi-platform explorer, categories, trend feeds, contests
│   │   ├── ThreeViewer.tsx     # WebGL 3D model viewer (Three.js)
│   │   ├── SearchModal.tsx     # Command palette (Ctrl+K)
│   │   ├── FileBrowserModal.tsx# Directory picker modal
│   │   ├── i18n.ts             # DE/EN translation mappings
│   │   └── index.css           # Glassmorphism design tokens & styles
│   └── dist/                   # Production build output served by FastAPI
├── chrome-extension/           # Browser extension for capturing source URLs on download
├── python_embeded/             # Portable Windows Python runtime
├── port.txt                    # Configured HTTP port (default 8000)
├── run_portable.bat            # Windows console launcher
├── start-manger-hidden.vbs     # Silent background autostart launcher
├── stop_server.bat             # Process killer script
└── update.bat                  # 1-Click Git updater and server restarter
```

---

## ⚙️ Core Subsystems

### 1. File Scanner & Storage (`scanner.py`, `database.py`)
* Scans configured directories recursively for `.stl` and `.3mf` files.
* Computes MD5 checksum for binary deduplication.
* Reads actual filesystem modification timestamp (`os.path.getmtime`) for accurate sorting.
* Automatically schedules background thumbnail generation for unrendered models.

### 2. Multi-Platform Online Aggregator (`online_search.py`)
* Queries dynamic endpoints (3Drop API) covering MakerWorld, Printables, Thingiverse, MakerOnline, and Creality Cloud.
* Scrapes Cults 3D in parallel via `ThreadPoolExecutor`.
* Supports `mode="daily"`, `mode="monthly"`, and `mode="newest"` for genuine trending feeds.
* Implements in-memory cache to minimize latency and redundant network calls.

### 3. Frontend & i18n (`App.tsx`, `OnlineSearch.tsx`, `i18n.ts`)
* Dual view modes: Local 3D Library & Online Model Hub.
* Glassmorphism dark UI with smooth transitions and responsive mobile bottom dock.
* Persistent language context supporting German (`de`) and English (`en`).
