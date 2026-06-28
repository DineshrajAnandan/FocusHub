import React, { useState, useEffect, useRef } from 'react';
import type { Video, Category, Note, ActionItem, LearningResource, Article } from '../types';
import { StorageService } from '../services/storage';
import { 
  ArrowLeft, CheckCircle2, Cloud, RefreshCw, AlertTriangle, 
  Bold, Italic, Code, List, Plus, Trash2, BookOpen, ListVideo, Play, ChevronRight
} from 'lucide-react';

interface PlaylistContext {
  playlistId: string;
  playlistTitle: string;
  nextVideo: LearningResource | null;
}

interface FocusPlayerProps {
  video: LearningResource;
  categories: Category[];
  playlistContext?: PlaylistContext | null;
  onExit: () => void;
  onWatchNext?: (video: LearningResource) => void;
  onRefreshData: () => void;
}

export const FocusPlayer: React.FC<FocusPlayerProps> = ({
  video,
  categories,
  playlistContext,
  onExit,
  onWatchNext,
  onRefreshData
}) => {
  const [noteContent, setNoteContent] = useState('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newActionText, setNewActionText] = useState('');
  const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [embedMode, setEmbedMode] = useState<'card' | 'iframe'>('card');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Load existing notes on mount
  useEffect(() => {
    StorageService.getNotes().then(savedNotes => {
      const existingNote = savedNotes.find(n => n.videoId === video.id);
      if (existingNote) {
        setNoteContent(existingNote.content);
        setActionItems(existingNote.actionItems || []);
      } else {
        setNoteContent('');
        setActionItems([]);
      }
      setSyncState('synced');
    });
  }, [video.id]);

  // Load and configure YouTube IFrame Player API for watch progress tracking
  useEffect(() => {
    // Save lastWatchedAt timestamp immediately on mount
    const updateLastWatched = async () => {
      const now = new Date().toISOString();
      if (video.type === 'video') {
        await StorageService.updateVideo({ ...video, lastWatchedAt: now });
      } else {
        await StorageService.updateArticle({ ...video, lastWatchedAt: now, status: 'In Progress' });
      }
      onRefreshData();
    };
    updateLastWatched();

    if (video.type !== 'video') return;

    let player: any = null;
    let timer: any = null;

    const initPlayer = () => {
      const el = document.getElementById('youtube-player');
      if (!el) {
        setTimeout(initPlayer, 100);
        return;
      }

      const startSeconds = video.watchProgress || 0;
      player = new (window as any).YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: video.youtubeId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          showinfo: 0,
          iv_load_policy: 3,
          start: startSeconds
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING is 1
            if (event.data === 1) {
              if (!timer) {
                timer = setInterval(async () => {
                  if (player && typeof player.getCurrentTime === 'function') {
                    const time = Math.floor(player.getCurrentTime());
                    if (time > 0) {
                      await StorageService.updateVideo({ 
                        ...video, 
                        watchProgress: time, 
                        lastWatchedAt: new Date().toISOString() 
                      });
                    }
                  }
                }, 3000);
              }
            } else {
              if (timer) {
                clearInterval(timer);
                timer = null;
              }
            }
          }
        }
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }, [video.id]);


  // Debounced Auto-saving logic
  const triggerAutoSave = (newContent: string, newActions: ActionItem[]) => {
    setSyncState('syncing');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const notePayload: Note = {
          videoId: video.id,
          youtubeId: video.type === 'video' ? video.youtubeId : undefined,
          content: newContent,
          actionItems: newActions,
          updatedAt: new Date().toISOString()
        };
        await StorageService.saveNote(notePayload);
        setSyncState('synced');
      } catch (err) {
        console.error('Failed to sync notes:', err);
        setSyncState('offline');
      }
    }, 1500); // 1.5 second debounce delay
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteContent(val);
    triggerAutoSave(val, actionItems);
  };

  // Action Items helpers
  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;

    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      task: newActionText.trim(),
      done: false
    };
    
    const updatedActions = [...actionItems, newItem];
    setActionItems(updatedActions);
    setNewActionText('');
    triggerAutoSave(noteContent, updatedActions);
  };

  const handleToggleAction = (id: string) => {
    const updatedActions = actionItems.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    );
    setActionItems(updatedActions);
    triggerAutoSave(noteContent, updatedActions);
  };

  const handleDeleteAction = (id: string) => {
    const updatedActions = actionItems.filter(item => item.id !== id);
    setActionItems(updatedActions);
    triggerAutoSave(noteContent, updatedActions);
  };

  // Formatting injection helpers
  const insertMarkdown = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    let replacement = '';
    if (syntax === 'bold') replacement = `**${selected || 'bold text'}**`;
    else if (syntax === 'italic') replacement = `*${selected || 'italic text'}*`;
    else if (syntax === 'code') replacement = `\`${selected || 'code snippet'}\``;
    else if (syntax === 'list') replacement = `\n- ${selected || 'list item'}`;

    const newContent = before + replacement + after;
    setNoteContent(newContent);
    triggerAutoSave(newContent, actionItems);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selected || 'text').length);
    }, 50);
  };

  const handleMarkCompleted = async () => {
    if (video.type === 'video') {
      const updatedVideo: Video = {
        ...video,
        status: 'Completed',
        completedAt: new Date().toISOString()
      };
      await StorageService.updateVideo(updatedVideo);
    } else {
      const updatedArticle: Article = {
        ...video,
        status: 'Completed',
        completedAt: new Date().toISOString()
      };
      await StorageService.updateArticle(updatedArticle);
    }
    
    // Update Focus Log (track focused watched seconds)
    const todayStr = new Date().toISOString().split('T')[0];
    const logs = await StorageService.getFocusLogs();
    const existingLog = logs.find(l => l.date === todayStr);

    const isPlanned = video.scheduleDate === todayStr;

    const updatedLog = {
      date: todayStr,
      focusSecondsWatched: (existingLog?.focusSecondsWatched || 0) + (video.type === 'video' ? video.durationSeconds : 0),
      plannedCompletedCount: (existingLog?.plannedCompletedCount || 0) + (isPlanned ? 1 : 0),
      unplannedCompletedCount: (existingLog?.unplannedCompletedCount || 0) + (isPlanned ? 0 : 1),
      consistencyScore: Math.min(((existingLog?.plannedCompletedCount || 0) + (isPlanned ? 1 : 0)) * 25 + 50, 100)
    };
    await StorageService.saveFocusLog(updatedLog);

    onRefreshData();
    onExit();
  };

  const category = categories.find(c => c.name === video.categoryName);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] min-h-[620px]">
      
      {/* LEFT: embedded Youtube player panel */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        
        {/* Navigation header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-3">
          {/* Back button — smart label based on playlist context */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onExit}
              className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {playlistContext ? 'Back to Playlist' : 'Back'}
            </button>
            {playlistContext && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-600" />
                <a
                  href={`#/playlists/${playlistContext.playlistId}`}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                >
                  <ListVideo className="h-3.5 w-3.5" />
                  {playlistContext.playlistTitle}
                </a>
              </>
            )}
          </div>

          {video.type === 'article' && (
            <div className="flex bg-input/20 border border-border p-0.5 rounded-md self-start sm:self-auto">
              <button
                onClick={() => setEmbedMode('card')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  embedMode === 'card' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-slate-700 dark:text-slate-400 hover:text-foreground'
                }`}
              >
                Reading Card
              </button>
              <button
                onClick={() => setEmbedMode('iframe')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  embedMode === 'iframe' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-slate-750 dark:text-slate-400 hover:text-foreground'
                }`}
              >
                Embedded View (Experimental)
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span 
              className="text-[10px] font-bold px-2 py-0.5 border rounded"
              style={{
                color: category?.color || '#a78bfa',
                borderColor: `${category?.color}30` || '#a78bfa30',
                backgroundColor: `${category?.color}10` || '#a78bfa10'
              }}
            >
              {video.categoryName}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">•</span>
            <span className="text-xs text-slate-655 dark:text-slate-400 font-semibold">
              {video.type === 'video' ? video.channel : video.source}
            </span>
          </div>
        </div>

        {/* The YouTube Embed Wrapper or Article Reader layout */}
        {video.type === 'article' ? (
          embedMode === 'card' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card border border-border rounded-lg text-center gap-6 shadow-xl max-h-[620px]">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-650 to-indigo-650 flex items-center justify-center text-white shadow-md shadow-purple-900/10">
                <BookOpen className="h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-2.5 max-w-md">
                <h2 className="text-lg font-bold text-foreground leading-snug">{video.title}</h2>
                <p className="text-xs text-slate-750 dark:text-slate-400">
                  Source: <span className="font-bold text-purple-700 dark:text-purple-400">{video.source}</span>
                </p>
                <p className="text-xs text-slate-655 dark:text-slate-400 mt-2 leading-relaxed">
                  External articles cannot be embedded directly due to browser security restrictions. Open the article in a new tab to read it, and use the notepad on the right to capture your takeaways.
                </p>
              </div>
              <a 
                href={video.url}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-purple-650 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded text-xs transition-colors shadow-md shadow-purple-900/10"
              >
                Open Article in New Tab
              </a>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between bg-white rounded-lg overflow-hidden border border-border shadow-2xl max-h-[620px]">
              <iframe 
                src={video.url}
                title={video.title}
                className="w-full h-full border-0 bg-white flex-1"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              ></iframe>
              <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 py-2 text-[10px] text-amber-700 dark:text-amber-500 text-left flex items-center gap-1.5 leading-relaxed">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                <span>
                  If the article appears blank or blocks connecting, the site has forbidden frame embedding. Toggle back to the <strong>Reading Card</strong> or open it directly in a new tab.
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-border shadow-2xl flex-1 max-h-[620px]">
            <div id="youtube-player" className="absolute inset-0 w-full h-full"></div>
          </div>
        )}

        {/* Video Metadata / Mark Complete button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-lg font-bold text-foreground line-clamp-1">{video.title}</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Focus Mode is active: comments and recommendations are hidden.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleMarkCompleted}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Completed
            </button>

            {/* Next video in playlist CTA */}
            {playlistContext?.nextVideo && onWatchNext && (
              <button
                onClick={() => onWatchNext(playlistContext.nextVideo!)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded text-xs transition-colors shadow-md"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Next Video
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: notepad syncing panel */}
      <div className="w-full lg:w-80 bg-card border border-border rounded-lg flex flex-col h-full shadow-md overflow-hidden">
        
        {/* Notepad header */}
        <div className="border-b border-border p-4 flex justify-between items-center bg-input/20">
          <span className="text-xs font-bold text-foreground">Active Notes</span>
          
          {/* Cloud Saving status indicator */}
          <div className="text-[10px] font-semibold">
            {syncState === 'synced' && (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Cloud className="h-3.5 w-3.5" />
                [✓ Synced]
              </span>
            )}
            {syncState === 'syncing' && (
              <span className="text-orange-700 dark:text-orange-400 flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                [⟳ Syncing...]
              </span>
            )}
            {syncState === 'offline' && (
              <span className="text-red-700 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                [⚠ Saved Locally]
              </span>
            )}
          </div>
        </div>

        {/* Markdown toolbar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-input/10">
          <button onClick={() => insertMarkdown('bold')} className="p-1 hover:bg-hover rounded text-slate-650 dark:text-slate-400 hover:text-foreground" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
          <button onClick={() => insertMarkdown('italic')} className="p-1 hover:bg-hover rounded text-slate-650 dark:text-slate-400 hover:text-foreground" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
          <button onClick={() => insertMarkdown('code')} className="p-1 hover:bg-hover rounded text-slate-650 dark:text-slate-400 hover:text-foreground" title="Code"><Code className="h-3.5 w-3.5" /></button>
          <button onClick={() => insertMarkdown('list')} className="p-1 hover:bg-hover rounded text-slate-650 dark:text-slate-400 hover:text-foreground" title="Bullet List"><List className="h-3.5 w-3.5" /></button>
          
          <div className="ml-auto flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
            <span>Local Auto-Save</span>
            <span className={`h-1.5 w-1.5 rounded-full ${syncState === 'syncing' ? 'bg-yellow-500' : syncState === 'offline' ? 'bg-red-500' : 'bg-emerald-500'} animate-ping`}></span>
          </div>
        </div>

        {/* Split container: Text notes & Action checklist */}
        <div className="flex-1 flex flex-col divide-y divide-border/60 overflow-y-auto">
          
          {/* Notes Input Area */}
          <textarea 
            ref={textareaRef}
            placeholder="Type your notes here... (Supports markdown syntax)"
            value={noteContent}
            onChange={handleTextChange}
            className="w-full flex-1 bg-transparent p-4 text-sm text-foreground placeholder-slate-500 focus:outline-none resize-none font-sans leading-relaxed"
          ></textarea>

          {/* Action checklist */}
          <div className="p-4 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Action Items</span>
            
            {/* checklist items */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {actionItems.length === 0 ? (
                <div className="text-[11px] text-slate-500 dark:text-slate-500">No action items created yet.</div>
              ) : (
                actionItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between group gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer min-w-0 select-none">
                      <input 
                        type="checkbox" 
                        checked={item.done}
                        onChange={() => handleToggleAction(item.id)}
                        className="rounded border-border bg-background text-purple-600 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                      />
                      <span className={`truncate ${item.done ? 'line-through text-slate-550' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.task}
                      </span>
                    </label>
                    <button 
                      onClick={() => handleDeleteAction(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* inline input to add action item */}
            <form onSubmit={handleAddAction} className="flex items-center gap-1.5 border border-border rounded bg-background px-2 py-1">
              <input 
                type="text" 
                placeholder="Add action item..."
                value={newActionText}
                onChange={e => setNewActionText(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs text-foreground placeholder-slate-600 flex-1 py-0.5"
              />
              <button type="submit" className="text-purple-750 dark:text-purple-400 hover:text-purple-600">
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
