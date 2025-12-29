import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_URL } from '../config';

interface ExchangeRates {
  base: string;
  date: string;
  rates: { [key: string]: number };
}

const COMMON_CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }
];

export function CurrencyConverter() {
  const { getToken } = useAuth();
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('100.00');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [converted, setConverted] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    loadRates();
  }, [fromCurrency]);

  const loadRates = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${API_URL}/currency/rates?base=${fromCurrency}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error('Error loading rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    try {
      const token = await getToken();
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      const response = await fetch(`${API_URL}/currency/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountInCents,
          from: fromCurrency,
          to: toCurrency
        })
      });

      const data = await response.json();
      setConverted(data.converted / 100);
      setRate(data.rate);
    } catch (error) {
      console.error('Error converting:', error);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConverted(null);
    setRate(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Convertitore Valute</h2>
        <p className="text-gray-600 mt-1">Converti importi tra diverse valute</p>
      </div>

      {/* Converter */}
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        {/* Amount Input */}
        <div>
          <label htmlFor="convert-amount" className="block text-sm font-medium mb-2">Importo</label>
          <input
            id="convert-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 text-2xl border rounded-lg"
            placeholder="100.00"
          />
        </div>

        {/* From Currency */}
        <div>
          <label htmlFor="from-currency" className="block text-sm font-medium mb-2">Da</label>
          <select
            id="from-currency"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {COMMON_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            title="Scambia valute"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label htmlFor="to-currency" className="block text-sm font-medium mb-2">A</label>
          <select
            id="to-currency"
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {COMMON_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Caricamento...' : 'Converti'}
        </button>

        {/* Result */}
        {converted !== null && rate !== null && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {converted.toFixed(2)} {toCurrency}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Tasso: 1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {amount} {fromCurrency} × {rate.toFixed(4)} = {converted.toFixed(2)} {toCurrency}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exchange Rates Table */}
      {rates && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">
            Tassi di Cambio (Base: {rates.base})
          </h3>
          <div className="text-xs text-gray-500 mb-3">
            Aggiornato: {new Date(rates.date).toLocaleDateString('it-IT')}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {COMMON_CURRENCIES
              .filter(c => c.code !== rates.base)
              .map((currency) => {
                const currencyRate = rates.rates[currency.code];
                if (!currencyRate) return null;

                return (
                  <div
                    key={currency.code}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{currency.symbol}</span>
                      <div>
                        <div className="font-medium">{currency.code}</div>
                        <div className="text-xs text-gray-500">{currency.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{currencyRate.toFixed(4)}</div>
                      <div className="text-xs text-gray-500">
                        1 {rates.base} = {currencyRate.toFixed(2)} {currency.code}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="text-sm">
            <p className="font-medium mb-1">Informazioni sui tassi di cambio</p>
            <p className="text-gray-600">
              I tassi vengono aggiornati quotidianamente e sono forniti da exchangerate-api.com.
              Per transazioni finanziarie importanti, verifica sempre i tassi con la tua banca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
