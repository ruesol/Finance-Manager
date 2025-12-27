import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database Connection Configuration
 * 
 * postgres-js è un client PostgreSQL veloce e moderno
 */

// Connection string - usa variabili ambiente in produzione
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5433/finance_manager';

/**
 * Configurazione client postgres
 * 
 * max: numero massimo connessioni nel pool
 * idle_timeout: chiudi connessioni dopo N secondi di inattività
 * connect_timeout: timeout connessione
 */
export const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

/**
 * Drizzle ORM instance con schema completo
 * 
 * schema: passa tutte le tabelle e relazioni per query builder tipizzato
 * logger: abilita in development per vedere SQL queries
 */
export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV === 'development'
});

/**
 * Close database connection (per cleanup)
 */
export async function closeDatabase() {
  await queryClient.end();
}

// Type exports
export type Database = typeof db;
