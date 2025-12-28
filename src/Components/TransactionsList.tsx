import { useEffect, useState } from 'react';
import { TransactionForm } from './TransactionForm';
import { API_URL } from '../config';

interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  accountIcon: string | null;
  amount: number;
  currency: string;
  date: Date;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  status: 'PENDING' | 'CLEARED' | 'RECONCILED' | 'CANCELLED';
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  description: string;
  notes: string | null;
  merchantName: string | null;
  toAccountId: string | null;
  toAccountName: string | null;
}

export function TransactionsList() {
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  
  // Add transaction form
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load accounts
      const accountsRes = await fetch(`${API_URL}/accounts`);
      if (!accountsRes.ok) throw new Error('Failed to fetch accounts');
      const accountsData = await accountsRes.json();
      setAccountsList(accountsData);

      // Load categories
      const categoriesRes = await fetch(`${API_URL}/categories`);
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
      const categoriesData = await categoriesRes.json();
      setCategoriesList(categoriesData);

      // Load transactions
      const txsRes = await fetch(`${API_URL}/transactions`);
      if (!txsRes.ok) throw new Error('Failed to fetch transactions');
      const txsData = await txsRes.json();
      setTransactionsList(txsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Impossibile caricare i dati');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questa transazione?')) return;

    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete transaction');
      
      loadData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Errore nell\'eliminare la transazione');
    }
  }



  function formatCurrency(cents: number, currency: string = 'EUR'): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency
    }).format(amount);
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  // Apply filters
  const filteredTransactions = transactionsList.filter(tx => {
    if (filterType !== 'ALL' && tx.type !== filterType) return false;
    if (filterAccount !== 'ALL' && tx.accountId !== filterAccount) return false;
    if (filterCategory !== 'ALL' && tx.categoryId !== filterCategory) return false;
    if (filterStatus !== 'ALL' && tx.status !== filterStatus) return false;
    if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      if (!tx.merchantName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const typeLabels: Record<string, { label: string; color: string; icon: string }> = {
    INCOME: { label: 'Entrata', color: 'text-green-600 bg-green-50', icon: '📈' },
    EXPENSE: { label: 'Spesa', color: 'text-red-600 bg-red-50', icon: '📉' },
    TRANSFER: { label: 'Trasferimento', color: 'text-blue-600 bg-blue-50', icon: '↔️' }
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'In attesa', color: 'text-orange-600 bg-orange-50' },
    CLEARED: { label: 'Confermato', color: 'text-green-600 bg-green-50' },
    RECONCILED: { label: 'Riconciliato', color: 'text-blue-600 bg-blue-50' },
    CANCELLED: { label: 'Annullato', color: 'text-gray-600 dark:text-gray-300 bg-gray-50' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Errore di connessione</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span className="text-5xl">💸</span>
            <span>Transazioni</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
            Visualizza e filtra le tue transazioni ({filteredTransactions.length} trovate)
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <span className="text-2xl">{showAddForm ? '✕' : '+'}</span>
          <span>{showAddForm ? 'Annulla' : 'Nuova Transazione'}</span>
        </button>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="text-3xl">✨</span>
              <span>Nuova Transazione</span>
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
            >
              Annulla
            </button>
          </div>
          <TransactionForm onSuccess={() => {
            setShowAddForm(false);
            loadData();
          }} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-100 p-3 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="🔍 Cerca per descrizione o negozio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full dark:text-gray-400 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              title="Filtra per tipo"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full dark:text-gray-100 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            >
              <option value="ALL">Tutti i tipi</option>
              <option value="INCOME">Entrate</option>
              <option value="EXPENSE">Spese</option>
              <option value="TRANSFER">Trasferimenti</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              title="Filtra per conto"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full dark:text-gray-100 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            >
              <option value="ALL">Tutti i conti</option>
              {accountsList.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.icon} {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              title="Filtra per categoria"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full dark:text-gray-100 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            >
              <option value="ALL">Tutte le categorie</option>
              {categoriesList.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {(filterType !== 'ALL' || filterAccount !== 'ALL' || filterCategory !== 'ALL' || searchTerm) && (
          <button
            onClick={() => {
              setFilterType('ALL');
              setFilterAccount('ALL');
              setFilterCategory('ALL');
              setFilterStatus('ALL');
              setSearchTerm('');
              setPage(1);
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            <span>✕</span>
            <span>Pulisci filtri</span>
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descrizione</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Conto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Importo</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${typeLabels[tx.type].color}`}>
                      <span className="text-base">{typeLabels[tx.type].icon}</span>
                      {typeLabels[tx.type].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-semibold">{tx.description}</div>
                    {tx.merchantName && (
                      <div className="text-xs text-gray-500 mt-1">{tx.merchantName}</div>
                    )}
                    {tx.type === 'TRANSFER' && tx.toAccountName && (
                      <div className="text-xs text-blue-600 font-medium mt-1">→ {tx.toAccountName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tx.accountIcon}</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{tx.accountName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {tx.categoryName ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tx.categoryIcon}</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{tx.categoryName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${statusLabels[tx.status].color}`}>
                      {statusLabels[tx.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-base font-bold ${
                      tx.type === 'INCOME' ? 'text-green-600' : 
                      tx.type === 'EXPENSE' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all transform hover:scale-110"
                      title="Elimina"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedTransactions.length === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">💸</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Nessuna transazione trovata</h3>
            <p className="text-gray-600 dark:text-gray-300">Prova a modificare i filtri di ricerca</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700 font-medium">
              Pagina {page} di {totalPages} • {filteredTransactions.length} transazioni
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-semibold border-2 border-gray-300 rounded-lg hover:bg-white dark:bg-gray-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Precedente
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-semibold border-2 border-gray-300 rounded-lg hover:bg-white dark:bg-gray-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Successiva →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
