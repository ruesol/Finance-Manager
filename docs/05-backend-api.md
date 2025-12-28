# Backend API

This document describes all API endpoints, request/response formats, and backend architecture.

## API Overview

**Base URL**: `http://localhost:3001/api`
**Format**: JSON
**Authentication**: None (single-user application)

## Endpoints

### Accounts

#### GET /api/accounts

Get all accounts.

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Main Checking",
    "type": "checking",
    "balance": 250000,
    "currency": "EUR",
    "icon": "🏦",
    "color": "#3B82F6",
    "createdAt": "2025-12-27T10:00:00Z",
    "updatedAt": "2025-12-27T10:00:00Z"
  }
]
```

#### POST /api/accounts

Create a new account.

**Request**:
```json
{
  "name": "Savings Account",
  "type": "savings",
  "balance": 100000,
  "currency": "EUR",
  "icon": "🏦",
  "color": "#10B981"
}
```

**Response**: Created account object

#### GET /api/accounts/:id

Get a specific account.

**Response**: Single account object

#### PUT /api/accounts/:id

Update an account.

**Request**: Partial account object
**Response**: Updated account object

#### DELETE /api/accounts/:id

Delete an account (cascades to transactions).

**Response**: `{ message: "Account deleted" }`

### Transactions

#### GET /api/transactions

Get all transactions with optional filters.

**Query Parameters**:
- `accountId`: Filter by account UUID
- `type`: Filter by type ('income' or 'expense')
- `startDate`: ISO date string
- `endDate`: ISO date string
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset

**Example**: `/api/transactions?accountId=uuid&type=expense&limit=50`

**Response**:
```json
[
  {
    "id": "uuid",
    "accountId": "uuid",
    "categoryId": "uuid",
    "type": "expense",
    "amount": 5050,
    "description": "Grocery shopping",
    "date": "2025-12-27T14:30:00Z",
    "isRecurring": false,
    "createdAt": "2025-12-27T14:30:00Z",
    "updatedAt": "2025-12-27T14:30:00Z",
    "account": {
      "name": "Main Checking",
      "icon": "🏦"
    },
    "category": {
      "name": "Food",
      "icon": "🍔"
    }
  }
]
```

#### POST /api/transactions

Create a new transaction.

**Request**:
```json
{
  "accountId": "uuid",
  "categoryId": "uuid",
  "type": "expense",
  "amount": 5050,
  "description": "Grocery shopping",
  "date": "2025-12-27T14:30:00Z",
  "isRecurring": false
}
```

**Response**: Created transaction object with related data

**Side Effects**: Updates account balance automatically

#### GET /api/transactions/:id

Get a specific transaction.

**Response**: Single transaction object with related data

#### PUT /api/transactions/:id

Update a transaction.

**Request**: Partial transaction object
**Response**: Updated transaction object
**Side Effects**: Recalculates account balance

#### DELETE /api/transactions/:id

Delete a transaction.

**Response**: `{ message: "Transaction deleted" }`
**Side Effects**: Updates account balance

### Categories

#### GET /api/categories

Get all categories.

**Query Parameters**:
- `type`: Filter by type ('income' or 'expense')

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Food",
    "type": "expense",
    "icon": "🍔",
    "color": "#F59E0B",
    "createdAt": "2025-12-27T10:00:00Z"
  }
]
```

#### POST /api/categories

Create a new category.

**Request**:
```json
{
  "name": "Healthcare",
  "type": "expense",
  "icon": "🏥",
  "color": "#EF4444"
}
```

**Response**: Created category object

### Dashboard

#### GET /api/dashboard/stats

Get aggregated dashboard statistics.

**Response**:
```json
{
  "totalBalance": 500000,
  "monthlyIncome": 300000,
  "monthlyExpenses": 150000,
  "accountsCount": 4,
  "transactionsCount": 127,
  "accounts": [
    {
      "id": "uuid",
      "name": "Main Checking",
      "type": "checking",
      "balance": 250000,
      "currency": "EUR",
      "icon": "🏦",
      "color": "#3B82F6"
    }
  ]
}
```

**Calculations**:
- `totalBalance`: Sum of all account balances
- `monthlyIncome`: Sum of income transactions in current month
- `monthlyExpenses`: Sum of expense transactions in current month
- `accountsCount`: Total number of accounts
- `transactionsCount`: Total number of transactions

## Error Handling

### Error Response Format

```json
{
  "error": "Error message here",
  "details": "Additional details (optional)"
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Common Errors

**Invalid UUID**:
```json
{
  "error": "Invalid account ID format"
}
```

**Missing Required Field**:
```json
{
  "error": "Missing required field: name"
}
```

**Foreign Key Violation**:
```json
{
  "error": "Account not found"
}
```

## Request Validation

### Account Creation

Required fields:
- `name`: string, 1-255 characters
- `type`: enum ('checking', 'savings', 'credit_card', 'investment')
- `balance`: integer
- `currency`: string, 3 characters (ISO 4217)

Optional fields:
- `icon`: string, default '💰'
- `color`: string (HEX color), default '#3B82F6'

### Transaction Creation

Required fields:
- `accountId`: valid UUID
- `type`: enum ('income', 'expense')
- `amount`: integer > 0
- `date`: ISO date string

Optional fields:
- `categoryId`: valid UUID or null
- `description`: string
- `isRecurring`: boolean, default false

## Server Configuration

### CORS

Enabled for all origins in development:
```typescript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

**Production**: Restrict to specific origin

### Port Configuration

Default port: `3001`
Override: Set `PORT` environment variable

### Database Connection

Connection pooling enabled:
```typescript
const db = drizzle(pool, { schema });
```

Pool configuration in `src/db/client.ts`

## API Implementation

### Route Structure

```
src/api/
├── routes/
│   ├── accounts.ts        # Account endpoints
│   ├── transactions.ts    # Transaction endpoints
│   ├── categories.ts      # Category endpoints
│   └── dashboard.ts       # Dashboard stats
├── server.ts              # Express server setup
└── types.ts               # Shared TypeScript types
```

### Example Route Handler

```typescript
// GET /api/accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await db.select().from(accountsTable);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});
```

### Database Query Examples

**Select with joins**:
```typescript
const transactions = await db
  .select({
    ...transactionsTable,
    account: accountsTable,
    category: categoriesTable,
  })
  .from(transactionsTable)
  .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
  .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id));
```

**Filtering**:
```typescript
const expenseTransactions = await db
  .select()
  .from(transactionsTable)
  .where(eq(transactionsTable.type, 'expense'));
```

**Aggregation**:
```typescript
const totalBalance = await db
  .select({ sum: sql<number>`sum(balance)` })
  .from(accountsTable);
```

## Testing API Endpoints

### Using curl

```bash
# Get all accounts
curl http://localhost:3001/api/accounts

# Create account
curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Account","type":"checking","balance":0,"currency":"EUR"}'

# Get dashboard stats
curl http://localhost:3001/api/dashboard/stats
```

### Using Postman/Insomnia

Import endpoints:
```
GET  http://localhost:3001/api/accounts
POST http://localhost:3001/api/accounts
GET  http://localhost:3001/api/transactions
POST http://localhost:3001/api/transactions
GET  http://localhost:3001/api/dashboard/stats
```

## Performance Optimization

1. **Database indexes**: Foreign keys and frequently queried columns
2. **Connection pooling**: Reuse database connections
3. **Query optimization**: Use DrizzleORM's query builder
4. **Pagination**: Limit large result sets
5. **Caching**: Potential future enhancement with Redis

## Security Considerations

### Current Implementation

- No authentication (single-user)
- Input validation for data types
- ORM prevents SQL injection
- CORS enabled for development

### Production Recommendations

1. Add authentication (JWT, sessions)
2. Implement rate limiting
3. Restrict CORS origins
4. Add request size limits
5. Enable HTTPS
6. Add API key for programmatic access
7. Implement audit logging

## Future Enhancements

- GraphQL API alternative
- WebSocket for real-time updates
- Batch operations endpoint
- Export/import endpoints (CSV, JSON)
- Webhook notifications
- API versioning (/api/v1, /api/v2)

## Related Documentation

- [Database Schema](./04-database-schema.md)
- [Frontend Components](./06-frontend-components.md)
- [Testing](./10-testing.md)
