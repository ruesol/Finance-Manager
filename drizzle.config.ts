import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Schema file location
  schema: './src/db/schema.ts',
  
  // Output directory per migrations
  out: './drizzle',
  
  // Database dialect
  dialect: 'postgresql',
  
  // Connessione database
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5433,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'finance_manager',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  },
  
  // Configurazione migrations
  migrations: {
    prefix: 'timestamp', // Prefisso timestamp per migration files
    table: 'drizzle_migrations', // Nome tabella migrations
    schema: 'public' // Schema PostgreSQL
  },
  
  // Verbose logging
  verbose: true,
  
  // Strict mode - errore se schema non è sincronizzato
  strict: true
});
