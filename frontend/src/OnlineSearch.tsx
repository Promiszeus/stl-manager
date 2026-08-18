import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { Search, Globe, ExternalLink, Heart, Download, X, Copy, Check, Filter, Sparkles, AlertCircle, Loader2, TrendingUp, Rocket, History, ChevronRight, ChevronDown, ArrowUpDown, Trophy, Gamepad2, Palette, Wrench, Home, Car, Smile, Layers, Star, Trash2 } from 'lucide-react';
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
    desc: 'Offizielle Bambu Lab & MakerWorld Wettbewerbe mit Prämienpunkten, Filament & 3D-Druckern.',
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
    id: 'thingiverse',
    name: 'Thingiverse Design Challenges',
    platform: 'Thingiverse',
    color: '#248bfb',
    bg: 'rgba(36, 139, 251, 0.15)',
    border: 'rgba(36, 139, 251, 0.35)',
    url: 'https://www.thingiverse.com/challenges',
    query: 'Thingiverse Challenge',
    desc: 'Thematische Design-Challenges und Community-Wettbewerbe der weltgrößten 3D-Druck Community.',
    badge: 'Thingiverse Official'
  },
  {
    id: 'cults3d',
    name: 'Cults 3D Design Competitions',
    platform: 'Cults 3D',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.35)',
    url: 'https://cults3d.com/en/contests',
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
  },
  {
    id: 'makeronline',
    name: 'MakerOnline Design Contests',
    platform: 'MakerOnline',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.35)',
    url: 'https://www.makeronline.com/en/challengeList',
    query: 'MakerOnline Contest',
    desc: 'Offizielle Anycubic & MakerOnline Contests mit 3D-Druckern, Cash-Preisen und Filament.',
    badge: 'Anycubic & MakerOnline'
  }
];

export const TREND_EXPLORE_PILLS = [
  { id: 'daily', titleKey: 'dailyTrends', icon: TrendingUp, color: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.25)' },
  { id: 'monthly', titleKey: 'monthlyTrends', icon: Rocket, color: '#f43f5e', shadow: 'rgba(244, 63, 94, 0.25)' },
  { id: 'newest', titleKey: 'newest', icon: Sparkles, color: '#10b981', shadow: 'rgba(16, 185, 129, 0.25)' }
];

export const CATEGORY_EXPLORE_CARDS = [
  { id: 'toys', titleKey: 'catToys', descKey: 'catToysDesc', query: 'Toy Fidget Articulated Figure', icon: Smile, color: '#fb923c', shadow: 'rgba(251, 146, 60, 0.25)' },
  { id: 'fashion', titleKey: 'catFashion', descKey: 'catFashionDesc', query: 'Fashion Jewelry Ring Bracelet Wearable', icon: Sparkles, color: '#ec4899', shadow: 'rgba(236, 72, 153, 0.25)' },
  { id: 'art', titleKey: 'catArt', descKey: 'catArtDesc', query: 'Art Sculpture Design Decor Statue', icon: Palette, color: '#c084fc', shadow: 'rgba(192, 132, 252, 0.25)' },
  { id: 'tools', titleKey: 'catTools', descKey: 'catToolsDesc', query: 'Functional Tool Mechanical Gadget Clamp', icon: Wrench, color: '#38bdf8', shadow: 'rgba(56, 189, 248, 0.25)' },
  { id: 'home', titleKey: 'catHome', descKey: 'catHomeDesc', query: 'Home Storage Organizer Gridfinity Mount Box', icon: Home, color: '#2dd4bf', shadow: 'rgba(45, 212, 191, 0.25)' },
  { id: 'gaming', titleKey: 'catGaming', descKey: 'catGamingDesc', query: 'Gaming Controller Stand Cosplay Prop Figure', icon: Gamepad2, color: '#a78bfa', shadow: 'rgba(167, 139, 250, 0.25)' },
  { id: 'plants', titleKey: 'catPlants', descKey: 'catPlantsDesc', query: 'Planter Flower Pot Vase Hydroponics Garden', icon: Layers, color: '#4ade80', shadow: 'rgba(74, 222, 128, 0.25)' },
  { id: 'hobby', titleKey: 'catHobby', descKey: 'catHobbyDesc', query: 'RC Car Drone Plane Model Vehicle Hobby', icon: Car, color: '#f87171', shadow: 'rgba(248, 113, 113, 0.25)' }
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

  // Listen for global reset (e.g. clicking Online Models nav button)
  useEffect(() => {
    const handleReset = () => {
      setActiveCategory('daily');
      setSearchTerm('');
      handleSearch('', 'daily', 'popular');
    };
    window.addEventListener('stl_reset_online_search', handleReset);
    return () => window.removeEventListener('stl_reset_online_search', handleReset);
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

  // Collapsible Dropdown States
  const [isPlatformsOpen, setIsPlatformsOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSearch();
    }
  };

  const isFavActive = activeCategory === 'favorites';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Favorites Shortcut Button */}
      <button
        type="button"
        onClick={() => handleCategoryClick(isFavActive ? 'daily' : 'favorites')}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: '12px',
          background: isFavActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
          border: isFavActive ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isFavActive ? '0 4px 15px rgba(0, 0, 0, 0.35)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={16} color="#ffffff" fill={favoriteModels.length > 0 ? '#ffffff' : 'none'} />
          <span style={{ fontSize: '13px', fontWeight: '700' }}>{t('myFavorites')}</span>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          background: isFavActive ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
          color: isFavActive ? '#090c14' : '#ffffff',
          padding: '2px 8px',
          borderRadius: '10px'
        }}>
          {favoriteModels.length}
        </span>
      </button>

      {/* 2. Prominently Highlighted Search Hub */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.32)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        borderRadius: '14px',
        padding: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px', color: '#ffffff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={13} color="#ffffff" /> {t('searchModels')}
          </span>
          {currentQuery && (
            <span style={{ fontSize: '10px', color: '#ffffff', background: 'rgba(255, 255, 255, 0.15)', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
              {t('activeSearch')}: "{currentQuery}"
            </span>
          )}
        </div>
        <form onSubmit={onSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
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
              border: '1px solid rgba(255, 255, 255, 0.2)',
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
              background: searchTerm.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
              color: searchTerm.trim() ? '#090c14' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: loading || !searchTerm.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !searchTerm.trim() ? 0.4 : 1,
              boxShadow: searchTerm.trim() ? '0 2px 10px rgba(255, 255, 255, 0.2)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
          </button>
        </form>
      </div>

      {/* 3. Platforms Accordion (Aufklapp-Menü mit weißer Umrandung) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.32)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <button
          type="button"
          onClick={() => setIsPlatformsOpen(!isPlatformsOpen)}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={13} color="#ffffff" />
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {t('platforms')}
            </span>
            <span style={{ fontSize: '10px', color: '#ffffff', background: 'rgba(255, 255, 255, 0.12)', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
              {activePlatforms.length === 0 ? '6/6' : `${activePlatforms.length}/6`}
            </span>
          </div>
          <ChevronDown
            size={15}
            color="var(--text-muted)"
            style={{
              transform: isPlatformsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>

        {isPlatformsOpen && (
          <div style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={selectAllPlatforms}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activePlatforms.length === 0 ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: '700',
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
                      border: isSelected ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
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
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Options & Sorting Accordion (Aufklapp-Menü mit weißer Umrandung) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.32)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <button
          type="button"
          onClick={() => setIsSortOpen(!isSortOpen)}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={13} color="var(--accent-cyan)" />
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {t('sortBy')}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '6px', fontWeight: '600' }}>
              {sortBy === 'popular' ? t('sortPopular') : sortBy === 'likes' ? t('sortLikes') : t('sortName')}
            </span>
          </div>
          <ChevronDown
            size={15}
            color="var(--text-muted)"
            style={{
              transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>

        {isSortOpen && (
          <div style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
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
        )}
      </div>

      {/* 5. Search History Accordion (Aufklapp-Menü mit weißer Umrandung) */}
      {searchHistory.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.32)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          borderRadius: '14px',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={13} color="var(--accent-cyan)" />
              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                {t('history')}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '6px', fontWeight: '600' }}>
                {searchHistory.length}
              </span>
            </div>
            <ChevronDown
              size={15}
              color="var(--text-muted)"
              style={{
                transform: isHistoryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>

          {isHistoryOpen && (
            <div style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={clearHistory}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', padding: 0 }}
                >
                  {t('clearHistory')}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {searchHistory.slice(0, 10).map(term => (
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
                    <button
                      type="button"
                      onClick={() => removeFromHistory(term)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <TrendingUp size={13} color={activeCategory === 'daily' ? '#090c14' : '#f59e0b'} />
            <span>{t('dailyTrends')}</span>
          </button>
          <button
            type="button"
            className={`explore-chip ${activeCategory === 'monthly' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('monthly')}
          >
            <Rocket size={13} color={activeCategory === 'monthly' ? '#090c14' : '#f43f5e'} />
            <span>{t('monthlyTrends')}</span>
          </button>
          <button
            type="button"
            className={`explore-chip ${activeCategory === 'newest' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('newest')}
          >
            <Sparkles size={13} color={activeCategory === 'newest' ? '#090c14' : '#10b981'} />
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
                <Icon size={13} color={isCatActive ? '#090c14' : cat.color} />
                <span>{t(cat.titleKey as any)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="desktop-explore-section">
        {/* Bento Grid Dashboard (Apple/Linear Style Full-Width Grid) */}
        <div className="bento-dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
          {/* Bento Card 1: Featured 3D Design Contest & Spotlight (Full Width with all 6 platforms) */}
          <div
            onClick={() => setShowContestsModal(true)}
            className="bento-card bento-card-hero"
            style={{ gridColumn: 'span 1', cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '320px', height: '100%', background: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), rgba(36, 139, 251, 0.05), transparent 70%)', pointerEvents: 'none' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24', padding: '3px 10px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
                  {t('bentoFeatured')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '11.5px', fontWeight: '700' }}>
                  <Trophy size={13} color="#f59e0b" />
                  <span>{t('allContests')}</span>
                  <ChevronRight size={13} />
                </div>
              </div>

              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                {t('contestTitle')}
              </h2>

              {/* All 6 Platforms Indicator with subtle platform colors */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', margin: '0 0 14px 0' }}>
                {PLATFORMS.map(p => (
                  <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#cbd5e1', fontWeight: '500' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}88` }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Pill Buttons on the Hero Card: Modal + Search + Direct Portal Chips for all 6 platforms */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', zIndex: 10 }} onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowContestsModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid #ffffff',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  color: '#090c14',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(255, 255, 255, 0.2)'
                }}
              >
                <Trophy size={13} color="#f59e0b" /> {t('allContests')}
              </button>

              <button
                type="button"
                onClick={() => handleSearch('Contest Challenge')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: '#fff',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Search size={13} color="#38bdf8" /> {t('exploreContestModels')}
              </button>

              {CONTEST_PORTALS.map(portal => (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => window.open(portal.url, '_blank')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${portal.color}55`,
                    borderRadius: '8px',
                    padding: '7px 11px',
                    color: '#f1f5f9',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title={`${portal.name} öffnen`}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: portal.color, boxShadow: `0 0 5px ${portal.color}` }} />
                  <span>{portal.platform}</span>
                  <ExternalLink size={10} style={{ opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Bento Card 2: Trends, Themenwelten & Kategorien (Unified Consistent Pill Design with Subtle Light Color Accents) */}
          <div className="bento-card bento-card-categories" style={{ gridColumn: 'span 1' }}>
            {/* Section A: Trends & Entdecken */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} color="#f59e0b" />
                <span>{t('trendsAndDiscover')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {TREND_EXPLORE_PILLS.map(tPill => {
                const Icon = tPill.icon;
                const isActive = activeCategory === tPill.id;
                return (
                  <button
                    key={tPill.id}
                    type="button"
                    onClick={() => handleCategoryClick(tPill.id)}
                    className="bento-category-pill"
                    style={{
                      background: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                      border: isActive ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isActive ? '#090c14' : '#e2e8f0',
                      boxShadow: isActive ? '0 2px 14px rgba(255, 255, 255, 0.25)' : 'none'
                    }}
                  >
                    <Icon size={14} color={isActive ? '#090c14' : tPill.color} />
                    <span>{t(tPill.titleKey as any)}</span>
                  </button>
                );
              })}
            </div>

            {/* Subtle Divider */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '14px 0' }} />

            {/* Section B: Themenwelten & Kategorien */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#38bdf8" />
                <span>{t('bentoCategories')}</span>
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
                      background: isCatActive ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                      border: isCatActive ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isCatActive ? '#090c14' : '#e2e8f0',
                      boxShadow: isCatActive ? '0 2px 14px rgba(255, 255, 255, 0.25)' : 'none'
                    }}
                  >
                    <Icon size={14} color={isCatActive ? '#090c14' : cat.color} />
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
                background: '#0d111d',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0, 0, 0, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(245, 158, 11, 0.2)' }}>
                    <Trophy size={18} color="#f59e0b" />
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
                          background: '#ffffff',
                          border: '1px solid #ffffff',
                          color: '#090c14',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)'
                        }}
                      >
                        <Search size={14} color="#090c14" />
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
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${portal.color}55`,
                          color: '#ffffff',
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
          <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.25)', padding: '4px 10px', borderRadius: '10px' }}>
            {displayedResults.length} {t('modelsLoaded')}
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Loader2 size={36} className="spin" style={{ color: '#ffffff', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{t('searchingAllPlatforms')}</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>{t('searchingPlatformsDetail')}</div>
        </div>
      )}

      {/* No Results / Empty Favorites State */}
      {!loading && displayedResults.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          {activeCategory === 'favorites' ? (
            <div>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Star size={30} color="#ffffff" fill="none" />
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
                  background: '#ffffff',
                  border: '1px solid #ffffff',
                  color: '#090c14',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 255, 255, 0.2)'
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
              const isFav = isFavorite(model.id);
              return (
                <div
                  key={model.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: isFav ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    boxShadow: isFav ? '0 4px 18px rgba(255, 255, 255, 0.08)' : '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.45)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = isFav ? '0 4px 18px rgba(255, 255, 255, 0.08)' : '0 4px 16px rgba(0,0,0,0.2)';
                    e.currentTarget.style.borderColor = isFav ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  {/* Image Container with Badges */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#0e121d', overflow: 'hidden' }}>
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
                      background: 'rgba(11, 15, 24, 0.88)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      padding: '3px 7px',
                      borderRadius: '7px',
                      fontSize: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
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
                        background: 'rgba(11, 15, 24, 0.88)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        padding: '3px 7px',
                        borderRadius: '7px',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}>
                        <Heart size={11} fill="#e2e8f0" color="#e2e8f0" />
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
                          background: isFav ? '#ffffff' : 'rgba(11, 15, 24, 0.88)',
                          backdropFilter: 'blur(6px)',
                          border: isFav ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                          padding: '4px 6px',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isFav ? '#090c14' : '#ffffff',
                          boxShadow: isFav ? '0 2px 10px rgba(255, 255, 255, 0.25)' : '0 2px 6px rgba(0,0,0,0.4)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Star size={13} fill={isFav ? '#090c14' : 'none'} color={isFav ? '#090c14' : '#ffffff'} />
                      </button>
                    </div>

                    {/* Bottom-Left: Creator Avatar & Name Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      maxWidth: '85%',
                      background: 'rgba(11, 15, 24, 0.88)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '20px',
                      padding: '2px 8px 2px 3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', color: '#fff' }}>
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
                        background: 'rgba(11, 15, 24, 0.88)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
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
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
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
                          background: copiedId === model.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${copiedId === model.id ? '#ffffff' : 'rgba(255, 255, 255, 0.12)'}`,
                          borderRadius: '8px',
                          color: copiedId === model.id ? '#ffffff' : 'var(--text-muted)',
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
                  background: '#ffffff',
                  border: '1px solid #ffffff',
                  borderRadius: '12px',
                  color: '#090c14',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.2s'
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
