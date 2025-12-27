import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, queryClient } from './index';
import { 
  allTriggers, 
  allViews, 
  allFunctions 
} from './triggers';
import { sql } from 'drizzle-orm';

/**
 * Run database migrations
 * 
 * Esegue:
 * 1. Schema migrations (tabelle, relazioni, indici)
 * 2. Trigger custom
 * 3. Views materializzate
 * 4. Funzioni PostgreSQL
 */

async function runMigrations() {
  console.log('🚀 Starting database migration...\n');

  try {
    // 1. Esegui migrations Drizzle (schema)
    console.log('📦 Running schema migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Schema migrations completed\n');

    // 2. Crea funzioni e trigger
    console.log('⚡ Creating triggers and functions...');
    
    // Updated_at trigger
    console.log('  - Creating update_updated_at trigger...');
    for (const trigger of allTriggers.updateUpdatedAt) {
      await db.execute(trigger);
    }
    
    // Balance update trigger
    console.log('  - Creating balance update trigger...');
    for (const trigger of allTriggers.updateBalance) {
      await db.execute(trigger);
    }
    
    // Same account transfer prevention
    console.log('  - Creating transfer validation trigger...');
    for (const trigger of allTriggers.preventSameAccountTransfer) {
      await db.execute(trigger);
    }
    
    // Audit log (opzionale - commenta se non serve)
    console.log('  - Creating audit log trigger...');
    for (const trigger of allTriggers.auditLog) {
      await db.execute(trigger);
    }
    
    console.log('✅ Triggers created\n');

    // 3. Crea views materializzate
    console.log('👁️  Creating materialized views...');
    await db.execute(allViews.accountStats);
    await db.execute(allViews.categoryStats);
    console.log('✅ Views created\n');

    // 4. Crea funzioni custom
    console.log('🔧 Creating custom functions...');
    await db.execute(allFunctions.getBalanceBetweenDates);
    await db.execute(allFunctions.getTopCategories);
    console.log('✅ Functions created\n');

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

// Run migrations
runMigrations();
