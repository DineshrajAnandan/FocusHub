import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage';
import type { Category, Note, LearningPath, LearningResource, Playlist } from '../types';

export interface PlaylistContext {
  playlistId: string;
  playlistTitle: string;
  nextVideo: LearningResource | null;
}

export function useAppData(activeVideoId: string | null) {
  const [videos, setVideos] = useState<LearningResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeVideo, setActiveVideo] = useState<LearningResource | null>(null);
  const [playlistContext, setPlaylistContext] = useState<PlaylistContext | null>(null);

  const refreshData = useCallback(async () => {
    const vids = await StorageService.getVideos();
    const arts = await StorageService.getArticles();
    const cats = await StorageService.getCategories();
    const nts = await StorageService.getNotes();
    const pths = await StorageService.getLearningPaths();
    const pls = await StorageService.getPlaylists();

    const combined: LearningResource[] = [
      ...vids.map(v => ({ ...v, type: 'video' as const })),
      ...arts.map(a => ({ ...a, type: 'article' as const }))
    ];

    setVideos(combined);
    setCategories(cats);
    setNotes(nts);
    setPaths(pths);
    setPlaylists(pls);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const syncActiveVideo = async () => {
      if (!activeVideoId) {
        setActiveVideo(null);
        setPlaylistContext(null);
        return;
      }
      
      const vids = await StorageService.getVideos();
      const arts = await StorageService.getArticles();
      const pls = await StorageService.getPlaylists();
      const combined: LearningResource[] = [
        ...vids.map(v => ({ ...v, type: 'video' as const })),
        ...arts.map(a => ({ ...a, type: 'article' as const }))
      ];

      const found = combined.find(r => r.id === activeVideoId);
      if (found) {
        let activeResource = found;
        if (found.status === 'Planned') {
          const updated = { ...found, status: 'In Progress' as const };
          if (updated.type === 'video') {
            await StorageService.updateVideo(updated);
          } else {
            await StorageService.updateArticle(updated);
          }
          activeResource = updated;
          refreshData(); // Refresh list to reflect status change
        }

        const ownerPlaylist = pls.find(pl => pl.videoIds.includes(found.id));
        if (ownerPlaylist) {
          const idx = ownerPlaylist.videoIds.indexOf(found.id);
          const nextId = ownerPlaylist.videoIds[idx + 1];
          const nextVideo = nextId ? combined.find(r => r.id === nextId) || null : null;
          setPlaylistContext({ playlistId: ownerPlaylist.id, playlistTitle: ownerPlaylist.title, nextVideo });
        } else {
          setPlaylistContext(null);
        }

        setActiveVideo(activeResource);
      }
    };

    syncActiveVideo();
  }, [activeVideoId, refreshData]);

  return {
    videos,
    categories,
    notes,
    paths,
    playlists,
    activeVideo,
    playlistContext,
    refreshData
  };
}
