# Architecture

This document describes the high-level architecture and technical decisions of the Finance Manager application.

## System Architecture

Finance Manager follows a **monolithic full-stack architecture** with clear separation between frontend, backend, and database layers.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Client                       │
│              React + TypeScript + Tailwind              │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST
                      │ (fetch API)
┌─────────────────────▼───────────────────────────────────┐
│                  Express API Server                      │
│              Node.js + TypeScript + Express             │
│   ┌──────────────────────────────────────────────────┐ │
│   │  Routes      │  Controllers  │   Validation      │ │
│   └──────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │ DrizzleORM
                      │ (Type-safe queries)
┌─────────────────────▼───────────────────────────────────┐
│                  PostgreSQL Database                     │
│      accounts | transactions | categories | ...         │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Layer

**Framework**: React 18
- Component-based architecture
- Functional components with Hooks
- TypeScript for type safety
- No external state management (using React's built-in useState)

**Build Tool**: Vite
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- Native ES modules support

**Styling**: Tailwind CSS v4
- Utility-first CSS framework
- Custom theming with CSS variables
- Dark mode support with class-based strategy
- Responsive design utilities

**Key Libraries**:
- No external dependencies for state management
- Native fetch API for HTTP requests
- Browser localStorage for theme persistence

### Backend Layer

**Runtime**: Node.js with TypeScript
- Type-safe server-side code
- Modern ES modules
- Async/await for asynchronous operations

**Framework**: Express.js
- RESTful API design
- Middleware architecture
- CORS enabled for development

**ORM**: DrizzleORM
- Type-safe database queries
- PostgreSQL dialect
- Schema-first approach
- Migration system

### Database Layer

**Database**: PostgreSQL 14+
- Relational database for financial data
- ACID compliance for data integrity
- Strong consistency guarantees
- Rich data types (DECIMAL, TIMESTAMP, etc.)

**Schema Design**:
- Normalized data structure
- Foreign key constraints
- Indexed columns for performance
- Monetary values stored as integers (cents)

## Design Patterns

### Frontend Patterns

**1. Component Composition**
```tsx
<Dashboard>
  <StatsCard />
  <AccountList />
  <TransactionsList />
</Dashboard>
```
- Small, reusable components
- Props for configuration
- Clear component boundaries

**2. Colocation**
- Components in `src/Components/`
- Styles within components (Tailwind classes)
- Types defined near usage

**3. Custom Hooks** (potential)
```tsx
// Future enhancement
const { accounts, loading, error } = useAccounts();
```

### Backend Patterns

**1. Route → Controller → Database**
```
GET /api/accounts
  → accountsRouter
    → getAccounts()
      → db.select().from(accounts)
```

**2. Middleware Chain**
```
Request → CORS → JSON Parser → Route Handler → Response
```

**3. Error Handling**
```tsx
try {
  const accounts = await db.query...
  res.json(accounts);
} catch (error) {
  res.status(500).json({ error: 'Internal error' });
}
```

## Data Flow

### Reading Data (GET)

```
1. User opens Dashboard
2. React component mounts
3. useEffect() triggers fetch()
4. HTTP GET /api/dashboard/stats
5. Express route handler
6. DrizzleORM queries PostgreSQL
7. PostgreSQL returns rows
8. Express sends JSON response
9. React updates state
10. Component re-renders with data
```

### Writing Data (POST/PUT/DELETE)

```
1. User submits form
2. Event handler calls fetch()
3. HTTP POST /api/accounts
4. Express validates request body
5. DrizzleORM inserts into PostgreSQL
6. PostgreSQL returns inserted row
7. Express sends success response
8. React updates local state
9. UI reflects new data
```

## File Structure

```
src/
├── Components/              # React UI components
│   ├── Dashboard.tsx       # Main dashboard view
│   ├── AccountList.tsx     # Accounts management
│   └── TransactionsList.tsx # Transactions view
├── api/                     # Backend API
│   ├── routes/             # Express route definitions
│   │   ├── accounts.ts     # Account CRUD endpoints
│   │   ├── transactions.ts # Transaction endpoints
│   │   └── dashboard.ts    # Dashboard stats
│   ├── server.ts           # Express server setup
│   └── types.ts            # Shared TypeScript types
├── db/                      # Database layer
│   ├── schema.ts           # DrizzleORM schema
│   ├── client.ts           # Database connection
│   └── seed.ts             # Sample data
├── App.tsx                 # Root React component
├── Main.tsx                # React entry point
└── index.css               # Global styles
```

## Key Technical Decisions

### 1. Monorepo Structure
**Decision**: Keep frontend and backend in one repository
**Rationale**:
- Simplified development workflow
- Easier code sharing (types, utilities)
- Single deployment unit
- Better for small teams

### 2. Integer Monetary Storage
**Decision**: Store amounts as integers (cents)
**Rationale**:
- Avoids floating-point precision errors
- Standard in financial applications
- Example: $10.50 → 1050 cents

### 3. DrizzleORM over Raw SQL
**Decision**: Use an ORM for database access
**Rationale**:
- Type-safe queries
- Better developer experience
- Automatic TypeScript inference
- Still close to SQL (no magic)

### 4. No Authentication (Yet)
**Decision**: Single-user application without auth
**Rationale**:
- Simplified initial development
- Focus on core features
- Easy to add later
- Self-hosted environment assumed

### 5. Tailwind CSS v4
**Decision**: Use latest Tailwind version
**Rationale**:
- Modern theming with CSS variables
- New `@variant` syntax for dark mode
- Better performance
- Smaller bundle size

## Performance Considerations

### Frontend Optimizations
- Vite's code splitting
- Lazy loading potential for routes
- Tailwind CSS purging unused styles
- React's automatic optimizations

### Backend Optimizations
- Database connection pooling
- Indexed database columns
- Efficient SQL queries via DrizzleORM
- JSON response streaming

### Database Optimizations
- Primary keys on all tables
- Foreign key indexes
- Appropriate column types
- Query result limiting

## Security Considerations

**Current State** (Development):
- No authentication/authorization
- CORS enabled for all origins
- Environment variables for config

**Production Recommendations**:
- Add user authentication (JWT, sessions)
- Restrict CORS to specific origins
- Use HTTPS
- Input validation and sanitization
- Rate limiting
- SQL injection prevention (ORM helps)
- XSS prevention (React helps)

## Scalability

**Current Scale**: Single-user, self-hosted
**Handles**: ~100k transactions comfortably

**Future Scaling Options**:
- Add caching layer (Redis)
- Implement pagination for large datasets
- Database read replicas
- API rate limiting
- Horizontal scaling with load balancer

## Testing Strategy

**Unit Tests**: Individual functions and components
**Integration Tests**: API endpoints with test database
**E2E Tests**: Full user workflows (potential)

See [Testing Documentation](./10-testing.md) for details.

## Next Steps

- Review [Database Schema](./04-database-schema.md) for data model
- Explore [Backend API](./05-backend-api.md) for endpoint details
- Check [Frontend Components](./06-frontend-components.md) for UI architecture
