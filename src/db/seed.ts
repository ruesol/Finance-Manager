import { db } from './index';
import { accounts, transactions, categories, tags, transactionTags } from './schema';

/**
 * Script per popolare il database con dati di esempio
 * 
 * Esegui: npx tsx src/db/seed.ts
 */

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // 1. CREA ACCOUNTS
    console.log('📊 Creating accounts...');
    const accountsData = await db.insert(accounts).values([
      {
        name: 'Conto Corrente',
        type: 'CHECKING',
        balance: 125000, // €1,250.00
        currency: 'EUR',
        description: 'Conto principale per spese quotidiane',
        icon: '🏦',
        color: '#3B82F6',
        accountNumber: 'IT60X0542811101000000123456'
      },
      {
        name: 'Conto Risparmio',
        type: 'SAVINGS',
        balance: 500000, // €5,000.00
        currency: 'EUR',
        description: 'Risparmi per emergenze',
        icon: '💰',
        color: '#10B981'
      },
      {
        name: 'Portafoglio',
        type: 'WALLET',
        balance: 8500, // €85.00
        currency: 'EUR',
        description: 'Contanti',
        icon: '👛',
        color: '#F59E0B'
      },
      {
        name: 'Carta di Credito',
        type: 'CREDIT_CARD',
        balance: -45000, // -€450.00 (debito)
        currency: 'EUR',
        description: 'Carta di credito Visa',
        icon: '💳',
        color: '#EF4444',
        accountNumber: '**** **** **** 4567'
      },
      {
        name: 'Investimenti',
        type: 'INVESTMENT',
        balance: 1200000, // €12,000.00
        currency: 'EUR',
        description: 'Portfolio ETF e azioni',
        icon: '📈',
        color: '#8B5CF6'
      }
    ]).returning();

    console.log(`✅ Created ${accountsData.length} accounts\n`);

    // 2. CREA CATEGORIE
    console.log('📁 Creating categories...');
    const categoriesData = await db.insert(categories).values([
      // Spese
      { name: 'Alimentari', icon: '🛒', color: '#10B981', sortOrder: 1 },
      { name: 'Ristoranti', icon: '🍽️', color: '#F59E0B', sortOrder: 2 },
      { name: 'Trasporti', icon: '🚗', color: '#3B82F6', sortOrder: 3 },
      { name: 'Bollette', icon: '💡', color: '#EF4444', sortOrder: 4 },
      { name: 'Affitto', icon: '🏠', color: '#DC2626', sortOrder: 5 },
      { name: 'Salute', icon: '⚕️', color: '#EC4899', sortOrder: 6 },
      { name: 'Intrattenimento', icon: '🎮', color: '#8B5CF6', sortOrder: 7 },
      { name: 'Shopping', icon: '🛍️', color: '#F97316', sortOrder: 8 },
      { name: 'Viaggi', icon: '✈️', color: '#06B6D4', sortOrder: 9 },
      { name: 'Sport', icon: '⚽', color: '#14B8A6', sortOrder: 10 },
      // Entrate
      { name: 'Stipendio', icon: '💼', color: '#22C55E', sortOrder: 11 },
      { name: 'Freelance', icon: '💻', color: '#3B82F6', sortOrder: 12 },
      { name: 'Investimenti', icon: '📊', color: '#8B5CF6', sortOrder: 13 },
      { name: 'Rimborsi', icon: '💸', color: '#10B981', sortOrder: 14 }
    ]).returning();

    console.log(`✅ Created ${categoriesData.length} categories\n`);

    // 3. CREA TAGS
    console.log('🏷️ Creating tags...');
    const tagsData = await db.insert(tags).values([
      { name: 'Urgente', color: '#EF4444' },
      { name: 'Ricorrente', color: '#3B82F6' },
      { name: 'Lavoro', color: '#8B5CF6' },
      { name: 'Personale', color: '#10B981' },
      { name: 'Famiglia', color: '#F59E0B' },
      { name: 'Vacanza', color: '#06B6D4' },
      { name: 'Regalo', color: '#EC4899' },
      { name: 'Tasse', color: '#DC2626' }
    ]).returning();

    console.log(`✅ Created ${tagsData.length} tags\n`);

    // Helper per ottenere ID categoria per nome
    const getCategoryId = (name: string) => 
      categoriesData.find(c => c.name === name)?.id;

    // Helper per date passate
    const daysAgo = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date;
    };

    // 4. CREA TRANSAZIONI
    console.log('💸 Creating transactions...');
    
    const checking = accountsData.find(a => a.name === 'Conto Corrente')!;
    const savings = accountsData.find(a => a.name === 'Conto Risparmio')!;
    const wallet = accountsData.find(a => a.name === 'Portafoglio')!;
    const credit = accountsData.find(a => a.name === 'Carta di Credito')!;

    const transactionsData = await db.insert(transactions).values([
      // Stipendio (30 giorni fa)
      {
        accountId: checking.id,
        amount: 250000, // €2,500.00
        currency: 'EUR',
        date: daysAgo(30),
        type: 'INCOME',
        status: 'CLEARED',
        categoryId: getCategoryId('Stipendio'),
        description: 'Stipendio Dicembre',
        merchantName: 'Azienda SRL'
      },
      // Affitto (25 giorni fa)
      {
        accountId: checking.id,
        amount: 80000, // €800.00
        currency: 'EUR',
        date: daysAgo(25),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Affitto'),
        description: 'Affitto Dicembre',
        merchantName: 'Proprietario Casa'
      },
      // Bollette (20 giorni fa)
      {
        accountId: checking.id,
        amount: 15000, // €150.00
        currency: 'EUR',
        date: daysAgo(20),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Bollette'),
        description: 'Luce + Gas',
        merchantName: 'Enel Energia'
      },
      // Spesa supermercato (15 giorni fa)
      {
        accountId: checking.id,
        amount: 12500, // €125.00
        currency: 'EUR',
        date: daysAgo(15),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Alimentari'),
        description: 'Spesa settimanale',
        merchantName: 'Esselunga',
        merchantLocation: 'Milano, Via Roma 123'
      },
      // Ristorante (12 giorni fa)
      {
        accountId: credit.id,
        amount: 6500, // €65.00
        currency: 'EUR',
        date: daysAgo(12),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Ristoranti'),
        description: 'Cena con amici',
        merchantName: 'Trattoria da Mario'
      },
      // Benzina (10 giorni fa)
      {
        accountId: credit.id,
        amount: 7500, // €75.00
        currency: 'EUR',
        date: daysAgo(10),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Trasporti'),
        description: 'Rifornimento benzina',
        merchantName: 'Eni Station'
      },
      // Spesa supermercato (8 giorni fa)
      {
        accountId: checking.id,
        amount: 9500, // €95.00
        currency: 'EUR',
        date: daysAgo(8),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Alimentari'),
        description: 'Spesa settimanale',
        merchantName: 'Carrefour'
      },
      // Cinema (7 giorni fa)
      {
        accountId: wallet.id,
        amount: 2500, // €25.00
        currency: 'EUR',
        date: daysAgo(7),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Intrattenimento'),
        description: 'Biglietti cinema',
        merchantName: 'UCI Cinemas'
      },
      // Freelance (5 giorni fa)
      {
        accountId: checking.id,
        amount: 80000, // €800.00
        currency: 'EUR',
        date: daysAgo(5),
        type: 'INCOME',
        status: 'CLEARED',
        categoryId: getCategoryId('Freelance'),
        description: 'Progetto web design',
        merchantName: 'Cliente ABC'
      },
      // Farmacia (4 giorni fa)
      {
        accountId: wallet.id,
        amount: 3500, // €35.00
        currency: 'EUR',
        date: daysAgo(4),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Salute'),
        description: 'Medicinali',
        merchantName: 'Farmacia Centrale'
      },
      // Shopping online (3 giorni fa)
      {
        accountId: credit.id,
        amount: 12000, // €120.00
        currency: 'EUR',
        date: daysAgo(3),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Shopping'),
        description: 'Abbigliamento',
        merchantName: 'Amazon'
      },
      // Spesa supermercato (2 giorni fa)
      {
        accountId: checking.id,
        amount: 8500, // €85.00
        currency: 'EUR',
        date: daysAgo(2),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Alimentari'),
        description: 'Spesa settimanale',
        merchantName: 'Lidl'
      },
      // Trasferimento a risparmio (1 giorno fa)
      {
        accountId: checking.id,
        toAccountId: savings.id,
        amount: 50000, // €500.00
        currency: 'EUR',
        date: daysAgo(1),
        type: 'TRANSFER',
        status: 'CLEARED',
        description: 'Risparmio mensile'
      },
      // Bar (oggi)
      {
        accountId: wallet.id,
        amount: 450, // €4.50
        currency: 'EUR',
        date: new Date(),
        type: 'EXPENSE',
        status: 'CLEARED',
        categoryId: getCategoryId('Ristoranti'),
        description: 'Caffè e brioche',
        merchantName: 'Bar Centrale'
      },
      // Transazione pending (oggi)
      {
        accountId: credit.id,
        amount: 15000, // €150.00
        currency: 'EUR',
        date: new Date(),
        type: 'EXPENSE',
        status: 'PENDING',
        categoryId: getCategoryId('Shopping'),
        description: 'Elettronica - in attesa',
        merchantName: 'MediaWorld'
      }
    ]).returning();

    console.log(`✅ Created ${transactionsData.length} transactions\n`);

    // 5. AGGIUNGI TAG ALLE TRANSAZIONI
    console.log('🏷️ Adding tags to transactions...');
    
    const urgentTag = tagsData.find(t => t.name === 'Urgente')!;
    const recurringTag = tagsData.find(t => t.name === 'Ricorrente')!;
    const workTag = tagsData.find(t => t.name === 'Lavoro')!;

    // Tag le bollette come ricorrenti e urgenti
    const billsTransaction = transactionsData.find(t => t.description === 'Luce + Gas')!;
    const rentTransaction = transactionsData.find(t => t.description === 'Affitto Dicembre')!;
    const freelanceTransaction = transactionsData.find(t => t.description === 'Progetto web design')!;

    await db.insert(transactionTags).values([
      { transactionId: billsTransaction.id, tagId: recurringTag.id },
      { transactionId: billsTransaction.id, tagId: urgentTag.id },
      { transactionId: rentTransaction.id, tagId: recurringTag.id },
      { transactionId: rentTransaction.id, tagId: urgentTag.id },
      { transactionId: freelanceTransaction.id, tagId: workTag.id }
    ]);

    console.log('✅ Tags added to transactions\n');

    // 6. MOSTRA RIEPILOGO
    console.log('📊 SEED SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Accounts:      ${accountsData.length}`);
    console.log(`✅ Categories:    ${categoriesData.length}`);
    console.log(`✅ Tags:          ${tagsData.length}`);
    console.log(`✅ Transactions:  ${transactionsData.length}`);
    console.log('═══════════════════════════════════════\n');

    console.log('🎉 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run seed
seed();
