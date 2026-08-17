# STL-Manager Agent Guidelines & Project Rules

This document outlines mandatory guidelines, architectural constraints, and development standards for any AI agent or developer operating within the **STL-Manager** codebase.

---

## 🏗️ 1. Architecture & Tech Stack Rules

* **Backend (Python / FastAPI):**
  * Use FastAPI + Uvicorn for asynchronous high-throughput API endpoints.
  * Keep the backend lightweight and self-contained. The project is designed to run portably with the embedded Python environment in `python_embeded/`.
  * Read the HTTP port dynamically from `port.txt` (default: `8000`).
* **Frontend (React 19 / TypeScript / Vite):**
  * Modern functional components with React Hooks.
  * Visual aesthetic: Glassmorphic dark mode, clean card grids, responsive bottom navigation dock on mobile devices, modern modals.
  * Static build output in `frontend/dist/` is directly hosted and served by the FastAPI backend.
* **Storage & Persistence:**
  * Local JSON storage in `backend/models.json` and `backend/settings.json`.
  * User settings, database models, tags, and scan paths must **never** be wiped or overwritten during updates.

---

## 🌐 2. Internationalization (i18n)

* The application strictly supports bilingual operation: **German (`de`)** and **English (`en`)**.
* **Rule:** Whenever you introduce new buttons, labels, error messages, placeholders, or modal text in `frontend/src/`, you **MUST** add the corresponding keys and translations to both `de` and `en` dictionaries in [`frontend/src/i18n.ts`](file:///f:/STL-Manager/frontend/src/i18n.ts).
* Never hardcode visible German or English strings directly in React components without an `i18n` translation hook.

---

## ⚡ 3. Performance & Rendering Constraints

* **Non-blocking Operations:** Long-running file scans, MD5 hashing, and 3D thumbnail rendering must run asynchronously or in background thread workers (`ThreadPoolExecutor` / background tasks). Never block the FastAPI main event loop.
* **CPU-Friendly Thumbnails:** Ensure 3D rendering falls back gracefully if hardware OpenGL/GPU is unavailable.
* **Smart Caching:** External search aggregations (`backend/online_search.py`) must utilize cache keys to prevent rate-limiting from external platforms (MakerWorld, Printables, Thingiverse, Cults 3D, etc.).

---

## 🔄 4. Frontend Build & Verification Workflow

* **Always Compile Assets:** After making changes to any files in `frontend/src/`, you **MUST** run the frontend build:
  ```powershell
  cd frontend
  npm run build
  cd ..
  ```
* **Verify Server Response:** Ensure FastAPI serves the updated `dist/` bundle cleanly without 404s on static chunks.

---

## 🖥️ 5. Slicer & OS Integration

* **1-Click Slicer Launch:** Preserve native desktop launching for Bambu Studio, OrcaSlicer, PrusaSlicer, and Cura via `/api/open-slicer`.
* **Path Normalization:** Always use `pathlib.Path` or proper OS path sanitization when dealing with file paths across Windows and POSIX environments.

---

## 🛡️ 6. Version Control & Clean Commits

* **Never Commit Large Binaries or Virtual Environments:**
  * Keep `.gitignore` strictly enforced: `python_embeded/`, `node_modules/`, `logs/`, `.venv/`, `__pycache__/`, `.env`.
* Ensure commit messages are clear, descriptive, and follow conventional commit formatting (e.g., `feat: ...`, `fix: ...`, `refactor: ...`).
