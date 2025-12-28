import { useState, useEffect } from "react";
import { useServices } from "../Context/ServiceContext";
import { Transaction, TransactionType, TransactionStatus } from "../Transaction";
import { Money } from "../Money";
import { API_URL } from "../config";

interface Props {
    onSuccess: () => void;
}

interface Account {
    id: string;
    name: string;
    icon?: string;
}

interface Category {
    id: string;
    name: string;
    icon?: string;
}

export function TransactionForm({ onSuccess }: Props) {
    const { transactionRepo } = useServices();
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [accountId, setAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accountsRes, categoriesRes] = await Promise.all([
                    fetch(`${API_URL}/accounts`),
                    fetch(`${API_URL}/categories`)
                ]);
                
                const accountsData = await accountsRes.json();
                const categoriesData = await categoriesRes.json();
                
                setAccounts(accountsData);
                setCategories(categoriesData);
                
                if (accountsData.length > 0) {
                    setAccountId(accountsData[0].id);
                }
                if (categoriesData.length > 0) {
                    setCategoryId(categoriesData[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch accounts/categories:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || !description || !accountId) return;

        try {
            const cents = Math.round(parseFloat(amount) * 100);
            const selectedCategory = categories.find(c => c.id === categoryId);

            const newTx: Transaction = {
                id: crypto.randomUUID(),
                accountId: accountId,
                amount: Money.fromCents(cents, "EUR"),
                date: new Date(),
                category: selectedCategory?.name || "General",
                tags: [],
                description: description,
                type: type,
                status: TransactionStatus.CLEARED,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await transactionRepo.save(newTx);
            setAmount("");
            setDescription("");
            onSuccess();
        } catch (error) {
            console.error('Error creating transaction:', error);
            alert('Errore nella creazione della transazione');
        }
    };

    if (loading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                
                {/* Account Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                    <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        aria-label="Account"
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.icon} {acc.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Category Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        aria-label="Category"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Description Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700"
                        placeholder="e.g. Supermarket"
                    />
                </div>

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (€)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700"
                        placeholder="0.00"
                    />
                </div>

                {/* Type & Submit */}
                <div className="flex items-end gap-2">
                    <select 
                        value={type}
                        onChange={(e) => setType(e.target.value as TransactionType)}
                        className="p-2 border border-gray-300 rounded bg-white dark:bg-gray-700"
                        aria-label="Transaction type"
                    >
                        <option value={TransactionType.EXPENSE}>Expense</option>
                        <option value={TransactionType.INCOME}>Income</option>
                    </select>
                    
                    <button 
                        type="submit"
                        className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                        Add
                    </button>
                </div>
            </div>
        </form>
    );
}