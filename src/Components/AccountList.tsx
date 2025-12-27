import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3001/api';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  accountNumber: string | null;
}

export function AccountList() {
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING' as const,
    balance: '',
    currency: 'EUR',
    description: '',
    icon: '🏦',
    color: '#3B82F6',
    accountNumber: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/accounts`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      
      const result = await response.json();
      setAccountsList(result);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Impossibile caricare i conti');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const balanceInCents = Math.round(parseFloat(formData.balance || '0') * 100);

      const payload = {
        name: formData.name,
        type: formData.type,
        balance: balanceInCents,
        currency: formData.currency,
        description: formData.description || null,
        icon: formData.icon || null,
        color: formData.color || null,
        accountNumber: formData.accountNumber || null
      };

      if (editingAccount) {
        // Update
        const response = await fetch(`${API_URL}/accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Failed to update account');
      } else {
        // Create
        const response = await fetch(`${API_URL}/accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Failed to create account');
      }

      // Reset form
      resetForm();
      loadAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Errore nel salvare il conto');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo conto?')) return;

    try {
      const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete account');
      
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Errore nell\'eliminare il conto');
    }
  }

  function startEdit(account: Account) {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type as any,
      balance: (account.balance / 100).toString(),
      currency: account.currency,
      description: account.description || '',
      icon: account.icon || '🏦',
      color: account.color || '#3B82F6',
      accountNumber: account.accountNumber || ''
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'CHECKING',
      balance: '',
      currency: 'EUR',
      description: '',
      icon: '🏦',
      color: '#3B82F6',
      accountNumber: ''
    });
    setEditingAccount(null);
    setShowForm(false);
  }

  function formatCurrency(cents: number, currency: string = 'EUR'): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency
    }).format(amount);
  }

  const accountTypeLabels: Record<string, string> = {
    CHECKING: 'Conto Corrente',
    SAVINGS: 'Conto Risparmio',
    WALLET: 'Portafoglio',
    INVESTMENT: 'Investimenti',
    CREDIT_CARD: 'Carta di Credito'
  };

  const iconOptions = ['🏦', '💰', '💳', '👛', '📈', '🏡', '🚗', '💎', '🎯'];

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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Errore di connessione</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadAccounts}
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-5xl">🏦</span>
            <span>Conti</span>
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Gestisci i tuoi conti bancari e wallet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 ${
            showForm
              ? 'bg-gray-500 hover:bg-gray-600 text-white'
              : 'bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
          }`}
        >
          {showForm ? '✕ Annulla' : '+ Nuovo Conto'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingAccount ? 'Modifica Conto' : 'Nuovo Conto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="es. Conto Corrente"
                />
              </div>

              <div>
                <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  id="account-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CHECKING">Conto Corrente</option>
                  <option value="SAVINGS">Conto Risparmio</option>
                  <option value="WALLET">Portafoglio</option>
                  <option value="INVESTMENT">Investimenti</option>
                  <option value="CREDIT_CARD">Carta di Credito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Iniziale *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valuta *
                </label>
                <select
                  aria-label="Valuta"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icona
                </label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 text-2xl rounded-lg border-2 transition-colors ${
                        formData.icon === icon
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Colore
                </label>
                <input
                  type="color"
                  aria-label="Colore"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Conto
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="es. IT60X0542811101000000123456"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Note opzionali..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editingAccount ? 'Salva Modifiche' : 'Crea Conto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountsList.map(account => (
          <div
            key={account.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            style={{ borderLeftWidth: '4px', borderLeftColor: account.color || '#3B82F6' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{account.icon || '💰'}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{account.name}</h3>
                  <span className="text-xs text-gray-500 uppercase">
                    {accountTypeLabels[account.type] || account.type}
                  </span>
                </div>
              </div>
            </div>

            {account.description && (
              <p className="text-sm text-gray-600 mb-3">{account.description}</p>
            )}

            {account.accountNumber && (
              <p className="text-xs text-gray-500 mb-3 font-mono">{account.accountNumber}</p>
            )}

            <div className={`text-2xl font-bold mb-4 ${account.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(account.balance, account.currency)}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startEdit(account)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                ✏️ Modifica
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
              >
                🗑️ Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

      {accountsList.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun conto trovato</h3>
          <p className="text-gray-600 mb-4">Crea il tuo primo conto per iniziare</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Crea Primo Conto
          </button>
        </div>
      )}
    </div>
  );
}
