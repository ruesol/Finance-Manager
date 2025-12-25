export class Money {
    private constructor(
        private readonly amount: number,
        private readonly currency: string
    ) {
        if (!Number.isInteger(amount)) {
            throw new Error("Money amount must be an integer");
        }
    }

    static fromCents(amount: number, currency: string = 'EUR'): Money {
        return new Money(amount, currency);
    }

    static fromMajor(amount: number, currency: string = 'EUR'): Money {
        return new Money(Math.round(amount * 100), currency);
    }

    static zero(currency: string = 'EUR'): Money {
        return new Money(0, currency);
    }

    add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error(`Cannot add ${other.currency} to ${this.currency}`);
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    subtract(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error(`Cannot subtract ${other.currency} from ${this.currency}`);
        }
        return new Money(this.amount - other.amount, this.currency);
    }

    allocate(ratios: number[]): Money[] {
        const totalRatio = ratios.reduce((a, b) => a + b, 0);
        let remainder = this.amount;
        const results: Money[] = [];

        for (let i = 0; i < ratios.length; i++) {
            const share = Math.floor((this.amount * ratios[i]) / totalRatio);
            results.push(new Money(share, this.currency));
            remainder -= share;
        }

        for (let i = 0; i < remainder; i++) {
            results[i] = new Money(results[i].amount + 1, results[i].currency);
        }

        return results;
    }

    getAmount(): number { return this.amount; }
    getCurrency(): string { return this.currency; }
    
    toString(): string {
        return `${(this.amount / 100).toFixed(2)} ${this.currency}`;
    }
}
