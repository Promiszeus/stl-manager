---
name: stl-manager
description: >-
  Comprehensive guide and workflow runbook for developing, building, testing, and maintaining
  the STL-Manager project (3D printing model library & multi-platform online hub).
  Use this skill whenever working on STL-Manager backend, frontend, scanner, thumbnailer,
  online search feeds, or deployment scripts.
---

# STL-Manager Development & Maintenance Skill

This skill provides step-by-step instructions, architectural patterns, and validation runbooks for developing and maintaining **STL-Manager**.

---

## 🏛️ Architecture Overview

STL-Manager consists of a portable Python (FastAPI) backend serving a compiled React 19 (Vite + TypeScript) frontend, with multi-platform 3D model aggregation and local filesystem indexing.

* **Backend:** FastAPI, Uvicorn, Trimesh, PyVista, Pillow (`backend/`)
* **Frontend:** React 19, TypeScript, Vite, Three.js, Lucide Icons (`frontend/`)
* **Environment:** Portable embedded Python (`python_embeded/python.exe`) or venv, configurable port (`port.txt`)
* **Storage:** Local JSON database (`backend/models.json`, `backend/settings.json`)
* **Detailed Architecture Reference:** See [references/architecture.md](./references/architecture.md)

---

## 🔄 Common Development Workflows

### 1. Frontend Development & Build
When modifying any UI component (`frontend/src/*.tsx`, `index.css`, `i18n.ts`):

1. Make edits in `frontend/src/`.
2. Build the production assets:
   ```powershell
   cd frontend
   npm run build
   cd ..
   ```
3. Verify that `frontend/dist/index.html` and `frontend/dist/assets/` were updated.

### 2. Restarting & Testing the Backend Server
After changing backend code (`backend/*.py`) or building the frontend:

1. **Stop existing instance:**
   ```powershell
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue
   ```
2. **Start backend (using embedded Python or current environment):**
   ```powershell
   & "F:\STL-Manager\python_embeded\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   *(Or read port dynamically from `port.txt` if customized)*
3. **Verify API endpoints:**
   * Health & Models: `http://localhost:8000/api/models`
   * Settings: `http://localhost:8000/api/settings`
   * Online Search / Trends: `http://localhost:8000/api/online/search?mode=daily`

### 3. Adding New Features or Modifying Feeds
* **Online Search / Scrapers:** Modify `backend/online_search.py` and test with standalone python scripts before updating frontend state.
* **3D Viewer / Rendering:** Keep CPU-friendly fallbacks in `backend/thumbnailer.py` and `frontend/src/ThreeViewer.tsx`.
* **Internationalization:** Whenever adding user-facing text, always update both `de` and `en` dictionaries in `frontend/src/i18n.ts`.

---

## 🧪 Verification & Quality Checklist

Before committing changes:
1. `npm run build` succeeds without TypeScript or Vite errors.
2. Backend starts cleanly without missing imports.
3. Test key user journeys:
   - [ ] Local Library: Grid/List view, sort by modification date (`mtime`), tag filtering.
   - [ ] Online Hub: Daily trends, monthly trends, newest feed, category cards, search query.
   - [ ] 3D Preview: Interactive Three.js model inspection.
   - [ ] Slicer Launcher: Verify executable dispatch (`/api/open-slicer`).
4. Ensure `.gitignore` excludes `python_embeded/`, `node_modules/`, `logs/`, and `.env`.

---

## 📚 Detailed References
* [Architecture & Data Flow](./references/architecture.md)
* [Runbooks & Troubleshooting](./references/workflows.md)
