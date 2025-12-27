import { Transaction } from "../Transaction";

export interface TransactionRepository {
    getAll(): Promise<Transaction[]>;
    save(transaction: Transaction): Promise<void>;
}