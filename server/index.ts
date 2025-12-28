import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkClient, verifyToken } from '@clerk/backend';
import { db, schema } from '../src/db/index';
import { accounts, transactions, categories, tags, budgets } from '../src/db/schema';
import { eq, isNull, gte, desc, sql, and, lte, between, or, like, asc } from 'drizzle-orm';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Clerk authentication middleware
const authenticateClerk = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    req.userId = verified.sub;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
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
    console.log(`🎯 Onboarding user ${userId}: Creating default categories`);
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
    console.error('Error fetching accounts:', error);
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
    console.error('Error creating account:', error);
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
    console.error('Error updating account:', error);
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
    console.error('Error deleting account:', error);
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
    console.error('Error fetching transactions:', error);
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
    console.error('Error creating transaction:', error);
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
    console.error('Error deleting transaction:', error);
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
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
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
    console.error('Error fetching dashboard stats:', error);
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
    console.error('Error exporting CSV:', error);
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
    console.error('Error exporting JSON:', error);
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
    console.error('Error fetching budgets:', error);
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
    console.error('Error fetching budget spending:', error);
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
    console.error('Error creating budget:', error);
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
    console.error('Error updating budget:', error);
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
    console.error('Error deleting budget:', error);
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
    console.error('Error searching transactions:', error);
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
    console.error('Error fetching monthly trends:', error);
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
    console.error('Error fetching category spending:', error);
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
    console.error('Error fetching year comparison:', error);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🏦 Accounts: http://localhost:${PORT}/api/accounts`);
  console.log(`💸 Transactions: http://localhost:${PORT}/api/transactions`);
});
