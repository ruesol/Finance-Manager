import { TransactionRepository } from "../Ports/TransactionRepository";
import { Transaction } from "../Transaction";
import { Money } from "../Money";
import { API_URL } from "../config";

interface ApiTransactionDto {
    id: string;
    accountId: string;
    amount: number;
    currency: string;
    date: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    status: 'PENDING' | 'CLEARED' | 'RECONCILED' | 'CANCELLED';
    categoryId: string | null;
    categoryName: string | null;
    categoryIcon: string | null;
    description: string;
    notes: string | null;
    merchantName: string | null;
    createdAt: string;
    updatedAt: string;
}

export class HttpTransactionRepository implements TransactionRepository {
    private readonly baseUrl = API_URL;

    async getAll(): Promise<Transaction[]> {
        const res = await fetch(`${this.baseUrl}/transactions`);
        if (!res.ok) {
            throw new Error(`Failed to fetch transactions: ${res.statusText}`);
        }
        const data: ApiTransactionDto[] = await res.json();
        
        return data.map((tx): Transaction => ({
            id: tx.id,
            accountId: tx.accountId,
            amount: Money.fromCents(tx.amount, tx.currency),
            date: new Date(tx.date),
            category: tx.categoryName || '',
            tags: [],
            description: tx.description,
            merchantName: tx.merchantName ?? undefined,
            externalReferenceId: undefined,
            type: tx.type.toLowerCase() as Transaction['type'],
            status: tx.status.toLowerCase() as Transaction['status'],
            createdAt: new Date(tx.createdAt || tx.date),
            updatedAt: new Date(tx.updatedAt || tx.date)
        }));
    }

    async save(transaction: Transaction): Promise<void> {
        const localDate = new Date(transaction.date);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const res = await fetch(`${this.baseUrl}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accountId: transaction.accountId,
                amount: transaction.amount.getAmount(),
                currency: transaction.amount.getCurrency(),
                date: dateString,
                type: transaction.type,
                status: transaction.status,
                description: transaction.description,
                categoryId: null,
                notes: null,
                merchantName: transaction.merchantName || null
            })
        });

        if (!res.ok) {
            throw new Error(`Failed to save transaction: ${res.statusText}`);
        }
    }
}