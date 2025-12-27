import { useState, useEffect, useLayoutEffect } from 'react';
import { Dashboard } from './Components/Dashboard';
import { AccountList } from './Components/AccountList';
import { TransactionsList } from './Components/TransactionsList';

type Page = 'dashboard' | 'accounts' | 'transactions';
type Theme = 'light' | 'dark' | 'system';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'system';
  });

  // useLayoutEffect viene eseguito PRIMA del paint, quindi non vediamo il flash
  useLayoutEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      // Rimuovi sempre la classe dark prima di decidere se aggiungerla
      root.classList.remove('dark');
      
      if (isDark) {
        root.classList.add('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
    
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    if (theme === 'light') return '☀️';
    if (theme === 'dark') return '🌙';
    return '💻';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-4xl transform group-hover:scale-110 transition-transform duration-200">💰</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Finance Manager</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">Gestione Finanze Personali</p>
              </div>
            </div>

            {/* Nav Links & Theme Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  currentPage === 'dashboard'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span>Dashboard</span>
                </span>
              </button>
              <button
                onClick={() => setCurrentPage('accounts')}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  currentPage === 'accounts'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">🏦</span>
                  <span>Conti</span>
                </span>
              </button>
              <button
                onClick={() => setCurrentPage('transactions')}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  currentPage === 'transactions'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">💸</span>
                  <span>Transazioni</span>
                </span>
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={handleThemeChange}
                className="ml-2 p-3 rounded-xl bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
                title={`Tema: ${theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Scuro' : 'Chiaro'}`}
              >
                <span className="text-2xl">{getThemeIcon()}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-12">
        <div className="animate-fade-in">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'accounts' && <AccountList />}
          {currentPage === 'transactions' && <TransactionsList />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Finance Manager v1.0</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
              🔒 Dati salvati in PostgreSQL • Made with ❤️ • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;