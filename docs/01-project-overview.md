# Project Overview

## What is Finance Manager?

Finance Manager is a modern Finance Management (PFM) software designed to help users track their financial accounts, transactions, and analyze their spending patterns.

## Core Features

### 1. Account Management
- Create and manage multiple financial accounts (checking, savings, credit cards, investments)
- Support for multiple currencies (EUR, USD, GBP)
- Real-time balance tracking
- Custom icons and colors for each account

### 2. Transaction Tracking
- Record income and expense transactions
- Categorize transactions (rent, food, salary, etc.)
- Track recurring payments
- Transaction history with filtering and search

### 3. Dashboard & Analytics
- Real-time financial overview
- Monthly income and expense summaries
- Savings rate calculation
- Visual charts and statistics
- Account balance aggregation

### 4. User Interface
- Modern, responsive design
- Dark mode support with system preference detection
- Mobile-friendly interface
- Smooth animations and transitions

## Project Goals

1. **Simplicity**: Easy to use interface for daily financial tracking
2. **Performance**: Fast, responsive application with efficient data handling
3. **Privacy**: Self-hosted solution with local database
4. **Extensibility**: Clean architecture for future feature additions

## Target Users

- Individuals wanting to track personal finances
- Users preferring self-hosted solutions
- People looking for a modern alternative to spreadsheets
- Developers seeking a finance tracking template

## Technical Highlights

- **Full-Stack TypeScript**: Type safety across frontend and backend
- **Modern React**: Hooks, functional components, and best practices
- **PostgreSQL**: Robust relational database for financial data
- **RESTful API**: Clean API design for potential mobile app integration
- **Developer Experience**: Hot reload, TypeScript, linting, and testing setup

## Project Structure

```
Finance Manager/
├── src/                    # Frontend React application
│   ├── Components/         # React components
│   ├── Main.tsx           # Application entry point
│   └── index.css          # Global styles (Tailwind)
├── src/api/               # Backend Express server
│   ├── routes/            # API route handlers
│   ├── server.ts          # Server entry point
│   └── types.ts           # Shared types
├── src/db/                # Database layer
│   ├── schema.ts          # Database schema (DrizzleORM)
│   ├── client.ts          # Database client
│   └── seed.ts            # Sample data seeder
├── docs/                  # This documentation
└── package.json           # Dependencies and scripts
```

## Roadmap

Future planned features:
- Budget planning and alerts
- Data import/export (CSV, OFX)
- Recurring transaction automation
- Multi-currency conversion
- Mobile application
- Bill reminders
- Financial goal tracking

## License & Credits

This project is built with open-source technologies and best practices from the developer community.
