# 🎨 STL-Manager Frontend

The frontend for **STL-Manager** is a modern, responsive Single Page Application built with **React 19**, **TypeScript**, and **Vite**, featuring a dark glassmorphic design and an interactive 3D WebGL model viewer.

---

## 🛠️ Tech Stack & Key Libraries

* **Framework:** React 19 + TypeScript
* **Bundler:** Vite 6
* **3D Viewer:** Three.js (WebGL interactive STL & 3MF rendering)
* **Icons:** Lucide React
* **Styling:** Custom Glassmorphic Dark Design System (`index.css`, `App.css`)
* **Internationalization:** Custom lightweight i18n hook supporting German (`de`) & English (`en`)

---

## 📁 Key Components

* **[`src/App.tsx`](file:///f:/STL-Manager/frontend/src/App.tsx):** Main layout, library grid/list view, floating batch action bar, settings modal, Slicer integration dispatch.
* **[`src/OnlineSearch.tsx`](file:///f:/STL-Manager/frontend/src/OnlineSearch.tsx):** Multi-platform 3D model hub (MakerWorld, Printables, Thingiverse, Cults 3D, MakerOnline, Creality Cloud), 3D design contests hub, trend feeds (Daily, Monthly, Newest), category cards, and search history.
* **[`src/ThreeViewer.tsx`](file:///f:/STL-Manager/frontend/src/ThreeViewer.tsx):** Interactive 3D WebGL viewer with orbit controls, mesh inspection, wireframe toggle, and bounding box measurements.
* **[`src/SearchModal.tsx`](file:///f:/STL-Manager/frontend/src/SearchModal.tsx):** Fast popup command palette (`Ctrl + K` / `/`) with tag filters and category shortcuts.
* **[`src/FileBrowserModal.tsx`](file:///f:/STL-Manager/frontend/src/FileBrowserModal.tsx):** Directory picker for adding monitored folders.
* **[`src/i18n.ts`](file:///f:/STL-Manager/frontend/src/i18n.ts):** Complete bilingual dictionaries for German (`de`) and English (`en`).

---

## 🚀 Building & Production Compilation

The compiled production bundle is hosted directly by the FastAPI backend from `frontend/dist/`.

To build the frontend:

```powershell
# From the frontend directory:
npm run build
```

The output bundle will be placed in `dist/` and served automatically by the Python backend.
