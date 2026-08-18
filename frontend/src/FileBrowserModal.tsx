import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, File, ArrowUp, RotateCw, HardDrive, Monitor, Download, Image as ImageIcon, Music, Video } from 'lucide-react';
import { useI18n } from './i18n';

interface FsItem {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  mtime?: number;
}

interface QuickAccessItem {
  name: string;
  path: string;
}

interface Props {
  mode: 'folder' | 'file';
  filterExt?: string;
  onClose: () => void;
  onSelect: (path: string, name?: string) => void;
  apiBase: string;
}

const formatSize = (bytes?: number) => {
  if (bytes === undefined || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '';
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getQuickAccessIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('desktop')) return <Monitor size={15} color="var(--accent-blue)" />;
  if (n.includes('download')) return <Download size={15} color="#00cec9" />;
  if (n.includes('bild') || n.includes('picture')) return <ImageIcon size={15} color="#fdcb6e" />;
  if (n.includes('musik') || n.includes('music')) return <Music size={15} color="#e84393" />;
  if (n.includes('video')) return <Video size={15} color="#6c5ce7" />;
  return <Folder size={15} color="#f6e58d" />;
};

export const FileBrowserModal: React.FC<Props> = ({ mode, filterExt = '', onClose, onSelect, apiBase }) => {
  const { t } = useI18n();
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState('');
  const [items, setItems] = useState<FsItem[]>([]);
  const [quickAccess, setQuickAccess] = useState<QuickAccessItem[]>([]);
  const [drives, setDrives] = useState<QuickAccessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pathInput, setPathInput] = useState('');
  const [selectedItem, setSelectedItem] = useState<FsItem | null>(null);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  const fetchPath = async (p: string) => {
    setLoading(true);
    setError('');
    setSelectedItem(null);
    try {
      const res = await fetch(`${apiBase}/api/fs/list?path=${encodeURIComponent(p)}&filter_ext=${encodeURIComponent(filterExt)}`);
      if (!res.ok) throw new Error(t('errAccessDenied'));
      const data = await res.json();
      setCurrentPath(data.current_path);
      setPathInput(data.current_path);
      setParentPath(data.parent_path);
      setItems(data.items);
      if (data.quick_access) setQuickAccess(data.quick_access);
      if (data.drives) setDrives(data.drives);
      
      // Scroll to top
      if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    } catch (e: any) {
      setError(e.message || t('errLoadDir'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPath('');
  }, []);

  const handleItemDoubleClick = (item: FsItem) => {
    if (item.is_dir) {
      fetchPath(item.path);
    } else {
      if (mode === 'file') {
        onSelect(item.path, item.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleItemClick = (item: FsItem) => {
    setSelectedItem(item);
  };

  const handleSubmit = () => {
    if (mode === 'folder') {
      if (selectedItem && selectedItem.is_dir) {
        onSelect(selectedItem.path);
      } else if (currentPath) {
        onSelect(currentPath);
      }
    } else {
      if (selectedItem && !selectedItem.is_dir) {
        onSelect(selectedItem.path, selectedItem.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  return (
    <div className="modal-overlay win-explorer-overlay" onClick={onClose}>
      <div className="modal-content win-explorer-modal" onClick={e => e.stopPropagation()}>
        
        {/* Title Bar */}
        <div className="win-explorer-header">
          <div className="win-explorer-title">
            <Folder size={16} color="#f6e58d" /> 
            {mode === 'folder' ? t('findFolder') : t('openFile')}
          </div>
          <button className="win-icon-button close-btn" onClick={onClose} title={t('btnCancel')}>
            <X size={16} />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="win-explorer-navbar">
          <div className="win-nav-actions">
            <button 
              className="win-icon-button" 
              onClick={() => fetchPath(parentPath)} 
              disabled={loading || !parentPath} 
              title={t('upOneLevel')}
            >
              <ArrowUp size={16} />
            </button>
            <button 
              className="win-icon-button" 
              onClick={() => fetchPath(currentPath)} 
              disabled={loading} 
              title={t('refresh')}
            >
              <RotateCw size={15} />
            </button>
          </div>
          <div className="win-address-bar">
            {currentPath === "" ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Monitor size={15} color="var(--accent-blue)" /> 
                <span>{t('thisPc')}</span>
              </div>
            ) : (
              <input 
                type="text" 
                value={pathInput}
                onChange={e => setPathInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchPath(pathInput); }}
                className="win-address-input"
                placeholder={t('searchLocalPlaceholder')}
              />
            )}
          </div>
        </div>

        {/* Main Area */}
        <div className="win-explorer-body">
          {/* Sidebar */}
          <div className="win-explorer-sidebar">
            <div className="win-sidebar-group">
              <div className="win-sidebar-title">{t('quickAccess')}</div>
              {quickAccess.map((qa, i) => (
                <div key={i} className={`win-sidebar-item ${currentPath === qa.path ? 'active' : ''}`} onClick={() => fetchPath(qa.path)}>
                  {getQuickAccessIcon(qa.name)}
                  <span>{qa.name}</span>
                </div>
              ))}
            </div>
            <div className="win-sidebar-group">
              <div className="win-sidebar-title">{t('thisPc')}</div>
              {drives.map((d, i) => (
                <div key={i} className={`win-sidebar-item ${currentPath === d.path ? 'active' : ''}`} onClick={() => fetchPath(d.path)}>
                  <HardDrive size={15} color="var(--accent-blue)" />
                  <span>{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Pane */}
          <div className="win-explorer-content" ref={mainContentRef}>
            {loading ? (
              <div className="win-message">{t('loadingDir')}</div>
            ) : error ? (
              <div className="win-message error">{error}</div>
            ) : items.length === 0 ? (
              <div className="win-message">{t('emptyFolder')}</div>
            ) : (
              <table className="win-file-table">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>{t('colName')}</th>
                    <th style={{ width: '25%' }}>{t('colDateModified')}</th>
                    <th style={{ width: '15%' }}>{t('colType')}</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>{t('colSize')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr 
                      key={i} 
                      className={selectedItem?.path === item.path ? 'selected' : ''}
                      onClick={() => handleItemClick(item)}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          {item.is_dir ? (
                            <Folder size={17} color="#f6e58d" fill="#f6e58d" fillOpacity={0.2} style={{ flexShrink: 0 }} />
                          ) : (
                            <File size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          )}
                          <span className="file-name">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{formatDate(item.mtime)}</td>
                      <td className="text-muted">{item.is_dir ? t('typeFileFolder') : t('typeFile')}</td>
                      <td className="text-muted" style={{ textAlign: 'right' }}>{formatSize(item.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="win-explorer-footer">
          <div className="win-footer-inputs">
            <div className="win-input-row">
              <label>{mode === 'folder' ? t('lblFolder') : t('lblFileName')}</label>
              <input type="text" readOnly value={selectedItem ? selectedItem.name : (mode === 'folder' ? currentPath : '')} />
            </div>
            <div className="win-input-row">
              <label>{t('lblFileType')}</label>
              <select disabled>
                {mode === 'folder' ? (
                  <option>{t('optFolders')}</option>
                ) : (
                  <option>Executable (*.exe)</option>
                )}
              </select>
            </div>
          </div>
          <div className="win-footer-actions">
            <button 
              className="win-btn-primary" 
              onClick={handleSubmit}
              disabled={mode === 'file' ? (!selectedItem || selectedItem.is_dir) : false}
            >
              {mode === 'folder' ? t('btnSelectFolder') : t('btnOpen')}
            </button>
            <button className="win-btn-secondary" onClick={onClose}>{t('btnCancel')}</button>
          </div>
        </div>

      </div>
    </div>
  );
};
