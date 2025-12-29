import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_URL } from '../config';

interface SearchFilters {
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  categoryId: string;
  accountId: string;
  type: string;
  status: string;
  searchText: string;
  sortBy: string;
  sortOrder: string;
}

interface Transaction {
  transaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: string;
    status: string;
    notes?: string;
    merchantName?: string;
  };
  category?: {
    name: string;
    icon?: string;
    color?: string;
  };
  account?: {
    name: string;
  };
}

export function AdvancedSearch() {
  const { getToken } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    categoryId: '',
    accountId: '',
    type: '',
    status: '',
    searchText: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [results, setResults] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const token = await getToken();
      const [categoriesRes, accountsRes] = await Promise.all([
        fetch(`${API_URL}/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/accounts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setCategories(await categoriesRes.json());
      setAccounts(await accountsRes.json());
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const token = await getToken();
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(
        `${API_URL}/transactions/search?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      categoryId: '',
      accountId: '',
      type: '',
      status: '',
      searchText: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setResults([]);
    setSearched(false);
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ricerca Avanzata Transazioni</h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow space-y-4">
        {/* Date Range */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filter-date-start" className="block text-sm font-medium mb-2">Data Inizio</label>
            <input
              id="filter-date-start"
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="filter-date-end" className="block text-sm font-medium mb-2">Data Fine</label>
            <input
              id="filter-date-end"
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Amount Range */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filter-min-amount" className="block text-sm font-medium mb-2">Importo Minimo (€)</label>
            <input
              id="filter-min-amount"
              type="number"
              step="0.01"
              value={filters.minAmount}
              onChange={(e) => updateFilter('minAmount', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="filter-max-amount" className="block text-sm font-medium mb-2">Importo Massimo (€)</label>
            <input
              id="filter-max-amount"
              type="number"
              step="0.01"
              value={filters.maxAmount}
              onChange={(e) => updateFilter('maxAmount', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Category and Account */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search-category" className="block text-sm font-medium mb-2">Categoria</label>
            <select
              id="search-category"
              value={filters.categoryId}
              onChange={(e) => updateFilter('categoryId', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Tutte</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="search-account" className="block text-sm font-medium mb-2">Conto</label>
            <select
              id="search-account"
              value={filters.accountId}
              onChange={(e) => updateFilter('accountId', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Tutti</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.icon} {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type and Status */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search-type" className="block text-sm font-medium mb-2">Tipo</label>
            <select
              id="search-type"
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Tutti</option>
              <option value="INCOME">Entrata</option>
              <option value="EXPENSE">Uscita</option>
              <option value="TRANSFER">Trasferimento</option>
            </select>
          </div>
          <div>
            <label htmlFor="search-status" className="block text-sm font-medium mb-2">Stato</label>
            <select
              id="search-status"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Tutti</option>
              <option value="PENDING">In Attesa</option>
              <option value="CLEARED">Confermato</option>
              <option value="RECONCILED">Riconciliato</option>
              <option value="CANCELLED">Cancellato</option>
            </select>
          </div>
        </div>

        {/* Text Search */}
        <div>
          <label htmlFor="search-text" className="block text-sm font-medium mb-2">Cerca nel testo</label>
          <input
            id="search-text"
            type="text"
            value={filters.searchText}
            onChange={(e) => updateFilter('searchText', e.target.value)}
            placeholder="Descrizione, note, commerciante..."
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Sort Options */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search-sortby" className="block text-sm font-medium mb-2">Ordina per</label>
            <select
              id="search-sortby"
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="date">Data</option>
              <option value="amount">Importo</option>
            </select>
          </div>
          <div>
            <label htmlFor="search-sortorder" className="block text-sm font-medium mb-2">Ordine</label>
            <select
              id="search-sortorder"
              value={filters.sortOrder}
              onChange={(e) => updateFilter('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ricerca...' : '🔍 Cerca'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Risultati: {results.length} transazioni
          </h3>

          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nessuna transazione trovata con i criteri specificati
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((item) => {
                const { transaction, category, account } = item;
                const isIncome = transaction.type === 'INCOME';
                const amount = transaction.amount / 100;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{category?.icon || '💰'}</span>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString('it-IT')} •{' '}
                          {category?.name || 'Nessuna categoria'} •{' '}
                          {account?.name || 'Account'}
                        </div>
                        {transaction.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            📝 {transaction.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}€{Math.abs(amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">{transaction.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
