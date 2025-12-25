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
    });

    describe('Arithmetic', () => {
        it('should add money with same currency', () => {
            const m1 = Money.fromCents(100, 'EUR');
            const m2 = Money.fromCents(50, 'EUR');
            const result = m1.add(m2);
            
            expect(result.getAmount()).toBe(150);
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
    });

    describe('Allocation', () => {
        it('should allocate money by ratios', () => {
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
    });

    describe('Display', () => {
        it('should format as string', () => {
            const money = Money.fromCents(12345, 'EUR');
            expect(money.toString()).toBe('123.45 EUR');
        });
    });
});