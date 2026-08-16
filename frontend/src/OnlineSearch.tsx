import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Search, Globe, ExternalLink, Heart, Download, X, Copy, Check, Filter, Sparkles, AlertCircle, Loader2, TrendingUp, Rocket, History, ChevronRight, Trophy, Gamepad2, Palette, Wrench, Home, Car, Smile, Layers } from 'lucide-react';
import { useI18n } from './i18n';

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

const TREND_QUERIES = {
  daily: ['Articulated Dragon', 'Fidget Toy', 'Cable Clip', 'Bambu Lab Scraper', 'Keychain Organizer'],
  monthly: ['Gridfinity Modular', 'Voron 2.4 Mod', 'Desk Organizer', 'Skull Planter', 'Hydroponic Tower'],
  newest: ['Functional 3D Print', 'Mechanical Toy', 'Home Decor 3D', 'Phone Stand']
};

export const CONTEST_PORTALS = [
  {
    id: 'makerworld',
    name: 'MakerWorld 3D-Druck Contests',
    platform: 'MakerWorld',
    color: '#00ae42',
    bg: 'rgba(0, 174, 66, 0.15)',
    border: 'rgba(0, 174, 66, 0.35)',
    url: 'https://makerworld.com/en/contests',
    query: 'MakerWorld Contest',
    desc: 'Offizielle Bambu Lab & MakerWorld Wettbewerbe mit Prämienpunkten, Filament & Druckern.',
    badge: 'Bambu Lab Official'
  },
  {
    id: 'printables',
    name: 'Printables Community Contests',
    platform: 'Printables',
    color: '#fa6b05',
    bg: 'rgba(250, 107, 5, 0.15)',
    border: 'rgba(250, 107, 5, 0.35)',
    url: 'https://www.printables.com/contest',
    query: 'Printables Contest',
    desc: 'Wöchentliche Flash Contests & große Wettbewerbe mit Prusametern und Original Prusa 3D-Druckern.',
    badge: 'Prusa Community'
  },
  {
    id: 'cults3d',
    name: 'Cults 3D Design Challenges',
    platform: 'Cults 3D',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.35)',
    url: 'https://cults3d.com/en/design-contests',
    query: 'Cults 3D Contest',
    desc: 'Kreative Design-Wettbewerbe mit Geldpreisen, Auszeichnungen und weltweiten Markenpartnern.',
    badge: 'Geldpreise & Awards'
  },
  {
    id: 'crealitycloud',
    name: 'Creality Cloud Competitions',
    platform: 'Creality Cloud',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.15)',
    border: 'rgba(2, 132, 199, 0.35)',
    url: 'https://www.crealitycloud.com/contest',
    query: 'Creality Contest',
    desc: 'Offizielle Creality 3D-Druck Wettbewerbe mit Creality K1 Max, Zubehör & Filament.',
    badge: 'Creality Official'
  }
];

export const CATEGORY_EXPLORE_CARDS = [
  {
    id: 'toys',
    titleKey: 'catToys',
    descKey: 'catToysDesc',
    query: 'Toy Fidget Articulated Figure',
    icon: Smile,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    activeGradient: 'linear-gradient(135deg, #422616 0%, #2b170c 100%)',
    idleGradient: 'linear-gradient(135deg, #2a1a11 0%, #1e130c 100%)',
    shadow: 'rgba(245, 158, 11, 0.35)'
  },
  {
    id: 'fashion',
    titleKey: 'catFashion',
    descKey: 'catFashionDesc',
    query: 'Fashion Jewelry Ring Bracelet Wearable',
    icon: Sparkles,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.3)',
    activeGradient: 'linear-gradient(135deg, #441634 0%, #2b0b20 100%)',
    idleGradient: 'linear-gradient(135deg, #2b1022 0%, #1c0a16 100%)',
    shadow: 'rgba(236, 72, 153, 0.35)'
  },
  {
    id: 'art',
    titleKey: 'catArt',
    descKey: 'catArtDesc',
    query: 'Art Sculpture Design Decor Statue',
    icon: Palette,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.3)',
    activeGradient: 'linear-gradient(135deg, #2e1548 0%, #1b0a2c 100%)',
    idleGradient: 'linear-gradient(135deg, #1e0f30 0%, #140820 100%)',
    shadow: 'rgba(168, 85, 247, 0.35)'
  },
  {
    id: 'tools',
    titleKey: 'catTools',
    descKey: 'catToolsDesc',
    query: 'Functional Tool Mechanical Gadget Clamp',
    icon: Wrench,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.3)',
    activeGradient: 'linear-gradient(135deg, #0e3742 0%, #082129 100%)',
    idleGradient: 'linear-gradient(135deg, #0a252d 0%, #06181d 100%)',
    shadow: 'rgba(6, 182, 212, 0.35)'
  },
  {
    id: 'home',
    titleKey: 'catHome',
    descKey: 'catHomeDesc',
    query: 'Home Storage Organizer Gridfinity Mount Box',
    icon: Home,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    activeGradient: 'linear-gradient(135deg, #123d30 0%, #0a251d 100%)',
    idleGradient: 'linear-gradient(135deg, #0e271f 0%, #081a14 100%)',
    shadow: 'rgba(16, 185, 129, 0.35)'
  },
  {
    id: 'gaming',
    titleKey: 'catGaming',
    descKey: 'catGamingDesc',
    query: 'Gaming Controller Stand Cosplay Prop Figure',
    icon: Gamepad2,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.3)',
    activeGradient: 'linear-gradient(135deg, #1f2048 0%, #12132d 100%)',
    idleGradient: 'linear-gradient(135deg, #151633 0%, #0e0e22 100%)',
    shadow: 'rgba(99, 102, 241, 0.35)'
  },
  {
    id: 'plants',
    titleKey: 'catPlants',
    descKey: 'catPlantsDesc',
    query: 'Planter Flower Pot Vase Hydroponics Garden',
    icon: Layers,
    color: '#84cc16',
    bg: 'rgba(132, 204, 22, 0.15)',
    border: 'rgba(132, 204, 22, 0.3)',
    activeGradient: 'linear-gradient(135deg, #2b3a10 0%, #1a2408 100%)',
    idleGradient: 'linear-gradient(135deg, #1d280a 0%, #121a05 100%)',
    shadow: 'rgba(132, 204, 22, 0.35)'
  },
  {
    id: 'hobby',
    titleKey: 'catHobby',
    descKey: 'catHobbyDesc',
    query: 'RC Car Drone Plane Model Vehicle Hobby',
    icon: Car,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.3)',
    activeGradient: 'linear-gradient(135deg, #0e3048 0%, #081d2c 100%)',
    idleGradient: 'linear-gradient(135deg, #0a2132 0%, #061520 100%)',
    shadow: 'rgba(56, 189, 248, 0.35)'
  }
];

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
  searchHistory: string[];
  clearHistory: () => void;
  removeFromHistory: (term: string) => void;
  activeCategory: string | null;
  handleCategoryClick: (cat: string) => void;
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
  const [activeCategory, setActiveCategory] = useState<string | null>('daily');

  // Search History Persistence
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('stl_search_history');
      return stored ? JSON.parse(stored) : ['Benchy', 'Gridfinity', 'Bambu Lab', 'Skull'];
    } catch {
      return ['Benchy', 'Gridfinity', 'Bambu Lab', 'Skull'];
    }
  });

  const saveHistory = (items: string[]) => {
    setSearchHistory(items);
    localStorage.setItem('stl_search_history', JSON.stringify(items));
  };

  const addToHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const filtered = searchHistory.filter(t => t.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...filtered].slice(0, 15);
    saveHistory(updated);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const removeFromHistory = (term: string) => {
    saveHistory(searchHistory.filter(t => t !== term));
  };

  const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8000' : '';

  const handleSearch = async (termToSearch?: string) => {
    const query = termToSearch !== undefined ? termToSearch : searchTerm;
    if (!query.trim()) return;

    addToHistory(query.trim());
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

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    const catCard = CATEGORY_EXPLORE_CARDS.find(c => c.id === cat);
    if (catCard) {
      setSearchTerm(catCard.query);
      handleSearch(catCard.query);
      return;
    }
    if (cat === 'daily') {
      const randomDaily = TREND_QUERIES.daily[Math.floor(Math.random() * TREND_QUERIES.daily.length)];
      setSearchTerm(randomDaily);
      handleSearch(randomDaily);
    } else if (cat === 'monthly') {
      const randomMonthly = TREND_QUERIES.monthly[Math.floor(Math.random() * TREND_QUERIES.monthly.length)];
      setSearchTerm(randomMonthly);
      handleSearch(randomMonthly);
    } else if (cat === 'newest') {
      const randomNew = TREND_QUERIES.newest[Math.floor(Math.random() * TREND_QUERIES.newest.length)];
      setSearchTerm(randomNew);
      handleSearch(randomNew);
    } else if (cat === 'history' && searchHistory.length > 0) {
      setSearchTerm(searchHistory[0]);
      handleSearch(searchHistory[0]);
    }
  };

  // Pre-populate trending models on initial mount so search is never empty!
  useEffect(() => {
    if (results.length === 0 && !hasSearched && !loading) {
      handleSearch('Trending 3D');
    }
  }, []);

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

  // Filter & Sorting logic
  let displayedResults = results.filter(m => {
    if (freeOnly && !m.is_free) return false;
    return true;
  });

  if (sortBy === 'likes') {
    displayedResults = [...displayedResults].sort((a, b) => b.likes - a.likes);
  } else if (sortBy === 'name') {
    displayedResults = [...displayedResults].sort((a, b) => a.title.localeCompare(b.title));
  }

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
        searchHistory,
        clearHistory,
        removeFromHistory,
        activeCategory,
        handleCategoryClick,
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
 */
export const OnlineSearchSidebar: React.FC = () => {
  const { t } = useI18n();
  const {
    searchTerm,
    setSearchTerm,
    currentQuery,
    activePlatforms,
    togglePlatform,
    selectAllPlatforms,
    loading,
    sortBy,
    setSortBy,
    freeOnly,
    setFreeOnly,
    searchHistory,
    clearHistory,
    removeFromHistory,
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
      {/* 1. Prominently Highlighted Search Hub */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.1), rgba(58, 123, 213, 0.15))',
        border: '1px solid rgba(0, 210, 255, 0.35)',
        boxShadow: '0 4px 20px rgba(0, 210, 255, 0.18)',
        borderRadius: '14px',
        padding: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px', color: 'var(--accent-cyan)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={13} color="var(--accent-cyan)" /> {t('searchModels')}
          </span>
          {currentQuery && (
            <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', background: 'rgba(0, 210, 255, 0.15)', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
              {t('activeSearch')}: "{currentQuery}"
            </span>
          )}
        </div>
        <form onSubmit={onSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--accent-cyan)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            style={{
              paddingLeft: '38px',
              paddingRight: '74px',
              borderRadius: '10px',
              height: '42px',
              fontSize: '13px',
              fontWeight: '500',
              background: 'var(--bg-dark)',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              color: '#fff',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
            }}
            autoFocus
          />
          {searchTerm && (
            <X
              size={15}
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '42px', color: 'var(--text-muted)', cursor: 'pointer' }}
            />
          )}
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            title={t('searchButton')}
            style={{
              position: 'absolute',
              right: '4px',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: 'none',
              background: searchTerm.trim() ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: loading || !searchTerm.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !searchTerm.trim() ? 0.4 : 1,
              boxShadow: searchTerm.trim() ? '0 2px 10px rgba(0, 210, 255, 0.4)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
          </button>
        </form>
      </div>

      {/* 2. Platform Selection (2-Column Grid) */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={12} /> {t('platforms')}
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
            {activePlatforms.length === 0 ? `✓ ${t('allActive')}` : t('selectAll')}
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
          {t('sortBy')}
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
          <option value="popular">{t('sortPopular')}</option>
          <option value="likes">{t('sortLikes')}</option>
          <option value="name">{t('sortName')}</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={e => setFreeOnly(e.target.checked)}
            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
          />
          {t('freeOnly')}
        </label>
      </div>

      {/* 4. Search History (Verlauf) */}
      {searchHistory.length > 0 && (
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <History size={12} /> {t('history')}
            </span>
            <button
              onClick={clearHistory}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', padding: 0 }}
            >
              {t('clearHistory')}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {searchHistory.slice(0, 8).map(term => (
              <div
                key={term}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}
              >
                <span
                  onClick={() => {
                    setSearchTerm(term);
                    handleSearch(term);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {term}
                </span>
                <X
                  size={11}
                  onClick={() => removeFromHistory(term)}
                  style={{ cursor: 'pointer', opacity: 0.6 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main Online Search Content View (MakerWorld Inspired)
 */
export const OnlineSearchContent: React.FC = () => {
  const { t } = useI18n();
  const {
    currentQuery,
    displayedResults,
    loading,
    loadingMore,
    hasMore,
    hasSearched,
    error,
    copiedId,
    searchHistory,
    activeCategory,
    handleCategoryClick,
    handleLoadMore,
    copyUrl,
    getPlatformStyle,
    handleSearch,
    setSearchTerm
  } = useOnlineSearch();

  const [showContestsModal, setShowContestsModal] = useState(false);

  return (
    <div className="online-search-container">
      {/* 1. Interactive Hero Feature Banner (MakerWorld Contest / Design Spotlight) */}
      <div
        onClick={() => setShowContestsModal(true)}
        className="contest-hero-banner"
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1b263b 0%, #111827 100%)',
          border: '1px solid rgba(0, 210, 255, 0.3)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.45), 0 0 20px rgba(0, 210, 255, 0.1)',
          marginBottom: '20px',
          padding: '22px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          minHeight: '145px',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
        }}
      >
        {/* Glow overlay */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '260px', height: '100%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.22), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 77, 77, 0.25)', border: '1px solid rgba(255, 77, 77, 0.45)', color: '#ff6b6b', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6b6b' }} />
            {t('featuredContest')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: '700', background: 'rgba(0, 210, 255, 0.12)', border: '1px solid rgba(0, 210, 255, 0.25)', padding: '4px 10px', borderRadius: '8px' }}>
            <Trophy size={13} />
            <span>{t('allContests')}</span>
            <ChevronRight size={14} />
          </div>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 6px 0', lineHeight: '1.3' }}>
          {t('contestTitle')}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
          MakerWorld • Printables • Thingiverse • Cults 3D • MakerOnline • Creality
        </p>

        {/* Quick Action Pill Buttons on the Banner */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', zIndex: 10 }} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowContestsModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 210, 255, 0.3)'
            }}
          >
            <Trophy size={14} /> {t('allContests')}
          </button>

          <button
            type="button"
            onClick={() => handleSearch('MakerWorld Contest')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Search size={14} /> {t('exploreContestModels')}
          </button>

          <button
            type="button"
            onClick={() => window.open('https://makerworld.com/en/contests', '_blank')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 174, 66, 0.2)',
              border: '1px solid rgba(0, 174, 66, 0.4)',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#4ade80',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
            title="MakerWorld Contest Portal öffnen"
          >
            <ExternalLink size={13} /> MakerWorld Portal
          </button>
        </div>
      </div>

      {/* Contests Hub Modal Dialog */}
      {showContestsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowContestsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 15, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
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
              maxWidth: '680px',
              maxHeight: '85vh',
              background: 'linear-gradient(180deg, #182035 0%, #0f1322 100%)',
              border: '1px solid rgba(0, 210, 255, 0.35)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 210, 255, 0.2)',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0, 0, 0, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)' }}>
                  <Trophy size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff' }}>{t('allContests')}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('contestsHubDesc')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContestsModal(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: List of Portals */}
            <div style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {CONTEST_PORTALS.map(portal => (
                <div
                  key={portal.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${portal.border}`,
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: portal.bg, color: portal.color, fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${portal.color}44` }}>
                        {portal.platform}
                      </span>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>
                        {portal.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>
                      {portal.badge}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {portal.desc}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowContestsModal(false);
                        handleSearch(portal.query);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(58, 123, 213, 0.25))',
                        border: '1px solid var(--accent-cyan)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <Search size={14} color="var(--accent-cyan)" />
                      {t('exploreContestModels')}
                    </button>

                    <button
                      type="button"
                      onClick={() => window.open(portal.url, '_blank')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: portal.bg,
                        border: `1px solid ${portal.color}55`,
                        color: portal.color,
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <ExternalLink size={13} />
                      {t('openContestPortal')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Four MakerWorld-Style Category Action Cards (2x2 Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {/* Card 1: Daily Trends */}
        <button
          onClick={() => handleCategoryClick('daily')}
          style={{
            padding: '14px 12px',
            borderRadius: '14px',
            background: activeCategory === 'daily' ? 'linear-gradient(135deg, #422616 0%, #2b170c 100%)' : 'linear-gradient(135deg, #2a1a11 0%, #1e130c 100%)',
            border: activeCategory === 'daily' ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: activeCategory === 'daily' ? '0 4px 16px rgba(245, 158, 11, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={18} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{t('dailyTrends')}</div>
            <div style={{ fontSize: '10px', color: '#d97706', marginTop: '2px' }}>24h Top</div>
          </div>
        </button>

        {/* Card 2: Monthly Trends */}
        <button
          onClick={() => handleCategoryClick('monthly')}
          style={{
            padding: '14px 12px',
            borderRadius: '14px',
            background: activeCategory === 'monthly' ? 'linear-gradient(135deg, #441634 0%, #2b0b20 100%)' : 'linear-gradient(135deg, #2b1022 0%, #1c0a16 100%)',
            border: activeCategory === 'monthly' ? '1px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.25)',
            boxShadow: activeCategory === 'monthly' ? '0 4px 16px rgba(236, 72, 153, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Rocket size={18} color="#ec4899" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{t('monthlyTrends')}</div>
            <div style={{ fontSize: '10px', color: '#db2777', marginTop: '2px' }}>Monats-Hits</div>
          </div>
        </button>

        {/* Card 3: Newest */}
        <button
          onClick={() => handleCategoryClick('newest')}
          style={{
            padding: '14px 12px',
            borderRadius: '14px',
            background: activeCategory === 'newest' ? 'linear-gradient(135deg, #123d30 0%, #0a251d 100%)' : 'linear-gradient(135deg, #0e271f 0%, #081a14 100%)',
            border: activeCategory === 'newest' ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: activeCategory === 'newest' ? '0 4px 16px rgba(16, 185, 129, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{t('newest')}</div>
            <div style={{ fontSize: '10px', color: '#059669', marginTop: '2px' }}>Frisch online</div>
          </div>
        </button>

        {/* Card 4: History / Search History */}
        <button
          onClick={() => {
            handleCategoryClick('history');
            if (searchHistory.length > 0) {
              setSearchTerm(searchHistory[0]);
              handleSearch(searchHistory[0]);
            }
          }}
          style={{
            padding: '14px 12px',
            borderRadius: '14px',
            background: activeCategory === 'history' ? 'linear-gradient(135deg, #242c4c 0%, #151a30 100%)' : 'linear-gradient(135deg, #181d33 0%, #101424 100%)',
            border: activeCategory === 'history' ? '1px solid #6366f1' : '1px solid rgba(99, 102, 241, 0.25)',
            boxShadow: activeCategory === 'history' ? '0 4px 16px rgba(99, 102, 241, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <History size={18} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{t('history')}</div>
            <div style={{ fontSize: '10px', color: '#818cf8', marginTop: '2px' }}>{searchHistory.length} Suchen</div>
          </div>
        </button>
      </div>

      {/* 3. Kategorien & Themenwelten Grid (Spielzeug, Mode, Kunst, Werkzeuge, Haushalt, Gaming, Pflanzen, Hobby) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="var(--accent-cyan)" />
            {t('categories')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('categoriesDesc')}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {CATEGORY_EXPLORE_CARDS.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  padding: '12px 10px',
                  borderRadius: '14px',
                  background: isActive ? cat.activeGradient : cat.idleGradient,
                  border: isActive ? `1px solid ${cat.color}` : `1px solid ${cat.border}`,
                  boxShadow: isActive ? `0 4px 16px ${cat.shadow}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={cat.color} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t(cat.titleKey as any)}
                  </div>
                  <div style={{ fontSize: '10px', color: cat.color, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t(cat.descKey as any)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Info Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} color="var(--accent-cyan)" />
            {currentQuery ? `${t('onlineSearch')}: "${currentQuery}"` : t('onlineSearch')}
          </h1>
        </div>

        {displayedResults.length > 0 && (
          <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(0, 210, 255, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 210, 255, 0.3)', padding: '4px 10px', borderRadius: '10px' }}>
            {displayedResults.length} {t('modelsLoaded')}
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '14px', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '10px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--accent-cyan)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{t('searchingAllPlatforms')}</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>{t('searchingPlatformsDetail')}</div>
        </div>
      )}

      {/* No Results State */}
      {!loading && hasSearched && displayedResults.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Search size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{t('noModelsFound')}</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>{t('noModelsFoundSubtitle')}</div>
        </div>
      )}

      {/* Results Grid - MakerWorld 2-Column Vertical Cards */}
      {!loading && displayedResults.length > 0 && (
        <div>
          <div className="online-models-grid">
            {displayedResults.map(model => {
              const platStyle = getPlatformStyle(model.platform);
              return (
                <div
                  key={model.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.35)';
                    e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                  }}
                >
                  {/* Image Container with Badges */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#16192b', overflow: 'hidden' }}>
                    {model.thumbnail ? (
                      <img
                        src={model.thumbnail}
                        alt={model.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Globe size={40} style={{ opacity: 0.3 }} />
                      </div>
                    )}

                    {/* Top-Left: Platform Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(18, 21, 36, 0.85)',
                      backdropFilter: 'blur(6px)',
                      border: `1px solid ${platStyle.color}66`,
                      color: platStyle.color,
                      padding: '3px 7px',
                      borderRadius: '7px',
                      fontSize: '10px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: platStyle.color }} />
                      {model.platform_name}
                    </div>

                    {/* Top-Right: Likes & Bookmark Stat */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{
                        background: 'rgba(18, 21, 36, 0.85)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '3px 7px',
                        borderRadius: '7px',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#ff6b81',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}>
                        <Heart size={11} fill="#ff6b81" />
                        <span>{model.likes || 12}</span>
                      </div>
                    </div>

                    {/* Bottom-Left: Creator Avatar & Name Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      maxWidth: '85%',
                      background: 'rgba(15, 18, 30, 0.85)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '2px 8px 2px 3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg, #00d2ff, #8e2de2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', color: '#fff' }}>
                        {model.author ? model.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {model.author || 'Creator'}
                      </span>
                    </div>

                    {/* Bottom-Right: Free / Price */}
                    {model.price && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(15, 18, 30, 0.85)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 215, 0, 0.4)',
                        color: '#ffd700',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800'
                      }}>
                        {model.price}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3
                      title={model.title}
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        marginBottom: '8px',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '34px'
                      }}
                    >
                      {model.title}
                    </h3>

                    {/* Action Row */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '6px' }}>
                      <a
                        href={model.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(58, 123, 213, 0.25))',
                          border: '1px solid rgba(0, 210, 255, 0.3)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: '700',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <ExternalLink size={12} />
                        {t('viewOn', { platform: model.platform_name })}
                      </a>

                      <button
                        onClick={() => copyUrl(model.id, model.url)}
                        title={t('copyLink')}
                        style={{
                          padding: '7px 9px',
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
                        {copiedId === model.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '32px', marginBottom: '24px' }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(58, 123, 213, 0.35))',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(0, 210, 255, 0.25)'
                }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    {t('loadingMore')}
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    {t('loadMore')}
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
