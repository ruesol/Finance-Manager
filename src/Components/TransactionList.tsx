import { Transaction } from "../Transaction";
import { TransactionType } from "../Transaction";

interface Props {
    transactions: Transaction[];
    loading: boolean;
}

export function TransactionList({ transactions, loading }: Props) {
    if (loading) return <div className="text-center p-10 text-gray-500">Loading...</div>;

    const formatCurrency = (cents: number, currency: string) => {
        return new Intl.NumberFormat('it-IT', { 
            style: 'currency', 
            currency: currency 
        }).format(cents / 100);
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => {
                        const isExpense = tx.type === TransactionType.EXPENSE;
                        const amountColor = isExpense ? "text-red-600" : "text-green-600";
                        const sign = isExpense ? "-" : "+";

                        return (
                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tx.date.toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {tx.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        {tx.category}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold ${amountColor}`}>
                                    {sign} {formatCurrency(tx.amount.getAmount(), tx.amount.getCurrency())}
                                </td>
                            </tr>
                        );
                    })}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                                No transactions found. Start by adding one above.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}