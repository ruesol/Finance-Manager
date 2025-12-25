import { Account, AccountType, AccountState } from '../Account';
import { Money } from '../Money';

describe('Account', () => {
    let accountState: AccountState;

    beforeEach(() => {
        accountState = {
            id: 'acc-1',
            name: 'Main Account',
            type: AccountType.Checking,
            balance: Money.fromCents(10000, 'EUR'),
            currency: 'EUR',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01')
        };
    });

    describe('Constructor', () => {
        it('should create account from state', () => {
            const account = new Account(accountState);
            
            expect(account.id).toBe('acc-1');
            expect(account.name).toBe('Main Account');
            expect(account.type).toBe(AccountType.Checking);
            expect(account.balance).toBe(accountState.balance);
        });

        it('should create account with optional fields', () => {
            accountState.description = 'Test description';
            accountState.icon = '💰';
            accountState.color = '#FF5733';
            
            const account = new Account(accountState);
            
            expect(account.description).toBe('Test description');
            expect(account.icon).toBe('💰');
            expect(account.color).toBe('#FF5733');
        });
    });

    describe('Deposit', () => {
        it('should deposit positive amount', () => {
            const account = new Account(accountState);
            const result = account.deposit(5000);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.getAmount()).toBe(15000);
            }
            expect(account.balance.getAmount()).toBe(15000);
        });

        it('should reject negative amount', () => {
            const account = new Account(accountState);
            const result = account.deposit(-100);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toBe('Amount must be positive');
            }
            expect(account.balance.getAmount()).toBe(10000); // unchanged
        });

        it('should reject zero amount', () => {
            const account = new Account(accountState);
            const result = account.deposit(0);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toBe('Amount must be positive');
            }
        });

        it('should update timestamp on successful deposit', () => {
            const account = new Account(accountState);
            const oldDate = account.updatedAt;
            
            // Wait a bit to ensure different timestamp
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-01-02'));
            
            account.deposit(1000);
            
            expect(account.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
            
            jest.useRealTimers();
        });

        it('should handle large deposits', () => {
            const account = new Account(accountState);
            const result = account.deposit(1000000); // 10,000 EUR
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.getAmount()).toBe(1010000);
            }
        });
    });

    describe('Withdraw', () => {
        it('should withdraw valid amount from checking account', () => {
            const account = new Account(accountState);
            const result = account.withdraw(3000);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.getAmount()).toBe(7000);
            }
            expect(account.balance.getAmount()).toBe(7000);
        });

        it('should reject insufficient funds for checking account', () => {
            const account = new Account(accountState);
            const result = account.withdraw(20000);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toBe('Insufficient funds');
            }
            expect(account.balance.getAmount()).toBe(10000); // unchanged
        });

        it('should reject insufficient funds for savings account', () => {
            accountState.type = AccountType.Savings;
            const account = new Account(accountState);
            const result = account.withdraw(15000);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toBe('Insufficient funds');
            }
        });

        it('should allow negative balance for credit card accounts', () => {
            accountState.type = AccountType.CreditCard;
            const account = new Account(accountState);
            const result = account.withdraw(20000);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.getAmount()).toBe(-10000);
            }
        });

        it('should reject negative withdrawal amount', () => {
            const account = new Account(accountState);
            const result = account.withdraw(-500);
            
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.message).toBe('Amount must be positive');
            }
        });

        it('should reject zero withdrawal amount', () => {
            const account = new Account(accountState);
            const result = account.withdraw(0);
            
            expect(result.success).toBe(false);
        });

        it('should allow withdrawing entire balance', () => {
            const account = new Account(accountState);
            const result = account.withdraw(10000);
            
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.getAmount()).toBe(0);
            }
        });

        it('should update timestamp on successful withdrawal', () => {
            const account = new Account(accountState);
            const oldDate = account.updatedAt;
            
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-01-02'));
            
            account.withdraw(1000);
            
            expect(account.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
            
            jest.useRealTimers();
        });
    });

    describe('GetBalance', () => {
        it('should return current balance', () => {
            const account = new Account(accountState);
            const balance = account.getBalance();
            
            expect(balance.getAmount()).toBe(10000);
            expect(balance.getCurrency()).toBe('EUR');
        });

        it('should return updated balance after deposit', () => {
            const account = new Account(accountState);
            account.deposit(5000);
            const balance = account.getBalance();
            
            expect(balance.getAmount()).toBe(15000);
        });

        it('should return updated balance after withdrawal', () => {
            const account = new Account(accountState);
            account.withdraw(3000);
            const balance = account.getBalance();
            
            expect(balance.getAmount()).toBe(7000);
        });
    });

    describe('Account Types', () => {
        it('should handle wallet account type', () => {
            accountState.type = AccountType.Wallet;
            const account = new Account(accountState);
            
            expect(account.type).toBe(AccountType.Wallet);
            
            // Wallet should not allow negative balance
            const result = account.withdraw(15000);
            expect(result.success).toBe(false);
        });

        it('should handle investment account type', () => {
            accountState.type = AccountType.Investment;
            const account = new Account(accountState);
            
            expect(account.type).toBe(AccountType.Investment);
            
            // Investment should not allow negative balance
            const result = account.withdraw(15000);
            expect(result.success).toBe(false);
        });
    });

    describe('Multiple Operations', () => {
        it('should handle multiple deposits', () => {
            const account = new Account(accountState);
            
            account.deposit(1000);
            account.deposit(2000);
            account.deposit(3000);
            
            expect(account.balance.getAmount()).toBe(16000);
        });

        it('should handle mixed deposits and withdrawals', () => {
            const account = new Account(accountState);
            
            account.deposit(5000);   // 15000
            account.withdraw(3000);  // 12000
            account.deposit(2000);   // 14000
            account.withdraw(4000);  // 10000
            
            expect(account.balance.getAmount()).toBe(10000);
        });

        it('should reject operations if intermediate state becomes invalid', () => {
            const account = new Account(accountState);
            
            account.withdraw(9000);  // 1000 left
            const result = account.withdraw(2000);  // should fail
            
            expect(result.success).toBe(false);
            expect(account.balance.getAmount()).toBe(1000);
        });
    });
});
