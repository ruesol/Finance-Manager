import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkClient, verifyToken } from '@clerk/backend';
import { db, schema } from '../src/db/index';
import { accounts, transactions, categories, tags, budgets } from '../src/db/schema';
import { eq, isNull, gte, desc, sql, and, lte, between, or, like, asc } from 'drizzle-orm';
import logger from './logger';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Clerk authentication middleware
const authenticateClerk = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn({ path: req.path }, 'Unauthorized request - Missing token');
      return res.status(401).json({ error: 'Unauthorized - Missing token' });
    }

    const token = authHeader.substring(7);
    
    const verifyOptions: any = {
      secretKey: process.env.CLERK_SECRET_KEY!
    };
    
    if (process.env.CLERK_JWT_KEY) {
      verifyOptions.jwtKey = process.env.CLERK_JWT_KEY;
    }
    
    const verified = await verifyToken(token, verifyOptions);

    if (!verified || !verified.sub) {
      logger.warn({ path: req.path }, 'Unauthorized request - Invalid token');
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    req.userId = verified.sub;
    logger.debug({ userId: req.userId, path: req.path }, 'User authenticated');
    next();
  } catch (error) {
    logger.error({ error, path: req.path }, 'Authentication error');
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// ============================================
// ONBOARDING UTILITIES
// ============================================

const DEFAULT_CATEGORIES = [
  { name: 'Alimentari', icon: '🛒', color: '#10B981', sortOrder: 1 },
  { name: 'Ristoranti', icon: '🍽️', color: '#F59E0B', sortOrder: 2 },
  { name: 'Trasporti', icon: '🚗', color: '#3B82F6', sortOrder: 3 },
  { name: 'Bollette', icon: '💡', color: '#EF4444', sortOrder: 4 },
  { name: 'Affitto', icon: '🏠', color: '#DC2626', sortOrder: 5 },
  { name: 'Salute', icon: '⚕️', color: '#EC4899', sortOrder: 6 },
  { name: 'Intrattenimento', icon: '🎮', color: '#8B5CF6', sortOrder: 7 },
  { name: 'Shopping', icon: '🛍️', color: '#F97316', sortOrder: 8 },
  { name: 'Stipendio', icon: '💼', color: '#22C55E', sortOrder: 9 },
  { name: 'Freelance', icon: '💻', color: '#3B82F6', sortOrder: 10 }
];

// Initialize default categories for new users
async function ensureUserHasCategories(userId: string) {
  const existingCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  if (existingCategories.length === 0) {
    logger.info({ userId }, 'Onboarding user: Creating default categories');
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId }))
    );
  }
}

// ============================================
// ACCOUNTS ENDPOINTS
// ============================================

// GET all accounts
app.get('/api/accounts', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    const result = await db
      .select()
      .from(accounts)
      .where(and(
        eq(accounts.userId, userId),
        isNull(accounts.deletedAt)
      ));
    res.json(result);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error fetching accounts');
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST create account
app.post('/api/accounts', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = await db.insert(accounts).values({
      ...req.body,
      userId
    }).returning();
    res.json(result[0]);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error creating account');
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT update account
app.put('/api/accounts/:id', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const result = await db
      .update(accounts)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(
        eq(accounts.id, id),
        eq(accounts.userId, userId)
      ))
      .returning();
    res.json(result[0]);
  } catch (error) {
    logger.error({ error, userId: req.userId, accountId: req.params.id }, 'Error updating account');
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// DELETE account (soft delete)
app.delete('/api/accounts/:id', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    await db
      .update(accounts)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(accounts.id, id),
        eq(accounts.userId, userId)
      ));
    res.json({ success: true });
  } catch (error) {
    logger.error({ error, userId: req.userId, accountId: req.params.id }, 'Error deleting account');
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============================================
// TRANSACTIONS ENDPOINTS
// ============================================

// GET all transactions with joins
app.get('/api/transactions', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
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
        toAccountId: transactions.toAccountId,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      ))
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
    logger.error({ error, userId: req.userId }, 'Error fetching transactions');
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST create transaction
app.post('/api/transactions', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Verify account belongs to user
    const account = await db
      .select()
      .from(accounts)
      .where(and(
        eq(accounts.id, req.body.accountId),
        eq(accounts.userId, userId)
      ))
      .limit(1);
      
    if (!account.length) {
      return res.status(403).json({ error: 'Account not found or unauthorized' });
    }
    
    // Convert date string to Date object
    const data = {
      ...req.body,
      userId,
      date: new Date(req.body.date)
    };
    const result = await db.insert(transactions).values(data).returning();
    res.json(result[0]);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error creating transaction');
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// DELETE transaction (soft delete)
app.delete('/api/transactions/:id', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    // Verify transaction belongs to user directly
    const txCheck = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, userId)
      ))
      .limit(1);
      
    if (!txCheck.length) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }
    
    await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(eq(transactions.id, id));
    res.json({ success: true });
  } catch (error) {
    logger.error({ error, userId: req.userId, transactionId: req.params.id }, 'Error deleting transaction');
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ============================================
// CATEGORIES ENDPOINTS
// ============================================

// GET all categories
app.get('/api/categories', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Ensure user has default categories (onboarding)
    await ensureUserHasCategories(userId);
    
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));
    res.json(result);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error fetching categories');
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST create category
app.post('/api/categories', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { name, parentId, icon, color, sortOrder } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await db
      .insert(categories)
      .values({
        userId,
        name,
        parentId: parentId || null,
        icon: icon || null,
        color: color || null,
        sortOrder: sortOrder || 0
      })
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error creating category');
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT update category
app.put('/api/categories/:id', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const categoryId = req.params.id;
    const { name, parentId, icon, color, sortOrder } = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (icon !== undefined) updateData.icon = icon || null;
    if (color !== undefined) updateData.color = color || null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    
    const result = await db
      .update(categories)
      .set(updateData)
      .where(and(
        eq(categories.id, categoryId),
        eq(categories.userId, userId)
      ))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    logger.error({ error, userId: req.userId, categoryId: req.params.id }, 'Error updating category');
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category
app.delete('/api/categories/:id', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const categoryId = req.params.id;
    
    // Check if category has transactions
    const txCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId));
    
    if (txCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with transactions',
        transactionCount: txCount[0].count
      });
    }
    
    const result = await db
      .delete(categories)
      .where(and(
        eq(categories.id, categoryId),
        eq(categories.userId, userId)
      ))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error({ error, userId: req.userId, categoryId: req.params.id }, 'Error deleting category');
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// PATCH reorder categories
app.patch('/api/categories/reorder', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { categories: categoryOrders } = req.body;
    
    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    // Update all categories in a transaction
    const updates = await Promise.all(
      categoryOrders.map(({ id, sortOrder }: { id: string; sortOrder: number }) =>
        db
          .update(categories)
          .set({ sortOrder, updatedAt: new Date() })
          .where(and(
            eq(categories.id, id),
            eq(categories.userId, userId)
          ))
          .returning()
      )
    );
    
    res.json({ message: 'Categories reordered successfully', updated: updates.length });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error reordering categories');
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// ============================================
// CURRENCY CONVERSION ENDPOINT
// ============================================

// GET exchange rates
app.get('/api/currency/rates', authenticateClerk, async (req: any, res) => {
  try {
    const { base = 'EUR' } = req.query;
    
    // Using exchangerate-api.com free tier (no API key needed for basic usage)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    
    res.json({
      base: data.base,
      date: data.date,
      rates: data.rates
    });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error fetching exchange rates');
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

// POST convert currency
app.post('/api/currency/convert', authenticateClerk, async (req: any, res) => {
  try {
    const { amount, from, to } = req.body;
    
    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'Amount, from, and to currencies are required' });
    }
    
    if (from === to) {
      return res.json({ amount, from, to, converted: amount, rate: 1 });
    }
    
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    const rate = data.rates[to];
    
    if (!rate) {
      return res.status(400).json({ error: `Exchange rate not found for ${to}` });
    }
    
    const converted = Math.round(amount * rate);
    
    res.json({
      amount,
      from,
      to,
      converted,
      rate
    });
  } catch (error) {
    logger.error({ error, amount, from, to }, 'Error converting currency');
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

// ============================================
// DASHBOARD STATS ENDPOINT
// ============================================

app.get('/api/dashboard/stats', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get all accounts for this user
    const allAccounts = await db
      .select()
      .from(accounts)
      .where(and(
        eq(accounts.userId, userId),
        isNull(accounts.deletedAt)
      ));

    // Calculate total balance
    const totalBalance = allAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get monthly transactions for user directly
    const monthlyTxs = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        deletedAt: transactions.deletedAt
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      ));

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
    const transactionsCount = monthlyTxs.length;

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      accountsCount: allAccounts.length,
      transactionsCount,
      accounts: allAccounts
    });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error fetching dashboard stats');
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ============================================
// EXPORT ENDPOINTS
// ============================================

// Export transactions as CSV
app.get('/api/export/transactions/csv', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    const result = await db
      .select({
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        category: categories.name,
        account: accounts.name,
        status: transactions.status,
        notes: transactions.notes,
        merchantName: transactions.merchantName
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      ))
      .orderBy(desc(transactions.date));
    
    // Build CSV
    const headers = ['Data', 'Descrizione', 'Importo', 'Tipo', 'Categoria', 'Conto', 'Stato', 'Note', 'Commerciante'];
    const csvRows = [headers.join(',')];
    
    for (const row of result) {
      const values = [
        row.date?.toISOString().split('T')[0] || '',
        `"${row.description?.replace(/"/g, '""') || ''}"`,
        (row.amount / 100).toFixed(2),
        row.type,
        `"${row.category || ''}"`,
        `"${row.account || ''}"`,
        row.status,
        `"${row.notes?.replace(/"/g, '""') || ''}"`,
        `"${row.merchantName?.replace(/"/g, '""') || ''}"`
      ];
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error exporting CSV');
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// Export transactions as JSON
app.get('/api/export/transactions/json', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    const result = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      ))
      .orderBy(desc(transactions.date));
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.json');
    res.json({
      exportDate: new Date().toISOString(),
      totalTransactions: result.length,
      transactions: result
    });
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error exporting JSON');
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// ============================================
// BUDGETS ENDPOINTS
// ============================================

// GET all budgets
app.get('/api/budgets', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    const result = await db
      .select({
        budget: budgets,
        category: categories
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, userId))
      .orderBy(budgets.startDate);
    
    res.json(result);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error fetching budgets');
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// GET budget spending for current period
app.get('/api/budgets/:id/spending', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const budgetId = req.params.id;
    
    const budget = await db
      .select()
      .from(budgets)
      .where(and(
        eq(budgets.id, budgetId),
        eq(budgets.userId, userId)
      ))
      .limit(1);
    
    if (budget.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const b = budget[0];
    const endDate = b.endDate || new Date();
    
    // Calculate total spending for this category in the period
    const spending = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.categoryId, b.categoryId),
        eq(transactions.type, 'EXPENSE'),
        gte(transactions.date, b.startDate),
        lte(transactions.date, endDate),
        isNull(transactions.deletedAt)
      ));
    
    const spent = Math.abs(spending[0]?.total || 0);
    const remaining = Math.max(0, b.amount - spent);
    const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    
    res.json({
      budgetId: b.id,
      amount: b.amount,
      spent,
      remaining,
      percentage: Math.round(percentage * 10) / 10,
      isOverBudget: spent > b.amount
    });
  } catch (error) {
    logger.error({ error, userId: req.userId, budgetId: req.params.id }, 'Error fetching budget spending');
    res.status(500).json({ error: 'Failed to fetch budget spending' });
  }
});

// CREATE budget
app.post('/api/budgets', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { categoryId, amount, period, startDate, endDate } = req.body;
    
    if (!categoryId || !amount || !period || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await db
      .insert(budgets)
      .values({
        userId,
        categoryId,
        amount,
        period,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      })
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error creating budget');
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// UPDATE budget
app.put('/api/budgets/:id', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const budgetId = req.params.id;
    const { amount, period, startDate, endDate } = req.body;
    
    const updateData: any = { updatedAt: new Date() };
    if (amount !== undefined) updateData.amount = amount;
    if (period !== undefined) updateData.period = period;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    
    const result = await db
      .update(budgets)
      .set(updateData)
      .where(and(
        eq(budgets.id, budgetId),
        eq(budgets.userId, userId)
      ))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    logger.error({ error, userId: req.userId, budgetId: req.params.id }, 'Error updating budget');
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// DELETE budget
app.delete('/api/budgets/:id', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const budgetId = req.params.id;
    
    const result = await db
      .delete(budgets)
      .where(and(
        eq(budgets.id, budgetId),
        eq(budgets.userId, userId)
      ))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    logger.error({ error, userId: req.userId, budgetId: req.params.id }, 'Error deleting budget');
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// ============================================
// ADVANCED SEARCH ENDPOINT
// ============================================

// Advanced transaction search with filters
app.get('/api/transactions/search', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const {
      startDate,
      endDate,
      minAmount,
      maxAmount,
      categoryId,
      accountId,
      type,
      status,
      searchText,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    
    const conditions = [
      eq(transactions.userId, userId),
      isNull(transactions.deletedAt)
    ];
    
    if (startDate) {
      conditions.push(gte(transactions.date, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, new Date(endDate as string)));
    }
    if (minAmount) {
      conditions.push(gte(transactions.amount, Math.abs(parseInt(minAmount as string))));
    }
    if (maxAmount) {
      conditions.push(lte(transactions.amount, Math.abs(parseInt(maxAmount as string))));
    }
    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId as string));
    }
    if (accountId) {
      conditions.push(eq(transactions.accountId, accountId as string));
    }
    if (type) {
      conditions.push(eq(transactions.type, type as any));
    }
    if (status) {
      conditions.push(eq(transactions.status, status as any));
    }
    if (searchText) {
      const search = `%${searchText}%`;
      conditions.push(
        or(
          like(transactions.description, search),
          like(transactions.notes, search),
          like(transactions.merchantName, search)
        )!
      );
    }
    
    const orderColumn = sortBy === 'amount' ? transactions.amount : transactions.date;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    
    const result = await db
      .select({
        transaction: transactions,
        category: categories,
        account: accounts
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(...conditions))
      .orderBy(orderFn(orderColumn));
    
    res.json(result);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error searching transactions');
    res.status(500).json({ error: 'Failed to search transactions' });
  }
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

// Monthly trends
app.get('/api/analytics/trends/monthly', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { months = 12 } = req.query;
    
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months as string));
    
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.date}, 'YYYY-MM')`,
        type: transactions.type,
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        gte(transactions.date, monthsAgo),
        isNull(transactions.deletedAt)
      ))
      .groupBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`, transactions.type)
      .orderBy(sql`TO_CHAR(${transactions.date}, 'YYYY-MM')`);
    
    res.json(result);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error fetching monthly trends');
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Category spending by period
app.get('/api/analytics/categories/spending', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;
    
    const conditions = [
      eq(transactions.userId, userId),
      eq(transactions.type, 'EXPENSE'),
      isNull(transactions.deletedAt)
    ];
    
    if (startDate) {
      conditions.push(gte(transactions.date, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, new Date(endDate as string)));
    }
    
    const result = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        total: sql<number>`SUM(ABS(${transactions.amount}))`,
        count: sql<number>`COUNT(${transactions.id})`
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(categories.id, categories.name, categories.icon, categories.color)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));
    
    res.json(result);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error fetching category spending');
    res.status(500).json({ error: 'Failed to fetch category spending' });
  }
});

// Year-over-year comparison
app.get('/api/analytics/year-comparison', authenticateClerk, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    const result = await db
      .select({
        year: sql<string>`EXTRACT(YEAR FROM ${transactions.date})`,
        month: sql<string>`EXTRACT(MONTH FROM ${transactions.date})`,
        type: transactions.type,
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt)
      ))
      .groupBy(
        sql`EXTRACT(YEAR FROM ${transactions.date})`,
        sql`EXTRACT(MONTH FROM ${transactions.date})`,
        transactions.type
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${transactions.date})`,
        sql`EXTRACT(MONTH FROM ${transactions.date})`
      );
    
    res.json(result);
  } catch (error) {
    logger.error({ error, userId: req.userId }, 'Error fetching year comparison');
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'API Server running');
  logger.info({ port: PORT, endpoint: '/api/dashboard/stats' }, 'Dashboard endpoint available');
  logger.info({ port: PORT, endpoint: '/api/accounts' }, 'Accounts endpoint available');
  logger.info({ port: PORT, endpoint: '/api/transactions' }, 'Transactions endpoint available');
});
