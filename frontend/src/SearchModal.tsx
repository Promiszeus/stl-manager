import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Globe, Folder, TrendingUp, Rocket, Sparkles, History, ArrowRight, Tag } from 'lucide-react';
import { useI18n } from './i18n';
import { useOnlineSearch } from './OnlineSearch';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeNav: 'library' | 'online';
  setActiveNav: (nav: 'library' | 'online') => void;
  allTags: string[];
  activeTagFilter: string | null;
  setActiveTagFilter: (tag: string | null) => void;
  onTriggerOnlineSearch?: (term: string) => void;
  searchHistory?: string[];
  onSelectHistory?: (term: string) => void;
  onClearHistory?: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
  activeNav,
  setActiveNav,
  allTags,
  activeTagFilter,
  setActiveTagFilter,
  onTriggerOnlineSearch,
  searchHistory = [],
  onSelectHistory,
  onClearHistory,
}) => {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localInput, setLocalInput] = useState(searchTerm);

  let onlineSearchContext: any = null;
  try {
    onlineSearchContext = useOnlineSearch();
  } catch (e) {}

  const triggerOnline = (query: string) => {
    if (onTriggerOnlineSearch) {
      onTriggerOnlineSearch(query);
    } else if (onlineSearchContext && onlineSearchContext.handleSearch) {
      onlineSearchContext.setSearchTerm(query);
      onlineSearchContext.handleSearch(query);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLocalInput(searchTerm);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = localInput.trim();
    if (!query) return;
    if (activeNav === 'online') {
      triggerOnline(query);
    } else {
      onSearchChange(query);
    }
    onClose();
  };

  const handleSelectTerm = (term: string) => {
    setLocalInput(term);
    if (onSelectHistory) onSelectHistory(term);
    if (activeNav === 'online') {
      triggerOnline(term);
    } else {
      onSearchChange(term);
    }
    onClose();
  };

  const handleTrendClick = (query: string) => {
    setActiveNav('online');
    setLocalInput(query);
    triggerOnline(query);
    onClose();
  };

  return (
    <div 
      className="search-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 16px 20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="search-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'linear-gradient(180deg, #161b2e 0%, #0f1322 100%)',
          border: '1px solid rgba(0, 210, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 210, 255, 0.15)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Scope Selector (Bibliothek vs Online) */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0, 0, 0, 0.2)', padding: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveNav('library')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeNav === 'library' ? 'linear-gradient(135deg, rgba(58, 123, 213, 0.4), rgba(0, 210, 255, 0.2))' : 'transparent',
              color: activeNav === 'library' ? '#fff' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Folder size={16} color={activeNav === 'library' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            {t('library')}
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('online')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeNav === 'online' ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.3), rgba(142, 45, 226, 0.3))' : 'transparent',
              color: activeNav === 'online' ? '#fff' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Globe size={16} color={activeNav === 'online' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            {t('onlineModels')}
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Search size={20} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={e => setLocalInput(e.target.value)}
            placeholder={activeNav === 'online' ? t('searchPlaceholder') : t('searchLocalPlaceholder')}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              outline: 'none',
              padding: '4px 0'
            }}
          />
          {localInput && (
            <button
              type="button"
              onClick={() => { setLocalInput(''); onSearchChange(''); inputRef.current?.focus(); }}
              style={{ flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          )}
          <button
            type="submit"
            style={{
              flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#fff',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            {t('searchButton')} <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
            title="Schließen"
          >
            <X size={16} />
          </button>
        </form>

        {/* Modal Body / Quick Suggestions */}
        <div style={{ padding: '16px 20px', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. Category Quick Links */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              {t('quickSearch')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleTrendClick('Articulated Dragon')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <TrendingUp size={15} color="#f59e0b" />
                <span>{t('dailyTrends')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTrendClick('Gridfinity Modular')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.05))',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  color: '#f472b6',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Rocket size={15} color="#ec4899" />
                <span>{t('monthlyTrends')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTrendClick('Functional 3D Print')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Sparkles size={15} color="#10b981" />
                <span>{t('newest')}</span>
              </button>
            </div>
          </div>

          {/* 2. Search History */}
          {searchHistory.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <History size={12} /> {t('history')}
                </span>
                {onClearHistory && (
                  <button
                    type="button"
                    onClick={onClearHistory}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                  >
                    {t('clearHistory')}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {searchHistory.slice(0, 8).map(term => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectTerm(term)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Library Tags */}
          {allTags && allTags.length > 0 && activeNav === 'library' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Tag size={12} /> {t('filterTags')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allTags.map(tag => {
                  const isSelected = activeTagFilter === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setActiveTagFilter(isSelected ? null : tag);
                        onClose();
                      }}
                      style={{
                        background: isSelected ? 'rgba(0, 210, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '8px',
                        padding: '4px 10px',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hint */}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
            Tippe einen Begriff ein oder wähle eine Kategorie für Sofort-Ergebnisse
          </div>
        </div>
      </div>
    </div>
  );
};
