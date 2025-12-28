import { db } from './index';
import { sql } from 'drizzle-orm';

async function dropTriggers() {
  console.log('🔧 Dropping all triggers...\n');

  try {
    // Drop audit trigger and function
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_account_changes ON accounts CASCADE;`);
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_category_changes ON categories CASCADE;`);
    await db.execute(sql`DROP TRIGGER IF EXISTS audit_transaction_changes ON transactions CASCADE;`);
    await db.execute(sql`DROP FUNCTION IF EXISTS audit_log_changes() CASCADE;`);
    
    console.log('✅ All audit triggers dropped successfully!\n');
    
  } catch (error) {
    console.error('❌ Drop triggers failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

dropTriggers();
