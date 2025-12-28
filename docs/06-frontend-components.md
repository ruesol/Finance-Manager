# Frontend Components

This document describes the React component architecture, state management, and UI implementation.

## Component Overview

The frontend is built with functional React components using TypeScript and Tailwind CSS.

## Component Tree

```
App.tsx (Root)
├── Navigation
│   ├── Logo
│   ├── NavButtons (Dashboard, Accounts, Transactions)
│   └── ThemeToggle
├── Main Content (conditional)
│   ├── Dashboard
│   │   ├── StatsCards (4x)
│   │   ├── AccountsGrid
│   │   └── QuickStats (2x)
│   ├── AccountList
│   │   ├── AccountCard (multiple)
│   │   └── CreateAccountForm
│   └── TransactionsList
│       ├── TransactionFilters
│       ├── TransactionTable
│       └── CreateTransactionForm
└── Footer
```

## Core Components

### App.tsx

Root application component managing routing and theme.

**State**:
```typescript
const [currentPage, setCurrentPage] = useState<Page>('dashboard');
const [theme, setTheme] = useState<Theme>('system');
```

**Key Features**:
- Client-side routing (no React Router)
- Theme management (light/dark/system)
- Navigation between pages
- Global layout structure

**Theme Implementation**:
```typescript
useLayoutEffect(() => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}, [theme]);
```

### Dashboard.tsx

Main dashboard view showing financial overview.

**Location**: `src/Components/Dashboard.tsx`

**State**:
```typescript
const [stats, setStats] = useState<DashboardStats>({
  totalBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  accountsCount: 0,
  transactionsCount: 0,
  accounts: []
});
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Data Fetching**:
```typescript
useEffect(() => {
  loadDashboardData();
}, []);

async function loadDashboardData() {
  const response = await fetch(`${API_URL}/dashboard/stats`);
  const data = await response.json();
  setStats(data);
}
```

**Sections**:
1. **Stats Cards**: 4 cards showing key metrics
   - Total Balance
   - Monthly Income
   - Monthly Expenses
   - Savings

2. **Accounts Grid**: Display all accounts with balances

3. **Quick Stats**: Monthly breakdown and info cards

**Currency Formatting**:
```typescript
function formatCurrency(cents: number, currency: string = 'EUR'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency
  }).format(amount);
}
```

### AccountList.tsx

Manage financial accounts.

**Location**: `src/Components/AccountList.tsx`

**Features**:
- List all accounts
- Create new account
- Edit existing account
- Delete account
- Real-time balance display

**State Management**:
```typescript
const [accounts, setAccounts] = useState<Account[]>([]);
const [showForm, setShowForm] = useState(false);
const [editingAccount, setEditingAccount] = useState<Account | null>(null);
```

**CRUD Operations**:
```typescript
// Create
async function handleCreateAccount(data: AccountFormData) {
  const response = await fetch('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  const newAccount = await response.json();
  setAccounts([...accounts, newAccount]);
}

// Delete
async function handleDeleteAccount(id: string) {
  await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
  setAccounts(accounts.filter(a => a.id !== id));
}
```

### TransactionsList.tsx

View and manage transactions.

**Location**: `src/Components/TransactionsList.tsx`

**Features**:
- Transaction table with sorting
- Filter by account, type, date
- Create new transaction
- Edit/delete transactions
- Pagination

**Filtering**:
```typescript
const [filters, setFilters] = useState({
  accountId: null,
  type: null,
  startDate: null,
  endDate: null
});

const filteredTransactions = transactions.filter(t => {
  if (filters.accountId && t.accountId !== filters.accountId) return false;
  if (filters.type && t.type !== filters.type) return false;
  // ... date filtering
  return true;
});
```

**Transaction Form**:
- Account selection dropdown
- Category selection dropdown
- Amount input (validates positive numbers)
- Date picker
- Description textarea

## Styling Approach

### Tailwind CSS Classes

All styling uses Tailwind utility classes:

```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
```

### Common Patterns

**Card Component**:
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  {children}
</div>
```

**Button Component**:
```tsx
<button className="px-6 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
  Click Me
</button>
```

**Form Input**:
```tsx
<input className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500" />
```

### Dark Mode Implementation

Every component includes dark mode variants:

```tsx
// Background
className="bg-white dark:bg-gray-800"

// Text
className="text-gray-900 dark:text-gray-100"

// Borders
className="border-gray-200 dark:border-gray-700"
```

### Responsive Design

Mobile-first approach with Tailwind breakpoints:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Responsive grid: 1 col mobile, 2 tablet, 4 desktop */}
</div>
```

**Breakpoints**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## State Management

### No External Library

Uses React's built-in state management:
- `useState` for component state
- `useEffect` for side effects
- `useLayoutEffect` for synchronous DOM updates (theme)

### Data Flow

1. Component mounts → `useEffect` triggers
2. Fetch data from API → `fetch()`
3. Update state → `setState()`
4. Component re-renders with new data

### State Location

- **Local State**: Component-specific data (forms, UI toggles)
- **Fetched State**: API data cached in component state
- **Global State**: Theme stored in localStorage

**Example**:
```typescript
// Local state
const [showModal, setShowModal] = useState(false);

// Fetched state
const [accounts, setAccounts] = useState<Account[]>([]);

// Global state (persisted)
const theme = localStorage.getItem('theme');
```

## Loading States

All data-fetching components implement loading states:

```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
}
```

## Error Handling

Graceful error displays with retry:

```tsx
if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Error
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
      <button onClick={retry} className="...">
        Retry
      </button>
    </div>
  );
}
```

## TypeScript Types

### Interfaces

```typescript
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  balance: number;
  currency: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
}

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accountsCount: number;
  transactionsCount: number;
  accounts: AccountSummary[];
}
```

### Type Safety

All API responses are typed:

```typescript
const response = await fetch('/api/accounts');
const accounts: Account[] = await response.json();
```

## Performance Optimizations

### Potential Improvements

1. **React.memo**: Memoize expensive components
```typescript
const MemoizedAccountCard = React.memo(AccountCard);
```

2. **useMemo**: Memoize expensive calculations
```typescript
const sortedTransactions = useMemo(
  () => transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
  [transactions]
);
```

3. **useCallback**: Memoize callback functions
```typescript
const handleDelete = useCallback((id: string) => {
  setAccounts(prev => prev.filter(a => a.id !== id));
}, []);
```

4. **Lazy Loading**: Code splitting for routes
```typescript
const Dashboard = lazy(() => import('./Components/Dashboard'));
```

## Accessibility

### Current Implementation

- Semantic HTML elements
- Alt text for icons (emojis used as visual indicators)
- Focus states on interactive elements
- Color contrast ratios meet WCAG AA

### Future Improvements

- ARIA labels for screen readers
- Keyboard navigation
- Focus management for modals
- Skip to content link

## Testing

Component tests with Jest and React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

test('renders dashboard title', () => {
  render(<Dashboard />);
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

See [Testing Documentation](./10-testing.md) for more details.

## Component Best Practices

1. **Single Responsibility**: Each component has one clear purpose
2. **Prop Validation**: TypeScript interfaces for all props
3. **Conditional Rendering**: Clear loading/error/success states
4. **Consistent Styling**: Reusable Tailwind patterns
5. **Type Safety**: No `any` types, explicit interfaces
6. **Error Boundaries**: Graceful error handling
7. **Accessibility**: Semantic HTML and ARIA when needed

## Related Documentation

- [Styling & Theming](./07-styling-theming.md)
- [State Management](./08-state-management.md)
- [Backend API](./05-backend-api.md)
