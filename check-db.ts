import { db } from './src/db/index';
import { transactions, accounts } from './src/db/schema';

async function checkData() {
  console.log('Checking database values...\n');
  
  // Check accounts
  const accs = await db.select().from(accounts).limit(3);
  console.log('=== ACCOUNTS ===');
  accs.forEach(acc => {
    console.log(`${acc.name}: balance=${acc.balance} ${acc.currency} (should be ${acc.balance/100} EUR if in cents)`);
  });
  
  console.log('\n=== TRANSACTIONS ===');
  const txs = await db.select().from(transactions).limit(3);
  txs.forEach(tx => {
    console.log(`${tx.description}: amount=${tx.amount} ${tx.currency} (should be ${tx.amount/100} EUR if in cents)`);
  });
  
  process.exit(0);
}

checkData();
