import { db } from './index';
import { accounts, transactions, categories, tags, transactionTags } from './schema';
import { sql } from 'drizzle-orm';

async function clean() {
  console.log('🧹 Cleaning database...\n');

  try {
    console.log('Truncating all tables...');
    
    // Disable triggers temporarily
    await db.execute(sql`SET session_replication_role = 'replica';`);
    
    // Truncate all tables with CASCADE
    await db.execute(sql`TRUNCATE TABLE transaction_tags, transactions, accounts, categories, tags CASCADE;`);
    
    // Re-enable triggers
    await db.execute(sql`SET session_replication_role = 'origin';`);
    
    console.log('✅ Database cleaned successfully!\n');
    
  } catch (error) {
    console.error('❌ Clean failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

clean();
