with open('G:/Printventory-Clone/frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line index 227 is line 228
print("Line 228:", repr(lines[227]))
print("Line 229:", repr(lines[228]))

idx = 228
patch = '''        {/* Tags row */}
        <div style={{ padding: '4px 10px 8px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', minHeight: '28px', position: 'relative' }}>
          {tags.map(t => {
            const c = tagColor(t, tagColors);
            return (
              <span key={t} onClick={() => removeTag(t)} title="Tag entfernen" style={{ background: c+'22', color: c, border: `1px solid ${c}55`, borderRadius: '10px', padding: '1px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: '600', transition: 'opacity .15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity='0.6'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                {t} ×
              </span>
            );
          })}
          {showTagInput ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input ref={tagInputRef} value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') addTag(tagInput); if(e.key==='Escape') setShowTagInput(false); }}
                autoFocus placeholder="Tag..." style={{ width: '80px', fontSize: '10px', background: 'var(--bg-dark)', border: '1px solid var(--accent-blue)', borderRadius: '10px', padding: '1px 8px', color: 'white', outline: 'none' }} />
              
              {/* Autocomplete Dropdown Popover for existing tags */}
              <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#171b2d', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', zIndex: 120, maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px', marginBottom: '4px', boxShadow: '0 6px 16px rgba(0,0,0,0.5)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '2px' }}>Vorhandene Tags:</div>
                {allTags.filter(t => !tags.includes(t) && (!tagInput || t.includes(tagInput.toLowerCase()))).map(t => {
                  const tc = tagColor(t, tagColors);
                  return (
                    <div key={t} onMouseDown={(e) => { e.preventDefault(); addTag(t); }}
                      style={{ background: tc + '22', color: tc, border: `1px solid ${tc}44`, borderRadius: '6px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>+ {t}</span>
                    </div>
                  );
                })}
                {allTags.filter(t => !tags.includes(t) && (!tagInput || t.includes(tagInput.toLowerCase()))).length === 0 && (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Keine passenden Tags</div>
                )}
              </div>
            </div>
          ) : (
            <button onClick={() => setShowTagInput(true)} title="Tag hinzufügen" style={{ background: 'none', border: '1px dashed var(--border-color)', borderRadius: '10px', padding: '1px 6px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Plus size={9}/> Tag
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const API_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [directoryInput, setDirectoryInput] = useState('');
  const [settings, setSettings] = useState<any>({ directories: [], slicers: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [previewModel, setPreviewModel] = useState<Model | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, model: Model } | null>(null);
  const [duplicates, setDuplicates] = useState<Model[][]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [showPreviewSlicerMenu, setShowPreviewSlicerMenu] = useState(false);
  const [slicerNameInput, setSlicerNameInput] = useState('');
  const [slicerPathInput, setSlicerPathInput] = useState('');

  useEffect(() => {
    document.title = "Print Manager";
    fetchModels();
    fetchSettings();
    fetchTags();
    
    const intervalId = setInterval(() => {
      fetchModels();
    }, 2500);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/models`);
      const data = await res.json();
      setModels(data);
    } catch (e) {
      console.error("Error fetching models", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.error("Error fetching settings", e);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tags`);
      const data = await res.json();
      setAllTags(data);
    } catch (e) {
      console.error("Error fetching tags", e);
    }
  };

  const handleAddDirectory = async () => {
    if (!directoryInput) return;
    try {
      await fetch(`${API_BASE}/api/settings/directories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: directoryInput })
      });
      setDirectoryInput('');
      fetchSettings();
      setTimeout(fetchModels, 2000);
    } catch (e) {
      console.error("Error adding directory", e);
    }
  };

  const handleBrowseDirectory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/utils/select-folder`, { method: 'POST' });
      const data = await res.json();
      if (data.path) {
        setDirectoryInput(data.path);
      }
    } catch (e) {
      console.error("Error picking directory", e);
    }
  };

  const handleBrowseSlicer = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/utils/select-file`, { method: 'POST' });
      const data = await res.json();
      if (data.path) {
        setSlicerPathInput(data.path);
        if (!slicerNameInput && data.suggested_name) {
          setSlicerNameInput(data.suggested_name);
        }
      }
    } catch (e) {
      console.error("Error picking slicer file", e);
    }
  };

  const handleSlice = async (id: string, path: string) => {
    try {
      await fetch(`${API_BASE}/api/slice/${id}`, { 
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ slicer_path: path })
      });
    } catch (e) {
      console.error("Error sending to slicer", e);
    }
  };

  const handleRemoveDirectory = async (path: string) => {
    try {
      await fetch(`${API_BASE}/api/settings/directories`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      fetchSettings();
    } catch (e) {
      console.error("Error removing directory", e);
    }
  };

  const handleAddSlicer = async () => {
    if (!slicerNameInput || !slicerPathInput) return;
    try {
      await fetch(`${API_BASE}/api/settings/slicer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: slicerNameInput, path: slicerPathInput })
      });
      setSlicerNameInput('');
      setSlicerPathInput('');
      fetchSettings();
    } catch (e) {
      console.error("Error saving slicer", e);
    }
  };

  const handleRemoveSlicer = async (name: string) => {
    try {
      await fetch(`${API_BASE}/api/settings/slicer/${name}`, { method: 'DELETE' });
      fetchSettings();
    } catch (e) {
      console.error("Error deleting slicer", e);
    }
  };

  const handleClearDatabase = async () => {
    if(!window.confirm("Are you sure you want to clear the entire database? All thumbnails will be deleted and directories will be rescanned.")) return;
    try {
      await fetch(`${API_BASE}/api/database/clear`, { method: 'POST' });
      fetchModels();
    } catch (e) {
      console.error("Error clearing database", e);
    }
  };

  const handleDeleteModel = async (id: string, name?: string) => {
    const label = name ? `"${name}"` : 'dieses Modell';
    if(!window.confirm(`Möchtest du ${label} wirklich DAUERHAFT von der Festplatte löschen?`)) return;
    try {
      await fetch(`${API_BASE}/api/models/${id}`, { method: 'DELETE' });
      setSelectedIds(prev => prev.filter(x => x !== id));
      fetchModels();
    } catch (e) {
      console.error("Error deleting model", e);
    }
  };

  const handleOpenFolder = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/open-folder/${id}`, { method: 'POST' });
    } catch (e) {
      console.error("Error opening folder", e);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sortedModels.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedModels.map(m => m.id));
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Möchtest du diese ${selectedIds.length} Dateien wirklich DAUERHAFT von der Festplatte löschen?`)) return;
    try {
      await fetch(`${API_BASE}/api/models/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      setSelectedIds([]);
      fetchModels();
    } catch (e) {
      console.error("Error batch deleting models", e);
    }
  };

  const handleBatchStatus = async (status: string) => {
    if (!selectedIds.length) return;
    try {
      await fetch(`${API_BASE}/api/models/batch-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status })
      });
      fetchModels();
    } catch (e) {
      console.error("Error batch updating status", e);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Not Printed' ? 'Printed' : 'Not Printed';
    try {
      await fetch(`${API_BASE}/api/models/${id}/status`, {\n'''

lines[227:233] = [patch]

with open('G:/Printventory-Clone/frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("PATCH APPLIED SUCCESSFULLY!")
