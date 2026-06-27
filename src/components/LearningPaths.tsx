import React, { useState, useEffect } from 'react';
import type { LearningPath, Category, LearningResource } from '../types';
import { StorageService } from '../services/storage';
import { 
  Plus, CheckCircle2, Circle, Play, HelpCircle, ArrowLeft, BookOpen
} from 'lucide-react';

interface LearningPathsProps {
  videos: LearningResource[];
  categories: Category[];
  onWatchVideo: (video: LearningResource) => void;
  onRefreshData: () => void;
}

export const LearningPaths: React.FC<LearningPathsProps> = ({
  videos,
  onWatchVideo
}) => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);

  // Read paths on mount
  useEffect(() => {
    StorageService.getLearningPaths().then(savedPaths => {
      setPaths(savedPaths);
      if (savedPaths.length > 0) {
        setActivePath(prev => {
          if (prev && savedPaths.some(p => p.id === prev.id)) {
            return savedPaths.find(p => p.id === prev.id) || null;
          }
          return savedPaths[0];
        });
      } else {
        setActivePath(null);
      }
    });
  }, [videos]); // Rerun when videos update to refresh progress ticks

  const handleCreatePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPath: LearningPath = {
      id: `path-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      weeks: [
        { weekNumber: 1, title: 'Introduction', steps: [] }
      ]
    };

    await StorageService.saveLearningPath(newPath);
    const refreshed = await StorageService.getLearningPaths();
    setPaths(refreshed);
    setActivePath(newPath);
    setTitle('');
    setDescription('');
    setShowAddForm(false);
  };

  const handleAddWeek = async (path: LearningPath) => {
    const nextWeek = path.weeks.length + 1;
    const updatedWeeks = [
      ...path.weeks,
      { weekNumber: nextWeek, title: `Week ${nextWeek} Goals`, steps: [] }
    ];
    const updatedPath = { ...path, weeks: updatedWeeks };
    await StorageService.saveLearningPath(updatedPath);
    const refreshed = await StorageService.getLearningPaths();
    setPaths(refreshed);
    setActivePath(updatedPath);
  };

  const handleAddStep = async (path: LearningPath, weekNumber: number, stepTitle: string, selectedVideoId: string | null) => {
    if (!stepTitle.trim()) return;

    const updatedWeeks = path.weeks.map(w => {
      if (w.weekNumber === weekNumber) {
        return {
          ...w,
          steps: [
            ...w.steps,
            { id: `step-${Date.now()}`, title: stepTitle.trim(), videoId: selectedVideoId }
          ]
        };
      }
      return w;
    });

    const updatedPath = { ...path, weeks: updatedWeeks };
    await StorageService.saveLearningPath(updatedPath);
    const refreshed = await StorageService.getLearningPaths();
    setPaths(refreshed);
    setActivePath(updatedPath);
  };

  // Progress metrics helpers
  const getPathProgress = (path: LearningPath) => {
    let totalSteps = 0;
    let completedSteps = 0;

    path.weeks.forEach(w => {
      w.steps.forEach(s => {
        totalSteps++;
        if (s.videoId) {
          const video = videos.find(v => v.id === s.videoId);
          if (video && video.status === 'Completed') {
            completedSteps++;
          }
        }
      });
    });

    return {
      total: totalSteps,
      completed: completedSteps,
      percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Paths</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Structure your playlists and videos into linear curriculums and track week-by-week progress.</p>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded text-xs flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Learning Path
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreatePath} className="bg-card border border-border p-6 rounded-lg shadow-md max-w-xl space-y-4 text-left">
          <h2 className="text-sm font-bold text-foreground">New Learning Path Details</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Path Name</label>
            <input 
              type="text" 
              placeholder="e.g. Master Machine Learning"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea 
              placeholder="Outlines the learning objectives of this path..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full h-16 bg-background border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500 resize-none"
            ></textarea>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 px-4 rounded">Create</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="bg-background border border-border text-foreground hover:bg-hover text-xs font-semibold py-2 px-4 rounded">Cancel</button>
          </div>
        </form>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Paths List Sidebar */}
        <div className={`space-y-3 bg-card border border-border p-4 rounded-lg h-fit text-left ${activePath ? 'hidden lg:block' : 'block'}`}>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-400 block uppercase tracking-wider">Active Paths</span>
          <div className="space-y-2">
            {paths.map(p => {
              const metrics = getPathProgress(p);
              const isActive = activePath?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePath(p)}
                  className={`w-full p-3 rounded-lg border text-left flex flex-col space-y-2 transition-colors ${
                    isActive ? 'border-purple-500 bg-purple-500/5' : 'border-border bg-background hover:bg-hover'
                  }`}
                >
                  <span className="font-bold text-xs text-foreground block truncate">{p.title}</span>
                  <div className="flex items-center justify-between text-[9px] text-slate-600 dark:text-slate-400">
                    <span>{metrics.percentage}% Completed</span>
                    <span>{metrics.completed}/{metrics.total} Steps</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Path Detail view */}
        <div className={`lg:col-span-3 space-y-6 text-left ${!activePath ? 'hidden lg:block' : 'block'}`}>
          {activePath ? (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                {activePath && (
                  <button 
                    onClick={() => setActivePath(null)}
                    className="lg:hidden flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 font-semibold mb-3 hover:text-purple-650"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Learning Paths List
                  </button>
                )}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{activePath.title}</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{activePath.description}</p>
                  </div>
                  
                  {/* Progress Badge */}
                  <div className="text-right">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 block">{getPathProgress(activePath).percentage}% Complete</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">{getPathProgress(activePath).completed} of {getPathProgress(activePath).total} steps</span>
                  </div>
                </div>
              </div>

              {/* Weeks List */}
              <div className="space-y-6">
                {activePath.weeks.map(week => (
                  <div key={week.weekNumber} className="bg-card border border-border rounded-lg p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400">Week {week.weekNumber}: {week.title}</h3>
                      <span className="text-[10px] text-slate-650 dark:text-slate-400">{week.steps.length} milestones</span>
                    </div>

                    {/* Week steps */}
                    <div className="space-y-3">
                      {week.steps.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No steps defined for this week.</p>
                      ) : (
                        week.steps.map(step => {
                          const video = step.videoId ? videos.find(v => v.id === step.videoId) : null;
                          const isDone = video?.status === 'Completed';

                          return (
                            <div key={step.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background border border-border/60 rounded-md gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                )}
                                <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {step.title}
                                </span>
                              </div>

                              {/* Video reference Watch trigger */}
                              {video ? (
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{video.title}</span>
                                  {isDone ? (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded font-bold">Done</span>
                                  ) : (
                                    <button 
                                      onClick={() => onWatchVideo(video)}
                                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-2.5 rounded text-[10px] flex items-center gap-1"
                                    >
                                      {video.type === 'article' ? (
                                        <BookOpen className="h-2.5 w-2.5" />
                                      ) : (
                                        <Play className="h-2.5 w-2.5 fill-current" />
                                      )}
                                      {video.type === 'article' ? 'Read' : 'Watch'}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-605 dark:text-slate-500 flex items-center gap-1 italic">
                                  <HelpCircle className="h-3 w-3 text-slate-550" />
                                  Unlinked milestone
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Inline step creator */}
                    <AddStepForm 
                      videos={videos} 
                      onAdd={(stepTitle, selectedVideoId) => handleAddStep(activePath, week.weekNumber, stepTitle, selectedVideoId)} 
                    />
                  </div>
                ))}

                <button 
                  onClick={() => handleAddWeek(activePath)}
                  className="w-full bg-background hover:bg-hover border border-border border-dashed py-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-foreground dark:hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Week Column
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-600 dark:text-slate-400 bg-card border border-border border-dashed rounded-lg">
              No active learning paths found. Create one to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline helper for adding steps
interface AddStepFormProps {
  videos: LearningResource[];
  onAdd: (title: string, videoId: string | null) => void;
}

const AddStepForm: React.FC<AddStepFormProps> = ({ videos, onAdd }) => {
  const [stepTitle, setStepTitle] = useState('');
  const [selectedVid, setSelectedVid] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepTitle.trim()) return;

    onAdd(stepTitle, selectedVid || null);
    setStepTitle('');
    setSelectedVid('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:text-purple-600 flex items-center gap-1 mt-1 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add milestone step...
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-2.5 bg-input/20 border border-border/40 p-3 rounded-md mt-2">
      <div className="flex-1 space-y-1.5 w-full text-left">
        <label className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Milestone Goal</label>
        <input 
          type="text" 
          placeholder="e.g. Master dynamic programming concepts"
          value={stepTitle}
          onChange={e => setStepTitle(e.target.value)}
          className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="space-y-1.5 w-full sm:w-48 text-left">
        <label className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Link Resource (Optional)</label>
        <select 
          value={selectedVid}
          onChange={e => setSelectedVid(e.target.value)}
          className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
        >
          <option value="">-- No resource linked --</option>
          {videos.filter(v => v.status !== 'Completed').map(v => (
            <option key={v.id} value={v.id}>{v.title}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-1.5 mt-2 sm:mt-0">
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold py-1 px-3 rounded h-[28px]">Add</button>
        <button type="button" onClick={() => setIsOpen(false)} className="bg-background border border-border text-foreground hover:bg-hover text-[10px] font-bold py-1 px-2.5 rounded h-[28px]">Cancel</button>
      </div>
    </form>
  );
};
