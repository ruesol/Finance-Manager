// Simula ciò che vede l'utente
const formatCurrency = (cents, currency = 'EUR') => {
  const amount = cents / 100;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency
  }).format(amount);
};

// Valori dall'API (come verificato)
const dashboardData = {
  totalBalance: 1945550,  // centesimi
  monthlyIncome: 80000,   // centesimi
  monthlyExpenses: 172950 // centesimi
};

console.log('=== DASHBOARD ===');
console.log('Saldo totale:', formatCurrency(dashboardData.totalBalance));
console.log('Entrate mensili:', formatCurrency(dashboardData.monthlyIncome));
console.log('Spese mensili:', formatCurrency(dashboardData.monthlyExpenses));
console.log('Risparmio:', formatCurrency(dashboardData.monthlyIncome - dashboardData.monthlyExpenses));

// Transazione esempio
const transaction = {
  description: 'Caffè e brioche',
  amount: 450,
  currency: 'EUR',
  type: 'EXPENSE'
};

console.log('\n=== TRANSAZIONE ===');
console.log(`${transaction.description}: ${formatCurrency(transaction.amount, transaction.currency)}`);
