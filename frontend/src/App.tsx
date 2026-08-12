import React, { useState, useEffect, useRef } from 'react';
import { Search, Folder, FolderOpen, Database, HardDrive, Printer, Heart, X, Settings, Trash2, LayoutGrid, List as ListIcon, Box, CheckCircle, Copy, Tag, Plus, ArrowUpDown, Globe, Pencil } from 'lucide-react';
import ThreeViewer from './ThreeViewer';
import { FileBrowserModal } from './FileBrowserModal';
import './index.css';

interface Model {
  id: string;
  name: string;
  path: string;
  size_kb: number;
  thumbnail?: string;
  thumbnails?: string[];
  status: string;
  tags: string[];
  source_url?: string;
  added_at: number;
  rel_path?: string;
}

const DEFAULT_TAG_COLORS = ['#8e2de2','#3a7bd5','#00b894','#e17055','#fdcb6e','#6c5ce7','#00cec9','#d63031','#e84393','#2d3436'];
function tagColor(tag: string, customColors?: Record<string, string>): string {
  if (customColors && customColors[tag.toLowerCase()]) {
    const val = customColors[tag.toLowerCase()];
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val;
  }
  let h = 0;
  for (let c of tag) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return DEFAULT_TAG_COLORS[Math.abs(h) % DEFAULT_TAG_COLORS.length];
}

const TagColorPicker = ({ tag, initialColor, onSave, size = 14 }: { tag: string, initialColor: string, onSave: (tag: string, color: string) => void, size?: number }) => {
  const [color, setColor] = useState(initialColor);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  const handleChange = (newColor: string) => {
    setColor(newColor);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onSave(tag, newColor);
    }, 200);
  };

  return (
    <input 
      type="color" 
      value={color} 
      title="Tag-Farbe ändern" 
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onChange={e => {
        e.stopPropagation();
        handleChange(e.target.value);
      }}
      onBlur={e => {
        e.stopPropagation();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onSave(tag, color);
      }}
      style={{ width: `${size}px`, height: `${size}px`, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%' }} 
    />
  );
};

const ModelCard = ({ model, slicers, viewMode, isSelected, allTags, tagColors, handleToggleSelect, handleSlice, handleDeleteModel, handleToggleStatus, handlePreview, handleUpdateTags, handleOpenFolder, onContextMenu, handleSetSearchTerm }: { model: Model, slicers: any[], viewMode: string, isSelected: boolean, allTags: string[], tagColors?: Record<string, string>, handleToggleSelect: (id: string) => void, handleSlice: (id: string, path: string) => void, handleDeleteModel: (id: string, name: string) => void, handleToggleStatus: (id: string, current: string) => void, handlePreview: (m: Model) => void, handleUpdateTags: (id: string, tags: string[]) => void, handleOpenFolder: (id: string) => void, onContextMenu: (e: React.MouseEvent, m: Model) => void, handleSetSearchTerm: (term: string) => void }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const thumbs = model.thumbnails && model.thumbnails.length > 0 ? model.thumbnails : (model.thumbnail ? [model.thumbnail] : []);
  const currentThumb = thumbs[imgIdx] || '';
  const total = thumbs.length || 1;
  const [showSlicerMenu, setShowSlicerMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  const tags = model.tags || [];

  const addTag = (val: string) => {
    const t = val.trim().toLowerCase();
    if (t && !tags.includes(t)) handleUpdateTags(model.id, [...tags, t]);
    setTagInput('');
    setShowTagInput(false);
  };
  const removeTag = (t: string) => handleUpdateTags(model.id, tags.filter(x => x !== t));

  const defaultSlicerPath = slicers && slicers.length > 0 ? slicers[0].path : "";

  const onSendClick = () => {
    if (!slicers || slicers.length === 0) {
      alert("Bitte hinterlege zuerst einen Slicer in den Einstellungen.");
      return;
    }
    if (slicers.length === 1) {
      handleSlice(model.id, defaultSlicerPath);
    } else {
      setShowSlicerMenu(!showSlicerMenu);
    }
  };

  if (viewMode === 'list') {
    return (
      <div onContextMenu={e => onContextMenu(e, model)} className={`list-item ${isSelected ? 'is-selected' : ''}`} style={{ padding: '8px 12px', background: 'var(--bg-card)', border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
         <div className="list-item-checkbox">
           <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(model.id)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-blue)' }} />
         </div>
         <img src={currentThumb} alt={model.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => handlePreview(model)} />
         <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: '500' }} title={model.name}>{model.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Folder size={11} color="#8e2de2" style={{ flexShrink: 0, marginRight: '4px' }} />
              {model.rel_path ? (
                model.rel_path.split(/[\/\\]/).map((part: string, idx: number, arr: string[]) => (
                  <React.Fragment key={idx}>
                    <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
                          onMouseEnter={e => e.currentTarget.style.color='var(--accent-blue)'}
                          onMouseLeave={e => e.currentTarget.style.color='inherit'}
                          onClick={(e) => { e.stopPropagation(); handleSetSearchTerm(part); }}
                          title={`Nach '${part}' filtern`}>
                      {part}
                    </span>
                    {idx < arr.length - 1 && <span style={{ opacity: 0.5, margin: '0 4px' }}>›</span>}
                  </React.Fragment>
                ))
              ) : '3d'}
            </div>
         </div>
         <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
           {tags.map(t => {
             const c = tagColor(t, tagColors);
             return (
               <span key={t} onClick={() => removeTag(t)} title="Tag entfernen" style={{ background: c+'22', color: c, border: `1px solid ${c}55`, borderRadius: '10px', padding: '1px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>
                 {t} ×
               </span>
             );
           })}
         </div>
         <span className="badge" style={{ cursor: 'pointer', background: model.status === 'Printed' ? 'rgba(46, 204, 113, 0.2)' : undefined, color: model.status === 'Printed' ? '#2ecc71' : undefined }} onClick={() => handleToggleStatus(model.id, model.status)}>
            {model.status}
         </span>
         <div style={{ color: 'var(--text-muted)', fontSize: '12px', width: '80px' }}>{model.size_kb} KB</div>
         <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative', width: '100%', flex: 1 }}>
              <button
                className="icon-button"
                onClick={() => handleToggleStatus(model.id, model.status)}
                title={model.status === 'Printed' ? 'Mark as Not Printed' : 'Mark as Printed'}
                style={{ color: model.status === 'Printed' ? '#2ecc71' : undefined }}
              >
                <CheckCircle size={16} />
              </button>
              {model.source_url && (
                <button className="icon-button" onClick={(e) => { e.stopPropagation(); window.open(model.source_url, '_blank'); }} title={`Quelle öffnen:\n${model.source_url}`}><Globe size={16} /></button>
              )}
              <button className="icon-button" onClick={(e) => { e.stopPropagation(); handleOpenFolder(model.id); }} title="Speicherort im Explorer öffnen"><FolderOpen size={16} /></button>
              <button className="icon-button" onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id, model.name); }} title="Remove Model from disk"><Trash2 size={14} /></button>
              <div style={{ position: 'relative', display: 'flex', marginLeft: 'auto' }}
                onMouseEnter={() => { if (slicers && slicers.length > 0) setShowSlicerMenu(true); }}
                onMouseLeave={() => setShowSlicerMenu(false)}>
              <button className="icon-button" onClick={onSendClick} title="Send to Slicer" style={{ color: 'var(--accent-blue)' }}>
                 <Printer size={18} strokeWidth={2.5} />
              </button>
              {showSlicerMenu && (
                 <div style={{ position: 'absolute', right: '0', top: '100%', paddingTop: '4px', zIndex: 100 }}>
                 <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', width: 'max-content' }}>
                    {slicers.map((s: any) => (
                       <div key={s.name} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}
                            onClick={() => { setShowSlicerMenu(false); handleSlice(model.id, s.path); }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-blue)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          {s.name}
                       </div>
                    ))}
                 </div>
                 </div>
              )}
              </div>
         </div>
      </div>
    );
  }

  return (
    <div onContextMenu={e => onContextMenu(e, model)} className={`model-card ${isSelected ? 'is-selected' : ''}`} style={{ border: isSelected ? '2px solid var(--accent-blue)' : undefined }}>
      <div className="card-image-container">
        <div className="select-checkbox-container">
          <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(model.id)} style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent-blue)' }} />
        </div>
        <span 
           className="badge" 
           style={{ cursor: 'pointer', background: model.status === 'Printed' ? 'rgba(46, 204, 113, 0.2)' : undefined, color: model.status === 'Printed' ? '#2ecc71' : undefined }}
           onClick={() => handleToggleStatus(model.id, model.status)}
           title="Toggle Status"
        >
          {model.status}
        </span>
        {total > 1 && (
            <>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', zIndex: 15, cursor: 'w-resize' }} onClick={() => setImgIdx(i => (i > 0 ? i - 1 : total - 1))} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', zIndex: 15, cursor: 'e-resize' }} onClick={() => setImgIdx(i => (i < total - 1 ? i + 1 : 0))} />
            </>
        )}
        <span className="badge-count">{imgIdx + 1}/{total}</span>
        <img src={currentThumb} alt={model.name} className="card-image" style={{ cursor: 'pointer' }} onClick={() => handlePreview(model)} onError={(e) => { e.currentTarget.src = "data:image/svg+xml;charset=UTF-8,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%231a1d2f'/%3E%3Ctext x='50%25' y='50%25' fill='%23949db2' font-family='sans-serif' font-size='14' text-anchor='middle' dominant-baseline='middle'%3ENo Thumbnail%3C/text%3E%3C/svg%3E" }} />
      </div>
      <div className="model-title-box" title={model.name}>{model.name}</div>
      <div className="card-content">
        <div className="model-meta">
          <div className="meta-item" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <Folder size={14} color="#8e2de2" style={{ flexShrink: 0, marginRight: '4px' }} />
            {model.rel_path ? (
              model.rel_path.split(/[\/\\]/).map((part: string, idx: number, arr: string[]) => (
                <React.Fragment key={idx}>
                  <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
                        onMouseEnter={e => e.currentTarget.style.color='var(--accent-blue)'}
                        onMouseLeave={e => e.currentTarget.style.color='inherit'}
                        onClick={(e) => { e.stopPropagation(); handleSetSearchTerm(part); }}
                        title={`Nach '${part}' filtern`}>
                    {part}
                  </span>
                  {idx < arr.length - 1 && <span style={{ opacity: 0.5, margin: '0 4px' }}>›</span>}
                </React.Fragment>
              ))
            ) : '3d'}
          </div>
          <div className="meta-item"><HardDrive size={14} color="#3a7bd5" /> {model.size_kb} KB</div>
        </div>
        <div className="card-actions" style={{ paddingTop: '8px', borderTop: 'none', marginTop: '10px' }}>
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative', width: '100%' }}>
              <button
                className="icon-button"
                onClick={() => handleToggleStatus(model.id, model.status)}
                title={model.status === 'Printed' ? 'Mark as Not Printed' : 'Mark as Printed'}
                style={{ color: model.status === 'Printed' ? '#2ecc71' : undefined }}
              >
                <CheckCircle size={14} />
              </button>
              {model.source_url && (
                <button className="icon-button" onClick={(e) => { e.stopPropagation(); window.open(model.source_url, '_blank'); }} title={`Quelle öffnen:\n${model.source_url}`}><Globe size={14} /></button>
              )}
              <button className="icon-button" onClick={(e) => { e.stopPropagation(); handleOpenFolder(model.id); }} title="Speicherort im Explorer öffnen"><FolderOpen size={14} /></button>
              <button className="icon-button" onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id, model.name); }} title="Remove Model from disk"><Trash2 size={14} /></button>
              <button className="icon-button"><Heart size={14} /></button>
               <div style={{ position: 'relative', display: 'flex', marginLeft: 'auto' }}
                 onMouseEnter={() => { if (slicers && slicers.length > 0) setShowSlicerMenu(true); }}
                 onMouseLeave={() => setShowSlicerMenu(false)}>
               <button className="icon-button" onClick={onSendClick} title="Send to Slicer" style={{ color: 'var(--accent-blue)' }}>
                  <Printer size={16} strokeWidth={2.5} />
               </button>
               {showSlicerMenu && (
                  <div style={{ position: 'absolute', bottom: '100%', left: '0', paddingBottom: '4px', zIndex: 100 }}>
                  <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', width: 'max-content' }}>
                     {slicers.map((s: any) => (
                        <div key={s.name} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}
                             onClick={() => { setShowSlicerMenu(false); handleSlice(model.id, s.path); }}
                             onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-blue)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                           {s.name}
                        </div>
                     ))}
                  </div>
                  </div>
               )}
               </div>
           </div>
        </div>
        {/* Tags row */}
        {/* Tags row */}
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
  const [newTagInput, setNewTagInput] = useState('');
  const [fileBrowserMode, setFileBrowserMode] = useState<'none' | 'folder' | 'slicer'>('none');

  useEffect(() => {
    document.title = "STL Manager";
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
    setFileBrowserMode('folder');
  };

  const handleBrowseSlicer = async () => {
    setFileBrowserMode('slicer');
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

  const handleUpdateUrl = async (id: string, currentUrl?: string) => {
    const newUrl = window.prompt("Neue Quell-URL für dieses Modell eingeben:", currentUrl || "");
    if (newUrl === null) return; // cancelled
    try {
      await fetch(`${API_BASE}/api/models/${id}/url`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      fetchModels();
      if (previewModel && previewModel.id === id) {
         setPreviewModel(prev => prev ? {...prev, source_url: newUrl} : null);
      }
    } catch (err) {
      console.error("Failed to update URL", err);
    }
  };

  const handleAddSettingsTag = async () => {
    if (!newTagInput.trim()) return;
    try {
      await fetch(`${API_BASE}/api/settings/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagInput })
      });
      setNewTagInput('');
      fetchTags();
      fetchSettings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSettingsTag = async (tag: string) => {
    if (!window.confirm(`Tag "${tag}" wirklich löschen? Dies entfernt ihn auch von allen Modellen.`)) return;
    try {
      await fetch(`${API_BASE}/api/settings/tags/${encodeURIComponent(tag)}`, { method: 'DELETE' });
      fetchTags();
      fetchModels();
      fetchSettings();
    } catch (err) {
      console.error(err);
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
      await fetch(`${API_BASE}/api/models/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchModels();
    } catch (e) {
      console.error("Error updating status", e);
    }
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    try {
      await fetch(`${API_BASE}/api/models/${id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
      });
      fetchModels();
      fetchTags();
    } catch (e) { console.error('Error updating tags', e); }
  };

  const handleUpdateTagColor = async (tag: string, color: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/tags/${encodeURIComponent(tag)}/color`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color })
      });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev: any) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Error updating tag color", e);
    }
  };

  const handleFindDuplicates = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/duplicates`);
      const data = await res.json();
      setDuplicates(data);
      setShowDuplicates(true);
    } catch (e) {
      console.error('Error finding duplicates', e);
    }
  };

  const filteredModels = models.filter(m => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(searchLower) || 
                        (m.rel_path && m.rel_path.toLowerCase().includes(searchLower));
    let matchTag = true;
    if (activeTagFilter === '__untagged__') {
      matchTag = !m.tags || m.tags.length === 0;
    } else if (activeTagFilter) {
      matchTag = (m.tags || []).includes(activeTagFilter);
    }
    return matchSearch && matchTag;
  });

  const sortedModels = [...filteredModels].sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
    if (sortBy === 'date_desc') return (b.added_at || 0) - (a.added_at || 0);
    if (sortBy === 'date_asc') return (a.added_at || 0) - (b.added_at || 0);
    if (sortBy === 'size_desc') return (b.size_kb || 0) - (a.size_kb || 0);
    if (sortBy === 'size_asc') return (a.size_kb || 0) - (b.size_kb || 0);
    return 0;
  });

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #00d2ff, #8e2de2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Database size={32} color="white" />
            </div>
          </div>
          <div className="logo-text">STL Manager</div>
          <div className="logo-sub">{models.length} models total</div>
        </div>

        <button className="button-primary" onClick={fetchModels}>Refresh Models</button>
        <button className="button-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleFindDuplicates}>
          <Copy size={16} /> Find Duplicates
        </button>

        <div className="form-group" style={{ marginTop: '10px' }}>
           <label className="form-label">Monitored Folders:</label>
           <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '20px' }}>
              {(settings?.directories || []).map((d: string, i: number) => <li key={i}>{d}</li>)}
           </ul>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={13} /> Filter by Tag:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
            <span 
              onClick={() => setActiveTagFilter(activeTagFilter === '__untagged__' ? null : '__untagged__')}
              style={{
                background: activeTagFilter === '__untagged__' ? 'rgba(255, 77, 77, 0.3)' : 'rgba(255, 77, 77, 0.1)',
                color: '#ff6b6b',
                border: `1px solid ${activeTagFilter === '__untagged__' ? '#ff6b6b' : 'rgba(255, 77, 77, 0.3)'}`,
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all .15s'
              }}
              title="Zeige nur Modelle ohne Tags"
            >
              Ohne Tag
            </span>
            {allTags.map(t => {
              const c = tagColor(t, settings?.tag_colors);
              return (
                <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: activeTagFilter === t ? c+'44' : c+'18', color: c, border: `1px solid ${c}${activeTagFilter === t ? 'bb' : '44'}`, borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>
                  <span onClick={() => setActiveTagFilter(activeTagFilter === t ? null : t)} style={{ cursor: 'pointer' }}>{t}</span>
                  <TagColorPicker tag={t} initialColor={c} onSave={handleUpdateTagColor} size={12} />
                </div>
              );
            })}
            {activeTagFilter && (
              <span onClick={() => setActiveTagFilter(null)} style={{ color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', padding: '2px 6px' }}>clear</span>
            )}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Search Models:</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter search term..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingRight: '36px' }}
            />
            {searchTerm ? (
              <X size={16} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} />
            ) : (
              <Search size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--text-muted)' }} />
            )}
          </div>
          <button className="button-secondary" onClick={() => { setSearchTerm(''); setActiveTagFilter(null); }} style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
             <X size={14} /> Filter zurücksetzen
          </button>
        </div>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button className="button-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setShowSettings(true)}>
             <Settings size={16} /> Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Controls Bar: Sort, View Mode, Selection Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left / Selection Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedIds.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 210, 255, 0.1)', border: '1px solid var(--accent-blue)', borderRadius: '8px', padding: '6px 14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                  {selectedIds.length} ausgewählt
                </span>
                <button className="button-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleSelectAll}>
                  {selectedIds.length === sortedModels.length ? 'Auswahl aufheben' : 'Alle auswählen'}
                </button>
                <button className="button-secondary" style={{ padding: '4px 10px', fontSize: '12px', color: '#2ecc71', borderColor: 'rgba(46, 204, 113, 0.4)' }} onClick={() => handleBatchStatus('Printed')}>
                  ✓ Als gedruckt
                </button>
                <button className="button-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleBatchStatus('Not Printed')}>
                  ✗ Als nicht gedruckt
                </button>
                <button className="danger-btn" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleBatchDelete}>
                  <Trash2 size={13} style={{ marginRight: '4px' }} /> Löschen (von Festplatte)
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {sortedModels.length} Modell{sortedModels.length !== 1 ? 'e' : ''} angezeigt
              </div>
            )}
          </div>

          {/* Right: Sort & View Mode */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={14} color="var(--text-muted)" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{ background: 'var(--bg-card)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="name_asc">Sortieren: Name (A - Z)</option>
                <option value="name_desc">Sortieren: Name (Z - A)</option>
                <option value="date_desc">Sortieren: Hinzugefügt (Neueste)</option>
                <option value="date_asc">Sortieren: Hinzugefügt (Älteste)</option>
                <option value="size_desc">Sortieren: Größe (Absteigend)</option>
                <option value="size_asc">Sortieren: Größe (Aufsteigend)</option>
              </select>
            </div>

            <button className="icon-button" style={{ background: viewMode === 'grid' ? 'var(--accent-blue)' : 'var(--bg-dark)' }} onClick={() => setViewMode('grid')} title="Grid View">
               <LayoutGrid size={18} />
            </button>
            <button className="icon-button" style={{ background: viewMode === 'list' ? 'var(--accent-blue)' : 'var(--bg-dark)' }} onClick={() => setViewMode('list')} title="List View">
               <ListIcon size={18} />
            </button>
          </div>
        </div>

        <div className={`${viewMode === 'grid' ? "models-grid" : "models-list"} ${selectedIds.length > 0 ? "has-selection" : ""}`}>
          {sortedModels.map(model => (
            <ModelCard key={model.id} model={model} slicers={settings.slicers} viewMode={viewMode} isSelected={selectedIds.includes(model.id)} allTags={allTags} tagColors={settings.tag_colors} handleToggleSelect={handleToggleSelect} handleSlice={handleSlice} handleDeleteModel={handleDeleteModel} handleToggleStatus={handleToggleStatus} handlePreview={setPreviewModel} handleUpdateTags={handleUpdateTags} handleOpenFolder={handleOpenFolder} handleSetSearchTerm={setSearchTerm} onContextMenu={(e, m) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, model: m }); }} />
          ))}
          {sortedModels.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No models found. Add a directory to start scanning.
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
                Settings
                <button className="icon-button" onClick={() => setShowSettings(false)}><X size={20} /></button>
             </div>
             
             <div className="form-group">
                <label className="form-label">Manage Slicers:</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={slicerNameInput}
                    onChange={e => setSlicerNameInput(e.target.value)}
                    placeholder="Name (z.B. PrusaSlicer)"
                    style={{ flex: 1, minWidth: '120px' }}
                  />
                  <div style={{ flex: 2, display: 'flex', gap: '4px', minWidth: '200px' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={slicerPathInput}
                      onChange={e => setSlicerPathInput(e.target.value)}
                      placeholder="Pfad (z.B. C:\...)"
                      style={{ flex: 1 }}
                    />
                    <button className="slice-btn" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }} onClick={handleBrowseSlicer} title="Datei auf Festplatte auswählen">
                      📁 Auswählen
                    </button>
                  </div>
                  <button className="slice-btn" onClick={handleAddSlicer}>Add</button>
                </div>
                <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                  {settings.slicers?.map((s: any, i: number) => (
                    <div className="list-item" key={i}>
                      <span style={{ flex: 1, fontWeight: 'bold' }}>{s.name}</span>
                      <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)' }}>{s.path}</span>
                      <button className="icon-button" onClick={() => handleRemoveSlicer(s.name)}><Trash2 size={14} color="#ff4d4d" /></button>
                    </div>
                  ))}
                  {(!settings.slicers || settings.slicers.length === 0) && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No slicers configured.</div>}
                </div>
             </div>

             <div className="form-group">
                 <label className="form-label">Manage Monitored Folders:</label>
                 <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                   <input 
                     type="text" 
                     className="input-field" 
                     placeholder="z.B. D:\STLs" 
                     value={directoryInput}
                     onChange={e => setDirectoryInput(e.target.value)}
                     style={{ flex: 1 }}
                   />
                   <button className="slice-btn" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }} onClick={handleBrowseDirectory} title="Ordner auf Festplatte auswählen">
                     📁 Ordner wählen
                   </button>
                   <button className="slice-btn" onClick={handleAddDirectory}>Add Folder</button>
                 </div>
                 <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                   {settings.directories.map((d: string, i: number) => (
                     <div className="list-item" key={i}>
                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d}</span>
                       <button className="icon-button" onClick={() => handleRemoveDirectory(d)}><Trash2 size={14} color="#ff4d4d" /></button>
                     </div>
                   ))}
                   {settings.directories.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No directories monitored.</div>}
                 </div>
                 {/* Manage Tags Section */}
                 <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">Manage Tags:</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Neuer Tag Name..." 
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddSettingsTag(); }}
                        style={{ flex: 1 }}
                      />
                      <button className="slice-btn" onClick={handleAddSettingsTag}>Add Tag</button>
                    </div>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {allTags.map(t => {
                        const c = tagColor(t, settings?.tag_colors);
                        return (
                          <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: '8px', border: `1px solid ${c}44` }}>
                            <span style={{ fontSize: '12px', color: c, fontWeight: 'bold' }}>{t}</span>
                            <TagColorPicker tag={t} initialColor={c} onSave={handleUpdateTagColor} size={18} />
                            <button className="icon-button" style={{ marginLeft: '4px', padding: '2px' }} onClick={() => handleRemoveSettingsTag(t)} title="Tag komplett löschen"><Trash2 size={12} color="#ff4d4d" /></button>
                          </div>
                        );
                      })}
                      {allTags.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tags available.</div>}
                    </div>
                 </div>
              </div>

             <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button className="danger-btn" onClick={handleClearDatabase}>
                   Clear Database & Rescan
                </button>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                  This will delete all generated thumbnails and clear the file registry.
                </div>
             </div>
           </div>
        </div>
      )}

      {previewModel && (
        <div className="modal-overlay" onClick={() => setPreviewModel(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '80%', height: '80%', display: 'flex', flexDirection: 'column' }}>
             <div className="modal-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={20} color="var(--accent-blue)" />
                    {previewModel.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {previewModel.source_url ? (
                      <a href={previewModel.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} onMouseEnter={e => e.currentTarget.style.color='var(--accent-cyan)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
                        <Globe size={10} /> {previewModel.source_url}
                      </a>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Keine URL hinterlegt</span>
                    )}
                    <button className="icon-button" style={{ padding: '2px', opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); handleUpdateUrl(previewModel.id, previewModel.source_url); }} title="URL bearbeiten/hinzufügen" onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.7'}>
                      <Pencil size={10} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ position: 'relative' }}
                    onMouseEnter={() => { if (settings.slicers && settings.slicers.length > 0) setShowPreviewSlicerMenu(true); }}
                    onMouseLeave={() => setShowPreviewSlicerMenu(false)}>
                    <button className="slice-btn" onClick={() => {
                        if (!settings.slicers || settings.slicers.length === 0) {
                          alert("Bitte hinterlege zuerst einen Slicer in den Einstellungen.");
                          return;
                        }
                        if (settings.slicers.length === 1) {
                          handleSlice(previewModel.id, settings.slicers[0].path);
                        } else {
                          setShowPreviewSlicerMenu(!showPreviewSlicerMenu);
                        }
                      }} title="An Drucker/Slicer senden">
                      <Printer size={18} />
                    </button>
                    {showPreviewSlicerMenu && (
                      <div style={{ position: 'absolute', right: '0', top: '100%', paddingTop: '4px', zIndex: 100 }}>
                      <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', width: 'max-content' }}>
                        {settings.slicers.map((s: any) => (
                          <div key={s.name} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}
                               onClick={() => { setShowPreviewSlicerMenu(false); handleSlice(previewModel.id, s.path); }}
                               onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-blue)'}
                               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {s.name}
                          </div>
                        ))}
                      </div>
                      </div>
                    )}
                  </div>
                  {previewModel.source_url && (
                    <button className="button-secondary" onClick={() => window.open(previewModel.source_url, '_blank')} title="Download-Seite öffnen" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', margin: 0, padding: '6px 12px' }}>
                      <Globe size={14} /> Quelle öffnen
                    </button>
                  )}
                  <button className="button-secondary" onClick={() => handleOpenFolder(previewModel.id)} title="Speicherort im Explorer öffnen" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', margin: 0, padding: '6px 12px' }}>
                    <FolderOpen size={14} /> Speicherort öffnen
                  </button>
                  <button className="icon-button" onClick={() => setPreviewModel(null)}><X size={20} /></button>
                </div>
             </div>
             <div style={{ flex: 1, position: 'relative', background: '#1a1d2f', borderRadius: '8px' }}>
                <ThreeViewer url={`${API_BASE}/api/download/${previewModel.id}`} filename={previewModel.name} />
             </div>
          </div>
        </div>
      )}

      {showDuplicates && (
        <div className="modal-overlay" onClick={() => setShowDuplicates(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '75%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Copy size={20} color="var(--accent-blue)" />
                Duplicate Files
                {duplicates.length > 0 && (
                  <span style={{ background: '#ff4d4d22', color: '#ff4d4d', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 'bold' }}>
                    {duplicates.length} group{duplicates.length > 1 ? 's' : ''} found
                  </span>
                )}
              </div>
              <button className="icon-button" onClick={() => setShowDuplicates(false)}><X size={20} /></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
              {duplicates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  âœ… No duplicate files found. Your library is clean!
                </div>
              ) : (
                duplicates.map((group, gi) => (
                  <div key={gi} style={{ marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(255,77,77,0.08)', padding: '8px 16px', fontSize: '12px', color: '#ff8888', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>
                      {group.length} duplicate files â€” same content hash
                    </div>
                    {group.map((m: Model) => {
                      const thumb = (m.thumbnails && m.thumbnails.length > 0) ? m.thumbnails[0] : '';
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                          <img src={thumb} alt={m.name} style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover', background: '#1a1d2f', flexShrink: 0 }}
                            onError={e => { e.currentTarget.style.display = 'none'; }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.path}</div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>{m.size_kb} KB</div>
                          <button className="icon-button" title="Speicherort im Explorer öffnen" onClick={() => handleOpenFolder(m.id)}>
                            <FolderOpen size={15} color="var(--accent-cyan)" />
                          </button>
                          <button className="icon-button" title="Delete this file from library"
                            onClick={async () => {
                              await fetch(`${API_BASE}/api/models/${m.id}`, { method: 'DELETE' });
                              const res = await fetch(`${API_BASE}/api/duplicates`);
                              setDuplicates(await res.json());
                              fetchModels();
                            }}>
                            <Trash2 size={15} color="#ff4d4d" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
          <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#1a1d2f', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', minWidth: '150px' }}>
            <div 
               style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px', color: 'white' }}
               onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-blue)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
               onClick={() => { handleOpenFolder(contextMenu.model.id); setContextMenu(null); }}
            >
               <FolderOpen size={14} /> Dateipfad öffnen
            </div>
            <div 
               style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px', color: '#ff4d4d', marginTop: '4px' }}
               onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 77, 77, 0.2)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
               onClick={() => { handleDeleteModel(contextMenu.model.id, contextMenu.model.name); setContextMenu(null); }}
            >
               <Trash2 size={14} /> Datei löschen
            </div>
          </div>
        </>
      )}

      {fileBrowserMode !== 'none' && (
        <FileBrowserModal
          mode={fileBrowserMode === 'slicer' ? 'file' : 'folder'}
          filterExt={fileBrowserMode === 'slicer' ? '.exe' : ''}
          apiBase={API_BASE}
          onClose={() => setFileBrowserMode('none')}
          onSelect={async (path, name) => {
            if (fileBrowserMode === 'folder') {
              setDirectoryInput(path);
              setFileBrowserMode('none');
              try {
                await fetch(`${API_BASE}/api/settings/directories`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ path: path })
                });
                setDirectoryInput('');
                fetchSettings();
                setTimeout(fetchModels, 2000);
              } catch (e) {
                console.error("Error auto-adding directory", e);
              }
            } else if (fileBrowserMode === 'slicer') {
              setSlicerPathInput(path);
              if (name && !slicerNameInput) {
                setSlicerNameInput(name);
              }
              setFileBrowserMode('none');
            }
          }}
        />
      )}
    </div>
  );
}

export default App;



