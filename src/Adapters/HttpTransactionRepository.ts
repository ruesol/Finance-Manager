import { TransactionRepository } from "../Ports/TransactionRepository";
import { Transaction } from "../Transaction";
import { Money } from "../Money";

export class HttpTransactionRepository implements TransactionRepository {
    private readonly baseUrl = 'http://localhost:3001/api';

    async getAll(): Promise<Transaction[]> {
        const res = await fetch(`${this.baseUrl}/transactions`);
        if (!res.ok) {
            throw new Error(`Failed to fetch transactions: ${res.statusText}`);
        }
        const data = await res.json();
        
        return data.map((tx: any): Transaction => ({
            id: tx.id,
            accountId: tx.accountId,
            amount: Money.fromCents(tx.amount, tx.currency),
            date: new Date(tx.date),
            category: tx.categoryName || '',
            tags: [],
            description: tx.description,
            merchantName: tx.merchantName,
            externalReferenceId: undefined,
            type: tx.type,
            status: tx.status,
            createdAt: new Date(tx.createdAt || tx.date),
            updatedAt: new Date(tx.updatedAt || tx.date)
        }));
    }

    async save(transaction: Transaction): Promise<void> {
        const res = await fetch(`${this.baseUrl}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accountId: transaction.accountId,
                amount: transaction.amount.getAmount(),
                currency: transaction.amount.getCurrency(),
                date: transaction.date.toISOString(),
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