# STL-Manager Development Workflows & Runbooks

## 🔨 Step-by-Step Runbooks

### 1. Frontend Modifications & Asset Compilation
When updating React components or styles:
```powershell
# 1. Navigate to frontend folder
cd "F:\STL-Manager\frontend"

# 2. Run TypeScript build & Vite bundler
npm run build

# 3. Return to root
cd "F:\STL-Manager"
```
Ensure no syntax or type errors occur during `tsc -b && vite build`.

---

### 2. Backend Server Management

#### Safe Process Restart (PowerShell)
```powershell
# Stop any process listening on the app port (default 8000)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue

# Start using portable embedded Python
& "F:\STL-Manager\python_embeded\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Checking Logs
Server outputs and scanner events can be inspected in the terminal or `logs/` directory.

---

### 3. Testing Online Search Endpoints
To test scrapers and platform aggregators without opening the browser:
```powershell
& "F:\STL-Manager\python_embeded\python.exe" -c "from backend.online_search import search_online_models; print(len(search_online_models('', mode='daily')))"
```

---

### 4. Git Commit & Release Guidelines
1. Always test the production build before committing:
   ```powershell
   git status
   git add .
   git commit -m "Your descriptive commit message"
   git push origin main
   ```
2. Verify that binary/large assets (`python_embeded/`, `node_modules/`, `logs/`) are not accidentally tracked.
