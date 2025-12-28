import { db } from './index';
import { 
  accounts, 
  transactions, 
  categories, 
  tags, 
  transactionTags 
} from './schema';
import { eq, and, desc, sql, between, inArray } from 'drizzle-orm';

export class QueryExamples {
  
  async createAccount() {
    const newAccount = await db.insert(accounts).values({
      name: 'Main Checking',
      type: 'CHECKING',
      balance: 100000,
      currency: 'EUR',
      icon: '💰',
      color: '#3B82F6'
    }).returning();
    
    return newAccount[0];
  }

  async createTransaction(accountId: string) {
    const newTx = await db.insert(transactions).values({
      accountId: accountId,
      amount: 5000,
      currency: 'EUR',
      date: new Date(),
      type: 'EXPENSE',
      status: 'CLEARED',
      description: 'Grocery shopping',
      merchantName: 'SuperMarket XYZ'
    }).returning();
    
    return newTx[0];
  }

  async getAllAccounts() {
    return await db.select().from(accounts);
  }

  async getAccountById(id: string) {
    const result = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);
    
    return result[0];
  }

  async updateAccountBalance(accountId: string, newBalance: number) {
    await db
      .update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, accountId));
  }

  async updateTransaction(transactionId: string, description: string) {
    await db
      .update(transactions)
      .set({ description })
      .where(eq(transactions.id, transactionId));
  }

  async deleteAccount(id: string) {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async softDeleteAccount(id: string) {
    await db
      .update(accounts)
      .set({ deletedAt: new Date() })
      .where(eq(accounts.id, id));
  }

  async getTransactionsWithAccount() {
    return await db
      .select({
        transaction: transactions,
        account: accounts
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .orderBy(desc(transactions.date))
      .limit(50);
  }

  async getExpensesByAccount(accountId: string, minAmount: number) {
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          eq(transactions.type, 'EXPENSE'),
          sql`${transactions.amount} >= ${minAmount}`
        )
      )
      .orderBy(desc(transactions.date));
  }

  async getTransactionsByDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          between(transactions.date, startDate, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async getAccountStats(accountId: string) {
    const result = await db
      .select({
        totalIncome: sql<number>`SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE 0 END)`,
        totalExpenses: sql<number>`SUM(CASE WHEN ${transactions.type} = 'EXPENSE' THEN ${transactions.amount} ELSE 0 END)`,
        transactionCount: sql<number>`COUNT(*)`,
        avgAmount: sql<number>`AVG(${transactions.amount})`
      })
      .from(transactions)
      .where(eq(transactions.accountId, accountId));
    
    return result[0];
  }

  async getExpensesByCategory() {
    return await db
      .select({
        categoryName: categories.name,
        totalAmount: sql<number>`SUM(${transactions.amount})`,
        transactionCount: sql<number>`COUNT(*)`,
        avgAmount: sql<number>`AVG(${transactions.amount})`
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.type, 'EXPENSE'))
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(${transactions.amount})`));
  }

  async getAccountWithTransactions(accountId: string) {
    return await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
      with: {
        transactions: {
          orderBy: desc(transactions.date),
          limit: 10
        }
      }
    });
  }

  async getTransactionWithDetails(transactionId: string) {
    return await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      with: {
        account: true,
        category: true,
        transactionTags: {
          with: {
            tag: true
          }
        }
      }
    });
  }

  async transferMoney(
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ) {
    await db.transaction(async (tx) => {
      await tx.insert(transactions).values({
        accountId: fromAccountId,
        toAccountId: toAccountId,
        amount: amount,
        currency: 'EUR',
        date: new Date(),
        type: 'TRANSFER',
        status: 'CLEARED',
        description: 'Internal transfer'
      });

      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${amount}` })
        .where(eq(accounts.id, fromAccountId));

      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amount}` })
        .where(eq(accounts.id, toAccountId));
    });
  }

  async getMonthlyExpenseTrend(accountId: string, months: number) {
    return await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as total_expenses,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_expense
      FROM ${transactions}
      WHERE account_id = ${accountId}
        AND type = 'EXPENSE'
        AND date >= CURRENT_DATE - INTERVAL '${sql.raw(months.toString())} months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `);
  }

  async getTopCategories(limit: number = 5) {
    return await db.execute(sql`
      SELECT * FROM get_top_categories(${limit})
    `);
  }

  async createMultipleTransactions(txData: Array<typeof transactions.$inferInsert>) {
    return await db.insert(transactions).values(txData).returning();
  }

  async markTransactionsAsReconciled(transactionIds: string[]) {
    await db
      .update(transactions)
      .set({ status: 'RECONCILED' })
      .where(inArray(transactions.id, transactionIds));
  }

  async refreshAccountStats() {
    await db.execute(sql`REFRESH MATERIALIZED VIEW account_stats`);
  }

  async getAccountStatsFromView() {
    return await db.execute(sql`SELECT * FROM account_stats`);
  }
}

export const queries = new QueryExamples();
