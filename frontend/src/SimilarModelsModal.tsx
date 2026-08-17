import React, { useState, useEffect } from 'react';
import { X, Sparkles, Box, Scissors, Eye, Check, Loader2, FolderOpen } from 'lucide-react';
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

interface SimilarModelsModalProps {
  sourceModel: SimilarModelItem;
  onClose: () => void;
  onSelectModelFor3D: (model: any) => void;
  onSliceModel: (model: any, slicerPath?: string) => void;
  onOpenFolder: (path: string) => void;
  slicers: Array<{ name: string; path: string }>;
}

export const SimilarModelsModal: React.FC<SimilarModelsModalProps> = ({
  sourceModel,
  onClose,
  onSelectModelFor3D,
  onSliceModel,
  onOpenFolder,
  slicers
}) => {
  const { t } = useI18n();
  const [similarModels, setSimilarModels] = useState<SimilarModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8000' : '';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/models/${sourceModel.id}/similar?limit=24&min_score=0.35`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          setSimilarModels(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Error fetching similar models:', err);
          setError('Konnte ähnliche Modelle nicht laden.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sourceModel.id]);

  const getPercentageColor = (pct: number) => {
    if (pct >= 85) return { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', text: '#34d399' };
    if (pct >= 70) return { bg: 'rgba(0, 210, 255, 0.2)', border: 'rgba(0, 210, 255, 0.5)', text: 'var(--accent-cyan)' };
    if (pct >= 55) return { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', text: '#fbbf24' };
    return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.5)', text: '#c084fc' };
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
          maxWidth: '1080px',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #131a2e 0%, #0c101d 100%)',
          border: '1px solid rgba(0, 210, 255, 0.35)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 210, 255, 0.18)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalFadeIn 0.25s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          className="similar-modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0, 210, 255, 0.4)',
                flexShrink: 0
              }}
            >
              <Sparkles size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('similarModels')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: 'rgba(0, 210, 255, 0.12)', border: '1px solid rgba(0, 210, 255, 0.25)', color: 'var(--accent-cyan)' }}>
                  Meta DINOv2 AI
                </span>
              </div>
            </div>
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
              width: '280px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent-cyan)' }}>
              {t('referenceModel')}
            </div>

            <div
              className="similar-reference-img"
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#090d16',
                border: '1px solid rgba(0, 210, 255, 0.3)',
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
              <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#fff', wordBreak: 'break-word' }}>
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
                <Eye size={13} color="var(--accent-cyan)" /> {t('open3DPreview')}
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
                <FolderOpen size={13} color="var(--accent-cyan)" /> {t('openFolder')}
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
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Scissors size={15} /> {t('sliceWith', { slicer: slicers[0].name })}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Similar Models Grid */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="spin" color="var(--accent-cyan)" />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>KI berechnet visuelle Form-Ähnlichkeiten...</span>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#ff6b6b' }}>{error}</div>
            ) : similarModels.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', textAlign: 'center', padding: '40px' }}>
                <Sparkles size={40} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>{t('noSimilarFound')}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px' }}>{t('noSimilarHint')}</p>
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
                        border: '1px solid rgba(255, 255, 255, 0.08)',
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
                            <Eye size={13} color="var(--accent-cyan)" /> 3D
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
                                background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.25), rgba(58, 123, 213, 0.3))',
                                border: '1px solid var(--accent-cyan)',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <Scissors size={13} /> Slicer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
