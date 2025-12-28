import { useState, useEffect } from 'react';
import { Account, AccountState, AccountType } from '../Account';
import { Money } from '../Money';

export function AccountCard() {
  const [account, setAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialize account from localStorage or create new
  useEffect(() => {
    const saved = localStorage.getItem('mainAccount');
    if (saved) {
      const state: AccountState = JSON.parse(saved);
      // Recreate Money object
      const balanceData = state.balance as any;
      state.balance = Money.fromCents(balanceData.amount, balanceData.currency);
      state.createdAt = new Date(state.createdAt);
      state.updatedAt = new Date(state.updatedAt);
      setAccount(new Account(state));
    } else {
      // Create default account
      const initialState: AccountState = {
        id: 'main-account',
        name: 'Main Account',
        type: AccountType.Checking,
        balance: Money.fromCents(0, 'EUR'),
        currency: 'EUR',
        description: 'Your main checking account',
        icon: '💰',
        color: '#3B82F6',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const newAccount = new Account(initialState);
      setAccount(newAccount);
      saveAccount(newAccount);
    }
  }, []);

  const saveAccount = (acc: Account) => {
    localStorage.setItem('mainAccount', JSON.stringify({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      balance: { amount: acc.balance.getAmount(), currency: acc.balance.getCurrency() },
      currency: acc.currency,
      description: acc.description,
      icon: acc.icon,
      color: acc.color,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt
    }));
  };

  const handleDeposit = () => {
    if (!account || !amount) return;
    
    const cents = Math.round(parseFloat(amount) * 100);
    const result = account.deposit(cents);
    
    if (result.success) {
      setAccount(new Account(account));
      saveAccount(account);
      setMessage({ text: `✅ Deposited ${result.value.toString()}`, type: 'success' });
      setAmount('');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ text: `❌ ${result.error.message}`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleWithdraw = () => {
    if (!account || !amount) return;
    
    const cents = Math.round(parseFloat(amount) * 100);
    const result = account.withdraw(cents);
    
    if (result.success) {
      setAccount(new Account(account));
      saveAccount(account);
      setMessage({ text: `✅ Withdrew ${result.value.toString()}`, type: 'success' });
      setAmount('');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ text: `❌ ${result.error.message}`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!account) return <div>Loading account...</div>;

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white mb-6">
      {/* Account Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-blue-100 text-sm font-medium">Account Balance</p>
          <h2 className="text-4xl font-bold mt-1">{account.balance.toString()}</h2>
        </div>
        <div className="text-5xl">{account.icon}</div>
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-gray-700/10 backdrop-blur-sm rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-100 text-xs">Account Name</p>
            <p className="font-semibold">{account.name}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-xs">Type</p>
            <p className="font-semibold">{account.type}</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-400/30' 
            : 'bg-red-500/20 border border-red-400/30'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white dark:bg-gray-700/10 backdrop-blur-sm rounded-lg p-4">
        <label className="block text-sm font-medium text-blue-100 mb-2">
          Amount (€)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-gray-700/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={handleDeposit}
            disabled={!amount}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200"
          >
            + Deposit
          </button>
          <button
            onClick={handleWithdraw}
            disabled={!amount}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200"
          >
            - Withdraw
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setAmount('10')}
            className="px-3 py-1 bg-white dark:bg-gray-700/10 hover:bg-white dark:bg-gray-700/20 rounded text-sm transition-colors"
          >
            €10
          </button>
          <button
            onClick={() => setAmount('50')}
            className="px-3 py-1 bg-white dark:bg-gray-700/10 hover:bg-white dark:bg-gray-700/20 rounded text-sm transition-colors"
          >
            €50
          </button>
          <button
            onClick={() => setAmount('100')}
            className="px-3 py-1 bg-white dark:bg-gray-700/10 hover:bg-white dark:bg-gray-700/20 rounded text-sm transition-colors"
          >
            €100
          </button>
          <button
            onClick={() => setAmount('500')}
            className="px-3 py-1 bg-white dark:bg-gray-700/10 hover:bg-white dark:bg-gray-700/20 rounded text-sm transition-colors"
          >
            €500
          </button>
        </div>
      </div>
    </div>
  );
}
