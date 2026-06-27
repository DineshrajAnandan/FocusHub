import { IndexedDBService } from './indexedDB';
import type { Video, Category, Note, FocusLog, LearningPath, Playlist, Article } from '../types';

const DEFAULT_GENERAL_CATEGORY: Category = {
  name: 'General',
  color: '#9333ea',
  icon: 'Folder',
  description: 'Default category for general learning resources.'
};

export class StorageService {
  // No-op: kept for compatibility in case callers reference it
  static setSessionUser(_user: any) {}
  static getUserId(): string | null { return null; }
  static isSupabaseConnected(): boolean { return false; }
  static async syncFromSupabase(): Promise<void> {}

  // ── Categories ──────────────────────────────────────────────────────────────

  static async getCategories(): Promise<Category[]> {
    let list = await IndexedDBService.getCategories();
    // Ensure the non-deletable "General" category always exists
    if (!list.some(c => c.name.toLowerCase() === 'general')) {
      await IndexedDBService.saveCategory(DEFAULT_GENERAL_CATEGORY);
      list = [DEFAULT_GENERAL_CATEGORY, ...list];
    }
    return list;
  }

  static async saveCategory(category: Category): Promise<void> {
    await IndexedDBService.saveCategory(category);
  }

  static async deleteCategory(categoryName: string): Promise<void> {
    if (categoryName.toLowerCase() === 'general') return;

    // Move videos in this category to "General"
    const videos = await IndexedDBService.getVideos();
    for (const v of videos) {
      if (v.categoryName.toLowerCase() === categoryName.toLowerCase()) {
        await IndexedDBService.updateVideo({ ...v, categoryName: 'General' });
      }
    }

    // Move articles in this category to "General"
    const articles = await IndexedDBService.getArticles();
    for (const a of articles) {
      if (a.categoryName.toLowerCase() === categoryName.toLowerCase()) {
        await IndexedDBService.updateArticle({ ...a, categoryName: 'General' });
      }
    }

    // Move playlists in this category to "General"
    const playlists = await IndexedDBService.getPlaylists();
    for (const p of playlists) {
      if (p.categoryName.toLowerCase() === categoryName.toLowerCase()) {
        await IndexedDBService.savePlaylist({ ...p, categoryName: 'General' });
      }
    }

    await IndexedDBService.deleteCategory(categoryName);
  }

  // ── Videos ──────────────────────────────────────────────────────────────────

  static async getVideos(): Promise<Video[]> {
    return IndexedDBService.getVideos();
  }

  static async saveVideo(video: Video): Promise<void> {
    await IndexedDBService.saveVideo(video);
  }

  static async updateVideo(video: Video): Promise<void> {
    await IndexedDBService.updateVideo(video);
  }

  static async deleteVideo(videoId: string): Promise<void> {
    await IndexedDBService.deleteVideo(videoId);
  }

  // ── Notes ───────────────────────────────────────────────────────────────────

  static async getNotes(): Promise<Note[]> {
    return IndexedDBService.getNotes();
  }

  static async saveNote(note: Note): Promise<void> {
    await IndexedDBService.saveNote(note);
  }

  // ── Focus Logs ──────────────────────────────────────────────────────────────

  static async getFocusLogs(): Promise<FocusLog[]> {
    return IndexedDBService.getFocusLogs();
  }

  static async saveFocusLog(log: FocusLog): Promise<void> {
    await IndexedDBService.saveFocusLog(log);
  }

  // ── Learning Paths ───────────────────────────────────────────────────────────

  static async getLearningPaths(): Promise<LearningPath[]> {
    return IndexedDBService.getLearningPaths();
  }

  static async saveLearningPath(path: LearningPath): Promise<void> {
    await IndexedDBService.saveLearningPath(path);
  }

  // ── Playlists ────────────────────────────────────────────────────────────────

  static async getPlaylists(): Promise<Playlist[]> {
    return IndexedDBService.getPlaylists();
  }

  static async savePlaylist(playlist: Playlist): Promise<void> {
    await IndexedDBService.savePlaylist(playlist);
  }

  static async deletePlaylist(playlistId: string): Promise<void> {
    await IndexedDBService.deletePlaylist(playlistId);
  }

  // ── Articles ─────────────────────────────────────────────────────────────────
  static async getArticles(): Promise<Article[]> {
    return IndexedDBService.getArticles();
  }

  static async saveArticle(article: Article): Promise<void> {
    await IndexedDBService.saveArticle(article);
  }

  static async updateArticle(article: Article): Promise<void> {
    await IndexedDBService.updateArticle(article);
  }

  static async deleteArticle(articleId: string): Promise<void> {
    await IndexedDBService.deleteArticle(articleId);
  }
}
