import { openDB, type IDBPDatabase } from 'idb';

// Define interfaces matching types
import type { Video, Category, Note, FocusLog, LearningPath, Playlist, Article } from '../types';

const DB_NAME = 'FocusTubeDB';
const DB_VERSION = 2;

export class IndexedDBService {
  private static dbPromise: Promise<IDBPDatabase<any>>;

  private static getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db: IDBPDatabase<any>, oldVersion: number) {
          if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('categories')) {
              db.createObjectStore('categories', { keyPath: 'name' });
            }
            if (!db.objectStoreNames.contains('videos')) {
              db.createObjectStore('videos', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('notes')) {
              db.createObjectStore('notes', { keyPath: 'videoId' });
            }
            if (!db.objectStoreNames.contains('focus_logs')) {
              db.createObjectStore('focus_logs', { keyPath: 'date' });
            }
            if (!db.objectStoreNames.contains('learning_paths')) {
              db.createObjectStore('learning_paths', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('playlists')) {
              db.createObjectStore('playlists', { keyPath: 'id' });
            }
          }
          if (!db.objectStoreNames.contains('articles')) {
            db.createObjectStore('articles', { keyPath: 'id' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  // Generic helpers
  private static async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return db.getAll(storeName);
  }

  private static async put<T>(storeName: string, value: T): Promise<void> {
    const db = await this.getDB();
    await db.put(storeName, value);
  }

  private static async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.getDB();
    await db.delete(storeName, key);
  }

  // Specific APIs
  static async getCategories(): Promise<Category[]> {
    return this.getAll<Category>('categories');
  }

  static async saveCategory(cat: Category): Promise<void> {
    await this.put('categories', cat);
  }

  static async deleteCategory(name: string): Promise<void> {
    await this.delete('categories', name);
  }

  static async getVideos(): Promise<Video[]> {
    return this.getAll<Video>('videos');
  }

  static async saveVideo(video: Video): Promise<void> {
    await this.put('videos', video);
  }

  static async updateVideo(video: Video): Promise<void> {
    await this.put('videos', video);
  }

  static async deleteVideo(id: string): Promise<void> {
    await this.delete('videos', id);
  }

  static async getNotes(): Promise<Note[]> {
    return this.getAll<Note>('notes');
  }

  static async saveNote(note: Note): Promise<void> {
    await this.put('notes', note);
  }

  static async getFocusLogs(): Promise<FocusLog[]> {
    return this.getAll<FocusLog>('focus_logs');
  }

  static async saveFocusLog(log: FocusLog): Promise<void> {
    await this.put('focus_logs', log);
  }

  static async getLearningPaths(): Promise<LearningPath[]> {
    return this.getAll<LearningPath>('learning_paths');
  }

  static async saveLearningPath(path: LearningPath): Promise<void> {
    await this.put('learning_paths', path);
  }

  static async getPlaylists(): Promise<Playlist[]> {
    return this.getAll<Playlist>('playlists');
  }

  static async savePlaylist(pl: Playlist): Promise<void> {
    await this.put('playlists', pl);
  }

  static async deletePlaylist(id: string): Promise<void> {
    await this.delete('playlists', id);
  }

  // ── Articles CRUD ───────────────────────────────────────────────────────────
  static async getArticles(): Promise<Article[]> {
    return this.getAll<Article>('articles');
  }

  static async saveArticle(article: Article): Promise<void> {
    await this.put('articles', article);
  }

  static async updateArticle(article: Article): Promise<void> {
    await this.put('articles', article);
  }

  static async deleteArticle(id: string): Promise<void> {
    await this.delete('articles', id);
  }
}
