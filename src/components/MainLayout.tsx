import React, { useState } from 'react';
import {
  LayoutDashboard, Layers, Folder, Map, Settings as SettingsIcon,
  Search, Sun, Moon, HardDrive, User, Menu, BookOpen, ChevronLeft, ChevronRight,
  ScanEye, ListVideo
} from 'lucide-react';

interface MainLayoutProps {
  activeTab: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  theme,
  onToggleTheme,
  onOpenSearch,
  onNavigate,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Navigation config
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'queue', label: 'Watch Queue', icon: Layers },
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'paths', label: 'Learning Paths', icon: Map },
    { id: 'playlists', label: 'Playlists', icon: ListVideo },
    { id: 'articles', label: 'Articles', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="h-screen overflow-hidden flex bg-background text-foreground relative">
      {/* Skip to Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
      >
        Skip to main content
      </a>

      {/* 1. SIDEBAR NAVIGATION PANEL (Desktop) */}
      <aside className={`hidden md:flex flex-col h-full bg-card border-r border-border p-4 justify-between flex-shrink-0 select-none overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="space-y-6">

          {/* Logo Brand Header & Toggle */}
          {sidebarCollapsed ? (
            // Collapsed: show icon + a dedicated expand button below it
            <div className="flex flex-col items-center gap-2">
              <div className="p-1.5 bg-purple-600 rounded text-white flex items-center justify-center">
                <ScanEye className="h-5 w-5 animate-pulse" />
              </div>
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-full flex items-center justify-center p-1.5 rounded-md hover:bg-hover text-slate-600 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                title="Expand Sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // Expanded: show logo + collapse button
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-600 rounded text-white flex items-center justify-center">
                  <ScanEye className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="font-bold tracking-tight text-foreground text-sm">FocusHub</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block leading-none">LEARNING HUB</span>
                </div>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 hover:bg-hover rounded-full text-slate-600 dark:text-slate-500 hover:text-foreground transition-colors"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Quick Search Shortcut Trigger */}
          {sidebarCollapsed ? (
            <button
              onClick={onOpenSearch}
              className="mx-auto bg-input/25 border border-border hover:border-border/60 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300 rounded-md p-2 transition-colors flex items-center justify-center"
              title="Quick Search (⌘K)"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              onClick={onOpenSearch}
              className="w-full bg-input/25 border border-border hover:border-border/60 text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300 rounded-md px-3 py-2 text-xs flex items-center justify-between transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                Quick search...
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-input border border-border rounded text-slate-600 dark:text-slate-400">⌘K</span>
            </button>
          )}

          {/* Tabs Menu List */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={`#/${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(`#/${item.id}`);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center rounded-md text-xs font-semibold transition-all text-left ${sidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
                    } ${isActive
                      ? 'bg-purple-600/10 border-l-2 border-purple-500 text-purple-700 dark:text-purple-400 font-bold'
                      : 'text-slate-700 hover:text-purple-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-hover'
                    }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-purple-700 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  {!sidebarCollapsed && item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Status Indicator */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className={`flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 ${sidebarCollapsed ? 'flex-col gap-3 items-center' : ''}`}>
            {!sidebarCollapsed ? (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                Demo Learner
              </span>
            ) : (
              <span title="Demo Learner">
                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </span>
            )}
            <button
              onClick={onToggleTheme}
              className="p-1.5 hover:bg-hover rounded-full text-slate-600 dark:text-slate-500 hover:text-foreground transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="bg-input/25 p-2.5 rounded border border-border/40 text-[10px]">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                <HardDrive className="h-3.5 w-3.5" />
                Saved Locally (IndexedDB)
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-purple-600 rounded text-white flex items-center justify-center">
            <ScanEye className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-sm">FocusHub</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-hover rounded"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-hover rounded"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-hover rounded"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MOBILE MENU NAV DRAWER */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
          <nav className="fixed top-14 left-0 right-0 bg-card border-b border-border p-4 z-50 md:hidden space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={`#/${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(`#/${item.id}`);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all text-left ${isActive
                    ? 'bg-purple-600/10 border-l-2 border-purple-500 text-purple-700 dark:text-purple-400 font-bold'
                    : 'text-slate-700 hover:text-purple-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-hover'
                    }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-purple-700 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </>
      )}

      {/* 2. MAIN WORKSPACE VIEW */}
      <main
        id="main-content"
        tabIndex={0}
        aria-label="Main Workspace Content"
        className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 md:p-8 pt-20 md:pt-8 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20"
      >
        {children}
      </main>
    </div>
  );
};
