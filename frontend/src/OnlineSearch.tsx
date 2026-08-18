import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { Search, Globe, ExternalLink, Heart, Download, X, Copy, Check, Filter, Sparkles, AlertCircle, Loader2, TrendingUp, Rocket, History, ChevronRight, Trophy, Gamepad2, Palette, Wrench, Home, Car, Smile, Layers, Star, Trash2 } from 'lucide-react';
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
  saved_at?: number;
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
  favoriteModels: OnlineModel[];
  isFavorite: (modelId: string) => boolean;
  toggleFavorite: (model: OnlineModel) => void;
  clearFavorites: () => void;
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
  activeMode: string;
  handleCategoryClick: (cat: string) => void;
  handleSearch: (termToSearch?: string, modeOverride?: string, sortOverride?: string) => Promise<void>;
  handleLoadMore: () => Promise<void>;
  copyUrl: (id: string, url: string) => void;
  getPlatformStyle: (plat: string) => { color: string; bg: string };
}

const OnlineSearchContext = createContext<OnlineSearchContextType | undefined>(undefined);

export const OnlineSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [activeMode, setActiveMode] = useState<string>('daily');
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Favorites Persistence
  const [favoriteModels, setFavoriteModels] = useState<OnlineModel[]>(() => {
    try {
      const stored = localStorage.getItem('stl_favorite_online_models');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveFavorites = (favs: OnlineModel[]) => {
    setFavoriteModels(favs);
    try {
      localStorage.setItem('stl_favorite_online_models', JSON.stringify(favs));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  };

  const isFavorite = (modelId: string) => {
    return favoriteModels.some(f => f.id === modelId);
  };

  const toggleFavorite = (model: OnlineModel) => {
    if (isFavorite(model.id)) {
      const updated = favoriteModels.filter(f => f.id !== model.id);
      saveFavorites(updated);
    } else {
      const updated = [{ ...model, saved_at: Date.now() }, ...favoriteModels];
      saveFavorites(updated);
    }
  };

  const clearFavorites = () => {
    saveFavorites([]);
  };

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

  const handleSearch = async (termToSearch?: string, modeOverride?: string, sortOverride?: string) => {
    const query = termToSearch !== undefined ? termToSearch : searchTerm;
    const mode = modeOverride !== undefined ? modeOverride : (query ? '' : activeMode);
    const sort = sortOverride !== undefined ? sortOverride : sortBy;

    if (query.trim()) {
      addToHistory(query.trim());
    }

    // Cancel ongoing search to save bandwidth & prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentQuery(query.trim());
    setActiveMode(mode);
    setPage(1);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (mode) params.set('mode', mode);
      if (sort) params.set('sort', sort);
      if (activePlatforms.length > 0) params.set('platforms', activePlatforms.join(','));
      params.set('page', '1');

      const res = await fetch(`${API_BASE}/api/online/search?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: OnlineModel[] = Array.isArray(data) ? data : [];
      setResults(list);
      setHasMore(list.length >= 10);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Search error:', err);
      setError('Fehler bei der Suche. Bitte überprüfe deine Internetverbindung und versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (currentQuery) params.set('q', currentQuery);
      if (activeMode) params.set('mode', activeMode);
      if (sortBy) params.set('sort', sortBy);
      if (activePlatforms.length > 0) params.set('platforms', activePlatforms.join(','));
      params.set('page', String(nextPage));

      const res = await fetch(`${API_BASE}/api/online/search?${params.toString()}`);
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
    if (cat === 'favorites') {
      return;
    } else if (cat === 'daily') {
      setSearchTerm('');
      handleSearch('', 'daily', 'popular');
    } else if (cat === 'monthly') {
      setSearchTerm('');
      handleSearch('', 'monthly', 'popular');
    } else if (cat === 'newest') {
      setSearchTerm('');
      handleSearch('', 'newest', 'newest');
    } else if (cat === 'history' && searchHistory.length > 0) {
      setSearchTerm(searchHistory[0]);
      handleSearch(searchHistory[0], '', 'popular');
    } else {
      const catCard = CATEGORY_EXPLORE_CARDS.find(c => c.id === cat);
      if (catCard) {
        setSearchTerm(catCard.query);
        handleSearch(catCard.query, '', 'popular');
      }
    }
  };

  // Pre-populate genuine trending models on initial mount so search is never empty!
  useEffect(() => {
    if (results.length === 0 && !hasSearched && !loading) {
      handleSearch('', 'daily', 'popular');
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

  // Filter & Sorting logic (with Favorites View support)
  const sourceList = activeCategory === 'favorites' ? favoriteModels : results;

  let displayedResults = sourceList.filter(m => {
    if (freeOnly && !m.is_free) return false;
    if (activePlatforms.length > 0 && !activePlatforms.includes(m.platform)) return false;
    if (activeCategory === 'favorites' && searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return m.title.toLowerCase().includes(q) || (m.author && m.author.toLowerCase().includes(q)) || (m.platform_name && m.platform_name.toLowerCase().includes(q));
    }
    return true;
  });

  if (sortBy === 'likes') {
    displayedResults = [...displayedResults].sort((a, b) => (b.likes || 0) - (a.likes || 0));
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
        favoriteModels,
        isFavorite,
        toggleFavorite,
        clearFavorites,
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
        activeMode,
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
    favoriteModels,
    activeCategory,
    handleCategoryClick,
    handleSearch
  } = useOnlineSearch();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSearch();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Favoriten Shortcut Button */}
      <button
        type="button"
        onClick={() => handleCategoryClick('favorites')}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: '12px',
          background: activeCategory === 'favorites' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3))' : 'rgba(245, 158, 11, 0.08)',
          border: activeCategory === 'favorites' ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.25)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: activeCategory === 'favorites' ? '0 4px 14px rgba(245, 158, 11, 0.3)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={16} color="#f59e0b" fill={favoriteModels.length > 0 ? '#f59e0b' : 'none'} />
          <span style={{ fontSize: '13px', fontWeight: '700' }}>{t('myFavorites')}</span>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          background: activeCategory === 'favorites' ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
          color: activeCategory === 'favorites' ? '#000' : '#fbbf24',
          padding: '2px 8px',
          borderRadius: '10px'
        }}>
          {favoriteModels.length}
        </span>
      </button>
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
    favoriteModels,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    loading,
    loadingMore,
    hasMore,
    error,
    copiedId,
    activeCategory,
    handleCategoryClick,
    handleLoadMore,
    copyUrl,
    getPlatformStyle,
    handleSearch
  } = useOnlineSearch();

  const [showContestsModal, setShowContestsModal] = useState(false);

  const getHeadingTitle = () => {
    if (activeCategory === 'favorites') return `${t('myFavorites')}`;
    if (activeCategory === 'daily') return `${t('dailyTrends')} (24h Top)`;
    if (activeCategory === 'monthly') return `${t('monthlyTrends')} (Monats-Hits)`;
    if (activeCategory === 'newest') return `${t('newest')} (Frisch online)`;
    const catCard = CATEGORY_EXPLORE_CARDS.find(c => c.id === activeCategory);
    if (catCard) return t(catCard.titleKey as any);
    if (currentQuery) return `${t('onlineSearch')}: "${currentQuery}"`;
    return t('onlineSearch');
  };

  return (
    <div className="online-search-container">
      {/* Mobile-Friendly Streamlined Header (Compact Contests Strip + Horizontal Swipeable Categories) */}
      <div className="mobile-explore-section">
        {/* Sleek 1-Line Contest Banner */}
        <div
          onClick={() => setShowContestsModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(27, 38, 59, 0.9), rgba(17, 24, 39, 0.9))',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={15} color="#f59e0b" />
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>3D-Druck Contests</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: '700' }}>
            <span>{t('allContests')}</span>
            <ChevronRight size={13} />
          </div>
        </div>

        {/* Horizontal Swipeable Chip Bar for Categories & Trends */}
        <div className="mobile-explore-chips">
          <button
            type="button"
            className={`explore-chip ${activeCategory === 'favorites' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('favorites')}
            style={activeCategory === 'favorites' ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderColor: '#fbbf24', color: '#fff' } : {}}
          >
            <Star size={13} fill={favoriteModels.length > 0 ? '#f59e0b' : 'none'} color="#f59e0b" />
            <span>{t('favorites')} ({favoriteModels.length})</span>
          </button>
          <button
            type="button"
            className={`explore-chip ${activeCategory === 'daily' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('daily')}
          >
            <TrendingUp size={13} color="#f59e0b" />
            <span>{t('dailyTrends')}</span>
          </button>
          <button
            type="button"
            className={`explore-chip ${activeCategory === 'monthly' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('monthly')}
          >
            <Rocket size={13} color="#ec4899" />
            <span>{t('monthlyTrends')}</span>
          </button>
          <button
            type="button"
            className={`explore-chip ${activeCategory === 'newest' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('newest')}
          >
            <Sparkles size={13} color="#10b981" />
            <span>{t('newest')}</span>
          </button>
          {CATEGORY_EXPLORE_CARDS.map(cat => {
            const Icon = cat.icon;
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`explore-chip ${isCatActive ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <Icon size={13} color={cat.color} />
                <span>{t(cat.titleKey as any)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="desktop-explore-section">
        {/* Bento Grid Dashboard (Apple/Linear Style Asymmetrical Grid) */}
        <div className="bento-dashboard-grid">
          {/* Bento Card 1: Featured 3D Design Contest & Spotlight (Col Span 2) */}
          <div
            onClick={() => setShowContestsModal(true)}
            className="bento-card bento-card-hero"
            style={{ cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '280px', height: '100%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.2), transparent 70%)', pointerEvents: 'none' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 77, 77, 0.2)', border: '1px solid rgba(255, 77, 77, 0.45)', color: '#ff6b6b', padding: '3px 10px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ff6b6b' }} />
                  {t('bentoFeatured')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontSize: '11.5px', fontWeight: '700' }}>
                  <Trophy size={13} />
                  <span>{t('allContests')}</span>
                  <ChevronRight size={13} />
                </div>
              </div>

              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0', lineHeight: '1.3' }}>
                {t('contestTitle')}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                MakerWorld • Printables • Thingiverse • Cults 3D • MakerOnline • Creality
              </p>
            </div>

            {/* Quick Action Pill Buttons on the Hero Card */}
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
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 210, 255, 0.3)'
                }}
              >
                <Trophy size={13} /> {t('allContests')}
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
                  padding: '6px 12px',
                  color: '#fff',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Search size={13} /> {t('exploreContestModels')}
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
                  padding: '6px 12px',
                  color: '#4ade80',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                title="MakerWorld Contest Portal öffnen"
              >
                <ExternalLink size={12} /> MakerWorld Portal
              </button>
            </div>
          </div>

          {/* Bento Card 2: Favoriten Kachel (Col Span 1) */}
          <div
            className={`bento-card bento-card-fav ${activeCategory === 'favorites' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('favorites')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={20} color="#f59e0b" fill={favoriteModels.length > 0 ? '#f59e0b' : 'none'} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '800', background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '10px' }}>
                {favoriteModels.length}
              </span>
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{t('myFavorites')}</div>
              <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '2px' }}>{t('favoritesDesc')}</div>
            </div>
          </div>

          {/* Bento Card 3: 24h Daily Trends */}
          <div
            className={`bento-card bento-card-stat ${activeCategory === 'daily' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('daily')}
            style={{ background: activeCategory === 'daily' ? 'linear-gradient(135deg, rgba(66, 38, 22, 0.9), rgba(43, 23, 12, 0.9))' : 'rgba(20, 27, 45, 0.7)' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={18} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>{t('dailyTrends')}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>24h Top Vorlagen</div>
            </div>
          </div>

          {/* Bento Card 4: Monthly Bestsellers */}
          <div
            className={`bento-card bento-card-stat ${activeCategory === 'monthly' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('monthly')}
            style={{ background: activeCategory === 'monthly' ? 'linear-gradient(135deg, rgba(68, 22, 52, 0.9), rgba(43, 11, 32, 0.9))' : 'rgba(20, 27, 45, 0.7)' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Rocket size={18} color="#ec4899" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>{t('monthlyTrends')}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Monats-Hits</div>
            </div>
          </div>

          {/* Bento Card 5: Frisch Online (Newest) */}
          <div
            className={`bento-card bento-card-stat ${activeCategory === 'newest' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('newest')}
            style={{ background: activeCategory === 'newest' ? 'linear-gradient(135deg, rgba(18, 61, 48, 0.9), rgba(10, 37, 29, 0.9))' : 'rgba(20, 27, 45, 0.7)' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={18} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#fff' }}>{t('newest')}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Frisch online</div>
            </div>
          </div>

          {/* Bento Card 6: Themenwelten & Kategorien (Full Width 3-Col Span) */}
          <div className="bento-card bento-card-categories">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--accent-cyan)" />
                {t('bentoCategories')}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('categoriesDesc')}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORY_EXPLORE_CARDS.map(cat => {
                const Icon = cat.icon;
                const isCatActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    className="bento-category-pill"
                    style={{
                      background: isCatActive ? cat.activeGradient : 'rgba(255, 255, 255, 0.04)',
                      border: isCatActive ? `1px solid ${cat.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isCatActive ? '#fff' : 'var(--text-muted)',
                      boxShadow: isCatActive ? `0 2px 10px ${cat.shadow}` : 'none'
                    }}
                  >
                    <Icon size={14} color={isCatActive ? '#fff' : cat.color} />
                    <span>{t(cat.titleKey as any)}</span>
                  </button>
                );
              })}
            </div>
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
      </div>

      {/* Header Info Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeCategory === 'favorites' ? <Star size={20} color="#f59e0b" fill="#f59e0b" /> : <Globe size={20} color="var(--accent-cyan)" />}
            {getHeadingTitle()}
          </h1>
          {activeCategory === 'favorites' && favoriteModels.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Möchtest du wirklich alle Favoriten aus der Liste entfernen?')) {
                  clearFavorites();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 77, 77, 0.1)',
                border: '1px solid rgba(255, 77, 77, 0.3)',
                color: '#ff6b6b',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title={t('clearAllFavorites')}
            >
              <Trash2 size={12} /> {t('clearAllFavorites')}
            </button>
          )}
        </div>

        {displayedResults.length > 0 && (
          <span style={{ fontSize: '11px', fontWeight: '700', background: activeCategory === 'favorites' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 210, 255, 0.15)', color: activeCategory === 'favorites' ? '#fbbf24' : 'var(--accent-cyan)', border: activeCategory === 'favorites' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(0, 210, 255, 0.3)', padding: '4px 10px', borderRadius: '10px' }}>
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

      {/* No Results / Empty Favorites State */}
      {!loading && displayedResults.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          {activeCategory === 'favorites' ? (
            <div>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Star size={32} color="#f59e0b" fill="none" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                {t('noFavoritesTitle')}
              </div>
              <div style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 20px', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                {t('noFavoritesSubtitle')}
              </div>
              <button
                type="button"
                onClick={() => handleCategoryClick('daily')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 210, 255, 0.3)'
                }}
              >
                <TrendingUp size={15} /> {t('dailyTrends')} durchsuchen
              </button>
            </div>
          ) : (
            <div>
              <Search size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{t('noModelsFound')}</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>{t('noModelsFoundSubtitle')}</div>
            </div>
          )}
        </div>
      )}

      {/* Results Grid - MakerWorld 2-Column Vertical Cards */}
      {!loading && displayedResults.length > 0 && (
        <div>
          <div className="online-models-grid">
            {displayedResults.map(model => {
              const platStyle = getPlatformStyle(model.platform);
              const isFav = isFavorite(model.id);
              return (
                <div
                  key={model.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: isFav ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    boxShadow: isFav ? '0 4px 18px rgba(245, 158, 11, 0.15)' : '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = isFav ? '0 10px 24px rgba(245, 158, 11, 0.25)' : '0 10px 24px rgba(0,0,0,0.35)';
                    e.currentTarget.style.borderColor = isFav ? '#f59e0b' : 'rgba(0, 210, 255, 0.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = isFav ? '0 4px 18px rgba(245, 158, 11, 0.15)' : '0 4px 16px rgba(0,0,0,0.2)';
                    e.currentTarget.style.borderColor = isFav ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.07)';
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

                    {/* Top-Right: Likes & Interactive Favorite Toggle */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
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

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(model);
                        }}
                        title={isFav ? t('removeFromFavorites') : t('addToFavorites')}
                        style={{
                          background: isFav ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(18, 21, 36, 0.85)',
                          backdropFilter: 'blur(6px)',
                          border: isFav ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.15)',
                          padding: '4px 6px',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          boxShadow: isFav ? '0 2px 10px rgba(245, 158, 11, 0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Star size={13} fill={isFav ? '#fff' : 'none'} color={isFav ? '#fff' : 'rgba(255,255,255,0.85)'} />
                      </button>
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
