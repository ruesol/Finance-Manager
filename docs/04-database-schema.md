# Database Schema

This document describes the PostgreSQL database schema, table relationships, and data model design.

## Schema Overview

The Finance Manager database consists of three main tables:
- `accounts`: Financial accounts (checking, savings, etc.)
- `transactions`: Income and expense records
- `categories`: Transaction categorization

## Entity Relationship Diagram

```
┌──────────────────────┐
│     accounts         │
│──────────────────────│
│ id (PK)             │◄──┐
│ name                │   │
│ type                │   │
│ balance             │   │
│ currency            │   │
│ icon                │   │
│ color               │   │
│ created_at          │   │
│ updated_at          │   │
└──────────────────────┘   │
                           │ FK
┌──────────────────────┐   │
│   transactions       │   │
│──────────────────────│   │
│ id (PK)             │   │
│ account_id (FK)     │───┘
│ category_id (FK)    │───┐
│ type                │   │
│ amount              │   │
│ description         │   │
│ date                │   │
│ is_recurring        │   │
│ created_at          │   │
│ updated_at          │   │
└──────────────────────┘   │
                           │ FK
┌──────────────────────┐   │
│    categories        │   │
│──────────────────────│   │
│ id (PK)             │◄──┘
│ name                │
│ type                │
│ icon                │
│ color               │
│ created_at          │
└──────────────────────┘
```

## Table Definitions

### accounts

Stores financial account information.

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'checking', 'savings', 'credit_card', 'investment'
  balance INTEGER NOT NULL DEFAULT 0, -- Stored in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR', -- ISO 4217 currency code
  icon VARCHAR(10) DEFAULT '💰',
  color VARCHAR(7) DEFAULT '#3B82F6', -- HEX color code
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id`: UUID primary key
- `name`: Display name (e.g., "Main Checking", "Emergency Fund")
- `type`: Account classification
  - `checking`: Regular checking account
  - `savings`: Savings account
  - `credit_card`: Credit card account
  - `investment`: Investment account
- `balance`: Current balance in cents (e.g., 5050 = $50.50)
- `currency`: Three-letter ISO currency code
- `icon`: Emoji icon for visual identification
- `color`: HEX color for UI theming
- `created_at`, `updated_at`: Audit timestamps

**Indexes**:
```sql
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_created_at ON accounts(created_at);
```

**Example Data**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Main Checking",
  "type": "checking",
  "balance": 250000, // $2,500.00
  "currency": "EUR",
  "icon": "🏦",
  "color": "#3B82F6",
  "created_at": "2025-12-27T10:00:00Z",
  "updated_at": "2025-12-27T10:00:00Z"
}
```

### transactions

Records all financial transactions (income and expenses).

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
  amount INTEGER NOT NULL, -- Stored in cents, always positive
  description TEXT,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);
```

**Columns**:
- `id`: UUID primary key
- `account_id`: Foreign key to accounts table
- `category_id`: Foreign key to categories (nullable)
- `type`: Transaction type
  - `income`: Money coming in
  - `expense`: Money going out
- `amount`: Transaction amount in cents (always positive)
- `description`: Transaction details/notes
- `date`: Transaction date (can be backdated)
- `is_recurring`: Flag for recurring transactions
- `created_at`, `updated_at`: Audit timestamps

**Indexes**:
```sql
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
```

**Constraints**:
- `amount > 0`: Ensures amount is always positive (type determines direction)
- `ON DELETE CASCADE`: Deleting an account deletes its transactions
- `ON DELETE SET NULL`: Deleting a category keeps transactions but removes reference

**Example Data**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "category_id": "770e8400-e29b-41d4-a716-446655440010",
  "type": "expense",
  "amount": 5050, // $50.50
  "description": "Grocery shopping at Whole Foods",
  "date": "2025-12-27T14:30:00Z",
  "is_recurring": false,
  "created_at": "2025-12-27T14:30:00Z",
  "updated_at": "2025-12-27T14:30:00Z"
}
```

### categories

Defines transaction categories for organization and reporting.

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
  icon VARCHAR(10) DEFAULT '📁',
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id`: UUID primary key
- `name`: Category name (must be unique)
- `type`: Category type (matches transaction type)
- `icon`: Emoji icon
- `color`: HEX color for visualization
- `created_at`: Creation timestamp

**Indexes**:
```sql
CREATE INDEX idx_categories_type ON categories(type);
CREATE UNIQUE INDEX idx_categories_name ON categories(name);
```

**Default Categories**:

Income categories:
- Salary (💼, #10B981)
- Freelance (💻, #8B5CF6)
- Investment (📈, #3B82F6)
- Gift (🎁, #EC4899)
- Other Income (💰, #6B7280)

Expense categories:
- Rent (🏠, #EF4444)
- Food (🍔, #F59E0B)
- Transport (🚗, #3B82F6)
- Entertainment (🎬, #8B5CF6)
- Shopping (🛍️, #EC4899)
- Bills (📄, #6B7280)
- Other (📁, #9CA3AF)

## Data Types & Conventions

### Monetary Values

**Storage**: Integer (cents)
**Rationale**: Avoid floating-point precision errors
**Conversion**:
```typescript
// Dollars to cents
const cents = Math.round(dollars * 100);

// Cents to dollars
const dollars = cents / 100;
```

### Dates & Timestamps

**Storage**: `TIMESTAMP` (UTC)
**Format**: ISO 8601
**Example**: `2025-12-27T14:30:00Z`

### UUIDs

**Generation**: PostgreSQL `gen_random_uuid()`
**Format**: Version 4 UUID
**Example**: `550e8400-e29b-41d4-a716-446655440000`

### Colors

**Format**: HEX color codes with `#`
**Example**: `#3B82F6` (blue)
**Validation**: 7 characters (`#` + 6 hex digits)

### Currency Codes

**Standard**: ISO 4217
**Examples**: EUR, USD, GBP
**Length**: 3 characters
**Default**: EUR

## Relationships

### One-to-Many

1. **Account → Transactions**
   - One account has many transactions
   - Cascade delete: removing account removes transactions

2. **Category → Transactions**
   - One category has many transactions
   - Set null: removing category keeps transactions

### Referential Integrity

All foreign keys enforce referential integrity:
- Cannot create transaction with non-existent account
- Cannot create transaction with non-existent category (unless null)
- Cascade and set null behaviors handle deletions

## Calculated Fields

### Account Balance

The balance is **denormalized** for performance:
- Stored directly in `accounts.balance`
- Updated when transactions are created/modified/deleted
- Alternative: Calculate sum of transactions (slower but guaranteed accurate)

**Balance Calculation**:
```sql
SELECT 
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance
FROM transactions
WHERE account_id = $1;
```

### Monthly Statistics

Calculated on-demand in API:
```sql
-- Monthly income
SELECT SUM(amount) 
FROM transactions 
WHERE type = 'income' 
  AND date >= date_trunc('month', CURRENT_DATE);

-- Monthly expenses
SELECT SUM(amount) 
FROM transactions 
WHERE type = 'expense' 
  AND date >= date_trunc('month', CURRENT_DATE);
```

## DrizzleORM Schema

See `src/db/schema.ts` for the TypeScript/DrizzleORM implementation:

```typescript
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  // ... etc
});
```

## Migration Strategy

**Current**: Schema push with DrizzleKit
```bash
npm run db:push
```

**Future**: Versioned migrations
```bash
npm run db:migrate
```

## Data Integrity Rules

1. **Balance consistency**: Account balance should match sum of transactions
2. **Positive amounts**: All transaction amounts must be > 0
3. **Valid dates**: Transaction dates cannot be in the future (business rule)
4. **Currency consistency**: All transactions use account's currency
5. **Category type matching**: Transaction type must match category type

## Performance Considerations

1. **Indexes**: Created on foreign keys and frequently queried columns
2. **Denormalization**: Account balance stored for quick access
3. **Query optimization**: Date range queries use indexed date column
4. **Connection pooling**: Database connections are reused

## Backup & Recovery

**Recommended**: Daily PostgreSQL backups
```bash
pg_dump -U postgres finance_manager > backup_$(date +%Y%m%d).sql
```

**Restore**:
```bash
psql -U postgres finance_manager < backup_20251227.sql
```

## Next Steps

- Review [Backend API](./05-backend-api.md) for how this schema is accessed
- Check [Getting Started](./02-getting-started.md) for database setup
