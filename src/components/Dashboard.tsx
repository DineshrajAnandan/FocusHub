import React, { useState, useEffect } from 'react';
import type { Category, LearningResource, Article } from '../types';
import { StorageService } from '../services/storage';
import { 
  Play, Award, BookOpen, Clock, Calendar, Zap, ArrowRight
} from 'lucide-react';

interface DashboardProps {
  videos: LearningResource[];
  categories: Category[];
  onWatchVideo: (video: LearningResource) => void;
  onRefreshData: () => void;
}

const MOTIVATIONAL_QUOTES = [
  "The expert in anything was once a beginner.",
  "Focus is a muscle, and you build it by using it.",
  "Learning never exhausts the mind. — Leonardo da Vinci",
  "Deep work is the superpower of the 21st century.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Your focus determines your reality. — Qui-Gon Jinn",
  "An investment in knowledge pays the best interest. — Benjamin Franklin",
  "The beautiful thing about learning is that nobody can take it away from you. — B.B. King",
  "Live as if you were to die tomorrow. Learn as if you were to live forever. — Mahatma Gandhi",
  "Consistency is what transforms average into excellence."
];

export const Dashboard: React.FC<DashboardProps> = ({
  videos,
  categories,
  onWatchVideo,
  onRefreshData
}) => {
  const [playlistVideoIds, setPlaylistVideoIds] = useState<Set<string>>(new Set());

  // Load playlists to exclude playlist videos from Today's Queue
  useEffect(() => {
    StorageService.getPlaylists().then(playlists => {
      const ids = new Set<string>();
      playlists.forEach(pl => pl.videoIds.forEach(id => ids.add(id)));
      setPlaylistVideoIds(ids);
    });
  }, [videos]);

  // Greeting helpers
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  const quoteIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
  const selectedQuote = MOTIVATIONAL_QUOTES[quoteIndex];

  // Streak counter logic
  const getStreakCount = () => {
    const completedDates = Array.from(
      new Set(
        videos
          .filter(v => v.status === 'Completed' && v.completedAt)
          .map(v => v.completedAt!.split('T')[0])
      )
    ).sort((a, b) => b.localeCompare(a)); // Sort descending

    if (completedDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If latest completion is older than yesterday, the streak is broken
    if (completedDates[0] !== todayStr && completedDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    const currentDate = new Date(completedDates[0]);

    for (let i = 0; i < completedDates.length; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (completedDates.includes(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Find Continue Watching item (most recent incomplete in-progress resource)
  const getContinueWatchingItem = () => {
    const incomplete = videos.filter(v => v.status !== 'Completed');
    const inProgressList = incomplete.filter(v => 
      (v.type === 'video' && v.watchProgress && v.watchProgress > 0) || 
      (v.type === 'article' && v.status === 'In Progress')
    );

    return inProgressList.sort((a, b) => {
      const timeA = a.lastWatchedAt ? new Date(a.lastWatchedAt).getTime() : 0;
      const timeB = b.lastWatchedAt ? new Date(b.lastWatchedAt).getTime() : 0;
      return timeB - timeA;
    })[0] || null;
  };

  const continueWatching = getContinueWatchingItem();
  const streakCount = getStreakCount();

  // Filter today's queue
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysQueue = videos.filter(
    v => (v.scheduleDate === todayStr || v.status === 'In Progress')
      && v.status !== 'Completed'
      && (v.type === 'article' || !playlistVideoIds.has(v.id))
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Hero Greeting block */}
      <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-transparent border border-border/80 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm text-left">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-650 dark:text-slate-400 text-xs font-semibold">
            <Calendar className="h-4 w-4 text-purple-500" />
            <span>{getFormattedDate()}</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            {getGreeting()}, <span className="text-purple-600 dark:text-purple-400">Learner</span>!
          </h1>
          <p className="text-sm italic text-slate-700 dark:text-slate-300 font-medium">
            "{selectedQuote}"
          </p>
        </div>

        {/* Streak indicator badge */}
        <div className="bg-card border border-border/85 rounded-lg px-5 py-4 flex items-center gap-3.5 shadow-sm md:self-stretch min-w-[180px]">
          <div className="p-2.5 bg-amber-500/10 rounded-full text-amber-500">
            <Zap className="h-6 w-6 fill-current animate-bounce" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Learning Streak</span>
            <span className="text-2xl font-black text-foreground leading-none mt-1 block">
              {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Continue Watching Hero Card */}
      {continueWatching && (
        <div className="text-left">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 block">Continue Watching</h2>
          <div className="bg-gradient-to-br from-card to-background border border-purple-500/20 rounded-xl p-5 md:p-6 shadow-md hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="text-[10px] font-extrabold uppercase px-2 py-0.5 border rounded"
                  style={{
                    color: categories.find(c => c.name === continueWatching.categoryName)?.color || '#a78bfa',
                    borderColor: `${categories.find(c => c.name === continueWatching.categoryName)?.color}35` || '#a78bfa35',
                    backgroundColor: `${categories.find(c => c.name === continueWatching.categoryName)?.color}10` || '#a78bfa10'
                  }}
                >
                  {continueWatching.categoryName}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-655 dark:text-slate-400">
                  {continueWatching.type === 'video' ? continueWatching.channel : continueWatching.source}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
                  {continueWatching.type === 'video' ? 'Video' : 'Article'}
                </span>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold text-foreground leading-snug line-clamp-2">
                  {continueWatching.title}
                </h3>
              </div>

              {/* Progress status bar */}
              <div className="space-y-1.5 max-w-md">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-655 dark:text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-purple-500" />
                    {continueWatching.type === 'video' ? (
                      <span>
                        Resuming at {formatDuration(continueWatching.watchProgress || 0)} / {formatDuration(continueWatching.durationSeconds || 0)}
                      </span>
                    ) : (
                      <span>Reading active in Focus Mode</span>
                    )}
                  </span>
                  <span className="font-bold text-purple-650 dark:text-purple-400">
                    {continueWatching.type === 'video' 
                      ? `${Math.min(100, Math.max(0, Math.round(((continueWatching.watchProgress || 0) / continueWatching.durationSeconds) * 100)))}%` 
                      : '50%'}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ 
                      width: continueWatching.type === 'video' 
                        ? `${Math.min(100, Math.max(0, Math.round(((continueWatching.watchProgress || 0) / continueWatching.durationSeconds) * 100)))}%` 
                        : '50%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Resume button */}
            <button
              onClick={() => onWatchVideo(continueWatching)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20 hover:shadow-purple-950/30 transition-all flex-shrink-0 self-start md:self-auto"
            >
              {continueWatching.type === 'video' ? 'Resume Watching' : 'Resume Reading'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Today's Queue Section */}
      <div className="space-y-4 text-left">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Today's Queue</h2>
          <span className="text-xs px-2.5 py-1 bg-input/30 border border-border text-foreground rounded-full font-medium">
            {todaysQueue.length} planned
          </span>
        </div>

        {todaysQueue.length === 0 ? (
          <div className="bg-card border border-border border-dashed p-12 rounded-lg text-center text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            <Award className="h-10 w-10 mx-auto mb-2 text-purple-600 dark:text-purple-400 opacity-60" />
            <p className="font-semibold text-sm">Today's queue is empty!</p>
            <p className="text-xs text-slate-650 dark:text-slate-400 mt-1">
              Add resources to your watch queue, bookmarks page, or plan items from the priorities manager.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todaysQueue.map(video => {
              const category = categories.find(c => c.name === video.categoryName);
              return (
                <div 
                  key={video.id} 
                  className="bg-card border border-border hover:border-purple-900/40 p-3.5 rounded-lg shadow-sm flex flex-col justify-between gap-3.5 transition-all duration-200 hover:scale-[1.01] text-left"
                >
                  <div className="space-y-3">
                    {/* Card Thumbnail */}
                    <div className="relative aspect-video w-full bg-slate-900 rounded overflow-hidden flex-shrink-0">
                      {video.type === 'article' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/10 to-indigo-900/10 text-purple-700 dark:text-purple-400">
                          <BookOpen className="h-8 w-8 animate-pulse" />
                        </div>
                      ) : (
                        <img 
                          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`} 
                          alt={video.title}
                          className="object-cover w-full h-full"
                        />
                      )}
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] font-bold text-white px-1.5 rounded flex items-center gap-1">
                        {video.type === 'article' ? (
                          <>
                            <BookOpen className="h-2.5 w-2.5 text-purple-400" />
                            <span>Article</span>
                          </>
                        ) : (
                          <span>{formatDuration(video.durationSeconds || 0)}</span>
                        )}
                      </span>
                    </div>

                    {/* Card Details */}
                    <div className="space-y-1.5 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug h-10">
                        {video.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-650 dark:text-slate-400 truncate max-w-[110px]">
                          {video.type === 'video' ? video.channel : video.source}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        
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
                          className="px-1.5 py-0.5 rounded text-[8px] font-bold border bg-transparent cursor-pointer focus:outline-none max-w-[100px] truncate"
                          style={{ 
                            color: category?.color || '#a78bfa', 
                            borderColor: `${category?.color}30` || '#a78bfa30',
                            backgroundColor: `${category?.color}10` || '#a78bfa10'
                          }}
                          title="Change Category"
                        >
                          {categories.map(c => (
                            <option key={c.name} value={c.name} className="text-foreground bg-background">{c.name}</option>
                          ))}
                        </select>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                          video.priority === 'High' ? 'text-red-700 dark:text-red-400 border-red-500/20 bg-red-500/5' :
                          video.priority === 'Medium' ? 'text-orange-700 dark:text-orange-400 border-orange-500/20 bg-orange-500/5' :
                          'text-slate-700 dark:text-slate-400 border-slate-500/20 bg-slate-500/5'
                        }`}>
                          {video.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onWatchVideo(video)}
                    className="w-full bg-purple-650 hover:bg-purple-700 text-white font-semibold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-1"
                  >
                    {video.type === 'article' ? (
                      <>
                        <BookOpen className="h-3.5 w-3.5" />
                        Read Now
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Watch Now
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
