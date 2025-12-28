import { useState } from "react";
import { useServices } from "../Context/ServiceContext";
import { Transaction, TransactionType, TransactionStatus } from "../Transaction";
import { Money } from "../Money";

interface Props {
    onSuccess: () => void;
}

export function TransactionForm({ onSuccess }: Props) {
    const { transactionRepo } = useServices();
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || !description) return;

        // Conversione "Naive" per ora (poi useremo una libreria di input mask)
        // 10.50 -> 1050
        const cents = Math.round(parseFloat(amount) * 100);

        const newTx: Transaction = {
            id: crypto.randomUUID(),
            accountId: "default-account", // Hardcoded per ora
            amount: Money.fromCents(cents, "EUR"),
            date: new Date(),
            category: "General",
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
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Description Input */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="e.g. Supermarket"
                    />
                </div>

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (€)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
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