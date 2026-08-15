import React, { useState } from 'react';
import { Search, Globe, ExternalLink, Heart, Download, X, Copy, Check, Filter, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface OnlineModel {
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

const PLATFORMS = [
  { id: 'makerworld', name: 'MakerWorld', color: '#00ae42', bg: 'rgba(0, 174, 66, 0.15)' },
  { id: 'printables', name: 'Printables', color: '#fa6b05', bg: 'rgba(250, 107, 5, 0.15)' },
  { id: 'cults3d', name: 'Cults 3D', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  { id: 'thingiverse', name: 'Thingiverse', color: '#248bfb', bg: 'rgba(36, 139, 251, 0.15)' },
  { id: 'makeronline', name: 'MakerOnline', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  { id: 'crealitycloud', name: 'Creality Cloud', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)' },
];

const POPULAR_TAGS = ['Benchy', 'Gridfinity', 'Bambu Lab', 'Voron', 'Kabelclip', 'Wandhalterung', 'Toolbox', 'Fidget'];

export const OnlineSearch: React.FC = () => {
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

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      // For 'popular' (default), preserve the batch arrival order from the backend so that
      // clicking "Load More" appends new models strictly downwards without reshuffling existing cards!
      return 0;
    });

  const getPlatformStyle = (plat: string) => {
    const found = PLATFORMS.find(p => p.id === plat);
    return found || { color: 'var(--accent-cyan)', bg: 'rgba(0, 210, 255, 0.15)' };
  };

  return (
    <div style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '28px 36px', background: 'var(--bg-dark)' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
          <Globe size={28} color="var(--accent-cyan)" /> Online 3D-Modell-Suche
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Durchsuche MakerWorld, Printables, Cults 3D, Thingiverse, MakerOnline & Creality Cloud gleichzeitig.
        </p>
      </div>

      {/* Big Search Box */}
      <div style={{ maxWidth: '850px', marginBottom: '20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Suchbegriff eingeben (z. B. Benchy, Gridfinity, Bambu, Halterung)..."
              style={{
                width: '100%',
                padding: '13px 44px 13px 48px',
                background: 'var(--bg-card)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            {searchTerm && (
              <X
                size={18}
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '16px', top: '15px', color: 'var(--text-muted)', cursor: 'pointer' }}
              />
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            style={{
              padding: '0 28px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: loading || !searchTerm.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !searchTerm.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(0, 210, 255, 0.25)',
              transition: 'transform 0.15s, opacity 0.15s'
            }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
            {loading ? 'Suche läuft...' : 'Suchen'}
          </button>
        </form>

        {/* Quick Tag Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={13} color="var(--accent-cyan)" /> Beliebt:
          </span>
          {POPULAR_TAGS.map(tag => (
            <span
              key={tag}
              onClick={() => {
                setSearchTerm(tag);
                handleSearch(tag);
              }}
              style={{
                fontSize: '11px',
                padding: '3px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0, 210, 255, 0.15)';
                e.currentTarget.style.color = 'var(--accent-cyan)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Platform & Sort Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        {/* Platform Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} /> Plattformen:
          </span>
          <button
            onClick={() => setActivePlatforms([])}
            style={{
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '20px',
              border: activePlatforms.length === 0 ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
              background: activePlatforms.length === 0 ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
              color: activePlatforms.length === 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            Alle
          </button>
          {PLATFORMS.map(p => {
            const isSelected = activePlatforms.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: isSelected ? `1px solid ${p.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? p.bg : 'transparent',
                  color: isSelected ? p.color : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color }} />
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Sort & Free Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={e => setFreeOnly(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
            />
            Nur Kostenlose
          </label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-card)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
        </div>
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
          <div style={{ fontSize: '13px', marginTop: '6px' }}>MakerWorld, Printables, Cults 3D, Thingiverse, MakerOnline werden abgefragt...</div>
        </div>
      )}

      {/* Empty State / Initial State */}
      {!loading && !hasSearched && (
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(0, 210, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Globe size={36} color="var(--accent-cyan)" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Finde Millionen 3D-Modelle im Web</h3>
          <p style={{ fontSize: '13px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
            Gib einfach einen Suchbegriff oben ein, um blitzschnell passende Druckvorlagen von den größten Repositories zu finden und direkt zu öffnen.
          </p>
        </div>
      )}

      {/* No Results State */}
      {!loading && hasSearched && displayedResults.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <Search size={40} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>Keine Modelle gefunden</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>Versuche es mit einem allgemeineren Begriff oder wähle mehr Plattformen aus.</div>
        </div>
      )}

      {/* Results Grid */}
      {!loading && displayedResults.length > 0 && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '500' }}>
            {displayedResults.length} Modelle gefunden:
          </div>
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
                    <div
                      title={model.title}
                      style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        color: 'var(--text-main)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4',
                        marginBottom: '8px',
                        minHeight: '38px'
                      }}
                    >
                      {model.title}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={`Ersteller: ${model.author}`}>
                        von {model.author}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                        {model.likes > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#ff6b6b' }}>
                            <Heart size={11} fill="#ff6b6b" /> {model.likes}
                          </span>
                        )}
                        {model.downloads > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-cyan)' }}>
                            <Download size={11} /> {model.downloads}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                      <a
                        href={model.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: 'rgba(0, 210, 255, 0.1)',
                          border: '1px solid rgba(0, 210, 255, 0.25)',
                          borderRadius: '8px',
                          color: 'var(--accent-cyan)',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 210, 255, 0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 210, 255, 0.1)'}
                      >
                        <ExternalLink size={13} /> Auf {model.platform_name} ansehen
                      </a>
                      <button
                        onClick={() => copyUrl(model.id, model.url)}
                        title="Link kopieren"
                        style={{
                          padding: '8px 10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: copiedId === model.id ? '#2ecc71' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {copiedId === model.id ? <Check size={14} /> : <Copy size={14} />}
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
