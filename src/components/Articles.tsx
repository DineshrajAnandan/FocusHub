import React, { useState, useEffect } from 'react';
import type { Category, Article, PriorityLevel, VideoStatus, LearningResource } from '../types';
import { StorageService } from '../services/storage';
import { 
  BookOpen, Trash2, AlertCircle, CheckCircle2, Loader
} from 'lucide-react';

interface ArticlesProps {
  videos: LearningResource[]; // combined list (contains articles)
  categories: Category[];
  onWatchVideo: (video: LearningResource) => void;
  onRefreshData: () => void;
}

export const Articles: React.FC<ArticlesProps> = ({
  videos,
  categories,
  onWatchVideo,
  onRefreshData
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | VideoStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | PriorityLevel>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | string>('All');

  // Add Article state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'General');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Set default category when categories updates
  useEffect(() => {
    if (categories.length > 0 && (!category || category === 'General' && !categories.some(c => c.name === 'General'))) {
      setCategory(categories[0].name);
    }
  }, [categories]);

  // Filter only article types
  const articles = videos.filter((v): v is Article => v.type === 'article');

  // Apply filters
  const filteredArticles = articles.filter(art => {
    const matchStatus = statusFilter === 'All' || art.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || art.priority === priorityFilter;
    const matchCategory = categoryFilter === 'All' || art.categoryName === categoryFilter;
    return matchStatus && matchPriority && matchCategory;
  });

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) {
      setError('Please enter both URL and Title.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let finalSource = source.trim();
      if (!finalSource) {
        try {
          const parsed = new URL(url.trim());
          finalSource = parsed.hostname.replace('www.', '');
        } catch (err) {
          finalSource = 'Web Resource';
        }
      }

      const newArticle: Article = {
        type: 'article',
        id: `art-${Date.now()}`,
        url: url.trim(),
        title: title.trim(),
        source: finalSource,
        categoryName: category || categories[0]?.name || 'General',
        priority: priority,
        status: 'Planned',
        scheduleDate: new Date().toISOString().split('T')[0], // Scheduled for today by default
        completedAt: null,
        createdAt: new Date().toISOString()
      };

      await StorageService.saveArticle(newArticle);
      setUrl('');
      setTitle('');
      setSource('');
      setSuccess(`Article "${title}" added successfully!`);
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to add article.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriority = async (art: Article, newPriority: PriorityLevel) => {
    await StorageService.updateArticle({ ...art, priority: newPriority });
    onRefreshData();
  };

  const handleUpdateCategory = async (art: Article, newCategory: string) => {
    await StorageService.updateArticle({ ...art, categoryName: newCategory });
    onRefreshData();
  };

  const handleUpdateStatus = async (art: Article, newStatus: VideoStatus) => {
    const updated: Article = {
      ...art,
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : null
    };
    await StorageService.updateArticle(updated);
    onRefreshData();
  };

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      await StorageService.deleteArticle(id);
      onRefreshData();
    }
  };

  // Stats calculation
  const totalCount = articles.length;
  const plannedCount = articles.filter(a => a.status === 'Planned').length;
  const inProgressCount = articles.filter(a => a.status === 'In Progress').length;
  const completedCount = articles.filter(a => a.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles & Bookmarks</h1>
          <p className="text-xs text-slate-650 dark:text-slate-400 mt-1">Read, annotate, and track articles from around the web without distraction.</p>
        </div>
      </div>

      {/* Add Article Form */}
      <div className="bg-card border border-border p-5 rounded-lg shadow-sm text-left">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
          <BookOpen className="h-4.5 w-4.5 text-purple-655 dark:text-purple-400" />
          Bookmark New Article
        </h2>
        <form onSubmit={handleAddArticle} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Article URL</label>
              <input 
                type="text" 
                placeholder="https://example.com/article..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Title</label>
              <input 
                type="text" 
                placeholder="Article Title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Source / Author (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Medium, Dev.to"
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-650 dark:text-slate-400">Category:</span>
                {categories.length === 0 ? (
                  <span className="text-[10px] text-red-500 font-bold">Create a category first</span>
                ) : (
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="bg-background border border-border text-foreground rounded text-xs px-2.5 py-1 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-655 dark:text-slate-400">Priority:</span>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as PriorityLevel)}
                  className="bg-background border border-border text-foreground rounded text-xs px-2.5 py-1 focus:outline-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-purple-650 hover:bg-purple-700 text-white font-bold py-1.5 px-4 rounded text-xs transition-all shadow-sm flex items-center gap-1"
            >
              {loading && <Loader className="h-3.5 w-3.5 animate-spin" />}
              Save Article
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded text-xs text-red-555 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg text-left shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block tracking-wider">Total Articles</span>
          <span className="text-2xl font-black text-foreground mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg text-left shadow-sm">
          <span className="text-[10px] uppercase font-bold text-purple-750 dark:text-purple-400 block tracking-wider">Planned</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">{plannedCount}</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg text-left shadow-sm">
          <span className="text-[10px] uppercase font-bold text-blue-705 dark:text-blue-450 block tracking-wider">Reading</span>
          <span className="text-2xl font-black text-blue-500 mt-1 block">{inProgressCount}</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-lg text-left shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-705 dark:text-emerald-400 block tracking-wider">Completed</span>
          <span className="text-2xl font-black text-emerald-500 mt-1 block">{completedCount}</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-card border border-border p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1 bg-input/20 border border-border rounded p-0.5">
          {(['All', 'Planned', 'In Progress', 'Completed', 'Skipped'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                statusFilter === status 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-700 dark:text-slate-400 hover:text-foreground hover:bg-hover'
              }`}
            >
              {status === 'In Progress' ? 'Reading' : status}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-650 dark:text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-background border border-border text-foreground rounded text-xs px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-655 dark:text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="bg-background border border-border text-foreground rounded text-xs px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-card border border-border border-dashed p-12 rounded-lg text-center text-slate-600 dark:text-slate-400">
          <BookOpen className="h-10 w-10 mx-auto mb-2 text-purple-650 dark:text-purple-400 opacity-60" />
          <p className="font-semibold text-sm">No articles matched your filters.</p>
          <p className="text-xs text-slate-650 dark:text-slate-400 mt-1">Try changing your filters or add a new article in the form above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredArticles.map(art => {
            const cat = categories.find(c => c.name === art.categoryName);
            return (
              <div 
                key={art.id} 
                className="bg-card border border-border hover:border-purple-900/40 p-4 rounded-lg shadow-sm flex flex-col justify-between gap-4 transition-all duration-200 hover:scale-[1.01] text-left"
              >
                <div className="space-y-3">
                  {/* Article Thumbnail */}
                  <div className="relative aspect-video w-full rounded overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-900/5 to-indigo-900/5 border border-border/40 flex items-center justify-center text-purple-700 dark:text-purple-400">
                    <BookOpen className="h-10 w-10 animate-pulse" />
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[8px] font-bold text-white px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                      Article
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug h-10" title={art.title}>
                      {art.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-slate-655 dark:text-slate-400 truncate max-w-[120px] font-bold">{art.source}</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      
                      {/* Interactive category dropdown */}
                      <select
                        value={art.categoryName}
                        onChange={(e) => handleUpdateCategory(art, e.target.value)}
                        className="px-1.5 py-0.5 rounded text-[8px] font-bold border bg-transparent cursor-pointer focus:outline-none max-w-[100px] truncate"
                        style={{ 
                          color: cat?.color || '#a78bfa', 
                          borderColor: `${cat?.color}30` || '#a78bfa30',
                          backgroundColor: `${cat?.color}10` || '#a78bfa10'
                        }}
                        title="Change Category"
                      >
                        {categories.map(c => (
                          <option key={c.name} value={c.name} className="text-foreground bg-background">{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer buttons and actions */}
                <div className="space-y-2 pt-2 border-t border-border mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {/* Priority selector */}
                      <select
                        value={art.priority}
                        onChange={(e) => handleUpdatePriority(art, e.target.value as PriorityLevel)}
                        className="bg-background border border-border rounded px-1.5 py-0.5 text-[9px] text-slate-650 dark:text-slate-400 focus:outline-none"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>

                      {/* Status selector */}
                      <select
                        value={art.status}
                        onChange={(e) => handleUpdateStatus(art, e.target.value as VideoStatus)}
                        className="bg-background border border-border rounded px-1.5 py-0.5 text-[9px] text-slate-655 dark:text-slate-400 focus:outline-none"
                      >
                        <option value="Planned">Planned</option>
                        <option value="In Progress">Reading</option>
                        <option value="Completed">Completed</option>
                        <option value="Skipped">Skipped</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleDeleteArticle(art.id)}
                      className="text-slate-655 hover:text-red-400 transition-colors p-1"
                      title="Delete Article"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Primary CTA */}
                  <button 
                    onClick={() => onWatchVideo(art)}
                    className="w-full bg-purple-650 hover:bg-purple-700 text-white font-semibold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Read in Focus Mode
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
