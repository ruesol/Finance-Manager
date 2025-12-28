import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkClient, verifyToken } from '@clerk/backend';
import { db } from '../src/db/index';
import { accounts, transactions, categories, tags } from '../src/db/schema';
import { eq, isNull, gte, desc, sql, and } from 'drizzle-orm';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Clerk authentication middleware
const authenticateClerk = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header or invalid format');
      return res.status(401).json({ error: 'Unauthorized - Missing token' });
    }

    const token = authHeader.substring(7);
    
    // Debug: Check environment variables
    const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
    const hasJwtKey = !!process.env.CLERK_JWT_KEY;
    console.log(`🔑 Auth attempt - SecretKey: ${hasSecretKey}, JwtKey: ${hasJwtKey}`);
    
    // Configure verification options
    const verifyOptions: any = {
      secretKey: process.env.CLERK_SECRET_KEY!
    };
    
    // Add jwtKey if available (for JWK resolution)
    if (process.env.CLERK_JWT_KEY) {
      verifyOptions.jwtKey = process.env.CLERK_JWT_KEY;
    }
    
    console.log('🔐 Verifying token...');
    console.log('📝 Token preview:', token.substring(0, 50) + '...');
    console.log('🔑 Using secretKey:', process.env.CLERK_SECRET_KEY?.substring(0, 15) + '...');
    const verified = await verifyToken(token, verifyOptions);
    console.log('✅ Token verified successfully, userId:', verified.sub);

    if (!verified || !verified.sub) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    req.userId = verified.sub;
    next();
  } catch (error) {
    console.error('❌ Auth error:', error);
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`🏦 Accounts: http://localhost:${PORT}/api/accounts`);
  console.log(`💸 Transactions: http://localhost:${PORT}/api/transactions`);
});
