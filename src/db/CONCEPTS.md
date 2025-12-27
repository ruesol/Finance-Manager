# Drizzle ORM - Guida Completa per Database Professionali

## 📚 Concetti Fondamentali

### 1. **Schema Definition**

Lo schema definisce la struttura del database in TypeScript.

```typescript
import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age')
});
```

**Tipi disponibili:**
- `uuid()` - UUID (tipo PostgreSQL nativo)
- `varchar(name, { length })` - Stringa con lunghezza massima
- `text()` - Stringa illimitata
- `integer()` - Numero intero
- `boolean()` - true/false
- `timestamp()` - Data e ora
- `json()` / `jsonb()` - JSON
- `serial()` - Auto-increment
- `real()`, `doublePrecision()` - Float/Double

---

### 2. **ENUM - Tipi Personalizzati**

PostgreSQL permette di creare ENUM (tipi enumerati):

```typescript
export const statusEnum = pgEnum('status', ['PENDING', 'ACTIVE', 'COMPLETED']);

export const tasks = pgTable('tasks', {
  status: statusEnum('status').notNull().default('PENDING')
});
```

**Vantaggi:**
- ✅ Type-safe - TypeScript conosce i valori possibili
- ✅ Validazione DB - PostgreSQL impedisce valori invalidi
- ✅ Performance - ENUM sono più veloci di VARCHAR

---

### 3. **Foreign Keys - Relazioni**

Le **foreign keys** creano relazioni tra tabelle:

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey()
});

export const posts = pgTable('posts', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',  // Cancella post se cancelli user
      onUpdate: 'cascade'   // Aggiorna se cambia user.id
    })
});
```

**Opzioni onDelete:**
- `cascade` - Cancella record collegati
- `set null` - Imposta NULL
- `set default` - Imposta valore default
- `restrict` - Impedisce cancellazione (default)
- `no action` - Come restrict

---

### 4. **Indici - Performance**

Gli **indici** velocizzano le query:

```typescript
export const posts = pgTable('posts', {
  userId: uuid('user_id'),
  title: varchar('title', { length: 255 }),
  createdAt: timestamp('created_at')
}, (table) => ({
  // Index singolo
  userIdx: index('posts_user_idx').on(table.userId),
  
  // Index composto (per query che filtrano entrambi)
  userDateIdx: index('posts_user_date_idx')
    .on(table.userId, table.createdAt.desc()),
  
  // Unique index
  titleUnique: uniqueIndex('posts_title_unique')
    .on(table.title)
}));
```

**Quando usare indici:**
- ✅ Colonne in WHERE clause
- ✅ Colonne in ORDER BY
- ✅ Foreign keys
- ✅ Colonne per JOIN
- ❌ Tabelle piccole (<1000 righe)
- ❌ Colonne con pochi valori distinti

---

### 5. **CHECK Constraints - Validazioni**

Le **CHECK constraints** validano dati a livello database:

```typescript
export const products = pgTable('products', {
  price: integer('price'),
  stock: integer('stock')
}, (table) => ({
  priceCheck: check('price_positive', sql`${table.price} >= 0`),
  stockCheck: check('stock_valid', sql`${table.stock} >= 0 AND ${table.stock} <= 10000`)
}));
```

**Vantaggi:**
- ✅ Integrità dati garantita
- ✅ Impossibile inserire dati invalidi
- ✅ Validazione anche fuori dall'app

---

### 6. **Default Values e Auto-increment**

```typescript
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),  // Auto-increment
  uuid: uuid('uuid').defaultRandom(),  // UUID automatico
  status: varchar('status').default('PENDING'),
  createdAt: timestamp('created_at').defaultNow()  // Timestamp corrente
});
```

---

### 7. **Soft Delete Pattern**

Invece di cancellare fisicamente, imposta un timestamp:

```typescript
export const users = pgTable('users', {
  deletedAt: timestamp('deleted_at')  // NULL = attivo
});

// Soft delete
await db.update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, userId));

// Query esclude soft-deleted
await db.select()
  .from(users)
  .where(isNull(users.deletedAt));
```

**Vantaggi:**
- ✅ Recupero dati cancellati
- ✅ Audit trail
- ✅ Mantiene integrità referenziale

---

### 8. **Relations - Query con JOIN Automatico**

Definisci relazioni per query semplificate:

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id]
  })
}));

// Query con auto-join
const userWithPosts = await db.query.users.findFirst({
  with: { posts: true }  // Carica automaticamente i post
});
```

---

### 9. **Database Transactions - ACID**

Le **transactions** garantiscono atomicità:

```typescript
await db.transaction(async (tx) => {
  // Operazione 1
  await tx.insert(orders).values({ ... });
  
  // Operazione 2
  await tx.update(products).set({ stock: sql`stock - 1` });
  
  // Se una fallisce → ROLLBACK automatico
  // Se tutte ok → COMMIT
});
```

**ACID:**
- **Atomic** - Tutto o niente
- **Consistent** - Dati sempre validi
- **Isolated** - Transactions indipendenti
- **Durable** - Dati persistiti

---

### 10. **Trigger - Logica Automatica**

I **trigger** eseguono codice quando succede qualcosa:

```sql
-- Aggiorna updated_at automaticamente
CREATE TRIGGER update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Quando usare trigger:**
- ✅ Auto-update timestamp
- ✅ Calcoli derivati (es. saldo account)
- ✅ Validazioni complesse
- ✅ Audit log
- ❌ Logica business complessa (meglio nell'app)

---

### 11. **Prepared Statements - Performance**

Le **prepared statements** velocizzano query ripetute:

```typescript
// Compila una volta
const getUserById = db.select()
  .from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare();

// Esegui molte volte
await getUserById.execute({ id: 'user-1' });
await getUserById.execute({ id: 'user-2' });
```

---

### 12. **Materialized Views - Cache Query**

Le **materialized views** salvano risultati di query complesse:

```sql
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as last_post
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.name;
```

**Refresh manuale:**
```sql
REFRESH MATERIALIZED VIEW user_stats;
```

**Quando usare:**
- ✅ Report complessi
- ✅ Dashboard analytics
- ✅ Query pesanti eseguite spesso

---

### 13. **Migrations - Versioning Schema**

Le **migrations** tracciano modifiche allo schema:

```bash
# Genera migration da schema.ts
npx drizzle-kit generate

# File creato: drizzle/0001_initial_schema.sql
```

**Best practices:**
- ✅ Mai modificare migration già eseguite
- ✅ Version control (git)
- ✅ Test su staging prima di production
- ✅ Backup prima di migration

---

### 14. **Connection Pooling**

Il **connection pooling** riutilizza connessioni:

```typescript
const queryClient = postgres(connectionString, {
  max: 10,              // Max 10 connessioni simultanee
  idle_timeout: 20,     // Chiudi dopo 20s inattività
  connect_timeout: 10   // Timeout connessione
});
```

**Perché serve:**
- ✅ Performance - riutilizza connessioni
- ✅ Scalabilità - limita carico DB
- ✅ Resource management

---

### 15. **Query Optimization Tips**

**Index giusti:**
```typescript
// Query comune
WHERE account_id = X AND date > Y
ORDER BY date DESC

// Index ottimale
index('idx').on(table.accountId, table.date.desc())
```

**LIMIT sempre:**
```typescript
// ❌ Male - carica tutto
await db.select().from(users);

// ✅ Bene - limita risultati
await db.select().from(users).limit(100);
```

**SELECT solo colonne necessarie:**
```typescript
// ❌ Male
await db.select().from(users);

// ✅ Bene
await db.select({ id: users.id, name: users.name }).from(users);
```

**EXPLAIN per analisi:**
```typescript
await db.execute(sql`EXPLAIN ANALYZE SELECT * FROM users WHERE age > 18`);
```

---

## 🎯 Schema Professionale Checklist

- [x] **Tipi appropriati** - UUID per PK, INTEGER per soldi (cents)
- [x] **Foreign Keys** con onDelete/onUpdate
- [x] **Indici** su colonne filtrate/ordinate
- [x] **CHECK constraints** per validazioni
- [x] **ENUM** invece di VARCHAR per stati
- [x] **NOT NULL** dove appropriato
- [x] **Default values** per timestamp
- [x] **Soft delete** con deletedAt
- [x] **Trigger** per updated_at
- [x] **Relations** per query ORM
- [x] **Unique constraints** dove necessario
- [x] **Composite keys** per many-to-many
- [x] **Audit log** (opzionale)
- [x] **Connection pooling** configurato
- [x] **Migrations** versionate

---

## 🚀 Quick Reference

```typescript
// INSERT
await db.insert(table).values({ ... });

// SELECT
await db.select().from(table).where(eq(table.id, id));

// UPDATE
await db.update(table).set({ ... }).where(eq(table.id, id));

// DELETE
await db.delete(table).where(eq(table.id, id));

// JOIN
await db.select().from(table1)
  .leftJoin(table2, eq(table1.id, table2.foreignId));

// TRANSACTION
await db.transaction(async (tx) => { ... });

// AGGREGATION
await db.select({ total: sql<number>`SUM(amount)` }).from(table);
```

---

**Congratulazioni! Ora sai creare database professionali con Drizzle! 🎉**
