import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3001/api';

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
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/dashboard/stats`);
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Errore di connessione</h3>
        <p className="text-gray-600 mb-4 text-center max-w-md">{error}</p>
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Panoramica delle tue finanze</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {/* Total Balance */}
        <div className="group bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-3 text-white transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Saldo Totale</span>
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">💰</span>
          </div>
          <div className="text-4xl font-bold mb-2">
            {formatCurrency(stats.totalBalance)}
          </div>
          <div className="text-blue-100 text-sm font-medium">
            {stats.accountsCount} {stats.accountsCount === 1 ? 'conto' : 'conti'}
          </div>
        </div>

        {/* Monthly Income */}
        <div className="group bg-linear-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-3 text-white transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-100 text-sm font-semibold uppercase tracking-wide">Entrate Mensili</span>
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">📈</span>
          </div>
          <div className="text-4xl font-bold mb-2">
            +{formatCurrency(stats.monthlyIncome)}
          </div>
          <div className="text-green-100 text-sm font-medium">
            Questo mese
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="group bg-linear-to-br from-red-500 to-red-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-3 text-white transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-100 text-sm font-semibold uppercase tracking-wide">Spese Mensili</span>
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">📉</span>
          </div>
          <div className="text-4xl font-bold mb-2">
            -{formatCurrency(stats.monthlyExpenses)}
          </div>
          <div className="text-red-100 text-sm font-medium">
            Questo mese
          </div>
        </div>

        {/* Savings */}
        <div className={`group bg-linear-to-br ${savings >= 0 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-3 text-white transform hover:-translate-y-1`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`${savings >= 0 ? 'text-purple-100' : 'text-orange-100'} text-sm font-semibold uppercase tracking-wide`}>Risparmi</span>
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">🎯</span>
          </div>
          <div className="text-4xl font-bold mb-2">
            {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
          </div>
          <div className={`${savings >= 0 ? 'text-purple-100' : 'text-orange-100'} text-sm font-medium`}>
            {savingsRate.toFixed(1)}% del reddito
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">I Tuoi Conti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.accounts.map(account => (
            <div
              key={account.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              style={{ borderLeftWidth: '4px', borderLeftColor: account.color }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{account.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <span className="text-xs text-gray-500 uppercase">{account.type}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-2xl font-bold ${account.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatCurrency(account.balance, account.currency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Breakdown */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-3 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
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
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-3 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
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
    </div>
  );
}
