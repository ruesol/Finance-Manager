import { TransactionRepository } from "../Ports/TransactionRepository";
import { Transaction } from "../Transaction";

export class InMemoryTransactionRepository implements TransactionRepository {
    private transactions: Transaction[] = [];

    async getAll(): Promise<Transaction[]> {
        return [...this.transactions];
    }

    async save(transaction: Transaction): Promise<void> {
        this.transactions.push(transaction);
    }
}