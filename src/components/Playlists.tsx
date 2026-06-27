import React, { useState } from 'react';
import type { Playlist, Video, LearningResource } from '../types';
import { StorageService } from '../services/storage';
import { YoutubeService } from '../services/youtube';
import { 
  Play, Trash2, CheckCircle2, ListVideo, AlertTriangle, ArrowLeft, Plus, Loader
} from 'lucide-react';

interface PlaylistsProps {
  videos: LearningResource[];
  playlists: Playlist[];
  activePlaylistId: string | null;
  onSelectPlaylist: (id: string) => void;
  onWatchVideo: (video: LearningResource) => void;
  onRefreshData: () => void;
}

export const Playlists: React.FC<PlaylistsProps> = ({
  videos,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onWatchVideo,
  onRefreshData
}) => {
  // Derive activePlaylist from the URL-driven activePlaylistId prop
  const activePlaylist = activePlaylistId
    ? playlists.find(p => p.id === activePlaylistId) || null
    : playlists[0] || null;

  // Local-only state for add form
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Custom dialog state for deleting playlist
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);


  const handleAddPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await YoutubeService.resolvePlaylistVideos(playlistUrl);
      
      const newPlaylist: Playlist = {
        id: `pl-${Date.now()}`,
        youtubeId: data.youtubeId,
        title: data.title,
        description: data.description,
        videoIds: [],
        categoryName: 'General',
        priority: 'Medium',
        createdAt: new Date().toISOString()
      };

      // Import all individual video entities for the playlist
      for (const item of data.videos) {
        const videoId = `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const video: Video = {
          type: 'video',
          id: videoId,
          youtubeId: item.youtubeId,
          title: item.title,
          channel: item.channel,
          durationSeconds: item.durationSeconds,
          categoryName: 'General',
          priority: 'Medium',
          status: 'Planned',
          scheduleDate: null,
          completedAt: null,
          createdAt: new Date().toISOString()
        };
        await StorageService.saveVideo(video);
        newPlaylist.videoIds.push(videoId);
      }

      await StorageService.savePlaylist(newPlaylist);
      setPlaylistUrl('');
      setSuccess(`Successfully imported playlist "${data.title}" with ${data.videos.length} videos!`);
      // Navigate to the newly created playlist
      onSelectPlaylist(newPlaylist.id);
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to import playlist. Check playlist URL and settings API keys.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getPlaylistProgress = (playlist: Playlist) => {
    const playlistVideos = playlist.videoIds
      .map(id => videos.find(v => v.id === id))
      .filter((v): v is Video => !!v);

    const total = playlistVideos.length;
    const completed = playlistVideos.filter(v => v.status === 'Completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  };

  const handleDeletePlaylist = async () => {
    if (!playlistToDelete) return;

    try {
      await StorageService.deletePlaylist(playlistToDelete.id);
      for (const id of playlistToDelete.videoIds) {
        await StorageService.deleteVideo(id);
      }
      // Navigate back to the first remaining playlist or playlists root
      const remaining = playlists.filter(p => p.id !== playlistToDelete.id);
      if (remaining.length > 0) {
        onSelectPlaylist(remaining[0].id);
      } else {
        window.location.hash = '#/playlists';
      }
      setDeleteConfirmOpen(false);
      setPlaylistToDelete(null);
      setSuccess('Playlist deleted successfully!');
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete playlist.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4 text-left">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ListVideo className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          Imported Playlists
        </h1>
        <p className="text-xs text-slate-650 dark:text-slate-400 mt-1">
          Access your imported YouTube playlists, track video watch status, and study in the exact original sequence.
        </p>
      </div>

      {/* Import Playlist Form */}
      <div className="bg-card border border-border p-5 rounded-lg shadow-sm text-left">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Plus className="h-4.5 w-4.5 text-purple-650 dark:text-purple-400" />
          Import YouTube Playlist
        </h2>
        <form onSubmit={handleAddPlaylist} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="https://youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={e => setPlaylistUrl(e.target.value)}
              className="flex-1 bg-background border border-border rounded px-3 py-2 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !playlistUrl.trim()}
              className="bg-purple-650 hover:bg-purple-700 disabled:bg-purple-900/40 text-white font-bold py-2 px-5 rounded text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              {loading && <Loader className="h-3.5 w-3.5 animate-spin" />}
              {loading ? 'Importing...' : 'Import Playlist'}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded text-xs text-red-555 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Playlists Sidebar */}
        <div className={`space-y-3 bg-card border border-border p-4 rounded-lg h-fit text-left ${activePlaylist ? 'hidden lg:block' : 'block'}`}>
          <span className="text-xs font-bold text-slate-650 dark:text-slate-400 block uppercase tracking-wider">Playlists</span>
          {playlists.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No playlists imported yet. Use the form above to import a playlist.</p>
          ) : (
            <div className="space-y-2">
              {playlists.map(p => {
                const metrics = getPlaylistProgress(p);
                const isActive = activePlaylist?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlaylist(p.id)}
                    className={`w-full p-3.5 rounded-lg border text-left flex flex-col space-y-2 transition-all duration-200 ${
                      isActive 
                        ? 'border-purple-500 bg-purple-500/5 shadow-md shadow-purple-900/5' 
                        : 'border-border bg-background hover:bg-hover'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-xs text-foreground block line-clamp-2 leading-tight flex-1">{p.title}</span>
                    </div>
                    
                    {/* Completion Mini Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-slate-650 dark:text-slate-400">
                        <span>{metrics.percentage}% Watched</span>
                        <span>{metrics.completed}/{metrics.total} Videos</span>
                      </div>
                      <div className="w-full bg-input/30 h-1.5 rounded-full overflow-hidden border border-border/20">
                        <div 
                          className="bg-purple-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${metrics.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Playlist Videos Sequence */}
        <div className={`lg:col-span-3 space-y-4 ${!activePlaylist ? 'hidden lg:block' : 'block'}`}>
          {activePlaylist ? (
            <div className="space-y-4">
              {/* ── Playlist Hero Card ── */}
              {(() => {
                const progress = getPlaylistProgress(activePlaylist);
                const playlistVideos = activePlaylist.videoIds
                  .map(id => videos.find(v => v.id === id))
                  .filter((v): v is Video => !!v);
                const firstVideo = playlistVideos[0];
                const firstIncomplete = playlistVideos.find(v => v.status !== 'Completed');
                const heroThumb = firstVideo
                  ? `https://img.youtube.com/vi/${firstVideo.youtubeId}/maxresdefault.jpg`
                  : null;
                const totalSeconds = playlistVideos.reduce((acc, v) => acc + (v.durationSeconds || 0), 0);
                const remainingSeconds = playlistVideos
                  .filter(v => v.status !== 'Completed')
                  .reduce((acc, v) => acc + (v.durationSeconds || 0), 0);
                const fmtHours = (s: number) => {
                  const h = Math.floor(s / 3600);
                  const m = Math.floor((s % 3600) / 60);
                  return h > 0 ? `${h}h ${m}m` : `${m}m`;
                };

                return (
                  <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
                    {/* Blurred background thumbnail */}
                    {heroThumb && (
                      <div className="absolute inset-0">
                        <img
                          src={heroThumb}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm" />
                      </div>
                    )}
                    {!heroThumb && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/80 via-zinc-900 to-indigo-950/80" />
                    )}

                    {/* Gradient overlay from bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />

                    {/* Content */}
                    <div className="relative p-6 space-y-5">
                      {/* Top row: back button + delete */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => { window.location.hash = '#/playlists'; }}
                          className="lg:hidden flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          All Playlists
                        </button>
                        <div className="lg:hidden" />

                        <button
                          onClick={() => {
                            setPlaylistToDelete(activePlaylist);
                            setDeleteConfirmOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold transition-all"
                          title="Delete Playlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>

                      {/* Title + description */}
                      <div className="space-y-2">
                        <h2 className="text-xl font-black text-white leading-tight">
                          {activePlaylist.title}
                        </h2>
                        {activePlaylist.description && (
                          <p className="text-sm text-white/60 leading-relaxed line-clamp-2">
                            {activePlaylist.description}
                          </p>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                            <ListVideo className="h-4 w-4 text-purple-300" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 leading-none">Total</p>
                            <p className="text-sm font-bold text-white">{progress.total} videos</p>
                          </div>
                        </div>

                        <div className="w-px h-8 bg-white/10" />

                        <div className="flex items-center gap-1.5">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 leading-none">Completed</p>
                            <p className="text-sm font-bold text-white">{progress.completed} done</p>
                          </div>
                        </div>

                        <div className="w-px h-8 bg-white/10" />

                        <div className="flex items-center gap-1.5">
                          <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                            <Play className="h-4 w-4 text-violet-300" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 leading-none">Remaining</p>
                            <p className="text-sm font-bold text-white">{fmtHours(remainingSeconds)}</p>
                          </div>
                        </div>

                        <div className="w-px h-8 bg-white/10" />

                        <div className="flex items-center gap-1.5">
                          <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                            <Play className="h-3.5 w-3.5 text-slate-300" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 leading-none">Total length</p>
                            <p className="text-sm font-bold text-white">{fmtHours(totalSeconds)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50 font-medium">Progress</span>
                          <span className="text-purple-300 font-bold">{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-700"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Continue CTA */}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => {
                            const videoToWatch = firstIncomplete || playlistVideos[0];
                            if (videoToWatch) onWatchVideo(videoToWatch);
                          }}
                          disabled={!playlistVideos.length}
                          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-lg shadow-purple-900/40"
                        >
                          <Play className="h-4 w-4 fill-current" />
                          {progress.completed === 0 ? 'Start Playlist' : progress.percentage === 100 ? 'Rewatch from Start' : 'Continue Learning'}
                        </button>

                        {firstIncomplete && (
                          <p className="text-[11px] text-white/50">
                            Next up: <span className="text-white/80 font-semibold line-clamp-1 max-w-[200px] inline-block align-bottom">{firstIncomplete.title}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}


              {/* Videos List - RENDERED IN YouTube SEQUENTIAL ORDER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1 text-left">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Videos — YouTube Order
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                    ID: {activePlaylist.youtubeId}
                  </span>
                </div>

                {/* Overall progress bar */}
                <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 bg-zinc-800/50 dark:bg-zinc-700/30 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-violet-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${getPlaylistProgress(activePlaylist).percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-400 flex-shrink-0 w-10 text-right">
                    {getPlaylistProgress(activePlaylist).percentage}%
                  </span>
                </div>

                <div className="space-y-2">
                  {(() => {
                    const playlistVideos = activePlaylist.videoIds
                      .map(id => videos.find(v => v.id === id))
                      .filter((v): v is Video => !!v);

                    if (playlistVideos.length === 0) {
                      return (
                        <div className="bg-card border border-dashed border-border p-10 rounded-xl text-center text-slate-500">
                          <ListVideo className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-medium">No videos found for this playlist.</p>
                        </div>
                      );
                    }

                    return playlistVideos.map((video, index) => {
                      const isCompleted = video.status === 'Completed';
                      const thumb = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;

                      return (
                        <div
                          key={video.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 group ${
                            isCompleted
                              ? 'border-emerald-500/20 bg-emerald-500/5 opacity-75'
                              : 'border-border bg-card hover:border-purple-500/40 hover:shadow-md hover:shadow-purple-900/10'
                          }`}
                        >
                          {/* Index number */}
                          <span className="text-xs font-black text-slate-600 dark:text-slate-600 w-6 flex-shrink-0 text-center">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          {/* Thumbnail */}
                          <div className="relative w-28 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-zinc-900">
                            <img
                              src={thumb}
                              alt={video.title}
                              className={`object-cover w-full h-full transition-transform duration-300 ${!isCompleted ? 'group-hover:scale-105' : ''}`}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {isCompleted && (
                              <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 rounded">
                              {formatDuration(video.durationSeconds)}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-semibold leading-snug line-clamp-2 ${
                              isCompleted ? 'line-through text-slate-500' : 'text-foreground'
                            }`}>
                              {video.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{video.channel}</p>
                          </div>

                          {/* Status + CTA */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {isCompleted ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 font-bold">
                                ✓ Done
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 font-bold">
                                Planned
                              </span>
                            )}
                            <button
                              onClick={() => onWatchVideo(video)}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 px-3 rounded-lg text-[10px] flex items-center gap-1 transition-all"
                            >
                              <Play className="h-2.5 w-2.5 fill-current" />
                              {isCompleted ? 'Rewatch' : 'Watch'}
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

          ) : (
            <div className="bg-card border border-border p-12 rounded-lg text-center text-slate-500">
              Select a playlist from the sidebar to inspect its sequence.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && playlistToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full p-6 space-y-4 shadow-xl text-left">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Playlist?
            </h3>
            
            <p className="text-xs text-slate-655 dark:text-slate-400 leading-relaxed">
              This will delete the playlist <strong>"{playlistToDelete.title}"</strong> and all of its associated video entities. This action is permanent.
            </p>

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setPlaylistToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-400 hover:bg-hover rounded font-semibold border"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlaylist}
                className="px-3.5 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded font-bold transition-all shadow-md"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
