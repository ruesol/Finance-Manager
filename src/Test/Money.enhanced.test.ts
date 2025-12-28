import { Money } from '../Money';

describe('Money', () => {
    describe('Creation', () => {
        it('should create from cents', () => {
            const money = Money.fromCents(100, 'EUR');
            expect(money.getAmount()).toBe(100);
            expect(money.getCurrency()).toBe('EUR');
        });

        it('should create from major units', () => {
            const money = Money.fromMajor(1.50, 'USD');
            expect(money.getAmount()).toBe(150);
        });

        it('should create zero money', () => {
            const money = Money.zero('GBP');
            expect(money.getAmount()).toBe(0);
            expect(money.getCurrency()).toBe('GBP');
        });

        it('should throw error for non-integer amounts', () => {
            expect(() => Money.fromCents(1.5, 'EUR')).toThrow('Money amount must be an integer');
        });

        it('should default to EUR when currency not specified', () => {
            const money = Money.fromCents(100);
            expect(money.getCurrency()).toBe('EUR');
        });

        it('should round major units properly', () => {
            const money1 = Money.fromMajor(1.234, 'EUR');
            expect(money1.getAmount()).toBe(123);
            
            const money2 = Money.fromMajor(1.236, 'EUR');
            expect(money2.getAmount()).toBe(124);
        });

        it('should handle negative amounts', () => {
            const money = Money.fromCents(-100, 'EUR');
            expect(money.getAmount()).toBe(-100);
        });

        it('should handle zero', () => {
            const money = Money.fromCents(0, 'EUR');
            expect(money.getAmount()).toBe(0);
        });

        it('should handle large amounts', () => {
            const money = Money.fromCents(999999999, 'EUR');
            expect(money.getAmount()).toBe(999999999);
        });
    });

    describe('Arithmetic', () => {
        it('should add money with same currency', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const m2 = Money.fromCents(50, 'EUR');
            const result = m1.add(m2);
            
            expect(result.getAmount()).toBe(150);
            expect(result.getCurrency()).toBe('EUR');
        });

        it('should subtract money with same currency', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const m2 = Money.fromCents(30, 'EUR');
            const result = m1.subtract(m2);
            
            expect(result.getAmount()).toBe(70);
        });

        it('should throw error when adding different currencies', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const m2 = Money.fromCents(50, 'USD');
            
            expect(() => m1.add(m2)).toThrow('Cannot add USD to EUR');
        });

        it('should throw error when subtracting different currencies', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const m2 = Money.fromCents(50, 'USD');
            
            expect(() => m1.subtract(m2)).toThrow('Cannot subtract USD from EUR');
        });

        it('should allow negative results from subtraction', () => {
            const m1 = Money.fromCents(50, 'EUR');
            const m2 = Money.fromCents(100, 'EUR');
            const result = m1.subtract(m2);
            
            expect(result.getAmount()).toBe(-50);
        });

        it('should add zero without changing value', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const zero = Money.zero('EUR');
            const result = m1.add(zero);
            
            expect(result.getAmount()).toBe(100);
        });

        it('should subtract zero without changing value', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const zero = Money.zero('EUR');
            const result = m1.subtract(zero);
            
            expect(result.getAmount()).toBe(100);
        });

        it('should handle adding negative amounts', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const m2 = Money.fromCents(-50, 'EUR');
            const result = m1.add(m2);
            
            expect(result.getAmount()).toBe(50);
        });

        it('should preserve original money objects', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const m2 = Money.fromCents(50, 'EUR');
            m1.add(m2);
            
            // Original should be unchanged (immutability)
            expect(m1.getAmount()).toBe(100);
            expect(m2.getAmount()).toBe(50);
        });
    });

    describe('Allocation', () => {
        it('should allocate money by equal ratios', () => {
            const money = Money.fromCents(100, 'EUR');
            const parts = money.allocate([1, 1, 1]);
            
            expect(parts).toHaveLength(3);
            expect(parts[0].getAmount()).toBe(34);
            expect(parts[1].getAmount()).toBe(33);
            expect(parts[2].getAmount()).toBe(33);
            
            // Verifica che la somma sia esatta
            const total = parts.reduce((sum, p) => sum + p.getAmount(), 0);
            expect(total).toBe(100);
        });

        it('should allocate money by different ratios', () => {
            const money = Money.fromCents(100, 'EUR');
            const parts = money.allocate([2, 1, 1]);
            
            expect(parts).toHaveLength(3);
            expect(parts[0].getAmount()).toBe(50);
            expect(parts[1].getAmount()).toBe(25);
            expect(parts[2].getAmount()).toBe(25);
        });

        it('should handle remainders correctly', () => {
            const money = Money.fromCents(10, 'EUR');
            const parts = money.allocate([3, 3, 3]);
            
            // 10 / 9 = 1.11... per part, so we get 4, 3, 3
            expect(parts[0].getAmount()).toBe(4);
            expect(parts[1].getAmount()).toBe(3);
            expect(parts[2].getAmount()).toBe(3);
            
            const total = parts.reduce((sum, p) => sum + p.getAmount(), 0);
            expect(total).toBe(10);
        });

        it('should allocate with many parts', () => {
            const money = Money.fromCents(1000, 'EUR');
            const parts = money.allocate([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
            
            expect(parts).toHaveLength(10);
            const total = parts.reduce((sum, p) => sum + p.getAmount(), 0);
            expect(total).toBe(1000);
        });

        it('should handle allocation with large ratios', () => {
            const money = Money.fromCents(1000, 'EUR');
            const parts = money.allocate([70, 20, 10]);
            
            expect(parts[0].getAmount()).toBe(700);
            expect(parts[1].getAmount()).toBe(200);
            expect(parts[2].getAmount()).toBe(100);
        });

        it('should preserve currency in allocated parts', () => {
            const money = Money.fromCents(100, 'USD');
            const parts = money.allocate([1, 1]);
            
            parts.forEach(part => {
                expect(part.getCurrency()).toBe('USD');
            });
        });

        it('should handle single ratio', () => {
            const money = Money.fromCents(100, 'EUR');
            const parts = money.allocate([1]);
            
            expect(parts).toHaveLength(1);
            expect(parts[0].getAmount()).toBe(100);
        });

        it('should handle zero amount allocation', () => {
            const money = Money.zero('EUR');
            const parts = money.allocate([1, 1, 1]);
            
            expect(parts).toHaveLength(3);
            parts.forEach(part => {
                expect(part.getAmount()).toBe(0);
            });
        });
    });

    describe('Display', () => {
        it('should format positive amount as string', () => {
            const money = Money.fromCents(12345, 'EUR');
            expect(money.toString()).toBe('123.45 EUR');
        });

        it('should format zero as string', () => {
            const money = Money.zero('EUR');
            expect(money.toString()).toBe('0.00 EUR');
        });

        it('should format negative amount as string', () => {
            const money = Money.fromCents(-5050, 'USD');
            expect(money.toString()).toBe('-50.50 USD');
        });

        it('should format small amounts correctly', () => {
            const money = Money.fromCents(5, 'EUR');
            expect(money.toString()).toBe('0.05 EUR');
        });

        it('should format large amounts correctly', () => {
            const money = Money.fromCents(123456789, 'EUR');
            expect(money.toString()).toBe('1234567.89 EUR');
        });

        it('should show different currencies', () => {
            const eur = Money.fromCents(100, 'EUR');
            const usd = Money.fromCents(100, 'USD');
            const gbp = Money.fromCents(100, 'GBP');
            
            expect(eur.toString()).toBe('1.00 EUR');
            expect(usd.toString()).toBe('1.00 USD');
            expect(gbp.toString()).toBe('1.00 GBP');
        });
    });

    describe('Getters', () => {
        it('should get amount', () => {
            const money = Money.fromCents(12345, 'EUR');
            expect(money.getAmount()).toBe(12345);
        });

        it('should get currency', () => {
            const money = Money.fromCents(100, 'USD');
            expect(money.getCurrency()).toBe('USD');
        });
    });

    describe('Edge Cases', () => {
        it('should handle very small amounts', () => {
            const money = Money.fromCents(1, 'EUR');
            expect(money.getAmount()).toBe(1);
            expect(money.toString()).toBe('0.01 EUR');
        });

        it('should handle maximum safe integer', () => {
            const money = Money.fromCents(Number.MAX_SAFE_INTEGER, 'EUR');
            expect(money.getAmount()).toBe(Number.MAX_SAFE_INTEGER);
        });

        it('should handle operations near zero', () => {
            const m1 = Money.fromCents(1, 'EUR');
            const m2 = Money.fromCents(1, 'EUR');
            const result = m1.subtract(m2);
            
            expect(result.getAmount()).toBe(0);
        });

        it('should handle allocation of 1 cent', () => {
            const money = Money.fromCents(1, 'EUR');
            const parts = money.allocate([1, 1, 1]);
            
            expect(parts[0].getAmount()).toBe(1);
            expect(parts[1].getAmount()).toBe(0);
            expect(parts[2].getAmount()).toBe(0);
            
            const total = parts.reduce((sum, p) => sum + p.getAmount(), 0);
            expect(total).toBe(1);
        });
    });
});
