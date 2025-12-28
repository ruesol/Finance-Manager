# Development Workflow

This document covers development practices, workflows, debugging, and tooling.

## Development Environment

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16+
- VS Code (recommended)
- Git

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Environment Setup

1. **Clone Repository**:
```bash
git clone <repository-url>
cd finance-manager
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Configure Database**:
```bash
# Create .env file
echo "DATABASE_URL=postgresql://user:password@localhost:5432/finance_db" > .env
```

4. **Initialize Database**:
```bash
npm run db:push
npm run db:seed  # Optional: seed with test data
```

5. **Start Development Servers**:
```bash
# Terminal 1: Frontend (Vite)
npm run dev

# Terminal 2: Backend (Express)
npm run server
```

## Git Workflow

### Branch Strategy

**Main Branches**:
- `main`: Production-ready code
- `develop`: Development integration branch

**Feature Branches**:
- `feature/account-management`
- `feature/dark-mode`
- `bugfix/transaction-calculation`

### Commit Conventions

Using conventional commits:

```bash
# Feature
git commit -m "feat: add transaction filtering"

# Bug fix
git commit -m "fix: correct balance calculation"

# Documentation
git commit -m "docs: update API documentation"

# Style
git commit -m "style: format code with prettier"

# Refactor
git commit -m "refactor: extract currency formatting utility"

# Test
git commit -m "test: add account creation tests"
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and open PR
4. Request review
5. Address feedback
6. Merge to `develop`
7. Delete feature branch

## Code Style

### TypeScript

**Naming Conventions**:
```typescript
// Interfaces: PascalCase
interface Account {}

// Functions: camelCase
function formatCurrency() {}

// Components: PascalCase
function Dashboard() {}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:3001';

// Types: PascalCase
type Theme = 'light' | 'dark' | 'system';
```

**Type Safety**:
```typescript
// ✅ Good: Explicit types
function calculateTotal(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

// ❌ Bad: Implicit any
function calculateTotal(amounts) {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}
```

### React Components

**Functional Components**:
```typescript
// ✅ Good: Type props, export default
interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return <div>...</div>;
}
```

**Hooks at Top Level**:
```typescript
function MyComponent() {
  // ✅ Good: Hooks first
  const [state, setState] = useState(0);
  useEffect(() => {}, []);
  
  // Then other logic
  function handleClick() {}
  
  return <div>...</div>;
}
```

### File Organization

```
src/
├── App.tsx              # Root component
├── main.tsx             # Entry point
├── index.css            # Global styles
├── Components/          # React components
│   ├── Dashboard.tsx
│   ├── AccountList.tsx
│   └── TransactionsList.tsx
├── api/                 # Backend API
│   ├── server.ts
│   └── routes/
│       ├── accounts.ts
│       ├── transactions.ts
│       └── categories.ts
├── db/                  # Database
│   ├── client.ts
│   └── schema.ts
└── types/              # Shared types
    └── index.ts
```

## Debugging

### Frontend Debugging

**React DevTools**:
1. Install [React DevTools](https://react.dev/learn/react-developer-tools)
2. Open browser DevTools → Components tab
3. Inspect component state and props

**Console Logging**:
```typescript
// Development only
if (import.meta.env.DEV) {
  console.log('Debug:', data);
}
```

**Browser Breakpoints**:
1. Open DevTools → Sources
2. Find component file
3. Click line number to set breakpoint
4. Trigger code path
5. Inspect variables

**Network Tab**:
- Monitor API requests
- Check request/response payloads
- Verify status codes
- Check timing

### Backend Debugging

**VS Code Debugger**:

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "server"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

**Console Logging**:
```typescript
// Add logging to routes
router.post('/accounts', async (req, res) => {
  console.log('Creating account:', req.body);
  // ... handler logic
});
```

**Database Query Logging**:
```typescript
// Enable Drizzle logging
const db = drizzle(pool, { 
  schema,
  logger: true  // Logs all queries
});
```

### Common Issues

**Issue: Dark mode not working**
- **Cause**: Tailwind v4 needs `@variant dark (.dark &);`
- **Fix**: Add to `src/index.css`

**Issue: API requests fail**
- **Check**: Backend server running on port 3001
- **Check**: CORS configuration
- **Check**: Network tab for errors

**Issue: Database connection fails**
- **Check**: PostgreSQL running
- **Check**: `DATABASE_URL` in `.env`
- **Check**: Database exists

**Issue: Build errors**
- **Fix**: Clear cache and reinstall
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Testing

### Unit Tests (Jest)

**Run Tests**:
```bash
npm test
```

**Example Test**:
```typescript
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('formats cents to EUR currency', () => {
    expect(formatCurrency(10000, 'EUR')).toBe('€100.00');
  });
  
  it('handles negative amounts', () => {
    expect(formatCurrency(-5050, 'EUR')).toBe('-€50.50');
  });
});
```

### Integration Tests

**API Tests with Supertest**:
```typescript
import request from 'supertest';
import app from '../api/server';

describe('POST /api/accounts', () => {
  it('creates a new account', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .send({
        name: 'Test Account',
        type: 'checking',
        balance: 0,
        currency: 'EUR'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Test Account');
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('create new account', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('text=Accounts');
  await page.click('text=New Account');
  await page.fill('input[name="name"]', 'Savings');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Savings')).toBeVisible();
});
```

## Performance Monitoring

### Lighthouse

```bash
npm run build
npm run preview
# Open Chrome DevTools → Lighthouse → Run audit
```

**Target Scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### React DevTools Profiler

1. Open React DevTools
2. Click Profiler tab
3. Click record
4. Interact with app
5. Stop recording
6. Analyze render times

**Optimization Strategies**:
- Use `React.memo` for expensive components
- Implement `useMemo` for expensive calculations
- Use `useCallback` to prevent recreation

## Build & Deployment

### Development Build

```bash
npm run dev
```

**Features**:
- Hot Module Replacement (HMR)
- Source maps
- Fast refresh
- Verbose error messages

### Production Build

```bash
npm run build
```

**Optimizations**:
- Code minification
- CSS purging
- Tree shaking
- Asset compression
- Hash-based caching

**Output**:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── favicon.svg
```

### Preview Production Build

```bash
npm run preview
```

Serves production build locally on port 4173.

## Database Management

### Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:push

# Drop database
npm run db:drop
```

### Schema Changes

1. Edit `src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL
4. Apply: `npm run db:push`

**Example Migration**:
```sql
-- Add column
ALTER TABLE accounts ADD COLUMN "description" text;

-- Create index
CREATE INDEX idx_transactions_date ON transactions("date");
```

### Seeding Data

**File**: `src/db/seed.ts`

```typescript
async function seed() {
  await db.insert(accountsTable).values([
    {
      name: 'Main Checking',
      type: 'checking',
      balance: 250000,
      currency: 'EUR',
      icon: '🏦',
      color: '#3B82F6'
    }
  ]);
}
```

**Run**:
```bash
npm run db:seed
```

## Environment Variables

### Development (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finance_db

# API
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### Production (.env.production)

```bash
DATABASE_URL=postgresql://prod_user:password@prod-db:5432/finance_db
PORT=3001
NODE_ENV=production
VITE_API_URL=https://api.example.com/api
```

## Code Quality Tools

### ESLint

**Configuration**: `.eslintrc.json`

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ]
}
```

**Run**:
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Prettier

**Configuration**: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

**Run**:
```bash
npm run format
```

### TypeScript Compiler

```bash
npm run type-check
```

## Documentation Updates

When making changes:

1. Update relevant docs in `docs/`
2. Update inline code comments
3. Update README if API changes
4. Add migration notes if schema changes

## Continuous Integration

### GitHub Actions

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Related Documentation

- [Getting Started](./02-getting-started.md)
- [Testing](./10-testing.md)
- [Deployment](./11-deployment.md)
