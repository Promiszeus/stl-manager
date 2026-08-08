# STL-Manager (Printventory)

STL-Manager is a powerful, local 3D model management application designed to seamlessly organize, preview, and interact with your STL files.

## Features

- **Automated Scanning**: Add directories to automatically monitor for new STL files.
- **3D Viewer**: Preview your STL files directly in the browser.
- **Organization**: Categorize your models using custom tags and statuses.
- **Duplicate Detection**: Automatically detects duplicate files using content hashing to save disk space.
- **Slicer Integration**: Open your 3D models directly in your preferred slicer straight from the app.
- **Local First**: Everything runs locally using a Python FastAPI backend and a React (Vite) frontend.

## Getting Started

1. Use `start.bat` or `run_portable.bat` to launch the application.
2. The backend will start on `http://localhost:8000` and the frontend UI will be served.
3. In the settings, add the directories where you store your 3D models.
4. Add the path to your slicer executable to enable "Open in Slicer" functionality.

## Tech Stack

- **Backend**: Python (FastAPI, Uvicorn)
- **Frontend**: React (Vite)
