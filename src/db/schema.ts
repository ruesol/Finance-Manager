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

export const accountTypeEnum = pgEnum('account_type', [
  'CHECKING',
  'SAVINGS', 
  'WALLET',
  'INVESTMENT',
  'CREDIT_CARD'
]);

// if the enums changes, the trigger must be updated too, otherwise the trigger will silently fail
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

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: accountTypeEnum('type').notNull(),
    balance: integer('balance').notNull().default(0),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    description: text('description'),
    icon: varchar('icon', { length: 10 }),
    color: varchar('color', { length: 7 }),
    accountNumber: varchar('account_number', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    nameIdx: index('accounts_name_idx').on(table.name),
    typeIdx: index('accounts_type_idx').on(table.type),
    typeNameIdx: index('accounts_type_name_idx').on(table.type, table.name),
    accountNumberUnique: uniqueIndex('accounts_account_number_unique')
      .on(table.accountNumber)
      .where(sql`deleted_at IS NULL`),
    balanceCheck: check('balance_check', sql`${table.balance} >= -999999999`),
    currencyCheckISO: check('currency_check', sql`LENGTH(${table.currency}) = 3`)
  })
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    parentId: uuid('parent_id'),
    icon: varchar('icon', { length: 10 }),
    color: varchar('color', { length: 7 }),
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
    nameParentUnique: uniqueIndex('categories_name_parent_unique')
      .on(table.name, table.parentId)
  })
);

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

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, {
        onDelete: 'cascade'
      }),
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    date: timestamp('date', { withTimezone: true }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    status: transactionStatusEnum('status').notNull().default('CLEARED'),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null'
    }),
    description: text('description').notNull(),
    notes: text('notes'),
    merchantName: varchar('merchant_name', { length: 255 }),
    merchantLocation: varchar('merchant_location', { length: 255 }),
    externalReferenceId: varchar('external_reference_id', { length: 100 }),
    toAccountId: uuid('to_account_id').references(() => accounts.id, {
      onDelete: 'set null'
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    accountIdx: index('transactions_account_idx').on(table.accountId),
    dateIdx: index('transactions_date_idx').on(table.date.desc()),
    accountDateIdx: index('transactions_account_date_idx')
      .on(table.accountId, table.date.desc()),
    categoryIdx: index('transactions_category_idx').on(table.categoryId),
    typeIdx: index('transactions_type_idx').on(table.type),
    statusIdx: index('transactions_status_idx').on(table.status),
    toAccountIdx: index('transactions_to_account_idx').on(table.toAccountId),
    accountTypeDateIdx: index('transactions_account_type_date_idx')
      .on(table.accountId, table.type, table.date.desc()),
    amountCheck: check('amount_check', sql`${table.amount} != 0`),
    transferCheck: check(
      'transfer_check', 
      sql`(${table.type} = 'TRANSFER' AND ${table.toAccountId} IS NOT NULL) OR ${table.type} != 'TRANSFER'`
    ),
    
  })
);

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
    pk: primaryKey({ columns: [table.transactionId, table.tagId] }),
    transactionIdx: index('transaction_tags_transaction_idx')
      .on(table.transactionId),
    tagIdx: index('transaction_tags_tag_idx')
      .on(table.tagId)
  })
);

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
