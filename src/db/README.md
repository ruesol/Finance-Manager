# Database Schema - Finance Manager

Schema database professionale con **PostgreSQL** e **Drizzle ORM**.

## 📋 Indice

- [Struttura Database](#struttura-database)
- [Setup](#setup)
- [Migrations](#migrations)
- [Query Examples](#query-examples)
- [Trigger e Functions](#trigger-e-functions)
- [Best Practices](#best-practices)

---

## 🗄️ Struttura Database

### Tabelle

1. **accounts** - Conti bancari/wallet
2. **categories** - Categorie transazioni (gerarchiche)
3. **tags** - Tag liberi per transazioni
4. **transactions** - Transazioni finanziarie
5. **transaction_tags** - Many-to-many transactions ↔ tags
6. **audit_logs** - Log modifiche (audit trail)

### Diagramma ER

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  accounts   │──1:N──│ transactions │──N:1──│ categories  │
└─────────────┘       └──────────────┘       └─────────────┘
                             │                       │
                             │N:M                    │1:N
                             │                       │
                       ┌──────────────────┐    ┌─────────┐
                       │ transaction_tags │──N:1│  tags   │
                       └──────────────────┘    └─────────┘
```

---

## 🚀 Setup

### 1. Installa dipendenze

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit @types/node
```

### 2. Configura environment variables

Copia `.env.example` → `.env`

```bash
cp .env.example .env
```

Modifica `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=finance_manager
```

### 3. Crea database PostgreSQL

```sql
CREATE DATABASE finance_manager;
```

### 4. Genera migrations

```bash
npx drizzle-kit generate
```

Questo crea file migration in `./drizzle/`

### 5. Esegui migrations

```bash
npx tsx src/db/migrate.ts
```

Questo esegue:
- ✅ Schema migrations (tabelle, indici, constraints)
- ✅ Trigger (updated_at, balance update)
- ✅ Views materializzate
- ✅ Funzioni PostgreSQL custom

---

## 📊 Schema Details

### **accounts**

```typescript
{
  id: UUID (PK),
  name: VARCHAR(255),
  type: ENUM('CHECKING', 'SAVINGS', 'WALLET', 'INVESTMENT', 'CREDIT_CARD'),
  balance: INTEGER, // cents
  currency: VARCHAR(3), // ISO 4217 (EUR, USD, etc)
  description: TEXT,
  icon: VARCHAR(10),
  color: VARCHAR(7), // HEX #FF5733
  accountNumber: VARCHAR(50) UNIQUE,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP, // auto-updated by trigger
  deletedAt: TIMESTAMP // soft delete
}
```

**Indici:**
- `accounts_name_idx` - ricerca per nome
- `accounts_type_idx` - filtrare per tipo
- `accounts_type_name_idx` - composite
- `accounts_account_number_unique` - unique constraint

**Constraints:**
- `balance >= -999999999` - previene underflow
- `LENGTH(currency) = 3` - formato ISO

---

### **transactions**

```typescript
{
  id: UUID (PK),
  accountId: UUID (FK → accounts),
  amount: INTEGER, // cents
  currency: VARCHAR(3),
  date: TIMESTAMP,
  type: ENUM('INCOME', 'EXPENSE', 'TRANSFER'),
  status: ENUM('PENDING', 'CLEARED', 'RECONCILED', 'CANCELLED'),
  categoryId: UUID (FK → categories),
  description: TEXT,
  notes: TEXT,
  merchantName: VARCHAR(255),
  merchantLocation: VARCHAR(255),
  externalReferenceId: VARCHAR(100),
  toAccountId: UUID (FK → accounts), // for transfers
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  deletedAt: TIMESTAMP
}
```

**Indici multipli per performance:**
- `transactions_account_idx` - query per account
- `transactions_date_idx` - ordinamento cronologico
- `transactions_account_date_idx` - composite (query comune)
- `transactions_category_idx` - filtro per categoria
- `transactions_type_idx` - filtro per tipo
- E altri...

**Constraints:**
- `amount != 0` - impedisce transazioni zero
- `type = 'TRANSFER' → toAccountId NOT NULL` - transfer validation

---

### **categories** (Gerarchiche)

```typescript
{
  id: UUID (PK),
  name: VARCHAR(100),
  parentId: UUID (FK → categories), // self-referencing
  icon: VARCHAR(10),
  color: VARCHAR(7),
  sortOrder: INTEGER,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

**Permette gerarchie:**
```
Food (parent)
├─ Groceries
├─ Restaurants
└─ Fast Food

Transport (parent)
├─ Gas
├─ Public Transport
└─ Taxi
```

---

### **tags** & **transaction_tags** (Many-to-Many)

```typescript
tags {
  id: UUID (PK),
  name: VARCHAR(50) UNIQUE,
  color: VARCHAR(7),
  createdAt: TIMESTAMP
}

transaction_tags {
  transactionId: UUID (FK → transactions),
  tagId: UUID (FK → tags),
  createdAt: TIMESTAMP,
  PRIMARY KEY (transactionId, tagId)
}
```

---

## ⚡ Trigger e Functions

### 1. **Auto-update updated_at**

Trigger automatico che aggiorna `updated_at` quando una row cambia.

```sql
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

Applicato a: `accounts`, `categories`, `transactions`

---

### 2. **Auto-update Account Balance**

Trigger che aggiorna automaticamente il saldo quando:
- Inserisci transazione → aggiunge/sottrae importo
- Modifichi transazione → ricalcola differenza
- Cancelli transazione → reversa operazione

```sql
CREATE TRIGGER update_balance_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();
```

**Non serve più aggiornare manualmente il balance!**

---

### 3. **Prevent Same Account Transfer**

Impedisce trasferimenti allo stesso account:

```sql
IF NEW.type = 'TRANSFER' AND NEW.account_id = NEW.to_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same account';
END IF;
```

---

### 4. **Audit Log** (Opzionale)

Registra automaticamente ogni modifica in `audit_logs`:

```typescript
{
  id: UUID,
  table_name: VARCHAR,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  row_id: UUID,
  old_data: JSONB,
  new_data: JSONB,
  changed_at: TIMESTAMP
}
```

---

### 5. **Custom Functions**

#### `get_balance_between_dates(accountId, startDate, endDate)`

Calcola saldo tra due date.

```typescript
const balance = await db.execute(sql`
  SELECT get_balance_between_dates(
    ${accountId}, 
    ${startDate}, 
    ${endDate}
  )
`);
```

#### `get_top_categories(limit, startDate, endDate)`

Top N categorie di spesa.

```typescript
const topCategories = await db.execute(sql`
  SELECT * FROM get_top_categories(5)
`);
```

---

## 🔍 Materialized Views

### **account_stats**

Statistiche aggregate per account:

```sql
SELECT 
    account_id,
    name,
    type,
    balance,
    transaction_count,
    total_income,
    total_expenses,
    last_transaction_date
FROM account_stats;
```

Refresh manuale:
```sql
REFRESH MATERIALIZED VIEW account_stats;
```

---

### **category_stats**

Statistiche per categoria:

```sql
SELECT 
    category_id,
    name,
    transaction_count,
    total_amount,
    avg_amount,
    first_transaction,
    last_transaction
FROM category_stats;
```

---

## 💻 Query Examples

### INSERT

```typescript
// Singolo
await db.insert(accounts).values({
  name: 'Checking',
  type: 'CHECKING',
  balance: 100000
});

// Multipli
await db.insert(transactions).values([
  { ... },
  { ... }
]);
```

### SELECT

```typescript
// Tutti
await db.select().from(accounts);

// Con WHERE
await db.select()
  .from(accounts)
  .where(eq(accounts.type, 'CHECKING'));

// Con JOIN
await db.select()
  .from(transactions)
  .leftJoin(accounts, eq(transactions.accountId, accounts.id));
```

### UPDATE

```typescript
await db.update(accounts)
  .set({ balance: 50000 })
  .where(eq(accounts.id, accountId));
```

### DELETE

```typescript
// Hard delete
await db.delete(accounts).where(eq(accounts.id, id));

// Soft delete
await db.update(accounts)
  .set({ deletedAt: new Date() })
  .where(eq(accounts.id, id));
```

### AGGREGATIONS

```typescript
await db.select({
  total: sql<number>`SUM(${transactions.amount})`,
  count: sql<number>`COUNT(*)`,
  avg: sql<number>`AVG(${transactions.amount})`
})
.from(transactions)
.where(eq(transactions.type, 'EXPENSE'));
```

### WITH RELATIONS

```typescript
// Carica account con transazioni
await db.query.accounts.findFirst({
  where: eq(accounts.id, accountId),
  with: {
    transactions: {
      orderBy: desc(transactions.date)
    }
  }
});
```

---

## 🎯 Best Practices

### 1. **Usa Transactions per operazioni atomiche**

```typescript
await db.transaction(async (tx) => {
  await tx.insert(transactions).values({ ... });
  await tx.update(accounts).set({ ... });
  // Se fallisce, ROLLBACK automatico
});
```

### 2. **Soft Delete invece di Hard Delete**

```typescript
// Invece di DELETE
await db.update(accounts)
  .set({ deletedAt: new Date() })
  .where(eq(accounts.id, id));

// Query esclude soft-deleted
await db.select()
  .from(accounts)
  .where(isNull(accounts.deletedAt));
```

### 3. **Usa Prepared Statements**

```typescript
const preparedQuery = db.select()
  .from(transactions)
  .where(eq(transactions.accountId, sql.placeholder('accountId')))
  .prepare();

await preparedQuery.execute({ accountId: 'xxx' });
```

### 4. **Indici per performance**

Drizzle genera automaticamente indici definiti nello schema.

### 5. **Validazioni a livello DB**

Usa `CHECK` constraints invece di validare solo nell'app:

```typescript
check('amount_check', sql`${table.amount} > 0`)
```

### 6. **Migrations Versionate**

Non modificare mai migration già eseguite. Crea nuove migration:

```bash
npx drizzle-kit generate
```

---

## 📚 Comandi Utili

```bash
# Genera migration da schema
npx drizzle-kit generate

# Esegui migrations
npx tsx src/db/migrate.ts

# Visualizza schema nel browser
npx drizzle-kit studio

# Push schema senza migration (dev only!)
npx drizzle-kit push

# Drop database (ATTENZIONE!)
npx drizzle-kit drop
```

---

## 🔐 Sicurezza

1. **Mai committare `.env`** - aggiungi a `.gitignore`
2. **Usa variabili ambiente** in produzione
3. **Connection pooling** - configurato in `src/db/index.ts`
4. **Prepared statements** - Drizzle li usa automaticamente
5. **Input validation** - valida SEMPRE input utente

---

## 📖 Documentazione Ufficiale

- [Drizzle ORM](https://orm.drizzle.team)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [postgres-js](https://github.com/porsager/postgres)

---

## ✅ Checklist Setup

- [x] Installato dipendenze
- [x] Configurato `.env`
- [x] Creato database PostgreSQL
- [x] Generato migrations
- [x] Eseguito migrations
- [x] Testato connessione

---

**Pronto per il deploy! 🚀**
