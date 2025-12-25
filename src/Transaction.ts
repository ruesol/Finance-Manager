import { Money } from './Money';

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
    TRANSFER = 'TRANSFER'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    CLEARED = 'CLEARED'
}

export interface Transaction {
    id: string;
    accountId: string;
    amount: Money;
    date: Date;
    category: string;
    tags: string[];
    description: string;
    merchantName?: string;
    externalReferenceId?: string;
    type: TransactionType;
    status: TransactionStatus;
    createdAt: Date;
    updatedAt: Date;
}
