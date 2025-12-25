export enum AccountType {
    Checking = 'CHECKING',
    Savings = 'SAVINGS',
    Wallet = 'WALLET',
    Investment = 'INVESTMENT',
    CreditCard = 'CREDIT_CARD'
}

export type Result<T, E = Error> = 
    | { success: true; value: T }
    | { success: false; error: E };

import { Money } from './Money';

export interface AccountState {
    id: string;
    name: string;
    type: AccountType;
    balance: Money;
    currency: string;
    
    description?: string;
    icon?: string;
    color?: string;
    
    createdAt: Date;
    updatedAt: Date;
}

export class Account implements AccountState {
    id!: string;
    name!: string;
    type!: AccountType;
    balance!: Money;
    currency!: string;
    description?: string;
    icon?: string;
    color?: string;
    createdAt!: Date;
    updatedAt!: Date;

    constructor(state: AccountState) {
        Object.assign(this, state);
    }

    deposit(amount: number): Result<Money> {
        if (amount <= 0) {
            return { success: false, error: new Error("Amount must be positive") };
        }
        
        this.balance = this.balance.add(Money.fromCents(amount, this.currency));
        this.updatedAt = new Date();
        
        return { success: true, value: this.balance };
    }

    withdraw(amount: number): Result<Money> {
        if (amount <= 0) {
            return { success: false, error: new Error("Amount must be positive") };
        }

        if (this.type !== AccountType.CreditCard && this.balance.subtract(Money.fromCents(amount, this.currency)).getAmount() < 0) {
             return { success: false, error: new Error("Insufficient funds") };
        }

        this.balance = this.balance.subtract(Money.fromCents(amount, this.currency));
        this.updatedAt = new Date();

        return { success: true, value: this.balance };
    }

    getBalance(): Money {
        return this.balance;
    }
}
