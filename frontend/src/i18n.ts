import { useState } from 'react';

export type Language = 'de' | 'en';

export const translations = {
  de: {
    // Navigation
    appName: 'STL Manager',
    modelsTotal: 'Modelle gesamt',
    library: 'Meine Bibliothek',
    onlineModels: 'Online-Modelle',
    onlineSearch: 'Online-Suche',
    home: 'Startseite',
    favorites: 'Favoriten',
    filterAndSearch: 'Filter & Suche',
    options: 'Optionen',
    settings: 'Einstellungen',
    language: 'Sprache',

    // Trends & Categories (MakerWorld Style)
    dailyTrends: 'Tägliche Trends',
    dailyTrendsDesc: 'Top-Modelle der letzten 24 Stunden',
    monthlyTrends: 'Monatliche Trends',
    monthlyTrendsDesc: 'Die beliebtesten Modelle diesen Monat',
    newest: 'Neueste',
    newestDesc: 'Frisch veröffentlichte Vorlagen',
    history: 'Verlauf',
    historyDesc: 'Deine letzten Suchbegriffe',
    searchHistory: 'Suchverlauf',
    clearHistory: 'Verlauf löschen',
    noHistory: 'Noch keine Suchbegriffe gespeichert.',
    contests: 'Wettbewerbe',
    featuredContest: 'Empfohlener 3D-Design Wettbewerb',
    contestTitle: 'MakerWorld 3D-Druck Contest: Innovative Modelle',
    allContests: '3D-Druck Wettbewerbe & Contests',
    exploreContestModels: 'Contest-Modelle durchsuchen',
    openContestPortal: 'Im Portal öffnen',
    contestsHubDesc: 'Entdecke offizielle 3D-Design Wettbewerbe von MakerWorld, Printables, Cults 3D und Creality.',
    activeCompetitions: 'Aktive Wettbewerbe & Herausforderungen',
    categories: 'Kategorien & Themen',
    categoriesDesc: 'Beliebte 3D-Druck Themenwelten',
    catToys: 'Spielzeug & Fidget',
    catToysDesc: 'Figuren, Spielzeug & Fidgets',
    catFashion: 'Mode & Schmuck',
    catFashionDesc: 'Ringe, Armbänder & Wearables',
    catArt: 'Kunst & Design',
    catArtDesc: 'Skulpturen, Deko & Miniaturen',
    catTools: 'Werkzeuge & Gadgets',
    catToolsDesc: 'Funktionale Hilfen & Mechanik',
    catHome: 'Haushalt & Ordnung',
    catHomeDesc: 'Gridfinity, Halter & Organizer',
    catGaming: 'Gaming & Popkultur',
    catGamingDesc: 'Controller, Cosplay & Zubehör',
    catPlants: 'Pflanzen & Vasen',
    catPlantsDesc: 'Blumentöpfe, Vasen & Deko',
    catHobby: 'RC & Modellbau',
    catHobbyDesc: 'Drohnen, Autos & RC-Modelle',
    popularTags: 'Beliebte Suchbegriffe',
    quickSearch: 'Schnellsuche',

    // Search
    searchModels: 'Modelle suchen...',
    searchPlaceholder: 'z. B. Skull, Benchy, Halterung...',
    searchButton: 'Suchen',
    activeSearch: 'Aktiv',
    platforms: 'Plattformen',
    allActive: 'Alle aktiv',
    selectAll: 'Alle wählen',
    freeOnly: 'Nur kostenlose Vorlagen',
    sortBy: 'Optionen & Sortierung',
    sortPopular: 'Sortieren: Beliebteste',
    sortLikes: 'Sortieren: Meiste Likes',
    sortName: 'Sortieren: Name (A-Z)',
    sortNameDesc: 'Sortieren: Name (Z-A)',
    sortModDesc: 'Sortieren: Änderungsdatum (Neueste)',
    sortModAsc: 'Sortieren: Änderungsdatum (Älteste)',
    sortDateDesc: 'Sortieren: Hinzugefügt (Neueste)',
    sortDateAsc: 'Sortieren: Hinzugefügt (Älteste)',
    sortSizeDesc: 'Sortieren: Größe (Größte)',
    sortSizeAsc: 'Sortieren: Größe (Kleinste)',
    searchLocalPlaceholder: 'Name oder Ordner...',
    modelsLoaded: 'Vorlagen geladen',
    searchingAllPlatforms: 'Suche auf allen Plattformen...',
    searchingPlatformsDetail: 'MakerWorld, Printables, Cults 3D, Thingiverse, MakerOnline & Creality Cloud werden durchsucht...',
    findMillionsTitle: 'Finde Millionen 3D-Modelle im Web',
    findMillionsSubtitle: 'Nutze die Schnellkarten oben oder die Suchleiste, um nach spannenden 3D-Modellen zu stöbern.',
    noModelsFound: 'Keine Modelle gefunden',
    noModelsFoundSubtitle: 'Versuche es mit einem allgemeinen Begriff oder wechsle die Plattform.',
    loadMore: 'Weitere Modelle laden',
    loadingMore: 'Lade weitere Modelle nach...',

    // Library Controls
    librarySearch: 'Bibliothek Durchsuchen',
    filterTags: 'Tags Filtern',
    clearFilter: 'Filter aufheben',
    untagged: 'Ohne Tag',
    findDuplicates: 'Duplikate finden',
    modelsDisplayed: 'Modelle angezeigt',
    modelSelected: 'ausgewählt',
    selectAllBtn: 'Alle auswählen',
    deselectAllBtn: 'Auswahl aufheben',
    markPrinted: 'Gedruckt',
    markNotPrinted: 'Nicht gedruckt',
    deleteSelected: 'Ausgewählte löschen',
    addFolder: 'Ordner hinzufügen',
    monitoredFolders: 'Überwachte Ordner',
    slicers: '3D-Slicer Programme',
    addSlicer: 'Slicer hinzufügen',
    saveSettings: 'Einstellungen speichern',

    // Model Card Actions
    viewOn: 'Auf {platform} ansehen',
    copyLink: 'Link kopieren',
    linkCopied: 'Kopiert!',
    sliceWith: 'Mit {slicer} slicen',
    open3DPreview: '3D-Vorschau öffnen',
    openFolder: 'Ordner öffnen',
    deleteModel: 'Modell löschen',
    free: 'Kostenlos',
    notPrintedStatus: 'Nicht gedruckt',
    printedStatus: 'Gedruckt',

    // AI Visual Similarity
    findSimilar: 'Ähnliche Modelle finden (KI)',
    similarModels: 'Optisch ähnliche Modelle (KI)',
    similarModelsSubtitle: 'Modelle mit hoher visueller und geometrischer Form-Übereinstimmung',
    similarity: 'Ähnlichkeit',
    referenceModel: 'Referenzmodell',
    noSimilarFound: 'Keine optisch ähnlichen Modelle in der Bibliothek gefunden.',
    noSimilarHint: 'Sobald du weitere Modelle hinzufügst, erkennt die KI Form- und Remix-Ähnlichkeiten automatisch.',
    aiEngine: 'Meta DINOv2 Vision KI (100% Lokal & Offline)',
    match: 'Match',

    // Platform Accounts & Logins
    platformAccounts: 'Plattform-Accounts & Zugangsdaten',
    platformAccountsSubtitle: 'Hinterlege deine Logins für 1-Klick Downloads & Interaktionen (100% lokal mit Windows DPAPI verschlüsselt).',
    platformSelect: 'Plattform auswählen',
    usernameOrEmail: 'E-Mail oder Benutzername',
    password: 'Passwort',
    tokenOrCookie: 'Session-Cookie / API-Token (Optional)',
    tokenOrCookieHint: 'Hilfreich bei 2-Faktor-Authentifizierung (2FA) oder Google/Apple-Logins',
    saveCredentials: 'Zugangsdaten sicher speichern',
    savedSecurely: '🔒 Sicher verschlüsselt',
    removeAccount: 'Zugangsdaten löschen',
    accountSavedSuccess: 'Zugangsdaten erfolgreich verschlüsselt gespeichert!',
    accountDeletedSuccess: 'Zugangsdaten wurden sicher entfernt.',
    notConfigured: 'Nicht verknüpft',
    configured: 'Verknüpft',

    // Settings Modal Tabs
    settingsTabsFolders: 'Ordner & Slicer',
    settingsTabsTags: 'Tags & Farben',
    settingsTabsAccounts: 'Plattform-Accounts',
    settingsTabsMaintenance: 'Wartung & App',
    manageTags: 'Tags verwalten',
    newTagName: 'Neuer Tag Name...',
    clearDatabaseDesc: 'Löscht alle generierten 3D-Vorschaubilder und liest alle Verzeichnisse komplett neu ein.',
    installApp: 'Als WebApp installieren',
    installAppDesc: 'Installiere STL-Manager als native Desktop- oder Smartphone-App für schnellen 1-Klick-Zugriff ohne Browserleiste.'
  },
  en: {
    // Navigation
    appName: 'STL Manager',
    modelsTotal: 'models total',
    library: 'My Library',
    onlineModels: 'Online Models',
    onlineSearch: 'Online Search',
    home: 'Home',
    favorites: 'Favorites',
    filterAndSearch: 'Filter & Search',
    options: 'Options',
    settings: 'Settings',
    language: 'Language',

    // Trends & Categories (MakerWorld Style)
    dailyTrends: 'Daily Trends',
    dailyTrendsDesc: 'Top models from the last 24 hours',
    monthlyTrends: 'Monthly Trends',
    monthlyTrendsDesc: 'Most popular models this month',
    newest: 'Newest',
    newestDesc: 'Freshly published 3D prints',
    history: 'History',
    historyDesc: 'Your recent search queries',
    searchHistory: 'Search History',
    clearHistory: 'Clear history',
    noHistory: 'No search history saved yet.',
    contests: 'Contests',
    featuredContest: 'Featured 3D Design Contest',
    contestTitle: 'MakerWorld 3D Print Contest: Innovative Creations',
    allContests: '3D Print Design Contests',
    exploreContestModels: 'Search Contest Models',
    openContestPortal: 'Open Portal',
    contestsHubDesc: 'Discover official 3D design contests and challenges from MakerWorld, Printables, Cults 3D and Creality.',
    activeCompetitions: 'Active Competitions & Challenges',
    categories: 'Categories & Topics',
    categoriesDesc: 'Popular 3D Printing Categories',
    catToys: 'Toys & Fidgets',
    catToysDesc: 'Figures, Toys & Fidgets',
    catFashion: 'Fashion & Jewelry',
    catFashionDesc: 'Rings, Jewelry & Wearables',
    catArt: 'Art & Design',
    catArtDesc: 'Sculptures, Decor & Miniatures',
    catTools: 'Tools & Gadgets',
    catToolsDesc: 'Functional Tools & Mechanics',
    catHome: 'Home & Storage',
    catHomeDesc: 'Gridfinity, Mounts & Organizers',
    catGaming: 'Gaming & Pop Culture',
    catGamingDesc: 'Controllers, Cosplay & Gear',
    catPlants: 'Planters & Vases',
    catPlantsDesc: 'Flower Pots, Vases & Decor',
    catHobby: 'RC & Models',
    catHobbyDesc: 'Drones, Cars & RC Models',
    popularTags: 'Popular Tags',
    quickSearch: 'Quick Search',

    // Search
    searchModels: 'Search Models...',
    searchPlaceholder: 'e.g. Skull, Benchy, Mount...',
    searchButton: 'Search',
    activeSearch: 'Active',
    platforms: 'Platforms',
    allActive: 'All active',
    selectAll: 'Select all',
    freeOnly: 'Free models only',
    sortBy: 'Options & Sorting',
    sortPopular: 'Sort by: Most Popular',
    sortLikes: 'Sort by: Most Likes',
    sortName: 'Sort by: Name (A-Z)',
    sortNameDesc: 'Sort by: Name (Z-A)',
    sortModDesc: 'Sort by: Date Modified (Newest)',
    sortModAsc: 'Sort by: Date Modified (Oldest)',
    sortDateDesc: 'Sort by: Date Added (Newest)',
    sortDateAsc: 'Sort by: Date Added (Oldest)',
    sortSizeDesc: 'Sort by: File Size (Largest)',
    sortSizeAsc: 'Sort by: File Size (Smallest)',
    searchLocalPlaceholder: 'Model name or folder...',
    modelsLoaded: 'models loaded',
    searchingAllPlatforms: 'Searching across all platforms...',
    searchingPlatformsDetail: 'MakerWorld, Printables, Cults 3D, Thingiverse, MakerOnline & Creality Cloud are being searched...',
    findMillionsTitle: 'Discover Millions of 3D Models',
    findMillionsSubtitle: 'Click the trend cards above or use the search bar to explore great 3D models.',
    noModelsFound: 'No models found',
    noModelsFoundSubtitle: 'Try using broader keywords or select other platforms.',
    loadMore: 'Load More Models',
    loadingMore: 'Loading more models...',

    // Library Controls
    librarySearch: 'Search Library',
    filterTags: 'Filter Tags',
    clearFilter: 'Clear filter',
    untagged: 'Untagged',
    findDuplicates: 'Find duplicates',
    modelsDisplayed: 'models displayed',
    modelSelected: 'selected',
    selectAllBtn: 'Select all',
    deselectAllBtn: 'Deselect all',
    markPrinted: 'Printed',
    markNotPrinted: 'Not Printed',
    deleteSelected: 'Delete selected',
    addFolder: 'Add Folder',
    monitoredFolders: 'Monitored Folders',
    slicers: '3D Slicer Programs',
    addSlicer: 'Add Slicer',
    saveSettings: 'Save Settings',

    // Model Card Actions
    viewOn: 'View on {platform}',
    copyLink: 'Copy link',
    linkCopied: 'Copied!',
    sliceWith: 'Slice with {slicer}',
    open3DPreview: 'Open 3D Preview',
    openFolder: 'Open Folder',
    deleteModel: 'Delete Model',
    free: 'Free',
    notPrintedStatus: 'Not Printed',
    printedStatus: 'Printed',

    // AI Visual Similarity
    findSimilar: 'Find Similar Models (AI)',
    similarModels: 'Visually Similar Models (AI)',
    similarModelsSubtitle: 'Models with high visual and geometric shape similarity',
    similarity: 'Similarity',
    referenceModel: 'Reference Model',
    noSimilarFound: 'No visually similar models found in your library.',
    noSimilarHint: 'As you add more 3D models, the AI will automatically group shapes and remix variants.',
    aiEngine: 'Meta DINOv2 Vision AI (100% Local & Offline)',
    match: 'Match',

    // Platform Accounts & Logins
    platformAccounts: 'Platform Accounts & Credentials',
    platformAccountsSubtitle: 'Store your logins for 1-click downloads & platform features (100% locally encrypted with Windows DPAPI).',
    platformSelect: 'Select Platform',
    usernameOrEmail: 'Email or Username',
    password: 'Password',
    tokenOrCookie: 'Session Cookie / API Token (Optional)',
    tokenOrCookieHint: 'Helpful for 2-Factor Authentication (2FA) or Google/Apple logins',
    saveCredentials: 'Save Credentials Securely',
    savedSecurely: '🔒 Securely Encrypted',
    removeAccount: 'Delete Credentials',
    accountSavedSuccess: 'Credentials encrypted and saved successfully!',
    accountDeletedSuccess: 'Credentials removed securely.',
    notConfigured: 'Not connected',
    configured: 'Connected',

    // Settings Modal Tabs
    settingsTabsFolders: 'Folders & Slicers',
    settingsTabsTags: 'Tags & Colors',
    settingsTabsAccounts: 'Platform Accounts',
    settingsTabsMaintenance: 'Maintenance & App',
    manageTags: 'Manage Tags',
    newTagName: 'New Tag Name...',
    clearDatabaseDesc: 'Deletes all generated 3D thumbnails and triggers a full fresh rescan of all folders.',
    installApp: 'Install as WebApp',
    installAppDesc: 'Install STL-Manager as a standalone desktop or mobile application for instant access without a browser bar.'
  }
};

export function useI18n() {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('stl_manager_lang') as Language) || 'de';
  });

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('stl_manager_lang', newLang);
  };

  const toggleLanguage = () => {
    setLanguage(lang === 'de' ? 'en' : 'de');
  };

  const t = (key: keyof typeof translations['de'], params?: Record<string, string>): string => {
    let text = translations[lang]?.[key] || translations['de']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  return { lang, setLanguage, toggleLanguage, t };
}
