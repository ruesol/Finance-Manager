# Testing

This document covers the testing strategy, frameworks, and best practices.

## Testing Philosophy

- **Test behavior, not implementation**: Focus on what the code does, not how
- **Test user interactions**: Test from the user's perspective
- **Automate regression testing**: Prevent old bugs from returning
- **Keep tests maintainable**: Tests should be easy to understand and update

## Testing Pyramid

```
       /\
      /  \     E2E Tests (Few)
     /----\    Integration Tests (Some)
    /------\   Unit Tests (Many)
   /--------\  
```

## Test Types

### 1. Unit Tests

Test individual functions and utilities in isolation.

**Framework**: Jest

**Example**: Currency formatting utility

```typescript
// src/utils/currency.test.ts
import { formatCurrency, parseCurrency } from './currency';

describe('formatCurrency', () => {
  it('formats cents to EUR currency', () => {
    expect(formatCurrency(10000, 'EUR')).toBe('€100.00');
  });
  
  it('formats cents to USD currency', () => {
    expect(formatCurrency(10000, 'USD')).toBe('$100.00');
  });
  
  it('handles zero amount', () => {
    expect(formatCurrency(0, 'EUR')).toBe('€0.00');
  });
  
  it('handles negative amounts', () => {
    expect(formatCurrency(-5050, 'EUR')).toBe('-€50.50');
  });
  
  it('handles large amounts', () => {
    expect(formatCurrency(123456789, 'EUR')).toBe('€1,234,567.89');
  });
});

describe('parseCurrency', () => {
  it('parses formatted currency to cents', () => {
    expect(parseCurrency('€100.00')).toBe(10000);
  });
  
  it('handles input without currency symbol', () => {
    expect(parseCurrency('100.00')).toBe(10000);
  });
});
```

**Run**:
```bash
npm test -- currency.test.ts
```

### 2. Component Tests

Test React components in isolation.

**Framework**: Jest + React Testing Library

**Example**: Account card component

```typescript
// src/Components/AccountCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import AccountCard from './AccountCard';

describe('AccountCard', () => {
  const mockAccount = {
    id: '123',
    name: 'Main Checking',
    type: 'checking' as const,
    balance: 250000,
    currency: 'EUR',
    icon: '🏦',
    color: '#3B82F6',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  it('renders account name and balance', () => {
    render(<AccountCard account={mockAccount} />);
    
    expect(screen.getByText('Main Checking')).toBeInTheDocument();
    expect(screen.getByText('€2,500.00')).toBeInTheDocument();
  });

  it('displays the account icon', () => {
    render(<AccountCard account={mockAccount} />);
    
    expect(screen.getByText('🏦')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = jest.fn();
    render(<AccountCard account={mockAccount} onEdit={handleEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(handleEdit).toHaveBeenCalledWith(mockAccount.id);
  });

  it('shows delete confirmation dialog', () => {
    render(<AccountCard account={mockAccount} />);
    
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });
});
```

### 3. Integration Tests

Test API endpoints and database interactions.

**Framework**: Jest + Supertest

**Example**: Account API tests

```typescript
// src/api/routes/accounts.test.ts
import request from 'supertest';
import app from '../server';
import { db } from '../../db/client';
import { accountsTable } from '../../db/schema';

describe('Accounts API', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.delete(accountsTable);
  });

  describe('GET /api/accounts', () => {
    it('returns empty array when no accounts exist', async () => {
      const response = await request(app).get('/api/accounts');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns all accounts', async () => {
      // Seed test data
      await db.insert(accountsTable).values([
        { name: 'Account 1', type: 'checking', balance: 10000, currency: 'EUR' },
        { name: 'Account 2', type: 'savings', balance: 20000, currency: 'EUR' }
      ]);

      const response = await request(app).get('/api/accounts');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Account 1');
    });
  });

  describe('POST /api/accounts', () => {
    it('creates a new account', async () => {
      const newAccount = {
        name: 'Test Account',
        type: 'checking',
        balance: 0,
        currency: 'EUR',
        icon: '🏦',
        color: '#3B82F6'
      };

      const response = await request(app)
        .post('/api/accounts')
        .send(newAccount);
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Account');
      expect(response.body.id).toBeDefined();
    });

    it('validates required fields', async () => {
      const invalidAccount = {
        type: 'checking'
        // Missing name, balance, currency
      };

      const response = await request(app)
        .post('/api/accounts')
        .send(invalidAccount);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('validates account type', async () => {
      const invalidAccount = {
        name: 'Test',
        type: 'invalid_type',
        balance: 0,
        currency: 'EUR'
      };

      const response = await request(app)
        .post('/api/accounts')
        .send(invalidAccount);
      
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('updates an account', async () => {
      // Create account
      const [account] = await db.insert(accountsTable).values({
        name: 'Original Name',
        type: 'checking',
        balance: 10000,
        currency: 'EUR'
      }).returning();

      const response = await request(app)
        .put(`/api/accounts/${account.id}`)
        .send({ name: 'Updated Name' });
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('returns 404 for non-existent account', async () => {
      const response = await request(app)
        .put('/api/accounts/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Updated' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('deletes an account', async () => {
      const [account] = await db.insert(accountsTable).values({
        name: 'To Delete',
        type: 'checking',
        balance: 0,
        currency: 'EUR'
      }).returning();

      const response = await request(app)
        .delete(`/api/accounts/${account.id}`);
      
      expect(response.status).toBe(200);

      // Verify deletion
      const accounts = await db.select().from(accountsTable);
      expect(accounts).toHaveLength(0);
    });
  });
});
```

### 4. End-to-End Tests

Test complete user workflows.

**Framework**: Playwright

**Example**: Account management flow

```typescript
// tests/accounts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('text=Accounts');
  });

  test('creates a new account', async ({ page }) => {
    // Click new account button
    await page.click('button:has-text("New Account")');

    // Fill form
    await page.fill('input[name="name"]', 'E2E Test Account');
    await page.selectOption('select[name="type"]', 'savings');
    await page.fill('input[name="balance"]', '1000.00');
    await page.selectOption('select[name="currency"]', 'EUR');

    // Submit
    await page.click('button[type="submit"]');

    // Verify account appears
    await expect(page.locator('text=E2E Test Account')).toBeVisible();
    await expect(page.locator('text=€1,000.00')).toBeVisible();
  });

  test('edits an existing account', async ({ page }) => {
    // Click edit on first account
    await page.click('[data-testid="account-card"] button:has-text("Edit")');

    // Change name
    await page.fill('input[name="name"]', 'Updated Account Name');
    await page.click('button[type="submit"]');

    // Verify update
    await expect(page.locator('text=Updated Account Name')).toBeVisible();
  });

  test('deletes an account', async ({ page }) => {
    const accountName = 'Account to Delete';

    // Get initial count
    const initialCount = await page.locator('[data-testid="account-card"]').count();

    // Find and delete account
    const accountCard = page.locator(`[data-testid="account-card"]:has-text("${accountName}")`);
    await accountCard.locator('button:has-text("Delete")').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify deletion
    const newCount = await page.locator('[data-testid="account-card"]').count();
    expect(newCount).toBe(initialCount - 1);
    await expect(page.locator(`text=${accountName}`)).not.toBeVisible();
  });

  test('validates form inputs', async ({ page }) => {
    await page.click('button:has-text("New Account")');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
  });
});
```

## Test Configuration

### Jest Configuration

**File**: `jest.config.js`

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Playwright Configuration

**File**: `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test File

```bash
npm test -- accounts.test.ts
```

### Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm test -- --coverage
```

**Output**:
```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.5  |   78.2   |   82.1  |   85.8  |
 utils/             |   95.2  |   90.5   |   100   |   95.2  |
  currency.ts       |   100   |   100    |   100   |   100   |
 Components/        |   82.3  |   75.1   |   78.9  |   82.5  |
  Dashboard.tsx     |   85.7  |   80.0   |   85.7  |   85.7  |
--------------------|---------|----------|---------|---------|
```

### E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test accounts.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug
```

## Mocking

### Mocking API Calls

```typescript
// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ id: '123', name: 'Test' }),
    ok: true,
    status: 200
  })
) as jest.Mock;

// Use in test
test('fetches accounts', async () => {
  await loadAccounts();
  expect(fetch).toHaveBeenCalledWith('/api/accounts');
});

// Restore
afterEach(() => {
  jest.clearAllMocks();
});
```

### Mocking Modules

```typescript
// Mock entire module
jest.mock('../api/client', () => ({
  fetchAccounts: jest.fn(() => Promise.resolve([]))
}));

// Use in test
import { fetchAccounts } from '../api/client';

test('handles empty accounts', async () => {
  (fetchAccounts as jest.Mock).mockResolvedValue([]);
  // ... test logic
});
```

### Mocking LocalStorage

```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock as any;

test('saves theme to localStorage', () => {
  setTheme('dark');
  expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
});
```

## Test Data Management

### Factory Functions

```typescript
// src/test/factories.ts
export function createAccount(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Test Account',
    type: 'checking',
    balance: 0,
    currency: 'EUR',
    icon: '🏦',
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export function createTransaction(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    accountId: crypto.randomUUID(),
    categoryId: null,
    type: 'expense',
    amount: 1000,
    description: 'Test transaction',
    date: new Date().toISOString(),
    isRecurring: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}
```

**Usage**:
```typescript
const account = createAccount({ balance: 100000 });
const transaction = createTransaction({ accountId: account.id });
```

## Best Practices

### 1. AAA Pattern

Arrange, Act, Assert:

```typescript
test('calculates account balance', () => {
  // Arrange
  const account = createAccount({ balance: 10000 });
  const transaction = createTransaction({ amount: 5000, type: 'expense' });
  
  // Act
  const newBalance = calculateBalance(account, transaction);
  
  // Assert
  expect(newBalance).toBe(5000);
});
```

### 2. Descriptive Test Names

```typescript
// ✅ Good
test('displays error message when API call fails')

// ❌ Bad
test('error test')
```

### 3. Test One Thing

```typescript
// ✅ Good - separate tests
test('validates email format')
test('validates email is required')

// ❌ Bad - testing multiple things
test('validates email')
```

### 4. Avoid Test Interdependence

```typescript
// ✅ Good - each test is independent
test('creates account', () => {
  const account = createAccount();
  // ...
});

// ❌ Bad - depends on previous test
let sharedAccount;
test('creates account', () => {
  sharedAccount = createAccount();
});
test('updates account', () => {
  updateAccount(sharedAccount); // Depends on first test
});
```

### 5. Clean Up After Tests

```typescript
afterEach(async () => {
  await db.delete(accountsTable);
  jest.clearAllMocks();
  localStorage.clear();
});
```

## Continuous Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

## Related Documentation

- [Development Workflow](./08-development-workflow.md)
- [Backend API](./05-backend-api.md)
- [Frontend Components](./06-frontend-components.md)
