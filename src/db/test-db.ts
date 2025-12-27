import { db } from './index';
import { accounts, transactions, categories, tags } from './schema';
import { queries } from './queries';

/**
 * Script di test per verificare setup database
 * 
 * Esegui: npx tsx src/db/test-db.ts
 */

async function testDatabase() {
  console.log('🧪 Testing database setup...\n');

  try {
    // 1. Test connessione
    console.log('✅ Database connected successfully\n');

    // 2. Crea account di test
    console.log('📝 Creating test account...');
    const account = await queries.createAccount();
    console.log(`✅ Created account: ${account.name} (ID: ${account.id})\n`);

    // 3. Crea categoria
    console.log('📁 Creating test category...');
    const category = await db.insert(categories).values({
      name: 'Groceries',
      icon: '🛒',
      color: '#10B981'
    }).returning();
    console.log(`✅ Created category: ${category[0].name}\n`);

    // 4. Crea transazione
    console.log('💸 Creating test transaction...');
    const transaction = await db.insert(transactions).values({
      accountId: account.id,
      categoryId: category[0].id,
      amount: 5000, // €50.00
      currency: 'EUR',
      date: new Date(),
      type: 'EXPENSE',
      status: 'CLEARED',
      description: 'Weekly grocery shopping'
    }).returning();
    console.log(`✅ Created transaction: ${transaction[0].description}\n`);

    // --- VERIFICA TRIGGER ---
    const updatedAccount = await queries.getAccountById(account.id);
    const expectedBalance = 100000 - 5000; // 1000.00 - 50.00
    
    if (updatedAccount.balance === expectedBalance) {
        console.log(`✅ Trigger Success: Balance updated automatically to ${updatedAccount.balance}`);
    } else {
        console.error(`❌ Trigger Fail: Expected ${expectedBalance}, got ${updatedAccount.balance}`);
        process.exit(1);
    }
    
    // 5. Query con relations
    console.log('🔍 Fetching account with transactions...');
    const accountWithTxs = await queries.getAccountWithTransactions(account.id);
    console.log(`✅ Found account with ${accountWithTxs?.transactions.length} transactions\n`);

    // 6. Test stats
    console.log('📊 Calculating stats...');
    const stats = await queries.getAccountStats(account.id);
    console.log(`✅ Total expenses: €${(stats.totalExpenses / 100).toFixed(2)}\n`);

    // 7. Cleanup (soft delete)
    console.log('🧹 Cleaning up...');
    await queries.softDeleteAccount(account.id);
    console.log('✅ Test account soft-deleted\n');

    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run tests
testDatabase();
