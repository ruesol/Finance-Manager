import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  InteractiveStatCard, 
  InteractiveAccountCard, 
  SimpleBarChart, 
  SimplePieChart 
} from './InteractiveComponents';
import { ExportButton } from './ExportButton';
import { BudgetManager } from './BudgetManager';
import { AdvancedCharts } from './AdvancedCharts';
import { AdvancedSearch } from './AdvancedSearch';
import { API_URL } from '../config';

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accountsCount: number;
  transactionsCount: number;
  accounts: AccountSummary[];
}

interface AccountSummary {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
}

export function Dashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'analytics' | 'search'>('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    accountsCount: 0,
    transactionsCount: 0,
    accounts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for Clerk to load and verify user is signed in
    if (isLoaded && isSignedIn) {
      loadDashboardData();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
      setError('Devi effettuare il login per visualizzare la dashboard.');
    }
  }, [isLoaded, isSignedIn]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Impossibile caricare i dati. Assicurati che il server API sia in esecuzione.');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(cents: number, currency: string = 'EUR'): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Errore di connessione</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-center max-w-md">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  const savings = stats.monthlyIncome - stats.monthlyExpenses;
  const savingsRate = stats.monthlyIncome > 0 
    ? (savings / stats.monthlyIncome * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Export */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Panoramica delle tue finanze</p>
        </div>
        <ExportButton />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Panoramica
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'budgets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 Budget
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📈 Analytics
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'search'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 Ricerca
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">{/* Total Balance */}
        <InteractiveStatCard
          title="Saldo Totale"
          value={formatCurrency(stats.totalBalance)}
          subtitle={`${stats.accountsCount} ${stats.accountsCount === 1 ? 'conto' : 'conti'}`}
          icon="💰"
          gradient="bg-gradient-to-br from-blue-600 to-blue-700"
          detailContent={
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {formatCurrency(stats.totalBalance)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Somma di tutti i tuoi conti attivi
                </p>
              </div>
              <SimpleBarChart
                title="Distribuzione per Conto"
                data={stats.accounts.map(acc => ({
                  label: acc.name,
                  value: acc.balance,
                  color: acc.color
                }))}
              />
            </div>
          }
        />

        {/* Monthly Income */}
        <InteractiveStatCard
          title="Entrate Mensili"
          value={`+${formatCurrency(stats.monthlyIncome)}`}
          subtitle="Questo mese"
          icon="📈"
          gradient="bg-gradient-to-br from-green-500 to-green-600"
          detailContent={
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                <h3 className="text-3xl font-bold text-green-600 mb-2">
                  +{formatCurrency(stats.monthlyIncome)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Totale entrate registrate questo mese
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Media giornaliera
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(Math.round(stats.monthlyIncome / 30))}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Proiezione annuale
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.monthlyIncome * 12)}
                  </div>
                </div>
              </div>
            </div>
          }
        />

        {/* Monthly Expenses */}
        <InteractiveStatCard
          title="Spese Mensili"
          value={`-${formatCurrency(stats.monthlyExpenses)}`}
          subtitle="Questo mese"
          icon="📉"
          gradient="bg-gradient-to-br from-red-500 to-red-600"
          detailContent={
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
                <h3 className="text-3xl font-bold text-red-600 mb-2">
                  -{formatCurrency(stats.monthlyExpenses)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Totale spese registrate questo mese
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Media giornaliera
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    -{formatCurrency(Math.round(stats.monthlyExpenses / 30))}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    % delle entrate
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.monthlyIncome > 0 
                      ? ((stats.monthlyExpenses / stats.monthlyIncome) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          }
        />

        {/* Savings */}
        <InteractiveStatCard
          title="Risparmi"
          value={`${savings >= 0 ? '+' : ''}${formatCurrency(savings)}`}
          subtitle={`${savingsRate.toFixed(1)}% del reddito`}
          icon="🎯"
          gradient={savings >= 0 
            ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
            : 'bg-gradient-to-br from-orange-500 to-orange-600'}
          detailContent={
            <div className="space-y-6">
              <div className={`${
                savings >= 0 
                  ? 'bg-purple-50 dark:bg-purple-900/20' 
                  : 'bg-orange-50 dark:bg-orange-900/20'
              } rounded-xl p-6`}>
                <h3 className={`text-3xl font-bold mb-2 ${
                  savings >= 0 ? 'text-purple-600' : 'text-orange-600'
                }`}>
                  {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {savings >= 0 
                    ? 'Ottimo lavoro! Stai risparmiando questo mese' 
                    : 'Attenzione: stai spendendo più di quanto guadagni'}
                </p>
              </div>
              
              <SimplePieChart
                title="Composizione del Budget"
                data={[
                  {
                    label: 'Entrate',
                    value: stats.monthlyIncome,
                    color: '#10b981'
                  },
                  {
                    label: 'Spese',
                    value: stats.monthlyExpenses,
                    color: '#ef4444'
                  }
                ]}
              />
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Tasso di risparmio
                  </span>
                  <span className={`text-xl font-bold ${
                    savingsRate >= 20 ? 'text-green-600' : 
                    savingsRate >= 10 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      savingsRate >= 20 ? 'bg-green-500' : 
                      savingsRate >= 10 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(savingsRate, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {savingsRate >= 20 && 'Eccellente! Continua così 🎉'}
                  {savingsRate >= 10 && savingsRate < 20 && 'Buono, ma puoi migliorare 👍'}
                  {savingsRate < 10 && 'Prova a ridurre le spese 💪'}
                </p>
              </div>
            </div>
          }
        />
      </div>

      {/* Accounts Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <span className="text-2xl">🏦</span>
          <span>I Tuoi Conti</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            (clicca per dettagli)
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.accounts.map(account => (
            <InteractiveAccountCard
              key={account.id}
              account={account}
              formatCurrency={formatCurrency}
              detailContent={
                <div className="space-y-6">
                  <div 
                    className="rounded-xl p-6"
                    style={{ 
                      background: `linear-gradient(135deg, ${account.color}15, ${account.color}05)`,
                      borderLeft: `6px solid ${account.color}`
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-5xl">{account.icon}</span>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {account.name}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">
                          {account.type}
                        </span>
                      </div>
                    </div>
                    <div className={`text-4xl font-bold ${
                      account.balance >= 0 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(account.balance, account.currency)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Valuta
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {account.currency}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Tipo
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {account.type}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      💡 Suggerimenti
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {account.balance < 0 && (
                        <li>⚠️ Il saldo è negativo, pianifica un deposito</li>
                      )}
                      {account.balance > 1000000 && (
                        <li>✨ Ottimo saldo! Considera investimenti o risparmi</li>
                      )}
                      <li>📊 Controlla regolarmente le transazioni</li>
                      <li>🔒 Mantieni sempre il conto sicuro</li>
                    </ul>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Breakdown */}
        <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-gray-100 p-3 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span>Riepilogo Mensile</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <span className="text-gray-700 font-medium">Entrate</span>
              <span className="font-bold text-green-600 text-lg">
                +{formatCurrency(stats.monthlyIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
              <span className="text-gray-700 font-medium">Spese</span>
              <span className="font-bold text-red-600 text-lg">
                -{formatCurrency(stats.monthlyExpenses)}
              </span>
            </div>
            <div className="border-t-2 border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                <span className="font-bold text-gray-900 text-lg">Saldo</span>
                <span className={`font-bold text-2xl ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-md border-2 border-gray-100 p-3 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">ℹ️</span>
            <span>Informazioni</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <span className="text-gray-700 font-medium">Totale Conti</span>
              <span className="font-bold text-blue-600 text-xl">{stats.accountsCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
              <span className="text-gray-700 font-medium">Totale Transazioni</span>
              <span className="font-bold text-purple-600 text-xl">{stats.transactionsCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-linear-to-r from-green-50 to-yellow-50 hover:from-green-100 hover:to-yellow-100 transition-colors">
              <span className="text-gray-700 font-medium">Tasso di Risparmio</span>
              <span className={`font-bold text-xl ${savingsRate >= 20 ? 'text-green-600' : 'text-orange-600'}`}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {activeTab === 'budgets' && <BudgetManager />}
      {activeTab === 'analytics' && <AdvancedCharts />}
      {activeTab === 'search' && <AdvancedSearch />}
    </div>
  );
}
