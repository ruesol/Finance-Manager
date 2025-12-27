import { ServiceProvider } from "./Context/ServiceContext";
import { TransactionList } from "./Components/TransactionList";
import { TransactionForm } from "./Components/TransactionForm";
import { useTransactions } from "./hooks/useTransactions";

// Creiamo un wrapper interno per poter usare l'hook useTransactions 
// (che richiede di essere DENTRO il ServiceProvider)
function Dashboard() {
    const { transactions, loading, refresh } = useTransactions();

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Finance Manager <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded ml-2">Beta 0.0.1</span></h1>
                <p className="text-gray-500 mt-2">Manage your personal finances locally.</p>
            </header>

            <TransactionForm onSuccess={refresh} />
            <TransactionList transactions={transactions} loading={loading} />
        </div>
    );
}

function App() {
  return (
    <ServiceProvider>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
      </div>
    </ServiceProvider>
  );
}

export default App;