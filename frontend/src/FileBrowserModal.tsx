import React, { useState, useEffect } from 'react';
import { X, Folder, File, ArrowLeft, HardDrive, Check } from 'lucide-react';

interface FsItem {
  name: string;
  path: string;
  is_dir: boolean;
}

interface Props {
  mode: 'folder' | 'file';
  filterExt?: string;
  onClose: () => void;
  onSelect: (path: string, name?: string) => void;
  apiBase: string;
}

export const FileBrowserModal: React.FC<Props> = ({ mode, filterExt = '', onClose, onSelect, apiBase }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [items, setItems] = useState<FsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPath = async (p: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/fs/list?path=${encodeURIComponent(p)}&filter_ext=${encodeURIComponent(filterExt)}`);
      if (!res.ok) {
        throw new Error('Failed to load path');
      }
      const data = await res.json();
      setCurrentPath(data.current_path);
      setParentPath(data.parent_path);
      setItems(data.items);
    } catch (e: any) {
      setError(e.message || 'Error loading directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPath('');
  }, []);

  const handleItemClick = (item: FsItem) => {
    if (item.is_dir) {
      fetchPath(item.path);
    } else {
      if (mode === 'file') {
        onSelect(item.path, item.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSelectCurrentFolder = () => {
    if (mode === 'folder' && currentPath) {
      onSelect(currentPath);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '90vw', height: '70vh', display: 'flex', flexDirection: 'column' }}>
        
        <div className="modal-header" style={{ marginBottom: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <button 
              className="icon-button" 
              onClick={() => fetchPath(parentPath)}
              disabled={loading}
              title="Go up"
            >
              <ArrowLeft size={18} />
            </button>
            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentPath || 'Lokale Laufwerke'}
            </span>
          </div>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Lade...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#ff6b6b' }}>{error}</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Ordner ist leer</div>
          ) : (
            items.map((item, i) => (
              <div 
                key={i} 
                className="list-item" 
                onClick={() => handleItemClick(item)}
                style={{ cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {currentPath === "" ? (
                  <HardDrive size={18} color="var(--accent-blue)" />
                ) : item.is_dir ? (
                  <Folder size={18} color="#f6e58d" />
                ) : (
                  <File size={18} color="var(--text-muted)" />
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px 0 0', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {mode === 'folder' ? 'Wähle einen Ordner aus.' : 'Wähle eine Datei aus.'}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button-secondary" onClick={onClose}>Abbrechen</button>
            {mode === 'folder' && currentPath && (
              <button className="button-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleSelectCurrentFolder}>
                <Check size={16} /> Aktuellen Ordner wählen
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
