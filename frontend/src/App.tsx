import React, { useState, useEffect, useRef } from 'react';
import { Search, Folder, FolderOpen, Database, HardDrive, Printer, X, Settings, Trash2, LayoutGrid, List as ListIcon, Box, CheckCircle, Copy, Tag, ArrowUpDown, Globe, Pencil, Menu, Languages, Sparkles, Lock, ShieldCheck, Eye, EyeOff, Smartphone, Download } from 'lucide-react';
import ThreeViewer from './ThreeViewer';
import { FileBrowserModal } from './FileBrowserModal';
import { OnlineSearchProvider, OnlineSearchSidebar, OnlineSearchContent } from './OnlineSearch';
import { SearchModal } from './SearchModal';
import { SimilarModelsModal } from './SimilarModelsModal';
import { useI18n } from './i18n';
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
  modified_at?: number;
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

const ModelCard = ({ model, slicers, viewMode, isSelected, allTags = [], tagColors, handleToggleSelect, handleSlice, handleDeleteModel, handleToggleStatus, handlePreview, handleUpdateTags, handleOpenFolder, onContextMenu, handleSetSearchTerm, handleFindSimilar }: { model: Model, slicers: any[], viewMode: string, isSelected: boolean, allTags?: string[], tagColors?: Record<string, string>, handleToggleSelect: (id: string) => void, handleSlice: (id: string, path: string) => void, handleDeleteModel: (id: string, name: string) => void, handleToggleStatus: (id: string, current: string) => void, handlePreview: (m: Model) => void, handleUpdateTags: (id: string, tags: string[]) => void, handleOpenFolder: (id: string) => void, onContextMenu: (e: React.MouseEvent, m: Model) => void, handleSetSearchTerm: (term: string) => void, handleFindSimilar: (m: Model) => void }) => {
  const { t } = useI18n();
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

  const fileExt = model.name.split('.').pop()?.toUpperCase() || '3D';
  const folderName = model.rel_path ? model.rel_path.split(/[\/\\]/).pop() || '3d' : '3d';

  if (viewMode === 'list') {
    return (
      <div onContextMenu={e => onContextMenu(e, model)} className={`list-item ${isSelected ? 'is-selected' : ''}`}>
        <div className="list-item-main-row">
          <div className="list-item-checkbox">
            <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(model.id)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-blue)' }} />
          </div>
          <img src={currentThumb} alt={model.name} className="list-item-thumb" onClick={() => handlePreview(model)} />
          <div className="list-item-info">
            <div className="list-item-name" title={model.name}>{model.name}</div>
            <div className="list-item-folder">
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
        </div>

        <div className="list-item-meta-row">
          {tags.length > 0 && (
            <div className="list-item-tags">
              {tags.map(t => {
                const c = tagColor(t, tagColors);
                return (
                  <span key={t} onClick={() => removeTag(t)} title="Tag entfernen" style={{ background: c+'22', color: c, border: `1px solid ${c}55`, borderRadius: '10px', padding: '1px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>
                    {t} ×
                  </span>
                );
              })}
            </div>
          )}

          <div className="list-item-size">{model.size_kb} KB</div>

          <div className="list-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: 'auto' }}>
            <button
              className="icon-button"
              onClick={() => handleToggleStatus(model.id, model.status)}
              title={model.status === 'Printed' ? 'Gedruckt (Klicken zum Ändern)' : 'Als gedruckt markieren'}
              style={{
                color: model.status === 'Printed' ? '#2ecc71' : 'var(--text-muted)',
                background: model.status === 'Printed' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: model.status === 'Printed' ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                width: '30px',
                height: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <CheckCircle size={17} strokeWidth={model.status === 'Printed' ? 2.5 : 2} />
            </button>
            {model.source_url && (
              <button
                className="icon-button"
                onClick={(e) => { e.stopPropagation(); window.open(model.source_url, '_blank'); }}
                title={`Quelle öffnen:\n${model.source_url}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  width: '30px',
                  height: '30px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Globe size={16} />
              </button>
            )}
            <button
              className="icon-button"
              onClick={(e) => { e.stopPropagation(); handleOpenFolder(model.id); }}
              title="Speicherort im Explorer öffnen"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                width: '30px',
                height: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <FolderOpen size={16} />
            </button>
            <button
              className="icon-button"
              onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id, model.name); }}
              title="Remove Model from disk"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                width: '30px',
                height: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
            </button>

            <button
              className="icon-button"
              onClick={(e) => { e.stopPropagation(); handleFindSimilar(model); }}
              title={t('findSimilar')}
              style={{
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Sparkles size={16} color="#fbbf24" />
            </button>

            <div
              style={{ position: 'relative', display: 'flex', flexShrink: 0 }}
              onMouseEnter={() => { if (slicers && slicers.length > 0) setShowSlicerMenu(true); }}
              onMouseLeave={() => setShowSlicerMenu(false)}
            >
              <button
                className="icon-button"
                onClick={onSendClick}
                title="Send to Slicer"
                style={{
                  color: 'var(--accent-blue)',
                  background: 'rgba(58, 123, 213, 0.18)',
                  border: '1px solid rgba(58, 123, 213, 0.45)',
                  borderRadius: '8px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Printer size={21} strokeWidth={2.4} />
              </button>
              {showSlicerMenu && (
                <div style={{ position: 'absolute', right: '0', top: '100%', paddingTop: '4px', zIndex: 100 }}>
                  <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', width: 'max-content', boxShadow: '0 6px 16px rgba(0,0,0,0.6)' }}>
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
      </div>
    );
  }

  return (
    <div onContextMenu={e => onContextMenu(e, model)} className={`model-card ${isSelected ? 'is-selected' : ''}`} style={{ border: isSelected ? '2px solid var(--accent-blue)' : undefined }}>
      <div className="card-image-container">
        {/* Top-Left: Checkbox */}
        <div className="card-top-left">
          <div className="select-checkbox-container" onClick={e => e.stopPropagation()}>
            <input 
              type="checkbox" 
              checked={isSelected} 
              onChange={() => handleToggleSelect(model.id)} 
              style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--accent-blue)', margin: 0 }} 
            />
          </div>
        </div>

        {/* Top-Right: File Extension Badge & Image Count */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
          <span style={{ background: 'rgba(18, 21, 36, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent-cyan)', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '6px' }}>
            .{fileExt}
          </span>
          {total > 1 && (
            <span className="badge-count">{imgIdx + 1}/{total}</span>
          )}
        </div>

        {total > 1 && (
            <>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', zIndex: 15, cursor: 'w-resize' }} onClick={() => setImgIdx(i => (i > 0 ? i - 1 : total - 1))} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', zIndex: 15, cursor: 'e-resize' }} onClick={() => setImgIdx(i => (i < total - 1 ? i + 1 : 0))} />
            </>
        )}

        {/* Bottom-Left: Folder Badge Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          maxWidth: '85%',
          background: 'rgba(15, 18, 30, 0.85)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '2px 8px 2px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          zIndex: 10
        }}>
          <Folder size={12} color="#8e2de2" />
          <span style={{ fontSize: '10px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {folderName}
          </span>
        </div>

        <img src={currentThumb} alt={model.name} className="card-image" style={{ cursor: 'pointer' }} onClick={() => handlePreview(model)} onError={(e) => { e.currentTarget.src = "data:image/svg+xml;charset=UTF-8,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%231a1d2f'/%3E%3Ctext x='50%25' y='50%25' fill='%23949db2' font-family='sans-serif' font-size='14' text-anchor='middle' dominant-baseline='middle'%3ENo Thumbnail%3C/text%3E%3C/svg%3E" }} />
      </div>

      <div className="model-title-box" title={model.name} onClick={() => handlePreview(model)} style={{ cursor: 'pointer' }}>{model.name}</div>
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
          <div className="meta-item" style={{ flexShrink: 0, marginLeft: 'auto' }}>
            <HardDrive size={14} /> {model.size_kb} KB
          </div>
        </div>

        {/* Tags Row */}
        <div className="model-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', marginTop: '6px', minHeight: '22px' }}>
          {tags.map(t => {
            const c = tagColor(t, tagColors);
            return (
              <span key={t} onClick={() => removeTag(t)} title="Tag entfernen" style={{ background: c+'22', color: c, border: `1px solid ${c}55`, borderRadius: '10px', padding: '1px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>
                {t} ×
              </span>
            );
          })}
          {showTagInput ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(tagInput); if (e.key === 'Escape') setShowTagInput(false); }}
                onBlur={() => {
                  setTimeout(() => {
                    if (tagInput.trim()) addTag(tagInput);
                    else setShowTagInput(false);
                  }, 150);
                }}
                placeholder="Tag..."
                style={{ width: '70px', padding: '1px 6px', fontSize: '10px', borderRadius: '8px', border: '1px solid var(--accent-blue)', background: 'var(--bg-input)', color: '#fff', outline: 'none' }}
                autoFocus
              />
              {allTags && allTags.length > 0 && (
                <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#171b2d', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', zIndex: 120, maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '110px', marginBottom: '4px', boxShadow: '0 6px 16px rgba(0,0,0,0.5)' }}>
                  {allTags.filter(t => !tags.includes(t) && (!tagInput || t.includes(tagInput.toLowerCase()))).map(t => {
                    const tc = tagColor(t, tagColors);
                    return (
                      <div key={t} onMouseDown={(e) => { e.preventDefault(); addTag(t); }}
                        style={{ background: tc + '22', color: tc, border: `1px solid ${tc}44`, borderRadius: '6px', padding: '2px 6px', fontSize: '9px', cursor: 'pointer', fontWeight: '600' }}>
                        + {t}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setShowTagInput(true); setTimeout(() => tagInputRef.current?.focus(), 50); }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border-color)', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Tag hinzufügen"
            >
              + Tag
            </button>
          )}
        </div>

        {/* Actions Toolbar */}
        <div className="card-actions" style={{ position: 'relative', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="icon-button"
              onClick={() => handleToggleStatus(model.id, model.status)}
              title={model.status === 'Printed' ? 'Gedruckt (Klicken zum Ändern)' : 'Als gedruckt markieren'}
              style={{
                color: model.status === 'Printed' ? '#2ecc71' : 'var(--text-muted)',
                background: model.status === 'Printed' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: model.status === 'Printed' ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                width: '30px',
                height: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <CheckCircle size={17} strokeWidth={model.status === 'Printed' ? 2.5 : 2} />
            </button>
            {model.source_url && (
              <button
                className="icon-button"
                onClick={(e) => { e.stopPropagation(); window.open(model.source_url, '_blank'); }}
                title={`Quelle öffnen:\n${model.source_url}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  width: '30px',
                  height: '30px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Globe size={16} />
              </button>
            )}
            <button
              className="icon-button"
              onClick={(e) => { e.stopPropagation(); handleOpenFolder(model.id); }}
              title="Speicherort im Explorer öffnen"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                width: '30px',
                height: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <FolderOpen size={16} />
            </button>
            <button
              className="icon-button"
              onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id, model.name); }}
              title="Remove Model from disk"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                width: '30px',
                height: '30px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <button
              className="icon-button"
              onClick={(e) => { e.stopPropagation(); handleFindSimilar(model); }}
              title={t('findSimilar')}
              style={{
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={16} color="#fbbf24" />
            </button>

            <div
              style={{ position: 'relative', display: 'flex' }}
              onMouseEnter={() => { if (slicers && slicers.length > 0) setShowSlicerMenu(true); }}
              onMouseLeave={() => setShowSlicerMenu(false)}
            >
              <button
                className="icon-button"
                onClick={onSendClick}
                title="Send to Slicer"
                style={{
                  color: 'var(--accent-blue)',
                  background: 'rgba(58, 123, 213, 0.18)',
                  border: '1px solid rgba(58, 123, 213, 0.45)',
                  borderRadius: '8px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Printer size={21} strokeWidth={2.4} />
              </button>
              {showSlicerMenu && (
                <div style={{ position: 'absolute', right: '0', top: '100%', paddingTop: '4px', zIndex: 100 }}>
                  <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', width: 'max-content', boxShadow: '0 6px 16px rgba(0,0,0,0.6)' }}>
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
      </div>
    </div>
  );
};

const API_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

function App() {
  const { lang, toggleLanguage, t } = useI18n();
  const [models, setModels] = useState<Model[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [directoryInput, setDirectoryInput] = useState('');
  const [settings, setSettings] = useState<any>({ directories: [], slicers: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [previewModel, setPreviewModel] = useState<Model | null>(null);
  const [similarModalSource, setSimilarModalSource] = useState<Model | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, model: Model } | null>(null);
  const [duplicates, setDuplicates] = useState<Model[][]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('mod_desc');
  const [slicerNameInput, setSlicerNameInput] = useState('');
  const [slicerPathInput, setSlicerPathInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [fileBrowserMode, setFileBrowserMode] = useState<'none' | 'folder' | 'slicer'>('none');
  const [activeNav, setActiveNav] = useState<'library' | 'online'>('library');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Platform Accounts State
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountPlatform, setSelectedAccountPlatform] = useState('makerworld');
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountToken, setAccountToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountMsg, setAccountMsg] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'folders' | 'tags' | 'accounts' | 'maintenance'>('folders');

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
    }

    const installHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const appInstalledHandler = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', installHandler);
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', installHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Tipp: Um die WebApp zu installieren, klicke im Browser (Chrome/Edge/Firefox) in der Adressleiste auf das App-Installieren-Symbol (⊕) oder im Browser-Menü auf "App installieren" bzw. "Zum Startbildschirm hinzufügen".');
    }
  };

  useEffect(() => {
    fetchModels();
    fetchSettings();
    fetchTags();
    fetchAccounts();
    const interval = setInterval(fetchModels, 2500);
    return () => clearInterval(interval);
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/accounts`);
      const data = await res.json();
      setAccounts(data);
    } catch (e) {
      console.error("Error fetching accounts", e);
    }
  };

  const handleSaveAccount = async () => {
    if (!accountUsername) return;
    setAccountLoading(true);
    setAccountMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/accounts/${selectedAccountPlatform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: accountUsername,
          password: accountPassword,
          token: accountToken
        })
      });
      if (res.ok) {
        setAccountPassword('');
        setAccountToken('');
        setAccountMsg(t('accountSavedSuccess'));
        fetchAccounts();
        setTimeout(() => setAccountMsg(''), 4000);
      }
    } catch (e) {
      console.error("Error saving account", e);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDeleteAccount = async (pid: string) => {
    try {
      await fetch(`${API_BASE}/api/accounts/${pid}`, { method: 'DELETE' });
      fetchAccounts();
      setAccountUsername('');
      setAccountPassword('');
      setAccountToken('');
      setAccountMsg(t('accountDeletedSuccess'));
      setTimeout(() => setAccountMsg(''), 4000);
    } catch (e) {
      console.error("Error deleting account", e);
    }
  };

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/models?t=${Date.now()}`);
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

  const handleUpdateTagColor = async (tag: string, color: string) => {
    try {
      await fetch(`${API_BASE}/api/settings/tag-color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, color })
      });
      fetchSettings();
    } catch (e) {
      console.error("Error updating tag color", e);
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
    if (newUrl === null) return;
    try {
      await fetch(`${API_BASE}/api/models/${id}/url`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      fetchModels();
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
    } catch (e) {
      console.error("Error updating tags", e);
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
    if (sortBy === 'mod_desc') return (b.modified_at || b.added_at || 0) - (a.modified_at || a.added_at || 0);
    if (sortBy === 'mod_asc') return (a.modified_at || a.added_at || 0) - (b.modified_at || b.added_at || 0);
    if (sortBy === 'size_desc') return (b.size_kb || 0) - (a.size_kb || 0);
    if (sortBy === 'size_asc') return (a.size_kb || 0) - (b.size_kb || 0);
    return 0;
  });

  return (
    <OnlineSearchProvider>
      <div className="app-container">
        {/* Mobile Header Bar (<= 860px) */}
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} title="Menü öffnen">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #00d2ff, #8e2de2)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0, 210, 255, 0.3)' }}>
                <Database size={15} color="white" />
              </div>
              <span style={{ fontWeight: '800', fontSize: '16px', color: '#fff', letterSpacing: '0.5px' }}>STL Manager</span>
              <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 210, 255, 0.3)', padding: '1px 5px', borderRadius: '5px' }}>v1.3.0</span>
            </div>
          </div>
        </div>

        {/* Sidebar (Permanent on Desktop, Slide-Drawer on Mobile) */}
        <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          {/* Logo Section / Mobile Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #00d2ff, #8e2de2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0, 210, 255, 0.25)' }}>
                <Database size={26} color="white" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontWeight: '800', fontSize: '17px', letterSpacing: '1px', color: '#fff' }}>STL Manager</div>
                  <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 210, 255, 0.3)', padding: '1px 5px', borderRadius: '6px' }}>v1.3.0</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{models.length} {t('modelsTotal')}</span>
                  <button
                    onClick={toggleLanguage}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: 'var(--accent-cyan)',
                      padding: '1px 5px',
                      fontSize: '9px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                    title="Sprache wechseln / Switch Language"
                  >
                    {lang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
                  </button>
                </div>
              </div>
            </div>
            <button
              className="mobile-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs - Larger, Modern & Clean */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <button 
              onClick={() => { setActiveNav('library'); setMobileMenuOpen(false); }}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: activeNav === 'library' ? '1px solid var(--accent-blue)' : '1px solid rgba(255, 255, 255, 0.05)',
                background: activeNav === 'library' ? 'rgba(58, 123, 213, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: activeNav === 'library' ? '#fff' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: activeNav === 'library' ? '0 4px 15px rgba(58, 123, 213, 0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Folder size={18} color={activeNav === 'library' ? 'var(--accent-cyan)' : 'var(--text-muted)'} /> 
                {t('library')}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '12px', color: 'var(--text-main)' }}>
                {models.length}
              </span>
            </button>

            <button 
              onClick={() => { setActiveNav('online'); setMobileMenuOpen(false); }}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: activeNav === 'online' ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.05)',
                background: activeNav === 'online' ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: activeNav === 'online' ? '#fff' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: activeNav === 'online' ? '0 4px 15px rgba(0, 210, 255, 0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={18} color={activeNav === 'online' ? 'var(--accent-cyan)' : 'var(--text-muted)'} /> 
                {t('onlineModels')}
              </span>
              <span style={{ fontSize: '10px', fontWeight: '800', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', padding: '2px 7px', borderRadius: '10px', color: '#fff' }}>
                NEU
              </span>
            </button>
          </div>

        {/* Library Controls (Search, Tags, Duplicates) */}
        {activeNav === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Prominently Highlighted Local Search Hub */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(58, 123, 213, 0.12), rgba(0, 210, 255, 0.08))',
              border: '1px solid rgba(58, 123, 213, 0.35)',
              boxShadow: '0 4px 20px rgba(58, 123, 213, 0.18)',
              borderRadius: '14px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px', color: 'var(--accent-cyan)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={13} color="var(--accent-cyan)" /> {t('librarySearch')}
                </span>
                {searchTerm && (
                  <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', background: 'rgba(0, 210, 255, 0.15)', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
                    {t('activeSearch')}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--accent-cyan)', pointerEvents: 'none' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder={t('searchLocalPlaceholder')} 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '38px',
                    borderRadius: '10px',
                    height: '42px',
                    fontSize: '13px',
                    fontWeight: '500',
                    background: 'var(--bg-dark)',
                    border: '1px solid rgba(58, 123, 213, 0.3)',
                    color: '#fff',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                  }}
                />
                {searchTerm && (
                  <X size={15} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} />
                )}
              </div>
            </div>

            {/* Tag Filter */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Tag size={12} /> {t('filterTags')}
                </span>
                {activeTagFilter && (
                  <button 
                    onClick={() => setActiveTagFilter(null)} 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                  >
                    {t('clearFilter')}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <span 
                  onClick={() => setActiveTagFilter(activeTagFilter === '__untagged__' ? null : '__untagged__')}
                  style={{
                    background: activeTagFilter === '__untagged__' ? 'rgba(255, 77, 77, 0.3)' : 'rgba(255, 77, 77, 0.08)',
                    color: '#ff6b6b',
                    border: `1px solid ${activeTagFilter === '__untagged__' ? '#ff6b6b' : 'rgba(255, 77, 77, 0.2)'}`,
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all .15s'
                  }}
                  title="Zeige nur Modelle ohne Tags"
                >
                  {t('untagged')}
                </span>
                {allTags.map(t => {
                  const c = tagColor(t, settings?.tag_colors);
                  const isSelected = activeTagFilter === t;
                  return (
                    <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: isSelected ? c+'44' : c+'14', color: c, border: `1px solid ${c}${isSelected ? 'bb' : '33'}`, borderRadius: '8px', padding: '3px 8px', fontSize: '11px', fontWeight: '600' }}>
                      <span onClick={() => setActiveTagFilter(isSelected ? null : t)} style={{ cursor: 'pointer' }}>{t}</span>
                      <TagColorPicker tag={t} initialColor={c} onSave={handleUpdateTagColor} size={12} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duplicates Tool Button */}
            <button 
              className="button-secondary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', fontSize: '13px', margin: 0, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }} 
              onClick={handleFindDuplicates}
            >
              <Copy size={15} /> {t('findDuplicates')}
            </button>
          </div>
        )}

        {/* Online Search Controls in Sidebar */}
        {activeNav === 'online' && (
          <OnlineSearchSidebar />
        )}

        {/* Footer / Settings */}
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button 
            className="button-secondary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '10px', fontSize: '13px', background: 'rgba(255, 255, 255, 0.04)' }} 
            onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
          >
             <Settings size={16} /> {t('settings')}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content Area: Keep both mounted to preserve search state & scroll position */}
      <div style={{ flex: 1, height: '100%', display: activeNav === 'online' ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden' }}>
        <OnlineSearchContent />
      </div>

      <div className="main-content" style={{ display: activeNav === 'library' ? 'flex' : 'none' }}>
        {/* Controls Bar: Sort, View Mode, Selection Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(20, 27, 45, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          {/* Left / Selection Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedIds.length > 0 ? (
              <div className="batch-action-bar">
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)', background: 'rgba(0, 210, 255, 0.15)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                  {selectedIds.length} {t('modelSelected')}
                </span>
                <button className="batch-pill-btn default" onClick={handleSelectAll}>
                  {selectedIds.length === sortedModels.length ? t('deselectAllBtn') : t('selectAllBtn')}
                </button>
                <button className="batch-pill-btn success" onClick={() => handleBatchStatus('Printed')}>
                  ✓ {t('markPrinted')}
                </button>
                <button className="batch-pill-btn warning" onClick={() => handleBatchStatus('Not Printed')}>
                  ✗ {t('markNotPrinted')}
                </button>
                <button className="batch-pill-btn danger" onClick={handleBatchDelete}>
                  <Trash2 size={13} /> {t('deleteSelected')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Folder size={18} color="var(--accent-cyan)" /> {t('library')}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-cyan)', background: 'rgba(0, 210, 255, 0.12)', border: '1px solid rgba(0, 210, 255, 0.25)', padding: '2px 8px', borderRadius: '10px' }}>
                  {sortedModels.length} {t('modelsDisplayed')}
                </span>
              </div>
            )}
          </div>

          {/* Right: Sort & View Mode */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(13, 17, 30, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '2px 8px' }}>
              <ArrowUpDown size={13} color="var(--accent-cyan)" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{ background: 'transparent', color: '#fff', border: 'none', padding: '6px 4px', fontSize: '12px', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
              >
                <option value="mod_desc" style={{ background: '#111627' }}>{t('sortModDesc')}</option>
                <option value="mod_asc" style={{ background: '#111627' }}>{t('sortModAsc')}</option>
                <option value="date_desc" style={{ background: '#111627' }}>{t('sortDateDesc')}</option>
                <option value="date_asc" style={{ background: '#111627' }}>{t('sortDateAsc')}</option>
                <option value="name_asc" style={{ background: '#111627' }}>{t('sortName')}</option>
                <option value="name_desc" style={{ background: '#111627' }}>{t('sortNameDesc')}</option>
                <option value="size_desc" style={{ background: '#111627' }}>{t('sortSizeDesc')}</option>
                <option value="size_asc" style={{ background: '#111627' }}>{t('sortSizeAsc')}</option>
              </select>
            </div>

            <div style={{ display: 'flex', background: 'rgba(13, 17, 30, 0.7)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                className="icon-button"
                style={{
                  background: viewMode === 'grid' ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'transparent',
                  color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '7px',
                  width: '30px',
                  height: '30px'
                }}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className="icon-button"
                style={{
                  background: viewMode === 'list' ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '7px',
                  width: '30px',
                  height: '30px'
                }}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className={`${viewMode === 'grid' ? "models-grid" : "models-list"} ${selectedIds.length > 0 ? "has-selection" : ""}`}>
          {sortedModels.map(model => (
            <ModelCard key={model.id} model={model} slicers={settings.slicers} viewMode={viewMode} isSelected={selectedIds.includes(model.id)} allTags={allTags} tagColors={settings.tag_colors} handleToggleSelect={handleToggleSelect} handleSlice={handleSlice} handleDeleteModel={handleDeleteModel} handleToggleStatus={handleToggleStatus} handlePreview={setPreviewModel} handleUpdateTags={handleUpdateTags} handleOpenFolder={handleOpenFolder} handleSetSearchTerm={setSearchTerm} handleFindSimilar={setSimilarModalSource} onContextMenu={(e, m) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, model: m }); }} />
          ))}
          {sortedModels.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {t('noModelsFound')}
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} color="var(--accent-cyan)" />
                  {t('settings')}
                </div>
                <button className="icon-button" onClick={() => setShowSettings(false)}><X size={20} /></button>
             </div>

             {/* Tab Navigation */}
             <div className="modal-tabs">
               <button 
                 type="button" 
                 className={`modal-tab-btn ${settingsTab === 'folders' ? 'active' : ''}`}
                 onClick={() => setSettingsTab('folders')}
               >
                 <Folder size={14} /> {t('settingsTabsFolders')}
               </button>
               <button 
                 type="button" 
                 className={`modal-tab-btn ${settingsTab === 'tags' ? 'active' : ''}`}
                 onClick={() => setSettingsTab('tags')}
               >
                 <Tag size={14} /> {t('settingsTabsTags')}
               </button>
               <button 
                 type="button" 
                 className={`modal-tab-btn ${settingsTab === 'accounts' ? 'active' : ''}`}
                 onClick={() => setSettingsTab('accounts')}
               >
                 <ShieldCheck size={14} /> {t('settingsTabsAccounts')}
               </button>
               <button 
                 type="button" 
                 className={`modal-tab-btn ${settingsTab === 'maintenance' ? 'active' : ''}`}
                 onClick={() => setSettingsTab('maintenance')}
               >
                 <HardDrive size={14} /> {t('settingsTabsMaintenance')}
               </button>
             </div>

             <div className="modal-body">
                {/* TAB 1: Folders & Slicers */}
                {settingsTab === 'folders' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">{t('monitoredFolders')}:</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="z.B. D:\STLs" 
                          value={directoryInput}
                          onChange={e => setDirectoryInput(e.target.value)}
                          style={{ flex: 1, minWidth: '180px' }}
                        />
                        <button
                          type="button"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          onClick={handleBrowseDirectory}
                          title="Ordner auf Festplatte auswählen"
                        >
                          <FolderOpen size={14} color="var(--accent-cyan)" /> {t('addFolder')}
                        </button>
                        <button
                          type="button"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0, 210, 255, 0.3)', whiteSpace: 'nowrap' }}
                          onClick={handleAddDirectory}
                        >
                          + {lang === 'de' ? 'Hinzufügen' : 'Add'}
                        </button>
                      </div>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {settings.directories.map((d: string, i: number) => (
                          <div className="list-item" key={i} style={{ margin: 0, padding: '8px 12px', background: 'rgba(15, 20, 35, 0.7)' }}>
                            <Folder size={14} color="#8e2de2" style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#fff' }}>{d}</span>
                            <button className="icon-button" onClick={() => handleRemoveDirectory(d)} title="Ordner entfernen"><Trash2 size={13} color="#ff4d4d" /></button>
                          </div>
                        ))}
                        {settings.directories.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>{lang === 'de' ? 'Noch keine Ordner überwacht.' : 'No directories monitored.'}</div>}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '16px' }}>
                      <label className="form-label">{t('slicers')}:</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={slicerNameInput}
                          onChange={e => setSlicerNameInput(e.target.value)}
                          placeholder="Name (z.B. Bambu Studio / OrcaSlicer)"
                          style={{ flex: 1, minWidth: '140px' }}
                        />
                        <div style={{ flex: 2, display: 'flex', gap: '6px', minWidth: '200px' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            value={slicerPathInput}
                            onChange={e => setSlicerPathInput(e.target.value)}
                            placeholder="Pfad (z.B. C:\Program Files\...)"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onClick={handleBrowseSlicer}
                            title="Datei auf Festplatte auswählen"
                          >
                            <FolderOpen size={14} color="var(--accent-cyan)" /> {lang === 'de' ? 'Auswählen' : 'Browse'}
                          </button>
                        </div>
                        <button
                          type="button"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0, 210, 255, 0.3)', whiteSpace: 'nowrap' }}
                          onClick={handleAddSlicer}
                        >
                          + {lang === 'de' ? 'Hinzufügen' : 'Add'}
                        </button>
                      </div>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {settings.slicers?.map((s: any, i: number) => (
                          <div className="list-item" key={i} style={{ margin: 0, padding: '8px 12px', background: 'rgba(15, 20, 35, 0.7)' }}>
                            <Printer size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
                            <span style={{ fontWeight: '700', fontSize: '12px', color: '#fff', width: '130px', flexShrink: 0 }}>{s.name}</span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)' }}>{s.path}</span>
                            <button className="icon-button" onClick={() => handleRemoveSlicer(s.name)} title="Slicer entfernen"><Trash2 size={13} color="#ff4d4d" /></button>
                          </div>
                        ))}
                        {(!settings.slicers || settings.slicers.length === 0) && <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>{lang === 'de' ? 'Noch keine Slicer hinterlegt.' : 'No slicers configured.'}</div>}
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: Tags & Colors */}
                {settingsTab === 'tags' && (
                  <div className="form-group">
                     <label className="form-label">{t('manageTags')}:</label>
                     <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                       <input 
                         type="text" 
                         className="input-field" 
                         placeholder={t('newTagName')} 
                         value={newTagInput}
                         onChange={e => setNewTagInput(e.target.value)}
                         onKeyDown={e => { if (e.key === 'Enter') handleAddSettingsTag(); }}
                         style={{ flex: 1 }}
                       />
                       <button
                         type="button"
                         style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0, 210, 255, 0.3)', whiteSpace: 'nowrap' }}
                         onClick={handleAddSettingsTag}
                       >
                         + {lang === 'de' ? 'Tag erstellen' : 'Add Tag'}
                       </button>
                     </div>
                     <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                       {allTags.map(t => {
                         const c = tagColor(t, settings?.tag_colors);
                         return (
                           <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 20, 35, 0.8)', padding: '5px 10px', borderRadius: '10px', border: `1px solid ${c}55` }}>
                             <span style={{ fontSize: '12px', color: c, fontWeight: '700' }}>{t}</span>
                             <TagColorPicker tag={t} initialColor={c} onSave={handleUpdateTagColor} size={18} />
                             <button className="icon-button" style={{ marginLeft: '4px', width: '24px', height: '24px' }} onClick={() => handleRemoveSettingsTag(t)} title="Tag komplett löschen"><Trash2 size={11} color="#ff4d4d" /></button>
                           </div>
                         );
                       })}
                       {allTags.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>{lang === 'de' ? 'Keine Tags vorhanden.' : 'No tags available.'}</div>}
                     </div>
                  </div>
                )}

               {/* TAB 3: Platform Accounts (DPAPI Encrypted) */}
               {settingsTab === 'accounts' && (
                 <div>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13px', color: '#fff' }}>
                       <ShieldCheck size={16} color="var(--accent-cyan)" />
                       {t('platformAccounts')}
                     </div>
                     <span style={{ fontSize: '10px', color: '#2ecc71', background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <Lock size={10} /> {t('savedSecurely')}
                     </span>
                   </div>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
                     {t('platformAccountsSubtitle')}
                   </div>

                   {/* Platform Selector Badges */}
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                     {accounts.map(acc => {
                       const isSelected = selectedAccountPlatform === acc.id;
                       return (
                         <button
                           key={acc.id}
                           type="button"
                           onClick={() => {
                             setSelectedAccountPlatform(acc.id);
                             setAccountUsername(acc.username || '');
                             setAccountPassword('');
                             setAccountToken('');
                             setAccountMsg('');
                           }}
                           style={{
                             padding: '5px 10px',
                             borderRadius: '8px',
                             border: isSelected ? `2px solid ${acc.color}` : '1px solid rgba(255,255,255,0.08)',
                             background: isSelected ? `${acc.color}25` : 'rgba(255,255,255,0.03)',
                             color: isSelected ? '#fff' : 'var(--text-muted)',
                             fontSize: '11px',
                             fontWeight: '700',
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '5px',
                             transition: 'all 0.2s'
                           }}
                         >
                           <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: acc.is_configured ? '#2ecc71' : 'rgba(255,255,255,0.2)' }} />
                           {acc.name}
                           {acc.is_configured && (
                             <span style={{ fontSize: '9px', background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '1px 4px', borderRadius: '4px' }}>
                               ✓
                             </span>
                           )}
                         </button>
                       );
                     })}
                   </div>

                   {/* Input Form for Selected Platform */}
                   <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                       <div style={{ flex: 1, minWidth: '160px' }}>
                         <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                           {t('usernameOrEmail')}
                         </label>
                         <input
                           type="text"
                           className="input-field"
                           placeholder="z.B. user@mail.de oder Username"
                           value={accountUsername}
                           onChange={e => setAccountUsername(e.target.value)}
                           style={{ width: '100%' }}
                         />
                       </div>

                       <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                         <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                           {t('password')}
                         </label>
                         <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                           <input
                             type={showPassword ? 'text' : 'password'}
                             className="input-field"
                             placeholder="••••••••••••"
                             value={accountPassword}
                             onChange={e => setAccountPassword(e.target.value)}
                             style={{ width: '100%', paddingRight: '34px' }}
                           />
                           <button
                             type="button"
                             onClick={() => setShowPassword(!showPassword)}
                             style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                             title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                           >
                             {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                         </div>
                       </div>
                     </div>

                     {/* Optional Token Field */}
                     <div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                         <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                           {t('tokenOrCookie')}
                         </label>
                         <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                           {t('tokenOrCookieHint')}
                         </span>
                       </div>
                       <input
                         type="password"
                         className="input-field"
                         placeholder="Optionaler Token / Cookie (z.B. für 2FA oder OAuth)"
                         value={accountToken}
                         onChange={e => setAccountToken(e.target.value)}
                         style={{ width: '100%', fontSize: '11px' }}
                       />
                     </div>

                     {/* Action Buttons */}
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                       <div style={{ fontSize: '11px', color: '#2ecc71', fontWeight: '700' }}>
                         {accountMsg}
                       </div>
                       <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                         {accounts.find(a => a.id === selectedAccountPlatform)?.is_configured && (
                           <button
                             type="button"
                             className="danger-btn"
                             style={{ padding: '6px 12px', fontSize: '12px' }}
                             onClick={() => handleDeleteAccount(selectedAccountPlatform)}
                           >
                             <Trash2 size={13} /> {t('removeAccount')}
                           </button>
                         )}
                         <button
                           type="button"
                           className="slice-btn"
                           style={{ background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', border: 'none', padding: '6px 16px', fontSize: '12px', fontWeight: '700' }}
                           onClick={handleSaveAccount}
                           disabled={accountLoading || !accountUsername}
                         >
                           {accountLoading ? 'Speichern...' : `🔒 ${t('saveCredentials')}`}
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {/* TAB 4: Maintenance & App */}
               {settingsTab === 'maintenance' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {/* PWA WebApp Box */}
                   <div style={{ background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.08), rgba(58, 123, 213, 0.05))', border: '1px solid rgba(0, 210, 255, 0.3)', borderRadius: '12px', padding: '16px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '13px', color: '#fff' }}>
                         <Smartphone size={16} color="var(--accent-cyan)" />
                         {t('installApp')}
                       </div>
                       {isStandalone && (
                         <span style={{ fontSize: '10px', color: '#2ecc71', background: 'rgba(46, 204, 113, 0.15)', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                           ✓ Installiert
                         </span>
                       )}
                     </div>
                     <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                       {t('installAppDesc')}
                     </p>
                     <button
                       type="button"
                       className="slice-btn"
                       style={{ background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', color: '#fff', border: 'none', padding: '8px 16px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                       onClick={handleInstallPWA}
                     >
                       <Download size={14} /> {isStandalone ? 'App ist bereits installiert' : t('installApp')}
                     </button>
                   </div>

                   {/* Rescan & Clear DB Box */}
                   <div style={{ background: 'rgba(255, 50, 50, 0.05)', border: '1px solid rgba(255, 50, 50, 0.2)', borderRadius: '12px', padding: '16px' }}>
                     <h4 style={{ margin: '0 0 8px 0', color: '#ff4d4d', fontSize: '13px' }}>Clear Database & Rescan</h4>
                     <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                       {t('clearDatabaseDesc')}
                     </p>
                     <button className="danger-btn" onClick={handleClearDatabase}>
                        Clear Database & Rescan
                     </button>
                   </div>
                 </div>
               )}
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
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Keine Quell-URL hinterlegt</span>
                    )}
                    <button 
                      onClick={() => handleUpdateUrl(previewModel.id, previewModel.source_url)} 
                      title="Quell-URL anpassen oder hinzufügen" 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: 'var(--accent-cyan)' }}
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                  <button
                    onClick={() => {
                      setSimilarModalSource(previewModel);
                      setPreviewModel(null);
                    }}
                    title={t('findSimilar')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      color: '#fbbf24',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={15} /> {t('findSimilar')}
                  </button>
                  <button className="icon-button" onClick={() => setPreviewModel(null)}><X size={20} /></button>
                </div>
             </div>
             <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
                <ThreeViewer url={`${API_BASE}/api/download/${previewModel.id}`} filename={previewModel.name} />
             </div>
          </div>
        </div>
      )}

      {similarModalSource && (
        <SimilarModelsModal
          sourceModel={similarModalSource as any}
          onClose={() => setSimilarModalSource(null)}
          onSelectModelFor3D={(m) => setPreviewModel(m)}
          onSliceModel={(m, path) => handleSlice(m.id, path || (settings.slicers?.[0]?.path || ''))}
          onOpenFolder={() => handleOpenFolder(similarModalSource.id)}
          slicers={settings.slicers || []}
        />
      )}

      {showDuplicates && (
        <div className="modal-overlay" onClick={() => setShowDuplicates(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span>{t('findDuplicates')}</span>
              <button className="icon-button" onClick={() => setShowDuplicates(false)}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {duplicates.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  No duplicate models found. All files are unique!
                </div>
              ) : (
                duplicates.map((group: Model[], gi: number) => (
                  <div key={gi} style={{ marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(255,77,77,0.08)', padding: '8px 16px', fontSize: '12px', color: '#ff8888', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>
                      {group.length} duplicate files — same content hash
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
          <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#1a1d2f', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', minWidth: '170px' }}>
            <div 
               style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px', color: 'var(--accent-cyan)' }}
               onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 210, 255, 0.15)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
               onClick={() => { setSimilarModalSource(contextMenu.model); setContextMenu(null); }}
            >
               <Sparkles size={14} /> {t('findSimilar')}
            </div>
            <div 
               style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px', color: 'white', marginTop: '2px' }}
               onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-blue)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
               onClick={() => { handleOpenFolder(contextMenu.model.id); setContextMenu(null); }}
            >
               <FolderOpen size={14} /> Dateipfad öffnen
            </div>
            <div 
               style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px', color: '#ff4d4d', marginTop: '2px' }}
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

      {/* MakerWorld Floating Bottom Navigation Bar (Phones & Tablets) */}
      <div className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-item ${activeNav === 'library' ? 'active' : ''}`}
          onClick={() => { setActiveNav('library'); setMobileMenuOpen(false); }}
        >
          <Folder size={18} />
          <span>{t('library')}</span>
        </button>

        <button 
          className={`mobile-nav-item ${activeNav === 'online' ? 'active' : ''}`}
          onClick={() => { setActiveNav('online'); setMobileMenuOpen(false); }}
        >
          <Globe size={18} />
          <span>{t('onlineModels')}</span>
        </button>

        {/* Center Floating Elevated Search FAB -> Opens Search Popup */}
        <button 
          className="mobile-fab-search"
          onClick={() => setIsSearchModalOpen(true)}
          title={t('searchButton')}
        >
          <Search size={22} />
        </button>

        <button 
          className="mobile-nav-item"
          onClick={toggleLanguage}
          title="Sprache / Language"
        >
          <Languages size={18} />
          <span>{lang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}</span>
        </button>

        <button 
          className="mobile-nav-item"
          onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
        >
          <Settings size={18} />
          <span>{t('options')}</span>
        </button>
      </div>

      {/* Modern Search Modal Popup (Command Palette) */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        allTags={allTags}
        activeTagFilter={activeTagFilter}
        setActiveTagFilter={setActiveTagFilter}
      />
      </div>
    </OnlineSearchProvider>
  );
}

export default App;

