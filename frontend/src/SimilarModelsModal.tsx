import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Sparkles, Box, Scissors, Eye, Check, Loader2, FolderOpen, Globe, Search, ExternalLink, Copy, RefreshCw, ThumbsUp } from 'lucide-react';
import { useI18n } from './i18n';

export interface SimilarModelItem {
  id: string;
  name: string;
  filename: string;
  path: string;
  rel_path?: string;
  thumbnails?: string[];
  tags?: string[];
  printed?: boolean;
  source_url?: string;
  similarity_score?: number;
  similarity_percentage?: number;
}

export interface SimilarOnlineModelItem {
  id: string;
  name: string;
  platform: string;
  thumbnail?: string;
  url: string;
  author?: string;
  author_avatar?: string;
  likes?: number;
  downloads?: number;
  views?: number;
  is_free?: boolean;
  price?: string;
  source?: string;
  similarity_score?: number;
  similarity_percentage?: number;
}

interface SimilarModelsModalProps {
  sourceModel: SimilarModelItem;
  onClose: () => void;
  onSelectModelFor3D: (model: any) => void;
  onSliceModel: (model: any, slicerPath?: string) => void;
  onOpenFolder: (path: string) => void;
  slicers: Array<{ name: string; path: string }>;
}

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://127.0.0.1:8000' : '';

export const SimilarModelsModal: React.FC<SimilarModelsModalProps> = ({
  sourceModel,
  onClose,
  onSelectModelFor3D,
  onSliceModel,
  onOpenFolder,
  slicers
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local');

  // Local similarity state
  const [similarModels, setSimilarModels] = useState<SimilarModelItem[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Online similarity state
  const [onlineModels, setOnlineModels] = useState<SimilarOnlineModelItem[]>([]);
  const [onlineQuery, setOnlineQuery] = useState<string>('');
  const [onlineSearchInput, setOnlineSearchInput] = useState<string>('');
  const [onlineTotalEvaluated, setOnlineTotalEvaluated] = useState<number>(0);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const [hasLoadedOnline, setHasLoadedOnline] = useState(false);
  const [errorOnline, setErrorOnline] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const onlineFetchedRef = useRef<string | null>(null);

  // Fetch Local Similar Models
  useEffect(() => {
    let isMounted = true;
    setLoadingLocal(true);
    setErrorLocal(null);

    fetch(`${API_BASE}/api/models/${sourceModel.id}/similar?limit=24&min_score=0.35`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          setSimilarModels(Array.isArray(data) ? data : []);
          setLoadingLocal(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Error fetching local similar models:', err);
          setErrorLocal(t('noSimilarFound'));
          setLoadingLocal(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sourceModel.id, t]);

  // Fetch Online Similar Models
  const fetchOnlineSimilar = useCallback((queryOverride?: string) => {
    setLoadingOnline(true);
    setErrorOnline(null);

    const qParam = queryOverride !== undefined ? encodeURIComponent(queryOverride) : '';
    const url = `${API_BASE}/api/models/${sourceModel.id}/similar-online?q=${qParam}&limit=24&min_score=0.20`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setOnlineModels(Array.isArray(data.matches) ? data.matches : []);
        setOnlineQuery(data.query || '');
        if (queryOverride === undefined) {
          setOnlineSearchInput(data.query || '');
        }
        setOnlineTotalEvaluated(data.total_evaluated || 0);
        setLoadingOnline(false);
        setHasLoadedOnline(true);
      })
      .catch(err => {
        console.error('Error fetching online similar models:', err);
        setErrorOnline(t('noSimilarOnlineFound'));
        setLoadingOnline(false);
        setHasLoadedOnline(true);
      });
  }, [sourceModel.id, t]);

  // Auto-fetch online when switching to online tab for the first time
  useEffect(() => {
    if (activeTab === 'online' && onlineFetchedRef.current !== sourceModel.id) {
      onlineFetchedRef.current = sourceModel.id;
      fetchOnlineSimilar();
    }
  }, [activeTab, sourceModel.id, fetchOnlineSimilar]);

  const handleOnlineSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onlineSearchInput.trim()) {
      fetchOnlineSimilar(onlineSearchInput.trim());
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 85) return { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', text: '#34d399' };
    if (pct >= 70) return { bg: 'rgba(0, 210, 255, 0.2)', border: 'rgba(0, 210, 255, 0.5)', text: 'var(--accent-cyan)' };
    if (pct >= 55) return { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', text: '#fbbf24' };
    return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.5)', text: '#c084fc' };
  };

  const getPlatformBadge = (platformName: string) => {
    const p = platformName.toLowerCase();
    if (p.includes('makerworld')) return { name: 'MakerWorld', bg: 'rgba(0, 174, 66, 0.2)', color: '#00ae42', border: 'rgba(0, 174, 66, 0.4)' };
    if (p.includes('printables')) return { name: 'Printables', bg: 'rgba(250, 107, 5, 0.2)', color: '#fa6b05', border: 'rgba(250, 107, 5, 0.4)' };
    if (p.includes('thingiverse')) return { name: 'Thingiverse', bg: 'rgba(36, 139, 251, 0.2)', color: '#248bfb', border: 'rgba(36, 139, 251, 0.4)' };
    if (p.includes('cults')) return { name: 'Cults 3D', bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.4)' };
    if (p.includes('creality')) return { name: 'Creality Cloud', bg: 'rgba(2, 132, 199, 0.2)', color: '#0284c7', border: 'rgba(2, 132, 199, 0.4)' };
    if (p.includes('makeronline')) return { name: 'MakerOnline', bg: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.4)' };
    return { name: platformName, bg: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'rgba(255, 255, 255, 0.2)' };
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1120px',
          maxHeight: '92vh',
          background: '#0d111d',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 35px rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div
          className="similar-modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.2)',
                flexShrink: 0
              }}
            >
              <Sparkles size={18} color="#f59e0b" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('similarModels')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff' }}>
                  Meta DINOv2 AI
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  100% Lokales Re-Ranking
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tab Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('local')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9px',
                background: activeTab === 'local' ? '#ffffff' : 'transparent',
                color: activeTab === 'local' ? '#090c14' : '#94a3b8',
                border: 'none',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.18s'
              }}
            >
              <Box size={14} color={activeTab === 'local' ? '#090c14' : '#94a3b8'} />
              {t('similarInLibrary')}
              <span style={{ fontSize: '10px', opacity: 0.85, padding: '1px 5px', borderRadius: '10px', background: activeTab === 'local' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)' }}>
                {similarModels.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('online')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9px',
                background: activeTab === 'online' ? '#ffffff' : 'transparent',
                color: activeTab === 'online' ? '#090c14' : '#94a3b8',
                border: 'none',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.18s'
              }}
            >
              <Globe size={14} color={activeTab === 'online' ? '#090c14' : '#94a3b8'} />
              {t('similarOnline')}
              {hasLoadedOnline && (
                <span style={{ fontSize: '10px', opacity: 0.85, padding: '1px 5px', borderRadius: '10px', background: activeTab === 'online' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)' }}>
                  {onlineModels.length}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="similar-modal-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left Column: Reference Model */}
          <div
            className="similar-modal-left"
            style={{
              width: '270px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>
              {t('referenceModel')}
            </div>

            <div
              className="similar-reference-img"
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                aspectRatio: '1/1',
                position: 'relative'
              }}
            >
              {sourceModel.thumbnails && sourceModel.thumbnails.length > 0 ? (
                <img
                  src={sourceModel.thumbnails[0]}
                  alt={sourceModel.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  <Box size={32} />
                </div>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: '#fff', wordBreak: 'break-word' }}>
                {sourceModel.name}
              </h3>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                {sourceModel.filename}
              </p>
            </div>

            {/* Quick Actions for Reference */}
            <div className="similar-reference-actions" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectModelFor3D(sourceModel);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Eye size={13} /> {t('open3DPreview')}
              </button>

              <button
                type="button"
                onClick={() => onOpenFolder(sourceModel.path || sourceModel.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <FolderOpen size={13} /> {t('openFolder')}
              </button>

              {slicers.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSliceModel(sourceModel, slicers[0].path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: 'none',
                    color: '#090c14',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <Scissors size={15} color="#090c14" /> {t('sliceWith', { slicer: slicers[0].name })}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Content based on Active Tab */}
          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            
            {/* TAB 1: LOCAL LIBRARY */}
            {activeTab === 'local' && (
              <>
                {loadingLocal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', color: 'var(--text-muted)', padding: '60px 0' }}>
                    <Loader2 size={32} className="spin" color="#ffffff" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>KI berechnet visuelle Form-Ähnlichkeiten in deiner Bibliothek...</span>
                  </div>
                ) : errorLocal ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: '#ff6b6b' }}>{errorLocal}</div>
                ) : similarModels.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', textAlign: 'center', padding: '40px' }}>
                    <Sparkles size={40} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>{t('noSimilarFound')}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px' }}>{t('noSimilarHint')}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('online')}
                      style={{
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: 'none',
                        color: '#090c14',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <Globe size={14} />
                      Im Web & Online-Plattformen suchen
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    {similarModels.map(model => {
                      const pct = model.similarity_percentage || 50;
                      const style = getPercentageColor(pct);

                      return (
                        <div
                          key={model.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            position: 'relative'
                          }}
                        >
                          {/* Thumbnail Container */}
                          <div
                            onClick={() => {
                              onClose();
                              onSelectModelFor3D(model);
                            }}
                            style={{
                              aspectRatio: '4/3',
                              background: '#090d16',
                              position: 'relative',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {model.thumbnails && model.thumbnails.length > 0 ? (
                              <img
                                src={model.thumbnails[0]}
                                alt={model.name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <Box size={28} color="var(--text-muted)" />
                            )}

                            {/* Similarity Badge */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                                color: style.text,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '800',
                                backdropFilter: 'blur(8px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Sparkles size={11} />
                              {pct}% {t('match')}
                            </div>

                            {model.printed && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  background: 'rgba(16, 185, 129, 0.25)',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  color: '#34d399',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Check size={10} /> {t('printedStatus')}
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                            <div>
                              <h4
                                title={model.name}
                                style={{
                                  margin: '0 0 2px 0',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: '#fff',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {model.name}
                              </h4>
                              <span
                                title={model.rel_path || model.filename}
                                style={{
                                  fontSize: '10px',
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: 'block'
                                }}
                              >
                                {model.rel_path || model.filename}
                              </span>
                            </div>

                            {/* Card Action Buttons */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectModelFor3D(model);
                                }}
                                title={t('open3DPreview')}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: '#fff',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                <Eye size={13} /> 3D
                              </button>

                              {slicers.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onSliceModel(model, slicers[0].path)}
                                  title={t('sliceWith', { slicer: slicers[0].name })}
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    background: '#ffffff',
                                    border: '1px solid #ffffff',
                                    color: '#090c14',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Scissors size={13} color="#090c14" /> Slicer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* TAB 2: ONLINE REPOSITORIES (HYBRID DINOv2 RE-RANKING) */}
            {activeTab === 'online' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Online Search Query Refinement Bar */}
                <form
                  onSubmit={handleOnlineSearchSubmit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  <Search size={16} color="#94a3b8" />
                  <input
                    type="text"
                    value={onlineSearchInput}
                    onChange={e => setOnlineSearchInput(e.target.value)}
                    placeholder={t('searchKeywords') + '...'}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loadingOnline}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#090c14',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={12} className={loadingOnline ? 'spin' : ''} />
                    {t('refineSearch')}
                  </button>
                </form>

                {/* Search Meta Status */}
                {hasLoadedOnline && !loadingOnline && onlineQuery && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '6px' }}>
                    <span>
                      Suchbegriff: <strong style={{ color: '#ffffff' }}>"{onlineQuery}"</strong>
                    </span>
                    {onlineTotalEvaluated > 0 && (
                      <span>
                        {onlineTotalEvaluated} Modelle auf 6 Plattformen bewertet
                      </span>
                    )}
                  </div>
                )}

                {loadingOnline ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '14px', padding: '60px 0', textAlign: 'center' }}>
                    <Loader2 size={36} className="spin" color="#ffffff" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                        {t('searchingSimilarOnline')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Meta DINOv2 analysiert 3D-Formen über MakerWorld, Printables, Thingiverse, Cults 3D, Creality Cloud & MakerOnline
                      </div>
                    </div>
                  </div>
                ) : errorOnline ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: '#ff6b6b', padding: '40px' }}>{errorOnline}</div>
                ) : onlineModels.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', textAlign: 'center', padding: '40px' }}>
                    <Globe size={40} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>{t('noSimilarOnlineFound')}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px' }}>{t('noSimilarOnlineHint')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
                    {onlineModels.map((model) => {
                      const pct = model.similarity_percentage || 50;
                      const style = getPercentageColor(pct);
                      const badge = getPlatformBadge(model.platform || '');

                      return (
                        <div
                          key={model.id + model.url}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            position: 'relative'
                          }}
                        >
                          {/* Thumbnail */}
                          <div
                            onClick={() => window.open(model.url, '_blank')}
                            style={{
                              aspectRatio: '4/3',
                              background: '#090d16',
                              position: 'relative',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}
                          >
                            {model.thumbnail ? (
                              <img
                                src={model.thumbnail}
                                alt={model.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Box size={28} color="var(--text-muted)" />
                            )}

                            {/* Platform Badge */}
                            <span
                              style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: badge.bg,
                                border: `1px solid ${badge.border}`,
                                color: badge.color,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '800',
                                backdropFilter: 'blur(6px)'
                              }}
                            >
                              {badge.name}
                            </span>

                            {/* Similarity Score Badge */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                                color: style.text,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '800',
                                backdropFilter: 'blur(8px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Sparkles size={11} />
                              {pct}% {t('match')}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                            <div>
                              <h4
                                title={model.name}
                                style={{
                                  margin: '0 0 4px 0',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  color: '#fff',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {model.name}
                              </h4>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>
                                  👤 {model.author || 'Creator'}
                                </span>
                                {model.likes !== undefined && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '700', color: '#94a3b8' }}>
                                    <ThumbsUp size={11} /> {model.likes}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => window.open(model.url, '_blank')}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  background: '#ffffff',
                                  border: 'none',
                                  color: '#090c14',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                              >
                                <ExternalLink size={12} />
                                Ansehen
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyLink(model.url)}
                                title="URL kopieren"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  color: copiedUrl === model.url ? '#34d399' : '#fff',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                {copiedUrl === model.url ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
