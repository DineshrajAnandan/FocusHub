import { useState, useEffect } from 'react';

export type Tab = 'dashboard' | 'queue' | 'categories' | 'paths' | 'playlists' | 'articles' | 'settings';

export interface RouteState {
  activeTab: Tab;
  activeVideoId: string | null;
  activePlaylistId: string | null;
}

export function useHashRouter() {
  const [route, setRoute] = useState<RouteState>({
    activeTab: 'dashboard',
    activeVideoId: null,
    activePlaylistId: null
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (hash.startsWith('#/watch/')) {
        const resourceId = hash.replace('#/watch/', '');
        setRoute({
          activeTab: route.activeTab, // keep current tab behind video
          activeVideoId: resourceId,
          activePlaylistId: route.activePlaylistId
        });
      } else if (hash.startsWith('#/playlists/')) {
        const playlistId = hash.replace('#/playlists/', '');
        setRoute({
          activeTab: 'playlists',
          activeVideoId: null,
          activePlaylistId: playlistId
        });
      } else {
        const tab = hash.replace('#/', '') as Tab;
        const validTabs: Tab[] = ['dashboard', 'queue', 'categories', 'paths', 'playlists', 'articles', 'settings'];
        
        if (validTabs.includes(tab)) {
          setRoute({
            activeTab: tab,
            activeVideoId: null,
            activePlaylistId: tab === 'playlists' ? route.activePlaylistId : null
          });
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
  }, [route.activeTab, route.activePlaylistId]);

  const navigateTo = (path: string) => {
    window.location.hash = path;
  };

  return { route, navigateTo };
}
