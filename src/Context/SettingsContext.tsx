import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  advancedMode: boolean;
  setAdvancedMode: (enabled: boolean) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'finance-manager-settings';

interface Settings {
  advancedMode: boolean;
  currency: string;
  language: string;
  theme: string;
}

const DEFAULT_SETTINGS: Settings = {
  advancedMode: false,
  currency: 'EUR',
  language: 'it',
  theme: 'light',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const setAdvancedMode = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, advancedMode: enabled }));
  };

  const setCurrency = (currency: string) => {
    setSettings(prev => ({ ...prev, currency }));
  };

  const setLanguage = (language: string) => {
    setSettings(prev => ({ ...prev, language }));
  };

  const setTheme = (theme: string) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  return (
    <SettingsContext.Provider
      value={{
        advancedMode: settings.advancedMode,
        setAdvancedMode,
        currency: settings.currency,
        setCurrency,
        language: settings.language,
        setLanguage,
        theme: settings.theme,
        setTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
