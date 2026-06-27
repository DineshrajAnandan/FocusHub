import { useState, useEffect } from 'react';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './components/Dashboard';
import { WatchQueue } from './components/WatchQueue';
import { Categories } from './components/Categories';
import { LearningPaths } from './components/LearningPaths';
import { Settings } from './components/Settings';
import { FocusPlayer } from './components/FocusPlayer';
import { Playlists } from './components/Playlists';
import { Articles } from './components/Articles';
import { CommandPalette } from './components/CommandPalette';
import { useTheme } from './hooks/useTheme';
import { useHashRouter } from './hooks/useHashRouter';
import { useAppData } from './hooks/useAppData';
import type { Category, Note, LearningPath, LearningResource, Playlist } from './types';

// Tab type definition removed, imported via useHashRouter inside (or just use it here if we need it)
// We'll keep Tab here to avoid touching other files that might not be expecting it moved
type Tab = 'dashboard' | 'queue' | 'categories' | 'paths' | 'playlists' | 'articles' | 'settings';

function App() {
  const { route, navigateTo } = useHashRouter();
  const activeTab = route.activeTab;
  const activePlaylistId = route.activePlaylistId;
  const activeVideoId = route.activeVideoId;
  const { videos, categories, notes, paths, playlists, activeVideo, playlistContext, refreshData } = useAppData(activeVideoId);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);

  // Theme state
  const { theme, toggleTheme } = useTheme();

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

  const handleWatchVideo = (video: LearningResource) => {
    navigateTo(`#/watch/${video.id}`);
  };

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
                navigateTo(`#/playlists/${playlistContext.playlistId}`);
              } else {
                navigateTo(`#/${activeTab}`);
              }
            }}
            onWatchNext={(nextVideo) => {
              navigateTo(`#/watch/${nextVideo.id}`);
            }}
            onRefreshData={refreshData}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <MainLayout
        activeTab={activeTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setSearchOpen(true)}
        onNavigate={navigateTo}
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
              navigateTo(`#/playlists/${id}`);
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
      </MainLayout>

      {/* 3. GLOBAL COMMAND-PALETTE SEARCH MODAL (⌘K) */}
      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        videos={videos}
        categories={categories}
        paths={paths}
        notes={notes}
        onWatchVideo={handleWatchVideo}
      />
    </>
  );
}

export default App;
