import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_URL } from '../config';

interface MonthlyTrend {
  month: string;
  type: string;
  total: number;
}

interface CategorySpending {
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  total: number;
  count: number;
}

interface YearComparison {
  year: string;
  month: string;
  type: string;
  total: number;
}

export function AdvancedCharts() {
  const { getToken } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [yearData, setYearData] = useState<YearComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadChartData();
  }, [selectedMonths]);

  const loadChartData = async () => {
    try {
      const token = await getToken();

      const [trendsRes, categoriesRes, yearRes] = await Promise.all([
        fetch(`${API_URL}/analytics/trends/monthly?months=${selectedMonths}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/analytics/categories/spending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/analytics/year-comparison`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const trends = await trendsRes.json();
      const categories = await categoriesRes.json();
      const years = await yearRes.json();

      setMonthlyData(trends);
      setCategoryData(categories);
      setYearData(years);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDataWithRange = async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await fetch(
        `${API_URL}/analytics/categories/spending?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const categories = await response.json();
      setCategoryData(categories);
    } catch (error) {
      console.error('Error loading category data:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento grafici...</div>;
  }

  // Process monthly trends for visualization
  const monthlyIncomes: { [key: string]: number } = {};
  const monthlyExpenses: { [key: string]: number } = {};
  monthlyData.forEach((item) => {
    if (item.type === 'INCOME') {
      monthlyIncomes[item.month] = item.total / 100;
    } else if (item.type === 'EXPENSE') {
      monthlyExpenses[item.month] = Math.abs(item.total) / 100;
    }
  });

  const months = Array.from(
    new Set([...Object.keys(monthlyIncomes), ...Object.keys(monthlyExpenses)])
  ).sort();

  const maxAmount = Math.max(
    ...months.map((m) => Math.max(monthlyIncomes[m] || 0, monthlyExpenses[m] || 0)),
    1
  );

  // Process year comparison
  const yearGroups: { [key: string]: YearComparison[] } = {};
  yearData.forEach((item) => {
    const key = `${item.year}-${item.month}`;
    if (!yearGroups[key]) yearGroups[key] = [];
    yearGroups[key].push(item);
  });

  const totalCategorySpending = categoryData.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label htmlFor="trend-period" className="block text-sm font-medium mb-2">Periodo Trend</label>
            <select
              id="trend-period"
              value={selectedMonths}
              onChange={(e) => setSelectedMonths(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              <option value={6}>Ultimi 6 mesi</option>
              <option value={12}>Ultimi 12 mesi</option>
              <option value={24}>Ultimi 24 mesi</option>
            </select>
          </div>

          <div>
            <label htmlFor="date-start" className="block text-sm font-medium mb-2">Da</label>
            <input
              id="date-start"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="date-end" className="block text-sm font-medium mb-2">A</label>
            <input
              id="date-end"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            onClick={loadCategoryDataWithRange}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Filtra
          </button>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Trend Mensili</h3>
        <div className="space-y-4">
          {months.map((month) => {
            const income = monthlyIncomes[month] || 0;
            const expense = monthlyExpenses[month] || 0;
            const balance = income - expense;

            return (
              <div key={month} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{month}</span>
                  <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Bilancio: €{balance.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-600">Entrate</span>
                      <span>€{income.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-6">
                      <div
                        className="bg-green-500 h-full rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(income / maxAmount) * 100}%` }}
                      >
                        {income > 0 && (
                          <span className="text-xs text-white font-medium">
                            {income > maxAmount * 0.1 && `€${income.toFixed(0)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-600">Uscite</span>
                      <span>€{expense.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-6">
                      <div
                        className="bg-red-500 h-full rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(expense / maxAmount) * 100}%` }}
                      >
                        {expense > 0 && (
                          <span className="text-xs text-white font-medium">
                            {expense > maxAmount * 0.1 && `€${expense.toFixed(0)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Spending */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Spese per Categoria</h3>
        <div className="space-y-3">
          {categoryData.slice(0, 10).map((cat) => {
            const percentage = totalCategorySpending > 0
              ? (cat.total / totalCategorySpending) * 100
              : 0;

            return (
              <div key={cat.categoryName} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.categoryIcon || '📊'}</span>
                    <span className="font-medium">{cat.categoryName}</span>
                    <span className="text-sm text-gray-500">({cat.count} transazioni)</span>
                  </div>
                  <span className="font-semibold">€{(cat.total / 100).toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: cat.categoryColor || '#3B82F6'
                    }}
                  />
                </div>
                <div className="text-xs text-gray-600 text-right">
                  {percentage.toFixed(1)}% del totale
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Year over Year Comparison */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Confronto Anno su Anno</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Anno</th>
                <th className="text-right py-2 px-4">Entrate</th>
                <th className="text-right py-2 px-4">Uscite</th>
                <th className="text-right py-2 px-4">Bilancio</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                yearData.reduce((acc: any, item) => {
                  const year = item.year;
                  if (!acc[year]) acc[year] = { income: 0, expense: 0 };
                  if (item.type === 'INCOME') acc[year].income += item.total;
                  if (item.type === 'EXPENSE') acc[year].expense += Math.abs(item.total);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([year, data]: [string, any]) => {
                  const balance = data.income - data.expense;
                  return (
                    <tr key={year} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{year}</td>
                      <td className="py-2 px-4 text-right text-green-600">
                        €{(data.income / 100).toFixed(2)}
                      </td>
                      <td className="py-2 px-4 text-right text-red-600">
                        €{(data.expense / 100).toFixed(2)}
                      </td>
                      <td className={`py-2 px-4 text-right font-semibold ${
                        balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        €{(balance / 100).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
