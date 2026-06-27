export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type VideoStatus = 'Planned' | 'In Progress' | 'Completed' | 'Skipped';

export interface Category {
  name: string;
  color: string;
  icon: string;
  description: string;
}

export interface Video {
  type: 'video';
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  durationSeconds: number;
  watchProgress?: number; // In seconds, to resume watch progress
  lastWatchedAt?: string; // ISO string representing when last played
  categoryName: string;
  priority: PriorityLevel;
  status: VideoStatus;
  scheduleDate: string | null; // YYYY-MM-DD
  completedAt: string | null;
  createdAt: string;
}

export interface Article {
  type: 'article';
  id: string;
  url: string;
  title: string;
  source: string;
  lastWatchedAt?: string; // ISO string representing when last read
  categoryName: string;
  priority: PriorityLevel;
  status: VideoStatus; // Planned | In Progress | Completed | Skipped
  scheduleDate: string | null; // YYYY-MM-DD
  completedAt: string | null;
  createdAt: string;
}

export type LearningResource = Video | Article;

export interface ActionItem {
  id: string;
  task: string;
  done: boolean;
}

export interface Note {
  videoId: string;
  youtubeId?: string; // Optional
  content: string;
  actionItems: ActionItem[];
  updatedAt: string;
}

export interface FocusLog {
  date: string; // YYYY-MM-DD
  focusSecondsWatched: number;
  plannedCompletedCount: number;
  unplannedCompletedCount: number;
  consistencyScore: number;
}

export interface LearningPathStep {
  id: string;
  title: string;
  videoId: string | null; // Associated saved Video ID
}

export interface LearningPathWeek {
  weekNumber: number;
  title: string;
  steps: LearningPathStep[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  weeks: LearningPathWeek[];
}

export interface Playlist {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  videoIds: string[]; // List of saved Video.id in order
  categoryName: string;
  priority: PriorityLevel;
  createdAt: string;
}

