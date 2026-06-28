import React, { useState, useEffect } from 'react';
import type { Video, Category, PriorityLevel, LearningResource, Article } from '../types';
import { StorageService } from '../services/storage';
import { YoutubeService } from '../services/youtube';
import {
  Play, Trash2, BookOpen, Plus, Loader, AlertCircle, CheckCircle2, PlayCircle, ExternalLink
} from 'lucide-react';

interface WatchQueueProps {
  videos: LearningResource[];
  categories: Category[];
  onWatchVideo: (video: LearningResource) => void;
  onRefreshData: () => void;
}

export const WatchQueue: React.FC<WatchQueueProps> = ({
  videos,
  categories,
  onWatchVideo,
  onRefreshData
}) => {
  const [playlistVideoIds, setPlaylistVideoIds] = useState<Set<string>>(new Set());

  // Quick Add Video states
  const [addMode, setAddMode] = useState<'url' | 'search'>('url');
  const [url, setUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || 'General');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>('Medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setHasApiKey(!!YoutubeService.getApiKey());
    if (categories.length > 0) {
      setSelectedCategory(prev =>
        categories.some(c => c.name === prev) ? prev : categories[0].name
      );
    }
  }, [categories]);

  useEffect(() => {
    StorageService.getPlaylists().then(playlists => {
      const ids = new Set<string>();
      playlists.forEach(pl => pl.videoIds.forEach(id => ids.add(id)));
      setPlaylistVideoIds(ids);
    });
  }, [videos]);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (categories.length === 0) { setError('Please create a category first.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const metadata = await YoutubeService.resolveVideoMetadata(url);
      const newVideo: Video = {
        type: 'video',
        id: `vid-${Date.now()}`,
        youtubeId: metadata.youtubeId,
        title: metadata.title,
        channel: metadata.channel,
        durationSeconds: metadata.durationSeconds,
        categoryName: selectedCategory || categories[0].name,
        priority: selectedPriority,
        status: 'Planned',
        scheduleDate: new Date().toISOString().split('T')[0],
        completedAt: null,
        createdAt: new Date().toISOString()
      };
      await StorageService.saveVideo(newVideo);
      setUrl('');
      setSuccess(`✓ Added "${metadata.title}"`);
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve video. Check your API key in Settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !hasApiKey) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setSearchResults([]);
    try {
      const results = await YoutubeService.searchVideos(searchQuery);
      setSearchResults(results);
      if (results.length === 0) setError('No videos found for this query.');
    } catch (err: any) {
      setError(err.message || 'YouTube search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSearchResult = async (item: any) => {
    setAddingId(item.youtubeId);
    setError('');
    try {
      const details = await YoutubeService.resolveVideoMetadata(
        `https://www.youtube.com/watch?v=${item.youtubeId}`
      );
      const newVideo: Video = {
        type: 'video',
        id: `vid-${Date.now()}`,
        youtubeId: item.youtubeId,
        title: item.title,
        channel: item.channel,
        durationSeconds: details.durationSeconds || 1200,
        categoryName: selectedCategory || categories[0]?.name || 'General',
        priority: selectedPriority,
        status: 'Planned',
        scheduleDate: new Date().toISOString().split('T')[0],
        completedAt: null,
        createdAt: new Date().toISOString()
      };
      await StorageService.saveVideo(newVideo);
      setAddedIds(prev => new Set([...prev, item.youtubeId]));
      setSuccess(`✓ Added "${item.title}"`);
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to add video.');
    } finally {
      setAddingId(null);
    }
  };

  const activeVideos = videos.filter(
    v => v.status !== 'Completed' && v.status !== 'Skipped' && !playlistVideoIds.has(v.id)
  );

  const handleUpdatePriority = async (resource: LearningResource, newPriority: PriorityLevel) => {
    const updated = { ...resource, priority: newPriority };
    if (updated.type === 'video') await StorageService.updateVideo(updated);
    else await StorageService.updateArticle(updated as Article);
    onRefreshData();
  };

  const handleUpdateCategory = async (resource: LearningResource, newCategory: string) => {
    const updated = { ...resource, categoryName: newCategory };
    if (updated.type === 'video') await StorageService.updateVideo(updated);
    else await StorageService.updateArticle(updated as Article);
    onRefreshData();
  };

  const handleDeleteVideo = async (resource: LearningResource) => {
    if (window.confirm('Delete this item?')) {
      if (resource.type === 'video') await StorageService.deleteVideo(resource.id);
      else await StorageService.deleteArticle(resource.id);
      onRefreshData();
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const highPriority = activeVideos.filter(v => v.priority === 'High');
  const mediumPriority = activeVideos.filter(v => v.priority === 'Medium');
  const lowPriority = activeVideos.filter(v => v.priority === 'Low');

  // ─── Shared selectors for category + priority in the add form ───
  const renderCategoryPrioritySelectors = () => (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Category</span>
        {categories.length === 0 ? (
          <span className="text-red-500 text-[10px] font-bold">Create category first</span>
        ) : (
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-purple-500"
          >
            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Priority</span>
        <select
          value={selectedPriority}
          onChange={e => setSelectedPriority(e.target.value as PriorityLevel)}
          className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-purple-500"
        >
          <option value="High">🔥 High</option>
          <option value="Medium">⚡ Medium</option>
          <option value="Low">💤 Low</option>
        </select>
      </div>
    </div>
  );

  // ─── Priority Lane Card ───
  const renderVideoCard = (resource: LearningResource) => {
    const category = categories.find(c => c.name === resource.categoryName);
    const isVideo = resource.type === 'video';
    const thumbUrl = isVideo
      ? `https://img.youtube.com/vi/${(resource as Video).youtubeId}/mqdefault.jpg`
      : null;

    return (
      <div key={resource.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col group hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-200">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden flex-shrink-0">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={resource.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-indigo-900/20 text-purple-400">
              <BookOpen className="h-10 w-10" />
            </div>
          )}
          {/* Duration badge */}
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {isVideo ? formatDuration((resource as Video).durationSeconds || 0) : 'Article'}
          </span>
          {/* Category pill */}
          <span
            className="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{
              color: category?.color || '#a78bfa',
              backgroundColor: `${category?.color || '#a78bfa'}25`,
              border: `1px solid ${category?.color || '#a78bfa'}40`
            }}
          >
            {resource.categoryName}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-3 gap-2">
          <h4 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug">
            {resource.title}
          </h4>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
            {isVideo ? (resource as Video).channel : (resource as Article).source}
          </p>

          {/* Actions */}
          <div className="mt-auto pt-2 border-t border-border flex items-center justify-between gap-2">
            <select
              value={resource.priority}
              onChange={e => handleUpdatePriority(resource, e.target.value as PriorityLevel)}
              className="bg-background border border-border text-foreground rounded text-[10px] px-1.5 py-0.5 focus:outline-none"
            >
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Med</option>
              <option value="Low">💤 Low</option>
            </select>

            <select
              value={resource.categoryName}
              onChange={e => handleUpdateCategory(resource, e.target.value)}
              className="bg-background border border-border text-foreground rounded text-[10px] px-1.5 py-0.5 focus:outline-none max-w-[80px] truncate"
            >
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => handleDeleteVideo(resource)}
              className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10 flex-shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => onWatchVideo(resource)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {isVideo ? (
              <><Play className="h-3.5 w-3.5 fill-current" /> Watch Now</>
            ) : (
              <><BookOpen className="h-3.5 w-3.5" /> Read Now</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ─── Lane wrapper ───
  const laneConfig = [
    { label: '🔥 High', items: highPriority, accent: 'border-red-500/30 bg-red-500/5', badgeColor: 'text-red-600 dark:text-red-400 bg-red-500/15' },
    { label: '⚡ Medium', items: mediumPriority, accent: 'border-orange-500/30 bg-orange-500/5', badgeColor: 'text-orange-600 dark:text-orange-400 bg-orange-500/15' },
    { label: '💤 Low', items: lowPriority, accent: 'border-slate-500/20 bg-slate-500/5', badgeColor: 'text-slate-600 dark:text-slate-400 bg-slate-500/15' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">Priority Queue</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Import YouTube videos, search directly, and manage your learning backlog by priority.
        </p>
      </div>

      {/* ── Add / Search Panel ── */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Tab header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-red-500" />
            Add YouTube Videos
          </h2>
          <div className="flex bg-background border border-border rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => { setAddMode('url'); setError(''); setSuccess(''); setSearchResults([]); }}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                addMode === 'url'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Add by URL
            </button>
            <button
              onClick={() => { setAddMode('search'); setError(''); setSuccess(''); }}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                addMode === 'search'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Search YouTube
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {addMode === 'url' ? (
            /* ── Add by URL form ── */
            <form onSubmit={handleAddVideo} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 flex-shrink-0"
                >
                  {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Import Video
                </button>
              </div>
              {renderCategoryPrioritySelectors()}
            </form>
          ) : (
            /* ── Search YouTube ── */
            <div className="space-y-4">
              {!hasApiKey ? (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">YouTube API Key Required</p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-500/80">
                      Add a Google Data API v3 key in{' '}
                      <a href="#/settings" className="underline font-bold text-purple-500">Settings</a>{' '}
                      to enable YouTube searching.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSearchYoutube} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Search for tutorials, lectures, talks..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading || !searchQuery.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Search'}
                  </button>
                </form>
              )}

              {/* Category + Priority selectors shown even during search */}
              {hasApiKey && renderCategoryPrioritySelectors()}

              {/* Search Results Grid */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {searchResults.length} results for "{searchQuery}"
                    </p>
                    <button
                      onClick={() => setSearchResults([])}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResults.map(item => {
                      const isAdded = addedIds.has(item.youtubeId);
                      const isAdding = addingId === item.youtubeId;
                      // Use thumbnailUrl (the correct field from YoutubeService.searchVideos)
                      const thumb = item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`;

                      return (
                        <div
                          key={item.youtubeId}
                          className={`bg-background border rounded-xl overflow-hidden flex flex-col transition-all ${
                            isAdded ? 'border-emerald-500/40 opacity-75' : 'border-border hover:border-purple-500/40'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden flex-shrink-0">
                            <img
                              src={thumb}
                              alt={item.title}
                              className="object-cover w-full h-full"
                              onError={e => {
                                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`;
                              }}
                            />
                            <a
                              href={`https://youtube.com/watch?v=${item.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 rounded p-1 transition-colors"
                              title="Preview on YouTube"
                            >
                              <ExternalLink className="h-3 w-3 text-white" />
                            </a>
                          </div>

                          {/* Details + CTA */}
                          <div className="p-3 flex flex-col flex-1 gap-2">
                            <div className="min-w-0">
                              <h4 className="text-[12px] font-semibold text-foreground line-clamp-2 leading-snug">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.channel}</p>
                            </div>

                            <button
                              onClick={() => handleAddSearchResult(item)}
                              disabled={isAdded || isAdding}
                              className={`mt-auto w-full py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                                isAdded
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white'
                              }`}
                            >
                              {isAdding ? (
                                <><Loader className="h-3 w-3 animate-spin" /> Adding…</>
                              ) : isAdded ? (
                                <><CheckCircle2 className="h-3 w-3" /> Added</>
                              ) : (
                                <><Plus className="h-3 w-3" /> Add to Queue</>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status messages */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Priority Lanes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {laneConfig.map(({ label, items, accent, badgeColor }) => (
          <div
            key={label}
            className={`border rounded-xl p-4 space-y-3 ${accent}`}
          >
            {/* Lane header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">{label}</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-0.5">
              {items.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="h-10 w-10 rounded-full border-2 border-dashed border-border flex items-center justify-center text-lg opacity-40">
                    +
                  </div>
                  <p className="text-xs font-medium">No items here</p>
                  <p className="text-[10px] text-center opacity-60">
                    Add videos above and assign this priority level.
                  </p>
                </div>
              ) : (
                items.map(video => renderVideoCard(video))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
