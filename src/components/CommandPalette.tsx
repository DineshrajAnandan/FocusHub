import React, { useState, useEffect } from 'react';
import { Search, X, Keyboard, Play } from 'lucide-react';
import type { Category, Note, LearningPath, LearningResource } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  videos: LearningResource[];
  categories: Category[];
  paths: LearningPath[];
  notes: Note[];
  onWatchVideo: (video: LearningResource) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  videos,
  categories,
  paths,
  notes,
  onWatchVideo
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Clear query when closed
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
      <div className="fixed inset-0" onClick={onClose}></div>

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
            onClick={onClose}
            className="p-1 hover:bg-hover rounded text-slate-500 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results lists */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {!searchQuery.trim() ? (
            <div className="text-center py-10 space-y-2">
              <Keyboard className="h-8 w-8 mx-auto text-slate-500 dark:text-slate-400" />
              <p className="text-xs text-slate-700 dark:text-slate-400 font-semibold">Search FocusHub global index</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Type matching keywords above. Press ESC to exit.</p>
            </div>
          ) : (
            <>
              {/* If total zero matches */}
              {results &&
                results.videos.length === 0 &&
                results.categories.length === 0 &&
                results.paths.length === 0 &&
                results.notes.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-600 dark:text-slate-400">
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
                      onClick={onClose}
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
                  {results.videos.map(v => (
                    <button
                      key={v.id}
                      onClick={() => {
                        onWatchVideo(v);
                        onClose();
                      }}
                      className="w-full p-2 hover:bg-purple-600/10 dark:hover:bg-purple-950/20 rounded flex items-center justify-between group transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground block truncate">{v.title}</span>
                        <span className="text-[9px] text-slate-650 dark:text-slate-400 truncate block mt-0.5">
                          {v.type === 'video' ? (v as any).channel : (v as any).source} • {v.categoryName}
                        </span>
                      </div>
                      <Play className="h-3.5 w-3.5 text-purple-400 fill-current opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
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
                          onWatchVideo(linkedVideo);
                          onClose();
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
                      onClick={onClose}
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
  );
};
