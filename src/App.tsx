import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Layers, Folder, Map, Settings as SettingsIcon,
  Search, Sun, Moon, HardDrive, User, Cpu, X, Play, Keyboard, ListVideo, Menu, BookOpen, ChevronLeft, ChevronRight,
  ScanEye
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { WatchQueue } from './components/WatchQueue';
import { Categories } from './components/Categories';
import { LearningPaths } from './components/LearningPaths';
import { Settings } from './components/Settings';
import { FocusPlayer } from './components/FocusPlayer';
import { Playlists } from './components/Playlists';
import { Articles } from './components/Articles';
import { StorageService } from './services/storage';
import type { Category, Note, LearningPath, LearningResource, Playlist } from './types';

type Tab = 'dashboard' | 'queue' | 'categories' | 'paths' | 'playlists' | 'articles' | 'settings';

interface PlaylistContext {
  playlistId: string;
  playlistTitle: string;
  nextVideo: LearningResource | null;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [videos, setVideos] = useState<LearningResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeVideo, setActiveVideo] = useState<LearningResource | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [playlistContext, setPlaylistContext] = useState<PlaylistContext | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile navigation drawers
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('focushub_theme') as 'light' | 'dark') || 'dark';
  });

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('focushub_theme', theme);
  }, [theme]);

  // Load initial data
  const refreshData = async () => {
    const vids = await StorageService.getVideos();
    const arts = await StorageService.getArticles();
    const cats = await StorageService.getCategories();
    const nts = await StorageService.getNotes();
    const pths = await StorageService.getLearningPaths();
    const pls = await StorageService.getPlaylists();

    // Merge into combined resource list with type fields
    const combined: LearningResource[] = [
      ...vids.map(v => ({ ...v, type: 'video' as const })),
      ...arts.map(a => ({ ...a, type: 'article' as const }))
    ];

    setVideos(combined);
    setCategories(cats);
    setNotes(nts);
    setPaths(pths);
    setPlaylists(pls);

    // Keep activeVideo in sync if it is currently playing
    const hash = window.location.hash;
    if (hash.startsWith('#/watch/')) {
      const resourceId = hash.replace('#/watch/', '');
      const currentPlaying = combined.find(r => r.id === resourceId);
      if (currentPlaying) {
        setActiveVideo(currentPlaying);
        // Re-derive playlist context in case playlists changed
        const ownerPlaylist = pls.find(pl => pl.videoIds.includes(currentPlaying.id));
        if (ownerPlaylist) {
          const idx = ownerPlaylist.videoIds.indexOf(currentPlaying.id);
          const nextId = ownerPlaylist.videoIds[idx + 1];
          const nextVideo = nextId ? combined.find(r => r.id === nextId) || null : null;
          setPlaylistContext({ playlistId: ownerPlaylist.id, playlistTitle: ownerPlaylist.title, nextVideo });
        } else {
          setPlaylistContext(null);
        }
      }
    }
  };

  // Load data on mount and set up hash routing
  useEffect(() => {
    refreshData();

    const handleHashChange = async () => {
      const hash = window.location.hash;

      if (hash.startsWith('#/watch/')) {
        const resourceId = hash.replace('#/watch/', '');

        // Query both pools to locate resource
        const vids = await StorageService.getVideos();
        const arts = await StorageService.getArticles();
        const pls = await StorageService.getPlaylists();
        const combined: LearningResource[] = [
          ...vids.map(v => ({ ...v, type: 'video' as const })),
          ...arts.map(a => ({ ...a, type: 'article' as const }))
        ];

        const found = combined.find(r => r.id === resourceId);
        if (found) {
          // Auto-mark In Progress when starting to watch
          let activeResource = found;
          if (found.status === 'Planned') {
            const updated = { ...found, status: 'In Progress' as const };
            if (updated.type === 'video') {
              await StorageService.updateVideo(updated);
            } else {
              await StorageService.updateArticle(updated);
            }
            activeResource = updated;
          }

          // Derive playlist context
          const ownerPlaylist = pls.find(pl => pl.videoIds.includes(found.id));
          if (ownerPlaylist) {
            const idx = ownerPlaylist.videoIds.indexOf(found.id);
            const nextId = ownerPlaylist.videoIds[idx + 1];
            const nextVideo = nextId ? combined.find(r => r.id === nextId) || null : null;
            setPlaylistContext({ playlistId: ownerPlaylist.id, playlistTitle: ownerPlaylist.title, nextVideo });
            setActivePlaylistId(ownerPlaylist.id);
          } else {
            setPlaylistContext(null);
          }

          refreshData();
          setActiveVideo(activeResource);
        } else {
          // If resource not found, default to dashboard
          window.location.hash = '#/dashboard';
        }
      } else if (hash.startsWith('#/playlists/')) {
        // Deep-link into a specific playlist: #/playlists/{playlistId}
        const playlistId = hash.replace('#/playlists/', '');
        setActiveTab('playlists');
        setActiveVideo(null);
        setActivePlaylistId(playlistId);
      } else {
        const tab = hash.replace('#/', '') as Tab;
        const validTabs: Tab[] = ['dashboard', 'queue', 'categories', 'paths', 'playlists', 'articles', 'settings'];
        if (validTabs.includes(tab)) {
          setActiveTab(tab);
          setActiveVideo(null);
          if (tab !== 'playlists') setActivePlaylistId(null);
        } else {
          // Set default hash if empty or invalid
          window.location.hash = '#/dashboard';
        }
      }
    };

    // Run on initial load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard listener for command-palette search (⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleWatchVideo = (video: LearningResource) => {
    window.location.hash = `#/watch/${video.id}`;
  };

  // Perform search matching (using state data loaded via refreshData)
  const getSearchResults = () => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    return {
      videos: videos.filter(v => v.title.toLowerCase().includes(q) || (v.type === 'video' ? v.channel : v.source).toLowerCase().includes(q)),
      categories: categories.filter(c => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)),
      paths: paths.filter(p => p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)),
      notes: notes.filter(n => {
        const v = videos.find(vid => vid.id === n.videoId);
        return n.content.toLowerCase().includes(q) || (v && v.title.toLowerCase().includes(q));
      })
    };
  };

  const results = getSearchResults();

  // Navigation config
  const navItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'queue' as Tab, label: 'Watch Queue', icon: Layers },
    { id: 'categories' as Tab, label: 'Categories', icon: Folder },
    { id: 'paths' as Tab, label: 'Learning Paths', icon: Map },
    { id: 'playlists' as Tab, label: 'Playlists', icon: ListVideo },
    { id: 'articles' as Tab, label: 'Articles', icon: BookOpen },
    { id: 'settings' as Tab, label: 'Settings', icon: SettingsIcon },
  ];

  // Distraction-Free Focus mode layout override
  if (activeVideo) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 flex flex-col justify-between">
        <div className="w-full flex-1">
          <FocusPlayer
            video={activeVideo}
            categories={categories}
            playlistContext={playlistContext}
            onExit={() => {
              if (playlistContext) {
                window.location.hash = `#/playlists/${playlistContext.playlistId}`;
              } else {
                window.location.hash = `#/${activeTab}`;
              }
            }}
            onWatchNext={(nextVideo) => {
              window.location.hash = `#/watch/${nextVideo.id}`;
            }}
            onRefreshData={refreshData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-background text-foreground relative">
      {/* Skip to Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
      >
        Skip to main content
      </a>
      {/* 1. SIDEBAR NAVIGATION PANEL (Desktop) */}
      <aside className={`hidden md:flex flex-col h-full bg-card border-r border-border p-4 justify-between flex-shrink-0 select-none overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="space-y-6">

          {/* Logo Brand Header & Toggle */}
          {sidebarCollapsed ? (
            // Collapsed: show icon + a dedicated expand button below it
            <div className="flex flex-col items-center gap-2">
              <div className="p-1.5 bg-purple-600 rounded text-white flex items-center justify-center">
                <ScanEye className="h-5 w-5 animate-pulse" />
              </div>
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-full flex items-center justify-center p-1.5 rounded-md hover:bg-hover text-slate-500 hover:text-purple-500 transition-colors"
                title="Expand Sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // Expanded: show logo + collapse button
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-600 rounded text-white flex items-center justify-center">
                  <ScanEye className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="font-bold tracking-tight text-foreground text-sm">FocusHub</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block leading-none">LEARNING HUB</span>
                </div>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 hover:bg-hover rounded-full text-slate-500 hover:text-foreground transition-colors"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Quick Search Shortcut Trigger */}
          {sidebarCollapsed ? (
            <button
              onClick={() => setSearchOpen(true)}
              className="mx-auto bg-input/25 border border-border hover:border-border/60 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300 rounded-md p-2 transition-colors flex items-center justify-center"
              title="Quick Search (⌘K)"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full bg-input/25 border border-border hover:border-border/60 text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300 rounded-md px-3 py-2 text-xs flex items-center justify-between transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                Quick search...
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-input border border-border rounded text-slate-600 dark:text-slate-400">⌘K</span>
            </button>
          )}

          {/* Tabs Menu List */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={`#/${item.id}`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center rounded-md text-xs font-semibold transition-all text-left ${sidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
                    } ${isActive
                      ? 'bg-purple-600/10 border-l-2 border-purple-500 text-purple-700 dark:text-purple-400 font-bold'
                      : 'text-slate-700 hover:text-purple-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-hover'
                    }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-purple-700 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  {!sidebarCollapsed && item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Status Indicator */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className={`flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 ${sidebarCollapsed ? 'flex-col gap-3 items-center' : ''}`}>
            {!sidebarCollapsed ? (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                Demo Learner
              </span>
            ) : (
              <span title="Demo Learner">
                <User className="h-4 w-4 text-slate-500" />
              </span>
            )}
            <button
              onClick={handleToggleTheme}
              className="p-1.5 hover:bg-hover rounded-full text-slate-500 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="bg-input/25 p-2.5 rounded border border-border/40 text-[10px]">
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <HardDrive className="h-3.5 w-3.5" />
                Saved Locally (IndexedDB)
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-purple-600 rounded text-white flex items-center justify-center">
            <Cpu className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">FocusHub</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-hover rounded"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggleTheme}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-hover rounded"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-hover rounded"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MOBILE MENU NAV DRAWER */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
          <nav className="fixed top-14 left-0 right-0 bg-card border-b border-border p-4 z-50 md:hidden space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={`#/${item.id}`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all text-left ${isActive
                      ? 'bg-purple-600/10 border-l-2 border-purple-500 text-purple-700 dark:text-purple-400 font-bold'
                      : 'text-slate-700 hover:text-purple-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-hover'
                    }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-purple-700 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </>
      )}

      {/* 2. MAIN WORKSPACE VIEW */}
      <main
        id="main-content"
        tabIndex={0}
        aria-label="Main Workspace Content"
        className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 md:p-8 pt-20 md:pt-8 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20"
      >

        {/* Dynamic component routing based on selected tab */}
        {activeTab === 'dashboard' && (
          <Dashboard
            videos={videos}
            categories={categories}
            onWatchVideo={handleWatchVideo}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'queue' && (
          <WatchQueue
            videos={videos}
            categories={categories}
            onWatchVideo={handleWatchVideo}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'categories' && (
          <Categories
            categories={categories}
            videos={videos}
            onRefreshData={refreshData}
            onWatchVideo={handleWatchVideo}
          />
        )}

        {activeTab === 'paths' && (
          <LearningPaths
            videos={videos}
            categories={categories}
            onWatchVideo={handleWatchVideo}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'playlists' && (
          <Playlists
            videos={videos}
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onSelectPlaylist={(id) => {
              setActivePlaylistId(id);
              window.location.hash = `#/playlists/${id}`;
            }}
            onWatchVideo={handleWatchVideo}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'articles' && (
          <Articles
            videos={videos}
            categories={categories}
            onWatchVideo={handleWatchVideo}
            onRefreshData={refreshData}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            onRefreshData={refreshData}
          />
        )}
      </main>

      {/* 3. GLOBAL COMMAND-PALETTE SEARCH MODAL (⌘K) */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
          <div className="fixed inset-0" onClick={() => setSearchOpen(false)}></div>

          <div className="bg-card border border-border w-full max-w-lg rounded-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[460px]">
            {/* Search Input field */}
            <div className="flex items-center px-4 py-3 border-b border-border gap-2.5">
              <Search className="h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search across categories, videos, notes, playlists..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-transparent text-sm w-full border-none focus:outline-none placeholder-slate-600 text-foreground"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 hover:bg-hover rounded text-slate-500 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results lists */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {!searchQuery.trim() ? (
                <div className="text-center py-10 space-y-2">
                  <Keyboard className="h-8 w-8 mx-auto text-slate-500 dark:text-slate-700" />
                  <p className="text-xs text-slate-700 dark:text-slate-400 font-semibold">Search FocusHub global index</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500">Type matching keywords above. Press ESC to exit.</p>
                </div>
              ) : (
                <>
                  {/* If total zero matches */}
                  {results &&
                    results.videos.length === 0 &&
                    results.categories.length === 0 &&
                    results.paths.length === 0 &&
                    results.notes.length === 0 && (
                      <div className="text-center py-12 text-xs text-slate-500">
                        No matches found for "{searchQuery}".
                      </div>
                    )
                  }

                  {/* Categories Results */}
                  {results && results.categories.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase block px-1">Categories</span>
                      {results.categories.map(c => (
                        <a
                          key={c.name}
                          href="#/categories"
                          onClick={() => {
                            setSearchOpen(false);
                          }}
                          className="w-full p-2 hover:bg-purple-600/10 dark:hover:bg-purple-950/20 rounded flex items-center justify-between group transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                            <span className="text-xs font-semibold text-foreground">{c.name}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">View Subjects</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Videos Results */}
                  {results && results.videos.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase block px-1">Videos</span>
                      {results.videos.map(v => {
                        return (
                          <button
                            key={v.id}
                            onClick={() => {
                              handleWatchVideo(v);
                              setSearchOpen(false);
                            }}
                            className="w-full p-2 hover:bg-purple-600/10 dark:hover:bg-purple-950/20 rounded flex items-center justify-between group transition-colors text-left"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-foreground block truncate">{v.title}</span>
                              <span className="text-[9px] text-slate-650 dark:text-slate-400 truncate block mt-0.5">
                                {v.type === 'video' ? v.channel : v.source} • {v.categoryName}
                              </span>
                            </div>
                            <Play className="h-3.5 w-3.5 text-purple-400 fill-current opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Notes Results */}
                  {results && results.notes.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase block px-1">Notes Content</span>
                      {results.notes.map(n => {
                        const linkedVideo = videos.find(v => v.id === n.videoId);
                        if (!linkedVideo) return null;
                        return (
                          <button
                            key={n.videoId}
                            onClick={() => {
                              handleWatchVideo(linkedVideo);
                              setSearchOpen(false);
                            }}
                            className="w-full p-2 hover:bg-purple-600/10 dark:hover:bg-purple-950/20 rounded flex flex-col transition-colors text-left"
                          >
                            <span className="text-xs font-semibold text-foreground">{linkedVideo.title}</span>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 italic">
                              "{n.content.substring(n.content.toLowerCase().indexOf(searchQuery.toLowerCase())).substring(0, 60)}..."
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Learning Paths Results */}
                  {results && results.paths.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase block px-1">Learning Paths</span>
                      {results.paths.map(p => (
                        <a
                          key={p.id}
                          href="#/paths"
                          onClick={() => {
                            setSearchOpen(false);
                          }}
                          className="w-full p-2 hover:bg-purple-600/10 dark:hover:bg-purple-950/20 rounded flex items-center justify-between group transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-foreground block truncate">{p.title}</span>
                            <span className="text-[9px] text-slate-600 dark:text-slate-400 truncate block mt-0.5">{p.description}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">Open Curriculum</span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
