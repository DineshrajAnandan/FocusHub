import React, { useState, useEffect } from 'react';
import { YoutubeService } from '../services/youtube';
import {
  Settings as SettingsIcon, ShieldAlert, Key, CheckCircle, RefreshCw, Trash2, HelpCircle, HardDrive, Video, Database
} from 'lucide-react';

interface SettingsProps {
  onRefreshData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onRefreshData }) => {
  const [ytApiKey, setYtApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setYtApiKey(YoutubeService.getApiKey());
  }, []);

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    YoutubeService.setApiKey(ytApiKey.trim());

    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onRefreshData();
    }, 600);
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to clear ALL data? This will permanently delete all your videos, categories, notes, and logs from IndexedDB. This cannot be undone.')) {
      // Clear IndexedDB by deleting the database
      indexedDB.deleteDatabase('FocusTubeDB');
      // Also clear any localStorage remnants
      localStorage.clear();
      alert('All data cleared. The app will now reload.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl text-left">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          Settings
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Configure your YouTube API key and manage your local data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Settings Forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* YouTube API Key */}
          <form onSubmit={handleSaveConfigs} className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Video className="h-4 w-4 text-red-650 dark:text-red-400" />
              YouTube API Configuration
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                YouTube Data API Key
                <span title="Required to resolve video metadata (title, duration, channel) from YouTube URLs">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                </span>
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={ytApiKey}
                onChange={e => setYtApiKey(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground placeholder-slate-500 dark:placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Used to fetch video titles, channel names, and durations when you paste a YouTube URL.
                Get a key from <span className="text-purple-700 dark:text-purple-400 font-semibold">console.cloud.google.com</span>.
              </p>
            </div>

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 px-4 rounded transition-colors flex items-center gap-1.5"
            >
              {isSaving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : savedSuccess ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Key className="h-3.5 w-3.5" />
              )}
              {savedSuccess ? 'Saved!' : 'Save API Key'}
            </button>
          </form>

          {/* Reset App Block */}
          <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/20 p-6 rounded-lg space-y-4">
            <h2 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              Danger Zone
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Resetting FocusTube will permanently delete all your data from the local IndexedDB database —
              including videos, categories, notes, playlists, and focus logs. This cannot be undone.
            </p>
            <button
              onClick={handleResetData}
              className="hover:bg-red-100 border border-red-200 text-red-700 dark:hover:bg-red-900 dark:border-red-800 dark:text-red-400 font-semibold py-2 px-4 rounded text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset All Data
            </button>
          </div>
        </div>

        {/* Right Column: Storage Info */}
        <div className="space-y-4">
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">
              Storage Status
            </span>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-transparent dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/40 rounded-full text-emerald-700 dark:text-emerald-400">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">Local IndexedDB</span>
                <span className="text-[10px] text-emerald-750 dark:text-emerald-400 font-semibold block mt-0.5 font-bold">Active & Persistent</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-705 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded border border-border space-y-1.5 leading-relaxed">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Storage Engine</span>
                <span className="font-semibold">IndexedDB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Database</span>
                <span className="font-mono text-purple-700 dark:text-purple-400 font-bold">FocusTubeDB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Sync</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-bold">Offline-first</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Privacy</span>
                <span className="font-semibold">100% Local</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-600 dark:text-slate-500 leading-relaxed">
              All your data is stored privately in your browser's IndexedDB. Nothing is sent to any server.
            </p>
          </div>

          {/* Stores info */}
          <div className="bg-card border border-border p-5 rounded-lg shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              Data Stores
            </span>
            {[
              { label: 'Categories', store: 'categories' },
              { label: 'Videos', store: 'videos' },
              { label: 'Notes', store: 'notes' },
              { label: 'Focus Logs', store: 'focus_logs' },
              { label: 'Playlists', store: 'playlists' },
              { label: 'Learning Paths', store: 'learning_paths' },
            ].map(item => (
              <div key={item.store} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-650 dark:text-slate-400">{item.label}</span>
                <span className="font-mono text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-900/30 font-bold">{item.store}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
