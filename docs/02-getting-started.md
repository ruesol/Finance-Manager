# Getting Started

This guide will help you set up the Finance Manager application on your local development environment.

## Prerequisites

Ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **PostgreSQL**: v14.0 or higher ([Download](https://www.postgresql.org/download/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Finance Manager"
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages for both frontend and backend.

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=finance_manager
DB_SSL=false

# Node Environment
NODE_ENV=development
```

**Important**: Update `DB_PASSWORD` with your PostgreSQL password.

### 4. Create the Database

Connect to PostgreSQL and create the database:

```bash
psql -U postgres
```

Then run:

```sql
CREATE DATABASE finance_manager;
\q
```

Or use the npm script:

```bash
npm run db:create
```

### 5. Run Database Migrations

Set up the database schema:

```bash
npm run db:push
```

This will create all necessary tables based on the schema defined in `src/db/schema.ts`.

### 6. Seed Sample Data (Optional)

To populate the database with sample accounts and transactions:

```bash
npm run db:seed
```

This creates:
- 4 sample accounts (Checking, Savings, Credit Card, Investment)
- 20+ sample transactions
- Various categories

## Running the Application

### Development Mode

Start both frontend and backend servers simultaneously:

```bash
npm run dev:all
```

This will start:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:3001 (Express server)

### Run Servers Separately

**Frontend only**:
```bash
npm run dev
```

**Backend only**:
```bash
npm run server
```

## Verify Installation

1. Open http://localhost:5173 in your browser
2. You should see the Finance Manager dashboard
3. If you seeded data, you'll see sample accounts and transactions
4. Check the browser console for any errors

## Common Issues

### PostgreSQL Connection Error

**Issue**: `ECONNREFUSED` or connection refused
**Solution**: 
- Verify PostgreSQL is running: `pg_isready`
- Check the port in `.env` matches your PostgreSQL installation
- Ensure `DB_USER` and `DB_PASSWORD` are correct

### Port Already in Use

**Issue**: `EADDRINUSE` port 5173 or 3001 already in use
**Solution**:
- Kill the process using the port
- Change the port in `vite.config.ts` (frontend) or `src/api/server.ts` (backend)

### Module Not Found

**Issue**: Import errors or module not found
**Solution**:
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Tailwind Styles Not Loading

**Issue**: No styling or dark mode not working
**Solution**:
- Hard refresh the browser: `Ctrl + Shift + R`
- Verify `src/index.css` has `@import "tailwindcss"`
- Check browser console for CSS errors

## Development Tools

### Recommended VS Code Extensions

- **ES7+ React/Redux/React-Native snippets**: React code snippets
- **Tailwind CSS IntelliSense**: Tailwind class autocomplete
- **Prettier**: Code formatting
- **ESLint**: Code linting
- **PostgreSQL**: Database management

### Database Management

**DrizzleKit Studio** (Visual database browser):
```bash
npm run db:studio
```

Access at http://localhost:4983

**psql** (Command-line):
```bash
psql -U postgres -d finance_manager
```

## Next Steps

- Read [Architecture](./03-architecture.md) to understand the system design
- Explore [Frontend Components](./06-frontend-components.md) for UI development
- Check [Backend API](./05-backend-api.md) for API reference
- Review [Development Workflow](./09-development-workflow.md) for best practices

## Useful Commands Reference

```bash
# Install dependencies
npm install

# Development
npm run dev              # Frontend only
npm run server          # Backend only
npm run dev:all         # Both servers

# Database
npm run db:push         # Apply schema changes
npm run db:seed         # Seed sample data
npm run db:studio       # Open database UI

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format with Prettier
npm test               # Run tests

# Build
npm run build          # Build for production
```
