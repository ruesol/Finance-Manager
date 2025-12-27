import { 
  pgTable, 
  uuid, 
  varchar, 
  integer, 
  timestamp, 
  text,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
  check
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================
// ENUMS - Tipi personalizzati PostgreSQL
// ============================================

export const accountTypeEnum = pgEnum('account_type', [
  'CHECKING',
  'SAVINGS', 
  'WALLET',
  'INVESTMENT',
  'CREDIT_CARD'
]);
// ============================================
// if the enums changes, the trigger must be updated too, otherwise the trigger will silently fail
// ============================================
export const transactionTypeEnum = pgEnum('transaction_type', [
  'INCOME',
  'EXPENSE',
  'TRANSFER'
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'PENDING',
  'CLEARED',
  'RECONCILED',
  'CANCELLED'
]);

// ============================================
// TABELLE - Definizioni Schema
// ============================================

/**
 * ACCOUNTS TABLE
 * Gestisce i conti bancari/wallet dell'utente
 */
export const accounts = pgTable(
  'accounts',
  {
    // Primary Key - UUID per scalabilità
    id: uuid('id').defaultRandom().primaryKey(),
    
    // Dati base
    name: varchar('name', { length: 255 }).notNull(),
    type: accountTypeEnum('type').notNull(),
    
    // Saldo in centesimi (evita problemi con float)
    // Esempio: 100.50 EUR = 10050
    balance: integer('balance').notNull().default(0),
    
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    
    // Dati opzionali
    description: text('description'),
    icon: varchar('icon', { length: 10 }),
    color: varchar('color', { length: 7 }), // HEX color: #FF5733
    accountNumber: varchar('account_number', { length: 50 }),
    
    // Metadata - timestamp automatici
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    
    // Soft delete - invece di cancellare fisicamente
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    // INDICI per performance
    // Index su name per ricerca veloce
    nameIdx: index('accounts_name_idx').on(table.name),
    
    // Index su type per filtrare per tipo account
    typeIdx: index('accounts_type_idx').on(table.type),
    
    // Composite index per query comuni
    typeNameIdx: index('accounts_type_name_idx').on(table.type, table.name),
    
    // Unique constraint su account_number
    accountNumberUnique: uniqueIndex('accounts_account_number_unique')
      .on(table.accountNumber)
      .where(sql`deleted_at IS NULL`), // Solo se non cancellato
    
    // CHECK CONSTRAINTS - validazioni a livello DB
    balanceCheck: check('balance_check', sql`${table.balance} >= -999999999`),
    currencyCheckISO: check('currency_check', sql`LENGTH(${table.currency}) = 3`)
  })
);

/**
 * CATEGORIES TABLE
 * Categorie per organizzare transazioni (Groceries, Rent, etc)
 */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    
    // Categoria padre per gerarchie (es. Food -> Groceries)
    parentId: uuid('parent_id'),
    
    icon: varchar('icon', { length: 10 }),
    color: varchar('color', { length: 7 }),
    
    // Ordinamento manuale
    sortOrder: integer('sort_order').default(0),
    
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    nameIdx: index('categories_name_idx').on(table.name),
    parentIdx: index('categories_parent_idx').on(table.parentId),
    
    // Unique per nome + parent (non duplicate nello stesso livello)
    nameParentUnique: uniqueIndex('categories_name_parent_unique')
      .on(table.name, table.parentId)
  })
);

/**
 * TAGS TABLE
 * Tag liberi per transazioni (es. #vacation, #work, #urgent)
 */
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    color: varchar('color', { length: 7 }),
    
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    nameIdx: uniqueIndex('tags_name_idx').on(table.name)
  })
);

/**
 * TRANSACTIONS TABLE
 * Transazioni finanziarie (entrate, uscite, trasferimenti)
 */
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    
    // FOREIGN KEY - Riferimento all'account
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, {
        onDelete: 'cascade' // Se cancelli account, cancelli anche transazioni
      }),
    
    // Importo in centesimi
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    
    // Data transazione (diversa da createdAt)
    date: timestamp('date', { withTimezone: true }).notNull(),
    
    type: transactionTypeEnum('type').notNull(),
    status: transactionStatusEnum('status').notNull().default('CLEARED'),
    
    // FOREIGN KEY - Categoria (opzionale)
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null'
    }),
    
    // Descrizione e note
    description: text('description').notNull(),
    notes: text('notes'),
    
    // Dati merchant (opzionali)
    merchantName: varchar('merchant_name', { length: 255 }),
    merchantLocation: varchar('merchant_location', { length: 255 }),
    
    // Riferimento esterno (es. ID da banca)
    externalReferenceId: varchar('external_reference_id', { length: 100 }),
    
    // Per trasferimenti - account destinazione
    toAccountId: uuid('to_account_id').references(() => accounts.id, {
      onDelete: 'set null'
    }),
    
    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    // INDICI MULTIPLI per query performance
    
    // Index su account_id (query più comune)
    accountIdx: index('transactions_account_idx').on(table.accountId),
    
    // Index su data per ordinamento cronologico
    dateIdx: index('transactions_date_idx').on(table.date.desc()),
    
    // Composite index per filtrare per account + data
    accountDateIdx: index('transactions_account_date_idx')
      .on(table.accountId, table.date.desc()),
    
    // Index per categoria
    categoryIdx: index('transactions_category_idx').on(table.categoryId),
    
    // Index per tipo transazione
    typeIdx: index('transactions_type_idx').on(table.type),
    
    // Index per status
    statusIdx: index('transactions_status_idx').on(table.status),
    
    // Index per trasferimenti
    toAccountIdx: index('transactions_to_account_idx').on(table.toAccountId),
    
    // Composite per query complesse
    accountTypeDateIdx: index('transactions_account_type_date_idx')
      .on(table.accountId, table.type, table.date.desc()),
    
    // CHECK CONSTRAINTS
    amountCheck: check('amount_check', sql`${table.amount} != 0`),
    
    // Transfer deve avere to_account_id
    transferCheck: check(
      'transfer_check', 
      sql`(${table.type} = 'TRANSFER' AND ${table.toAccountId} IS NOT NULL) OR ${table.type} != 'TRANSFER'`
    ),
    
  })
);

/**
 * TRANSACTION_TAGS TABLE
 * Tabella many-to-many per relazione transactions <-> tags
 */
export const transactionTags = pgTable(
  'transaction_tags',
  {
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, {
        onDelete: 'cascade'
      }),
    
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, {
        onDelete: 'cascade'
      }),
    
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => ({
    // PRIMARY KEY composita
    pk: primaryKey({ columns: [table.transactionId, table.tagId] }),
    
    // Indici per query bidirezionali
    transactionIdx: index('transaction_tags_transaction_idx')
      .on(table.transactionId),
    tagIdx: index('transaction_tags_tag_idx')
      .on(table.tagId)
  })
);

// ============================================
// RELAZIONI - Per Query ORM
// ============================================

/**
 * Relations consentono query come:
 * db.query.accounts.findMany({ with: { transactions: true } })
 */

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  transfersTo: many(transactions, {
    relationName: 'transfersTo'
  })
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent'
  }),
  children: many(categories, {
    relationName: 'parent'
  }),
  transactions: many(transactions)
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id]
  }),
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
    relationName: 'transfersTo'
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id]
  }),
  transactionTags: many(transactionTags)
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  transactionTags: many(transactionTags)
}));

export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionTags.transactionId],
    references: [transactions.id]
  }),
  tag: one(tags, {
    fields: [transactionTags.tagId],
    references: [tags.id]
  })
}));

// ============================================
// TYPES - TypeScript types inferiti
// ============================================

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TransactionTag = typeof transactionTags.$inferSelect;
export type NewTransactionTag = typeof transactionTags.$inferInsert;
