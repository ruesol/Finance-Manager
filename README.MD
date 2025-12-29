# � Finance Manager

> **The ultimate personal finance management solution built with Hexagonal Architecture**

A modern, extensible, and highly maintainable finance tracking application designed from the ground up with clean architecture principles. Every component is replaceable—UI, database, external services—making it future-proof and adaptable to any need.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![License: Commercial](https://img.shields.io/badge/License-Commercial-blue.svg)](LICENSE-COMMERCIAL.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)

---
## ✨ Key Features

### 📊 Core Functionality
- **Multi-account management**: Checking, savings, credit cards, investments
- **Transaction tracking**: Income, expenses, and transfers with detailed metadata
- **Category organization**: Hierarchical categories with icons and colors
- **Multi-currency support**: Handle multiple currencies with proper conversion

### 💰 Budget Management ⭐ NEW
- Set monthly, quarterly, or yearly budgets per category
- Real-time spending tracking with visual progress indicators
- Over-budget warnings with color-coded alerts
- Budget history and trends

### 📈 Advanced Analytics ⭐ NEW
- **Monthly trends**: Income vs expenses over configurable periods
- **Category insights**: Top spending categories with percentages
- **Year-over-year comparison**: Track financial growth patterns
- **Custom date ranges**: Analyze any time period

### 🔍 Advanced Search ⭐ NEW
- Filter by date range, amount, category, account
- Search in descriptions, notes, and merchant names
- Sort by date or amount
- Export filtered results

### 📤 Data Export ⭐ NEW
- **CSV export**: For Excel and spreadsheet analysis
- **JSON export**: For backups and programmatic access
- One-click download with proper formatting

### 🔐 Security & Authentication
- Clerk authentication with JWT verification
- Multi-tenancy with complete user isolation
- Row-level security at database level
- Secure API endpoints

### 🏷️ Category Management ⭐ NEW
- **Create & customize**: Icons, colors, names
- **Edit & delete**: Full CRUD operations
- **Drag & drop**: Reorder categories visually
- **Smart deletion**: Prevents deleting categories with transactions

### 💱 Multi-Currency ⭐ NEW
- **Real-time rates**: 10+ major currencies
- **Currency converter**: Instant conversions
- **Exchange rate table**: View all rates at once
- **Travel-friendly**: Perfect for international transactions

---
## 🎯 Project Vision

**Finance Manager** aims to be the best open-source solution for personal and business money accounting by:

- 📊 **Best-in-class accounting**: Comprehensive transaction tracking, multi-currency support, and powerful analytics
- 🏗️ **Hexagonal Architecture**: Clean separation between business logic and infrastructure
- 🔌 **Everything is replaceable**: Swap UI frameworks, databases, or external services without touching core logic
- 🧪 **100% testable**: Domain logic isolated from dependencies for rock-solid reliability
- 🚀 **Production-ready**: Built with TypeScript, React 19, and PostgreSQL for enterprise-grade performance

---

## 🏛️ Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters), ensuring:

```
┌─────────────────────────────────────────────────────┐
│                  Primary Adapters                    │
│         (Driving - What drives the app)              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │ REST API │  │   CLI    │  │ React UI │         │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│        │             │              │                │
│        └─────────────┼──────────────┘                │
│                      │                               │
├──────────────────────┼───────────────────────────────┤
│                      ▼                               │
│              ┌───────────────┐                       │
│              │  DOMAIN CORE  │                       │
│              │               │                       │
│              │ • Account     │                       │
│              │ • Transaction │                       │
│              │ • Money       │                       │
│              │ • Category    │                       │
│              │               │                       │
│              │ Pure business │                       │
│              │ logic - zero  │                       │
│              │ dependencies  │                       │
│              └───────┬───────┘                       │
│                      │                               │
│                      ▼                               │
│              ┌───────────────┐                       │
│              │     PORTS     │                       │
│              │  (Interfaces) │                       │
│              │               │                       │
│              │ • Repository  │                       │
│              │ • Services    │                       │
│              │ • Gateways    │                       │
│              └───────┬───────┘                       │
├──────────────────────┼───────────────────────────────┤
│                      ▼                               │
│              Secondary Adapters                      │
│         (Driven - Infrastructure)                    │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │PostgreSQL│  │  APIs    │  │  Cache   │         │
│   └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

### Why Hexagonal?

- ✅ **Replace the UI**: Swap React for Vue, Svelte, or mobile apps without changing business logic
- ✅ **Replace the DB**: Move from PostgreSQL to MongoDB, MySQL, or in-memory storage seamlessly
- ✅ **Replace services**: Switch payment providers, notification systems, or analytics engines
- ✅ **100% tested domain**: Test business rules without databases or HTTP servers
- ✅ **Technology freedom**: Never locked into specific frameworks or vendors

---

## ✨ Features

### Core Features
- 💳 **Multi-account management**: Track checking, savings, credit cards, investments, and crypto
- 💸 **Transaction tracking**: Income, expenses, and transfers with rich metadata
- 🏷️ **Smart categorization**: Organize transactions with categories and tags
- 💱 **Multi-currency support**: Handle multiple currencies with proper conversion
- 📊 **Analytics & insights**: Visual dashboards with spending trends and savings rate
- 🌙 **Dark mode**: Full dark mode support across all components
- 📱 **Responsive design**: Beautiful UI that works on desktop, tablet, and mobile

### Technical Features
- 🧪 **175+ tests**: Comprehensive test suite with 96%+ domain coverage
- 🎨 **Interactive UI**: Clickable cards with detailed modals and charts
- 📈 **Visual analytics**: Bar charts, pie charts, and progress indicators
- 🔒 **Type-safe**: Full TypeScript coverage for compile-time safety
- ⚡ **Fast**: Optimized React 19 with efficient rendering
- 🎯 **Clean code**: ESLint, Prettier, and strict TypeScript config

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose (for PostgreSQL)
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ruesol/Finance-Manager.git
cd Finance-Manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the database**
```bash
docker compose up -d
```

4. **Run database migrations**
```bash
npm run db:migrate
```

5. **Seed with sample data** (optional)
```bash
npm run db:seed
```

6. **Start the development server**
```bash
npm run dev:all
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

---

## 📦 Project Structure

```
finance-manager/
├── src/
│   ├── Domain/                 # 🎯 Core business logic (zero dependencies)
│   │   ├── Account.ts          # Account entity and business rules
│   │   ├── Transaction.ts      # Transaction entity
│   │   ├── Money.ts            # Money value object (immutable)
│   │   ├── Category.ts         # Category management
│   │   └── interfaces/         # Port definitions (contracts)
│   │
│   ├── Components/             # 🎨 React UI components (Primary Adapter)
│   │   ├── Dashboard.tsx       # Interactive dashboard with charts
│   │   ├── AccountList.tsx     # Account management
│   │   ├── TransactionsList.tsx# Transaction tracking
│   │   └── InteractiveComponents.tsx # Reusable UI components
│   │
│   ├── db/                     # 💾 Database adapter (Secondary Adapter)
│   │   ├── schema.ts           # Drizzle ORM schema
│   │   ├── index.ts            # Database connection
│   │   └── migrate.ts          # Migration runner
│   │
│   ├── Test/                   # 🧪 Test suite
│   │   ├── Account.test.ts
│   │   ├── Money.test.ts
│   │   └── utils.test.ts
│   │
│   └── utils.ts                # 🛠️ Utility functions
│
├── server/                     # 🌐 REST API (Primary Adapter)
│   └── index.ts                # Express server with endpoints
│
├── docs/                       # 📚 Documentation
│   └── 01-project-overview.md
│
├── LICENSE                     # MIT License (personal use)
├── LICENSE-COMMERCIAL.md       # Commercial license terms
├── docker-compose.yml          # PostgreSQL container
├── drizzle.config.ts          # Database configuration
└── package.json               # Dependencies and scripts
```

---

## 🔌 Replaceable Components

Thanks to hexagonal architecture, you can easily replace any infrastructure component:

### Replace the UI Framework

```typescript
// Current: React
<Dashboard stats={data} />

// Future: Vue, Svelte, Angular, mobile apps
// Just implement the same interface!
```

### Replace the Database

```typescript
// Current: PostgreSQL with Drizzle ORM
export const db = drizzle(queryClient, { schema });

// Future: MongoDB, MySQL, SQLite, in-memory
// Just implement the Repository interfaces!
class MongoTransactionRepository implements TransactionRepository {
  async save(transaction: Transaction): Promise<void> { /* ... */ }
  async findById(id: string): Promise<Transaction> { /* ... */ }
}
```

### Replace External Services

```typescript
// Current: Direct API calls
// Future: Banking APIs, payment providers, notification services
// Just implement the Gateway interfaces!
interface BankingProvider {
  fetchTransactions(): Promise<Transaction[]>;
}
```

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage:**
- Domain Layer: **96%+** (Account, Money, Transaction)
- Utilities: **100%**
- App Component: **100%**
- Overall: **175+ tests**, all passing ✅

---

## 📊 Database

### Available Commands

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Open Drizzle Studio (visual database editor)
npm run db:studio

# Push schema directly (development only)
npm run db:push
```

### Current Schema

- **accounts**: Bank accounts, credit cards, investments
- **transactions**: All financial transactions
- **categories**: Transaction categories
- **tags**: Flexible tagging system

---

## 🎨 UI Components

The UI is built with modern React patterns and Tailwind CSS:

- **Interactive cards**: Click to view detailed analytics
- **Modal system**: Rich detail views with charts
- **Dark mode**: Complete dark theme support
- **Responsive**: Mobile-first design
- **Accessible**: Semantic HTML and ARIA labels

---

## 📜 License

This project is dual-licensed:

### For Personal Use (Free)
**MIT License** - Use freely for personal, non-commercial purposes.  
See [LICENSE](LICENSE) for full terms.

### For Commercial Use (Paid)
**Commercial License** required for businesses, organizations, and commercial applications.  
See [LICENSE-COMMERCIAL.md](LICENSE-COMMERCIAL.md) for pricing and terms.

**Contact:** commercial@financemanager.example.com

---

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🧪 More tests
- 🎨 UI enhancements

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 🗺️ Roadmap

### Phase 1: Core Foundation ✅
- [x] Hexagonal architecture setup
- [x] Domain model (Account, Transaction, Money)
- [x] PostgreSQL adapter
- [x] REST API
- [x] React UI with dark mode
- [x] Test suite with 96%+ coverage

### Phase 2: Enhanced Features (In Progress)
- [ ] Banking API integration (Open Banking)
- [ ] Budget management
- [ ] Recurring transactions
- [ ] Export to CSV/PDF
- [ ] Mobile app (React Native)

### Phase 3: Advanced Features
- [ ] Multi-user support with authentication
- [ ] Rule-based automation
- [ ] Investment tracking
- [ ] AI-powered categorization
- [ ] Plugin system for extensions
- [ ] GraphQL API option

### Phase 4: Enterprise Features
- [ ] Multi-tenancy
- [ ] Advanced reporting
- [ ] Audit logs
- [ ] Role-based access control
- [ ] SSO integration

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/ruesol/Finance-Manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ruesol/Finance-Manager/discussions)
- **Email**: support@financemanager.example.com

---

## 🏗️ Built With

- **Frontend**: React 19, TypeScript 5.7, Tailwind CSS 4
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL 16, Drizzle ORM
- **Testing**: Jest 30, React Testing Library
- **Build**: Vite 6, tsx
- **DevOps**: Docker, Docker Compose

---

## 📝 Documentation

- [Architecture Overview](docs/01-project-overview.md)
- [Testing Guide](src/Test/README.md)
- [Coverage Report](TEST_COVERAGE_REPORT.md)
- [API Documentation](server/README.md) _(coming soon)_

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! It helps others discover the project.

---

## 📄 Credits

Created with ❤️ by the Finance Manager team.

Inspired by the principles of Domain-Driven Design and Clean Architecture.

---

**Ready to take control of your finances?** [Get started now](#-quick-start) or explore the [architecture](#-architecture)!