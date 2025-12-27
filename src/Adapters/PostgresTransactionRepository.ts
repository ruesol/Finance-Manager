import { TransactionRepository } from '../Ports/TransactionRepository';
import { Transaction } from '../Transaction';
import { Money } from '../Money';
import { db } from '../db/index';
import { transactions, accounts, categories } from '../db/schema';
import { eq, and, gte, lte, desc, sql, isNull } from 'drizzle-orm';

/**
 * PostgreSQL implementation of TransactionRepository using Drizzle ORM
 */
export class PostgresTransactionRepository implements TransactionRepository {
  
  async getAll(): Promise<Transaction[]> {
    const result = await db
      .select()
      .from(transactions)
      .where(isNull(transactions.deletedAt))
      .orderBy(desc(transactions.date));
    
    return result.map(this.toDomain);
  }

  async getById(id: string): Promise<Transaction | undefined> {
    const result = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, id),
          isNull(transactions.deletedAt)
        )
      )
      .limit(1);
    
    return result[0] ? this.toDomain(result[0]) : undefined;
  }

  async getByAccount(accountId: string): Promise<Transaction[]> {
    const result = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          isNull(transactions.deletedAt)
        )
      )
      .orderBy(desc(transactions.date));
    
    return result.map(this.toDomain);
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const result = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
          isNull(transactions.deletedAt)
        )
      )
      .orderBy(desc(transactions.date));
    
    return result.map(this.toDomain);
  }

  async save(transaction: Transaction): Promise<void> {
    const existing = await this.getById(transaction.id);
    
    if (existing) {
      // Update
      await db
        .update(transactions)
        .set({
          accountId: transaction.accountId,
          amount: transaction.amount.getAmount(),
          currency: transaction.amount.getCurrency(),
          date: transaction.date,
          type: transaction.type,
          status: transaction.status,
          categoryId: transaction.category || null,
          description: transaction.description,
          notes: null,
          merchantName: transaction.merchantName || null,
          merchantLocation: null,
          toAccountId: null,
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transaction.id));
    } else {
      // Insert
      await db.insert(transactions).values({
        id: transaction.id,
        accountId: transaction.accountId,
        amount: transaction.amount.getAmount(),
        currency: transaction.amount.getCurrency(),
        date: transaction.date,
        type: transaction.type,
        status: transaction.status,
        categoryId: transaction.category || null,
        description: transaction.description,
        notes: null,
        merchantName: transaction.merchantName || null,
        merchantLocation: null,
        toAccountId: null
      });
    }
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(eq(transactions.id, id));
  }

  /**
   * Convert database row to domain Transaction
   */
  private toDomain(row: any): Transaction {
    return {
      id: row.id,
      accountId: row.accountId,
      amount: Money.fromCents(row.amount, row.currency),
      date: row.date,
      type: row.type,
      status: row.status,
      category: row.categoryId,
      description: row.description,
      merchantName: row.merchantName,
      tags: [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}
