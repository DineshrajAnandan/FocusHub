import React, { useState } from 'react';
import type { Category, LearningResource, Article } from '../types';
import { StorageService } from '../services/storage';
import { 
  Plus, Check, Code, Cpu, Music, Activity, BookOpen, Film, Landmark, MessageSquare,
  AlertCircle, Trash2, Play, CheckCircle2, Clock, ChevronRight, Folder
} from 'lucide-react';

interface CategoriesProps {
  categories: Category[];
  videos: LearningResource[];
  onRefreshData: () => void;
  onWatchVideo?: (video: LearningResource) => void;
}

const PALETTE = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#3b82f6', '#ef4444', '#64748b'];

const ICON_MAP: { [key: string]: any } = {
  Code, Cpu, Music, Activity, BookOpen, Film, Landmark, MessageSquare, Folder
};

const STATUS_CONFIG = {
  Completed: { label: 'Completed', classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  'In Progress': { label: 'In Progress', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  Planned: { label: 'Planned', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  Skipped: { label: 'Skipped', classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};

export const Categories: React.FC<CategoriesProps> = ({
  categories,
  videos,
  onRefreshData,
  onWatchVideo
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [iconName, setIconName] = useState('Code');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleDeleteCategory = async (catName: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${catName}"? All videos and playlists in this category will be migrated to the default "General" category.`)) {
      await StorageService.deleteCategory(catName);
      if (selectedCategory === catName) setSelectedCategory(null);
      onRefreshData();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('A category with this name already exists.');
      return;
    }

    const newCat: Category = {
      name: name.trim(),
      color,
      icon: iconName,
      description: description.trim()
    };

    await StorageService.saveCategory(newCat);
    setName('');
    setDescription('');
    setError('');
    setShowCreateForm(false);
    onRefreshData();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Determine which videos to display
  const displayedVideos = selectedCategory
    ? videos.filter(v => v.categoryName === selectedCategory)
    : videos;

  const activeCat = selectedCategory
    ? categories.find(c => c.name === selectedCategory)
    : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4 text-left flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories & Subjects</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Group your learning assets into dedicated focus areas. Click a category to view its videos.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(v => !v)}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Category
        </button>
      </div>

      {/* Create Category Inline Form */}
      {showCreateForm && (
        <div className="bg-card border border-border p-5 rounded-lg shadow-md space-y-4 text-left animate-in fade-in">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Create New Category
          </h2>
          <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Name</label>
              <input
                type="text"
                placeholder="e.g. FAANG Interview Prep"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={30}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <input
                type="text"
                placeholder="What do you plan to learn here?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={100}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Theme Color</label>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map(c => (
                  <button
                    key={c} type="button" onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-full border border-black/30 flex items-center justify-center transition-transform hover:scale-105"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="h-3 w-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Category Icon</label>
              <div className="flex flex-wrap gap-2 bg-background p-2 border border-border rounded">
                {Object.keys(ICON_MAP).map(key => {
                  const Icon = ICON_MAP[key];
                  return (
                    <button
                      key={key} type="button" onClick={() => setIconName(key)}
                      className={`p-1.5 rounded border transition-colors ${
                        iconName === key
                          ? 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-500/5'
                          : 'border-transparent text-slate-600 hover:text-foreground dark:text-slate-400 hover:bg-hover'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              {error && (
                <div className="flex-1 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded text-xs text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setError(''); }}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-foreground border border-border rounded hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Category Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {/* "All" pill */}
        <button
          onClick={() => setSelectedCategory(null)}
          className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-2 ${
            selectedCategory === null
              ? 'border-purple-500 bg-purple-600/10'
              : 'border-border bg-card hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-1.5 rounded border ${selectedCategory === null ? 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'border-border bg-background text-slate-600 dark:text-slate-500'}`}>
              <Folder className="h-4 w-4" />
            </div>
            {selectedCategory === null && <ChevronRight className="h-3.5 w-3.5 text-purple-700 dark:text-purple-400" />}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">All Videos</p>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">{videos.length} total</p>
          </div>
        </button>

        {categories.map(cat => {
          const catVideos = videos.filter(v => v.categoryName === cat.name);
          const completed = catVideos.filter(v => v.status === 'Completed').length;
          const percent = catVideos.length > 0 ? Math.round((completed / catVideos.length) * 100) : 0;
          const Icon = ICON_MAP[cat.icon] || Code;
          const isSelected = selectedCategory === cat.name;

          return (
            <div key={cat.name} className="relative group">
              <button
                onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                className={`w-full p-3 rounded-lg border text-left transition-all flex flex-col gap-2 ${
                  isSelected
                    ? 'border-2 bg-card/80'
                    : 'border-border bg-card hover:bg-card/80'
                }`}
                style={isSelected ? { borderColor: cat.color } : {}}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="p-1.5 rounded border"
                    style={{ color: cat.color, borderColor: `${cat.color}30`, backgroundColor: `${cat.color}10` }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {isSelected && <ChevronRight className="h-3.5 w-3.5" style={{ color: cat.color }} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground truncate">{cat.name}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">{catVideos.length} videos • {percent}%</p>
                </div>
                {/* Mini progress bar */}
                <div className="w-full bg-background h-1 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: cat.color }} />
                </div>
              </button>

              {/* Delete button (visible on hover, hidden for General) */}
              {cat.name.toLowerCase() !== 'general' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.name); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-600 dark:text-slate-400 hover:bg-hover p-1 rounded transition-all bg-card border border-border"
                  title="Delete Category"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Videos Section */}
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          {activeCat ? (
            <>
              <div
                className="p-1 rounded border"
                style={{ color: activeCat.color, borderColor: `${activeCat.color}30`, backgroundColor: `${activeCat.color}10` }}
              >
                {React.createElement(ICON_MAP[activeCat.icon] || Code, { className: 'h-3.5 w-3.5' })}
              </div>
              <h2 className="text-sm font-bold text-foreground">{activeCat.name}</h2>
            </>
          ) : (
            <>
              <Folder className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-foreground">All Videos</h2>
            </>
          )}
          <span className="text-xs text-slate-650 dark:text-slate-400 ml-1">
            ({displayedVideos.length} video{displayedVideos.length !== 1 ? 's' : ''})
          </span>
        </div>

        {displayedVideos.length === 0 ? (
          <div className="text-center py-12 border border-border border-dashed rounded-lg text-slate-600 dark:text-slate-400">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No videos in this category yet.</p>
            <p className="text-xs mt-1">Add videos from the Dashboard tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedVideos.map(video => {
              const cat = categories.find(c => c.name === video.categoryName);
              const statusCfg = STATUS_CONFIG[video.status] || STATUS_CONFIG.Planned;
              const durationFmt = video.type === 'article' ? 'Article' : formatDuration(video.durationSeconds || 0);

              return (
                <div
                  key={video.id}
                  className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm hover:border-purple-500/30 hover:shadow-md transition-all duration-200 group text-left"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-900 flex-shrink-0">
                    {video.type === 'article' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/10 to-indigo-900/10 text-purple-700 dark:text-purple-400">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    ) : (
                      <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                        alt={video.title}
                        className="object-cover w-full h-full"
                      />
                    )}
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] font-bold text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                      {video.type === 'article' ? (
                        <BookOpen className="h-2.5 w-2.5" />
                      ) : (
                        <Clock className="h-2.5 w-2.5" />
                      )}
                      {durationFmt}
                    </span>
                    {video.status === 'Completed' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      </div>
                    )}
                    {/* Hover play overlay */}
                    {onWatchVideo && video.status !== 'Completed' && (
                      <button
                        onClick={() => onWatchVideo(video)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <div className="bg-purple-600 rounded-full p-3 flex items-center justify-center">
                          {video.type === 'article' ? (
                            <BookOpen className="h-5 w-5 text-white" />
                          ) : (
                            <Play className="h-5 w-5 text-white fill-current" />
                          )}
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{video.title}</h4>
                    <p className="text-[10px] text-slate-650 dark:text-slate-400 truncate">
                      {video.type === 'video' ? video.channel : video.source}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                      {/* Category selector badge */}
                      <select
                        value={video.categoryName}
                        onChange={async (e) => {
                          const updated = { ...video, categoryName: e.target.value };
                          if (updated.type === 'video') {
                            await StorageService.updateVideo(updated);
                          } else {
                            await StorageService.updateArticle(updated as Article);
                          }
                          onRefreshData();
                        }}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-transparent cursor-pointer focus:outline-none max-w-[100px] truncate"
                        style={{ color: cat?.color || '#a78bfa', borderColor: `${cat?.color || '#a78bfa'}30`, backgroundColor: `${cat?.color || '#a78bfa'}10` }}
                      >
                        {categories.map(c => (
                          <option key={c.name} value={c.name} className="text-foreground bg-background">{c.name}</option>
                        ))}
                      </select>
                      {/* Status badge */}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusCfg.classes}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
