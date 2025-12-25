import { Transaction, TransactionType, TransactionStatus } from '../Transaction';
import { Money } from '../Money';

describe('Transaction', () => {
    let baseTransaction: Transaction;

    beforeEach(() => {
        baseTransaction = {
            id: 'txn-1',
            accountId: 'acc-1',
            amount: Money.fromCents(5000, 'EUR'),
            date: new Date('2025-01-15'),
            category: 'Groceries',
            tags: ['food', 'supermarket'],
            description: 'Weekly shopping',
            type: TransactionType.EXPENSE,
            status: TransactionStatus.CLEARED,
            createdAt: new Date('2025-01-15T10:00:00Z'),
            updatedAt: new Date('2025-01-15T10:00:00Z')
        };
    });

    describe('Transaction Types', () => {
        it('should create income transaction', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                id: 'txn-income',
                type: TransactionType.INCOME,
                category: 'Salary',
                description: 'Monthly salary',
                amount: Money.fromCents(250000, 'EUR')
            };

            expect(transaction.type).toBe(TransactionType.INCOME);
            expect(transaction.amount.getAmount()).toBe(250000);
        });

        it('should create expense transaction', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                type: TransactionType.EXPENSE
            };

            expect(transaction.type).toBe(TransactionType.EXPENSE);
        });

        it('should create transfer transaction', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                type: TransactionType.TRANSFER,
                category: 'Transfer',
                description: 'Transfer to savings'
            };

            expect(transaction.type).toBe(TransactionType.TRANSFER);
        });
    });

    describe('Transaction Status', () => {
        it('should create pending transaction', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                status: TransactionStatus.PENDING
            };

            expect(transaction.status).toBe(TransactionStatus.PENDING);
        });

        it('should create cleared transaction', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                status: TransactionStatus.CLEARED
            };

            expect(transaction.status).toBe(TransactionStatus.CLEARED);
        });
    });

    describe('Transaction Properties', () => {
        it('should have all required properties', () => {
            expect(baseTransaction.id).toBe('txn-1');
            expect(baseTransaction.accountId).toBe('acc-1');
            expect(baseTransaction.amount.getAmount()).toBe(5000);
            expect(baseTransaction.date).toEqual(new Date('2025-01-15'));
            expect(baseTransaction.category).toBe('Groceries');
            expect(baseTransaction.tags).toEqual(['food', 'supermarket']);
            expect(baseTransaction.description).toBe('Weekly shopping');
            expect(baseTransaction.type).toBe(TransactionType.EXPENSE);
            expect(baseTransaction.status).toBe(TransactionStatus.CLEARED);
            expect(baseTransaction.createdAt).toBeDefined();
            expect(baseTransaction.updatedAt).toBeDefined();
        });

        it('should handle optional merchant name', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                merchantName: 'Supermarket XYZ'
            };

            expect(transaction.merchantName).toBe('Supermarket XYZ');
        });

        it('should handle optional external reference ID', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                externalReferenceId: 'bank-ref-12345'
            };

            expect(transaction.externalReferenceId).toBe('bank-ref-12345');
        });

        it('should handle empty tags array', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                tags: []
            };

            expect(transaction.tags).toEqual([]);
            expect(transaction.tags.length).toBe(0);
        });

        it('should handle multiple tags', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                tags: ['food', 'supermarket', 'weekly', 'essential']
            };

            expect(transaction.tags).toHaveLength(4);
            expect(transaction.tags).toContain('food');
            expect(transaction.tags).toContain('essential');
        });
    });

    describe('Transaction Categories', () => {
        it('should handle different expense categories', () => {
            const categories = ['Groceries', 'Transport', 'Entertainment', 'Utilities', 'Healthcare'];
            
            categories.forEach(category => {
                const transaction: Transaction = {
                    ...baseTransaction,
                    category
                };
                expect(transaction.category).toBe(category);
            });
        });

        it('should handle different income categories', () => {
            const categories = ['Salary', 'Bonus', 'Investment', 'Gift'];
            
            categories.forEach(category => {
                const transaction: Transaction = {
                    ...baseTransaction,
                    type: TransactionType.INCOME,
                    category
                };
                expect(transaction.category).toBe(category);
            });
        });
    });

    describe('Transaction Amounts', () => {
        it('should handle small amounts', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                amount: Money.fromCents(50, 'EUR')
            };

            expect(transaction.amount.getAmount()).toBe(50);
            expect(transaction.amount.toString()).toBe('0.50 EUR');
        });

        it('should handle large amounts', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                amount: Money.fromCents(1000000, 'EUR')
            };

            expect(transaction.amount.getAmount()).toBe(1000000);
            expect(transaction.amount.toString()).toBe('10000.00 EUR');
        });

        it('should handle different currencies', () => {
            const currencies = ['EUR', 'USD', 'GBP', 'JPY'];
            
            currencies.forEach(currency => {
                const transaction: Transaction = {
                    ...baseTransaction,
                    amount: Money.fromCents(5000, currency)
                };
                expect(transaction.amount.getCurrency()).toBe(currency);
            });
        });
    });

    describe('Transaction Dates', () => {
        it('should have date in the past', () => {
            const pastDate = new Date('2024-12-01');
            const transaction: Transaction = {
                ...baseTransaction,
                date: pastDate
            };

            expect(transaction.date).toEqual(pastDate);
            expect(transaction.date.getTime()).toBeLessThan(Date.now());
        });

        it('should have date in the future (for scheduled transactions)', () => {
            const futureDate = new Date('2026-01-01');
            const transaction: Transaction = {
                ...baseTransaction,
                date: futureDate,
                status: TransactionStatus.PENDING
            };

            expect(transaction.date).toEqual(futureDate);
            expect(transaction.date.getTime()).toBeGreaterThan(Date.now());
        });

        it('should track creation and update timestamps', () => {
            const createdAt = new Date('2025-01-15T10:00:00Z');
            const updatedAt = new Date('2025-01-15T15:30:00Z');
            
            const transaction: Transaction = {
                ...baseTransaction,
                createdAt,
                updatedAt
            };

            expect(transaction.createdAt).toEqual(createdAt);
            expect(transaction.updatedAt).toEqual(updatedAt);
            expect(transaction.updatedAt.getTime()).toBeGreaterThan(transaction.createdAt.getTime());
        });
    });

    describe('Transaction Descriptions', () => {
        it('should handle detailed descriptions', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                description: 'Monthly grocery shopping at Supermarket XYZ - includes fresh produce, dairy, and household items'
            };

            expect(transaction.description.length).toBeGreaterThan(50);
            expect(transaction.description).toContain('grocery');
        });

        it('should handle minimal descriptions', () => {
            const transaction: Transaction = {
                ...baseTransaction,
                description: 'Food'
            };

            expect(transaction.description).toBe('Food');
        });
    });

    describe('Real-world Scenarios', () => {
        it('should create salary transaction', () => {
            const salary: Transaction = {
                id: 'txn-salary',
                accountId: 'acc-1',
                amount: Money.fromCents(350000, 'EUR'),
                date: new Date('2025-01-31'),
                category: 'Salary',
                tags: ['income', 'monthly', 'work'],
                description: 'January salary',
                merchantName: 'Company ABC Inc.',
                externalReferenceId: 'payroll-2025-01',
                type: TransactionType.INCOME,
                status: TransactionStatus.CLEARED,
                createdAt: new Date('2025-01-31'),
                updatedAt: new Date('2025-01-31')
            };

            expect(salary.type).toBe(TransactionType.INCOME);
            expect(salary.amount.getAmount()).toBe(350000);
            expect(salary.merchantName).toBe('Company ABC Inc.');
        });

        it('should create restaurant expense', () => {
            const restaurant: Transaction = {
                id: 'txn-restaurant',
                accountId: 'acc-1',
                amount: Money.fromCents(4500, 'EUR'),
                date: new Date('2025-01-20'),
                category: 'Dining',
                tags: ['food', 'restaurant', 'entertainment'],
                description: 'Dinner with friends',
                merchantName: 'Italian Restaurant',
                type: TransactionType.EXPENSE,
                status: TransactionStatus.CLEARED,
                createdAt: new Date('2025-01-20'),
                updatedAt: new Date('2025-01-20')
            };

            expect(restaurant.type).toBe(TransactionType.EXPENSE);
            expect(restaurant.category).toBe('Dining');
            expect(restaurant.tags).toContain('restaurant');
        });

        it('should create pending online purchase', () => {
            const purchase: Transaction = {
                id: 'txn-online',
                accountId: 'acc-credit',
                amount: Money.fromCents(8999, 'EUR'),
                date: new Date('2025-01-25'),
                category: 'Shopping',
                tags: ['online', 'electronics'],
                description: 'Wireless headphones',
                merchantName: 'Amazon',
                externalReferenceId: 'order-123456789',
                type: TransactionType.EXPENSE,
                status: TransactionStatus.PENDING,
                createdAt: new Date('2025-01-25'),
                updatedAt: new Date('2025-01-25')
            };

            expect(purchase.status).toBe(TransactionStatus.PENDING);
            expect(purchase.externalReferenceId).toBe('order-123456789');
        });

        it('should create account transfer', () => {
            const transfer: Transaction = {
                id: 'txn-transfer',
                accountId: 'acc-checking',
                amount: Money.fromCents(50000, 'EUR'),
                date: new Date('2025-01-10'),
                category: 'Transfer',
                tags: ['internal', 'savings'],
                description: 'Transfer to savings account',
                type: TransactionType.TRANSFER,
                status: TransactionStatus.CLEARED,
                createdAt: new Date('2025-01-10'),
                updatedAt: new Date('2025-01-10')
            };

            expect(transfer.type).toBe(TransactionType.TRANSFER);
            expect(transfer.category).toBe('Transfer');
        });
    });
});
