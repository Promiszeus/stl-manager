import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { Search, Globe, ExternalLink, Heart, Download, X, Copy, Check, Filter, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export interface OnlineModel {
  id: string;
  title: string;
  platform: string;
  platform_name: string;
  url: string;
  thumbnail: string;
  author: string;
  likes: number;
  downloads: number;
  is_free: boolean;
  price?: string | null;
}

export const PLATFORMS = [
  { id: 'makerworld', name: 'MakerWorld', color: '#00ae42', bg: 'rgba(0, 174, 66, 0.15)' },
  { id: 'printables', name: 'Printables', color: '#fa6b05', bg: 'rgba(250, 107, 5, 0.15)' },
  { id: 'cults3d', name: 'Cults 3D', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  { id: 'thingiverse', name: 'Thingiverse', color: '#248bfb', bg: 'rgba(36, 139, 251, 0.15)' },
  { id: 'makeronline', name: 'MakerOnline', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  { id: 'crealitycloud', name: 'Creality Cloud', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)' },
];

export const POPULAR_TAGS = ['Benchy', 'Gridfinity', 'Bambu Lab', 'Voron', 'Kabelclip', 'Wandhalterung', 'Toolbox', 'Fidget'];

interface OnlineSearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentQuery: string;
  activePlatforms: string[];
  togglePlatform: (platId: string) => void;
  selectAllPlatforms: () => void;
  results: OnlineModel[];
  displayedResults: OnlineModel[];
  loading: boolean;
  loadingMore: boolean;
  page: number;
  hasMore: boolean;
  hasSearched: boolean;
  error: string | null;
  copiedId: string | null;
  sortBy: 'popular' | 'likes' | 'name';
  setSortBy: (sort: 'popular' | 'likes' | 'name') => void;
  freeOnly: boolean;
  setFreeOnly: (val: boolean) => void;
  handleSearch: (termToSearch?: string) => Promise<void>;
  handleLoadMore: () => Promise<void>;
  copyUrl: (id: string, url: string) => void;
  getPlatformStyle: (plat: string) => { color: string; bg: string };
}

const OnlineSearchContext = createContext<OnlineSearchContextType | undefined>(undefined);

export const OnlineSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [activePlatforms, setActivePlatforms] = useState<string[]>([]);
  const [results, setResults] = useState<OnlineModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'likes' | 'name'>('popular');
  const [freeOnly, setFreeOnly] = useState(false);

  const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8000' : '';

  const handleSearch = async (termToSearch?: string) => {
    const query = termToSearch !== undefined ? termToSearch : searchTerm;
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentQuery(query.trim());
    setPage(1);

    try {
      const platParam = activePlatforms.length > 0 ? `&platforms=${activePlatforms.join(',')}` : '';
      const res = await fetch(`${API_BASE}/api/online/search?q=${encodeURIComponent(query.trim())}${platParam}&page=1`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: OnlineModel[] = Array.isArray(data) ? data : [];
      setResults(list);
      setHasMore(list.length >= 10);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Fehler bei der Suche. Bitte überprüfe deine Internetverbindung und versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!currentQuery || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const platParam = activePlatforms.length > 0 ? `&platforms=${activePlatforms.join(',')}` : '';
      const res = await fetch(`${API_BASE}/api/online/search?q=${encodeURIComponent(currentQuery)}${platParam}&page=${nextPage}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newItems: OnlineModel[] = Array.isArray(data) ? data : [];

      if (newItems.length > 0) {
        setResults(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const filteredNew = newItems.filter(p => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });
        setPage(nextPage);
        setHasMore(newItems.length >= 10);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const togglePlatform = (platId: string) => {
    setActivePlatforms(prev => 
      prev.includes(platId) ? prev.filter(p => p !== platId) : [...prev, platId]
    );
  };

  const selectAllPlatforms = () => {
    setActivePlatforms([]);
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformStyle = (plat: string) => {
    const found = PLATFORMS.find(p => p.id === plat);
    return found || { color: 'var(--accent-cyan)', bg: 'rgba(0, 210, 255, 0.15)' };
  };

  // Filter and sort results
  const displayedResults = results
    .filter(m => {
      if (freeOnly && !m.is_free) return false;
      if (activePlatforms.length > 0 && !activePlatforms.includes(m.platform)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'likes') return b.likes - a.likes;
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      // For 'popular' (default), preserve batch order from backend so clicking "Load More" appends downwards without reshuffling
      return 0;
    });

  return (
    <OnlineSearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        currentQuery,
        activePlatforms,
        togglePlatform,
        selectAllPlatforms,
        results,
        displayedResults,
        loading,
        loadingMore,
        page,
        hasMore,
        hasSearched,
        error,
        copiedId,
        sortBy,
        setSortBy,
        freeOnly,
        setFreeOnly,
        handleSearch,
        handleLoadMore,
        copyUrl,
        getPlatformStyle
      }}
    >
      {children}
    </OnlineSearchContext.Provider>
  );
};

export const useOnlineSearch = () => {
  const context = useContext(OnlineSearchContext);
  if (!context) {
    throw new Error('useOnlineSearch must be used within an OnlineSearchProvider');
  }
  return context;
};

/**
 * Online Search Sidebar Controls
 * Rendered in the fixed sidebar when "Online-Modelle" tab is active.
 */
export const OnlineSearchSidebar: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    activePlatforms,
    togglePlatform,
    selectAllPlatforms,
    loading,
    sortBy,
    setSortBy,
    freeOnly,
    setFreeOnly,
    handleSearch
  } = useOnlineSearch();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSearch();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Integrated Search Bar */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Modelle Suchen
        </div>
        <form onSubmit={onSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="z. B. Skull, Benchy..."
            style={{
              paddingLeft: '34px',
              paddingRight: '68px',
              borderRadius: '10px',
              height: '38px',
              fontSize: '13px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
            autoFocus
          />
          {searchTerm && (
            <X
              size={14}
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '38px', color: 'var(--text-muted)', cursor: 'pointer' }}
            />
          )}
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            title="Suchen"
            style={{
              position: 'absolute',
              right: '4px',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              background: searchTerm.trim() ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: loading || !searchTerm.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !searchTerm.trim() ? 0.4 : 1,
              transition: 'all 0.15s'
            }}
          >
            {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
          </button>
        </form>
      </div>

      {/* 2. Platform Selection (2-Column Grid) */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={12} /> Plattformen
          </span>
          <button
            onClick={selectAllPlatforms}
            style={{
              background: 'none',
              border: 'none',
              color: activePlatforms.length === 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {activePlatforms.length === 0 ? '✓ Alle aktiv' : 'Alle wählen'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {PLATFORMS.map(p => {
            const isSelected = activePlatforms.length === 0 || activePlatforms.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                style={{
                  padding: '7px 8px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${p.color}66` : '1px solid rgba(255, 255, 255, 0.05)',
                  background: isSelected ? p.bg : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: isSelected ? '700' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                  textAlign: 'left'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? p.color : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Filter & Sort Options */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Optionen & Sortierung
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            color: 'var(--text-main)',
            fontSize: '12px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="popular">Sortieren: Beliebteste</option>
          <option value="likes">Sortieren: Meiste Likes</option>
          <option value="name">Sortieren: Name (A-Z)</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={e => setFreeOnly(e.target.checked)}
            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
          />
          Nur kostenlose Vorlagen
        </label>
      </div>

      {/* 4. Quick-Search Suggestions */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={12} color="var(--accent-cyan)" /> Schnellsuche
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {POPULAR_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => {
                setSearchTerm(tag);
                handleSearch(tag);
              }}
              style={{
                fontSize: '11px',
                fontWeight: '500',
                padding: '4px 9px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0, 210, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                e.currentTarget.style.color = 'var(--accent-cyan)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Online Search Content View
 */
export const OnlineSearchContent: React.FC = () => {
  const {
    currentQuery,
    displayedResults,
    loading,
    loadingMore,
    hasMore,
    hasSearched,
    error,
    copiedId,
    handleLoadMore,
    copyUrl,
    getPlatformStyle,
    handleSearch,
    setSearchTerm
  } = useOnlineSearch();

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '24px 32px', background: 'var(--bg-dark)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: 0 }}>
            <Globe size={24} color="var(--accent-cyan)" /> 
            {currentQuery ? `Online-Modelle: "${currentQuery}"` : 'Online 3D-Modell-Suche'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px', margin: 0 }}>
            MakerWorld • Printables • Cults 3D • Thingiverse • MakerOnline • Creality Cloud
          </p>
        </div>

        {displayedResults.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 210, 255, 0.3)', padding: '5px 12px', borderRadius: '12px' }}>
              {displayedResults.length} Vorlagen geladen
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '16px', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '10px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <Loader2 size={40} className="spin" style={{ color: 'var(--accent-cyan)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>Suche auf allen Plattformen...</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>MakerWorld, Printables, Cults 3D, Thingiverse, MakerOnline & Creality Cloud werden durchsucht...</div>
        </div>
      )}

      {/* Empty State / Initial State */}
      {!loading && !hasSearched && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(0, 210, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Globe size={36} color="var(--accent-cyan)" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Finde Millionen 3D-Modelle im Web</h3>
          <p style={{ fontSize: '13px', maxWidth: '480px', margin: '0 auto', lineHeight: '1.6' }}>
            Nutze die Suchleiste links in der Seitenleiste, um nach Stichworten wie <b>Benchy</b>, <b>Skull</b>, <b>Halterung</b> oder <b>Gridfinity</b> zu suchen.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            {POPULAR_TAGS.map(t => (
              <button
                key={t}
                onClick={() => {
                  setSearchTerm(t);
                  handleSearch(t);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  e.currentTarget.style.color = 'var(--accent-cyan)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
              >
                {t} suchen →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {!loading && hasSearched && displayedResults.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <Search size={40} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>Keine Modelle gefunden</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>Versuche es mit einem allgemeineren Begriff in der Seitenleiste.</div>
        </div>
      )}

      {/* Results Grid */}
      {!loading && displayedResults.length > 0 && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {displayedResults.map(model => {
              const platStyle = getPlatformStyle(model.platform);
              return (
                <div
                  key={model.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.3)';
                    e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  {/* Thumbnail with Badge */}
                  <div style={{ position: 'relative', width: '100%', height: '180px', background: '#181b2c', overflow: 'hidden' }}>
                    {model.thumbnail ? (
                      <img
                        src={model.thumbnail}
                        alt={model.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        Kein Vorschaubild
                      </div>
                    )}

                    {/* Platform Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(18, 21, 36, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: `1px solid ${platStyle.color}66`,
                      color: platStyle.color,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: platStyle.color }} />
                      {model.platform_name}
                    </div>

                    {/* Free / Price Badge */}
                    {model.price && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(18, 21, 36, 0.85)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#f1c40f',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '700'
                      }}>
                        {model.price}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3
                      title={model.title}
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        marginBottom: '6px',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '36px'
                      }}
                    >
                      {model.title}
                    </h3>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        von {model.author}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                        {model.likes > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#ff6b81' }}>
                            <Heart size={11} fill="#ff6b81" /> {model.likes}
                          </span>
                        )}
                        {model.downloads > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-cyan)' }}>
                            <Download size={11} /> {model.downloads}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                      <a
                        href={model.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(58, 123, 213, 0.25))',
                          border: '1px solid rgba(0, 210, 255, 0.3)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 210, 255, 0.3), rgba(58, 123, 213, 0.45))';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(58, 123, 213, 0.25))';
                        }}
                      >
                        <ExternalLink size={13} />
                        Auf {model.platform_name} ansehen
                      </a>

                      <button
                        onClick={() => copyUrl(model.id, model.url)}
                        title="Link kopieren"
                        style={{
                          padding: '8px 10px',
                          background: copiedId === model.id ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${copiedId === model.id ? '#2ecc71' : 'var(--border-color)'}`,
                          borderRadius: '8px',
                          color: copiedId === model.id ? '#2ecc71' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        {copiedId === model.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '36px', marginBottom: '24px' }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  padding: '13px 32px',
                  background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(58, 123, 213, 0.35))',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(0, 210, 255, 0.25)'
                }}
                onMouseEnter={e => {
                  if (!loadingMore) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  if (!loadingMore) e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Lade weitere Modelle...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Weitere Modelle laden (+80 weitere Vorlagen)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
