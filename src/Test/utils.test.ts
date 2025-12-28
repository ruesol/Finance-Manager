import {
  formatCurrency,
  formatDate,
  formatDateTime,
  parseCurrency,
  validatePositiveNumber,
  validateEmail,
  debounce,
  truncateText,
  capitalize,
  generateId
} from '../utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format cents to EUR currency', () => {
      const result = formatCurrency(10000, 'EUR');
      expect(result).toMatch(/100[,.]00/);
      expect(result).toContain('€');
    });

    it('should format cents to USD currency', () => {
      const result = formatCurrency(10000, 'USD');
      expect(result).toMatch(/100[,.]00/);
    });

    it('should default to EUR when currency not specified', () => {
      const result = formatCurrency(5000);
      expect(result).toContain('€');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0);
      expect(result).toMatch(/0[,.]00/);
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-5050);
      expect(result).toContain('-');
      expect(result).toMatch(/50[,.]50/);
    });

    it('should handle large amounts', () => {
      const result = formatCurrency(123456789);
      expect(result).toMatch(/1[.]234[.]567[,.]89/);
    });

    it('should handle decimal rounding', () => {
      const result = formatCurrency(1234); // 12.34
      expect(result).toMatch(/12[,.]34/);
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2025-12-28');
      const result = formatDate(date);
      expect(result).toMatch(/28\/12\/2025/);
    });

    it('should format ISO string', () => {
      const result = formatDate('2025-01-15');
      expect(result).toMatch(/15\/01\/2025/);
    });

    it('should handle different date formats', () => {
      const date = new Date(2025, 0, 1); // Jan 1, 2025
      const result = formatDate(date);
      expect(result).toMatch(/01\/01\/2025/);
    });
  });

  describe('formatDateTime', () => {
    it('should format Date object with time', () => {
      const date = new Date('2025-12-28T14:30:00');
      const result = formatDateTime(date);
      expect(result).toMatch(/28\/12\/2025/);
      expect(result).toMatch(/14:30/);
    });

    it('should format ISO string with time', () => {
      const result = formatDateTime('2025-01-15T09:45:00');
      expect(result).toMatch(/15\/01\/2025/);
      expect(result).toMatch(/09:45/);
    });
  });

  describe('parseCurrency', () => {
    it('should parse EUR formatted currency', () => {
      expect(parseCurrency('€100.00')).toBe(10000);
      expect(parseCurrency('€100,00')).toBe(10000);
    });

    it('should parse USD formatted currency', () => {
      expect(parseCurrency('$50.50')).toBe(5050);
    });

    it('should handle currency without symbol', () => {
      expect(parseCurrency('100.00')).toBe(10000);
      expect(parseCurrency('100,00')).toBe(10000);
    });

    it('should handle amounts with spaces', () => {
      expect(parseCurrency('€ 100.00')).toBe(10000);
      expect(parseCurrency('100 €')).toBe(10000);
    });

    it('should handle zero', () => {
      expect(parseCurrency('0')).toBe(0);
      expect(parseCurrency('€0.00')).toBe(0);
    });

    it('should handle negative amounts', () => {
      expect(parseCurrency('-50.50')).toBe(-5050);
      expect(parseCurrency('-€50.50')).toBe(-5050);
    });

    it('should handle decimal precision', () => {
      expect(parseCurrency('12.34')).toBe(1234);
      expect(parseCurrency('0.01')).toBe(1);
    });

    it('should round to cents', () => {
      expect(parseCurrency('12.345')).toBe(1235);
      expect(parseCurrency('12.344')).toBe(1234);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(validatePositiveNumber(1)).toBe(true);
      expect(validatePositiveNumber(100)).toBe(true);
      expect(validatePositiveNumber(0.1)).toBe(true);
    });

    it('should reject zero', () => {
      expect(validatePositiveNumber(0)).toBe(false);
    });

    it('should reject negative numbers', () => {
      expect(validatePositiveNumber(-1)).toBe(false);
      expect(validatePositiveNumber(-100)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(validatePositiveNumber(NaN)).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(validatePositiveNumber('100' as any)).toBe(false);
      expect(validatePositiveNumber(null as any)).toBe(false);
      expect(validatePositiveNumber(undefined as any)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+filter@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@invalid.com')).toBe(false);
      expect(validateEmail('invalid@domain')).toBe(false);
      expect(validateEmail('invalid @example.com')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle multiple rapid calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc('call1');
      jest.advanceTimersByTime(50);
      
      debouncedFunc('call2');
      jest.advanceTimersByTime(50);
      
      debouncedFunc('call3');
      jest.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('call3');
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      const result = truncateText('This is a long text', 10);
      expect(result).toBe('This is a ...');
    });

    it('should not truncate text shorter than maxLength', () => {
      const result = truncateText('Short', 10);
      expect(result).toBe('Short');
    });

    it('should handle text equal to maxLength', () => {
      const result = truncateText('ExactlyTen', 10);
      expect(result).toBe('ExactlyTen');
    });

    it('should handle empty string', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });

    it('should handle maxLength of 0', () => {
      const result = truncateText('Text', 0);
      expect(result).toBe('...');
    });

    it('should handle very short maxLength', () => {
      const result = truncateText('Text', 1);
      expect(result).toBe('T...');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should lowercase remaining letters', () => {
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('hELLO')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle strings with spaces', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('should handle strings with special characters', () => {
      expect(capitalize('hello-world')).toBe('Hello-world');
      expect(capitalize('hello_world')).toBe('Hello_world');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
    });

    it('should generate string IDs', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate IDs with correct format', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate IDs with timestamp', () => {
      const beforeTimestamp = Date.now();
      const id = generateId();
      const afterTimestamp = Date.now();
      
      const idTimestamp = parseInt(id.split('-')[0]);
      expect(idTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(idTimestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should generate multiple unique IDs rapidly', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      
      expect(ids.size).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle formatCurrency with very large numbers', () => {
      const result = formatCurrency(Number.MAX_SAFE_INTEGER);
      expect(result).toBeTruthy();
    });

    it('should handle formatCurrency with very small numbers', () => {
      const result = formatCurrency(1);
      expect(result).toMatch(/0[,.]01/);
    });

    it('should handle formatDate with invalid dates', () => {
      expect(() => formatDate('invalid-date')).toThrow();
    });

    it('should handle parseCurrency with multiple decimal separators', () => {
      // Edge case: malformed input
      const result = parseCurrency('12.34.56');
      expect(typeof result).toBe('number');
    });

    it('should handle truncateText with unicode characters', () => {
      const result = truncateText('Hello 👋 World', 10);
      expect(result).toHaveLength(13); // including ellipsis
    });

    it('should handle capitalize with numbers', () => {
      expect(capitalize('123abc')).toBe('123abc');
    });
  });
});
