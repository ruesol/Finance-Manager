import express from 'express';
import cors from 'cors';
import { db } from '../src/db/index';
import { accounts, transactions, categories, tags } from '../src/db/schema';
import { eq, isNull, gte, desc, sql } from 'drizzle-orm';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ============================================
// ACCOUNTS ENDPOINTS
// ============================================

// GET all accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const result = await db
      .select()
      .from(accounts)
      .where(isNull(accounts.deletedAt));
    res.json(result);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST create account
app.post('/api/accounts', async (req, res) => {
  try {
    const result = await db.insert(accounts).values(req.body).returning();
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT update account
app.put('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db
      .update(accounts)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// DELETE account (soft delete)
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db
      .update(accounts)
      .set({ deletedAt: new Date() })
      .where(eq(accounts.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============================================
// TRANSACTIONS ENDPOINTS
// ============================================

// GET all transactions with joins
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        accountName: accounts.name,
        accountIcon: accounts.icon,
        amount: transactions.amount,
        currency: transactions.currency,
        date: transactions.date,
        type: transactions.type,
        status: transactions.status,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        description: transactions.description,
        notes: transactions.notes,
        merchantName: transactions.merchantName,
        toAccountId: transactions.toAccountId
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(isNull(transactions.deletedAt))
      .orderBy(desc(transactions.date));

    // Get toAccount names for transfers
    const txsWithToAccount = await Promise.all(
      result.map(async (tx) => {
        if (tx.toAccountId) {
          const toAccount = await db
            .select({ name: accounts.name })
            .from(accounts)
            .where(eq(accounts.id, tx.toAccountId))
            .limit(1);
          return { ...tx, toAccountName: toAccount[0]?.name || null };
        }
        return { ...tx, toAccountName: null };
      })
    );

    res.json(txsWithToAccount);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST create transaction
app.post('/api/transactions', async (req, res) => {
  try {
    // Convert date string to Date object
    const data = {
      ...req.body,
      date: new Date(req.body.date)
    };
    const result = await db.insert(transactions).values(data).returning();
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// DELETE transaction (soft delete)
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(eq(transactions.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ============================================
// CATEGORIES ENDPOINTS
// ============================================

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.select().from(categories);
    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================
// DASHBOARD STATS ENDPOINT
// ============================================

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Get all accounts
    const allAccounts = await db
      .select()
      .from(accounts)
      .where(isNull(accounts.deletedAt));

    // Calculate total balance
    const totalBalance = allAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get monthly transactions
    const monthlyTxs = await db
      .select()
      .from(transactions)
      .where(isNull(transactions.deletedAt));

    // Filter by current month
    const monthlyTxsFiltered = monthlyTxs.filter(
      tx => new Date(tx.date) >= monthStart
    );

    // Calculate monthly income and expenses
    const monthlyIncome = monthlyTxsFiltered
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTxsFiltered
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    // Total transactions count
    const transactionsCount = monthlyTxs.filter(
      t => t.deletedAt === null
    ).length;

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      accountsCount: allAccounts.length,
      transactionsCount,
      accounts: allAccounts
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🏦 Accounts: http://localhost:${PORT}/api/accounts`);
  console.log(`💸 Transactions: http://localhost:${PORT}/api/transactions`);
});
