import { useState } from 'react';
import { useSettings } from '../Context/SettingsContext';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const { 
    advancedMode, 
    setAdvancedMode, 
    currency, 
    setCurrency,
    language,
    setLanguage,
    theme,
    setTheme 
  } = useSettings();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setAdvancedMode(false);
    setCurrency('EUR');
    setLanguage('it');
    setTheme('light');
    setShowResetConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">⚙️ Impostazioni</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Chiudi impostazioni"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Advanced Mode Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🚀 Modalità Avanzata
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {advancedMode 
                    ? 'Tutte le funzionalità avanzate sono abilitate: Budget, Analytics, Ricerca Avanzata, Gestione Categorie e Convertitore Valute.'
                    : 'Modalità semplificata per un\'esperienza più minimale. Abilita per accedere a funzionalità avanzate come budget, analytics e gestione categorie.'}
                </p>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="advancedModeToggle"
                      checked={advancedMode}
                      onChange={(e) => setAdvancedMode(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full transition ${
                      advancedMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                      advancedMode ? 'translate-x-6' : ''
                    }`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {advancedMode ? 'Abilitata' : 'Disabilitata'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Currency Section */}
          <div className="border-b pb-4">
            <label htmlFor="currencySelect" className="block text-sm font-medium text-gray-700 mb-2">
              💰 Valuta Predefinita
            </label>
            <select
              id="currencySelect"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="GBP">British Pound (£)</option>
              <option value="JPY">Japanese Yen (¥)</option>
              <option value="CHF">Swiss Franc (CHF)</option>
              <option value="CAD">Canadian Dollar (CAD)</option>
              <option value="AUD">Australian Dollar (AUD)</option>
            </select>
          </div>

          {/* Language Section */}
          <div className="border-b pb-4">
            <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-700 mb-2">
              🌍 Lingua
            </label>
            <select
              id="languageSelect"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          {/* Theme Section */}
          <div className="border-b pb-4">
            <label htmlFor="themeSelect" className="block text-sm font-medium text-gray-700 mb-2">
              🎨 Tema
            </label>
            <select
              id="themeSelect"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Chiaro</option>
              <option value="dark">Scuro</option>
              <option value="auto">Automatico</option>
            </select>
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">ℹ️ Informazioni</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Versione:</strong> 1.2.0</p>
              <p><strong>Ultimo aggiornamento:</strong> Dicembre 2025</p>
              <p><strong>Repository:</strong> Finance Manager</p>
            </div>
          </div>

          {/* Reset Section */}
          <div className="pt-4">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition font-medium"
              >
                🔄 Ripristina Impostazioni Predefinite
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center">
                  Sei sicuro? Tutte le impostazioni torneranno ai valori predefiniti.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
                  >
                    Sì, Ripristina
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
          >
            Salva e Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
