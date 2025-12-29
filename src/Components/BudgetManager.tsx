import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_URL } from '../config';

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  spending?: {
    spent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
  };
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export function BudgetManager() {
  const { getToken } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'MONTHLY' as const,
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await getToken();
      
      const [budgetsRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/budgets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const budgetsData = await budgetsRes.json();
      const categoriesData = await categoriesRes.json();

      // Load spending for each budget
      const budgetsWithSpending = await Promise.all(
        budgetsData.map(async (item: any) => {
          try {
            const spendingRes = await fetch(
              `${API_URL}/budgets/${item.budget.id}/spending`,
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
            const spending = await spendingRes.json();
            return { ...item, spending };
          } catch {
            return item;
          }
        })
      );

      setBudgets(budgetsWithSpending);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: Math.round(parseFloat(formData.amount) * 100)
        })
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          categoryId: '',
          amount: '',
          period: 'MONTHLY',
          startDate: new Date().toISOString().split('T')[0]
        });
        loadData();
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo budget?')) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${API_URL}/budgets/${budgetId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Budget Mensili</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Annulla' : '+ Nuovo Budget'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label htmlFor="budget-category" className="block text-sm font-medium mb-2">Categoria</label>
            <select
              id="budget-category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Seleziona categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="budget-amount" className="block text-sm font-medium mb-2">Importo (€)</label>
            <input
              id="budget-amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="budget-period" className="block text-sm font-medium mb-2">Periodo</label>
            <select
              id="budget-period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="MONTHLY">Mensile</option>
              <option value="QUARTERLY">Trimestrale</option>
              <option value="YEARLY">Annuale</option>
            </select>
          </div>

          <div>
            <label htmlFor="budget-start-date" className="block text-sm font-medium mb-2">Data Inizio</label>
            <input
              id="budget-start-date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Crea Budget
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nessun budget configurato. Crea il tuo primo budget!
          </div>
        ) : (
          budgets.map((item) => {
            const { budget, category, spending } = item;
            const percentage = spending?.percentage || 0;
            const isOverBudget = spending?.isOverBudget || false;

            return (
              <div
                key={budget.id}
                className="bg-white p-6 rounded-lg shadow space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category?.icon || '📊'}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{category?.name || 'Categoria'}</h3>
                      <p className="text-sm text-gray-600">
                        {budget.period === 'MONTHLY' ? 'Mensile' :
                         budget.period === 'QUARTERLY' ? 'Trimestrale' : 'Annuale'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>

                {spending && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Speso: €{(spending.spent / 100).toFixed(2)}</span>
                      <span>Budget: €{(budget.amount / 100).toFixed(2)}</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isOverBudget
                            ? 'bg-red-600'
                            : percentage > 80
                            ? 'bg-yellow-500'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-sm font-medium">
                      <span className={isOverBudget ? 'text-red-600' : 'text-gray-700'}>
                        {percentage.toFixed(1)}% utilizzato
                      </span>
                      <span className={isOverBudget ? 'text-red-600' : 'text-green-600'}>
                        {isOverBudget ? 'Superato!' : `€${(spending.remaining / 100).toFixed(2)} disponibili`}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
