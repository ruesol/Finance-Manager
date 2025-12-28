# Autenticazione con Clerk

## Panoramica

Il Finance Manager utilizza [Clerk](https://clerk.com) per gestire l'autenticazione degli utenti e garantire l'isolamento dei dati (multi-tenancy). Ogni utente può vedere e modificare solo i propri account, transazioni e categorie.

## Architettura

### Backend

Il backend Express utilizza JWT (JSON Web Tokens) forniti da Clerk per autenticare le richieste API.

#### Middleware di Autenticazione

```typescript
const authenticateClerk = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing token' });
    }

    const token = authHeader.substring(7);
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    });

    if (!verified || !verified.sub) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    req.userId = verified.sub;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
```

#### Protezione degli Endpoint

Tutti gli endpoint API sono protetti con il middleware `authenticateClerk`:

```typescript
app.get('/api/accounts', authenticateClerk, async (req: any, res) => {
  const userId = req.userId;
  // Filtra per userId...
});
```

#### Filtraggio dei Dati per User ID

Ogni query al database include un filtro sul `userId` per garantire l'isolamento dei dati:

- **Accounts**: `where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)))`
- **Categories**: `where(eq(categories.userId, userId))`
- **Transactions**: Join con accounts e filtro su `eq(accounts.userId, userId)`

#### Verifica Ownership

Prima di modificare o eliminare risorse, il backend verifica che l'utente sia il proprietario:

```typescript
// Esempio: Update account
const account = await db.select()
  .from(accounts)
  .where(and(
    eq(accounts.id, id),
    eq(accounts.userId, userId)
  ))
  .limit(1);

if (account.length === 0) {
  return res.status(404).json({ error: 'Account not found or unauthorized' });
}
```

### Frontend

Il frontend React utilizza `@clerk/clerk-react` per gestire l'autenticazione lato client.

#### Setup

In [Main.tsx](../src/Main.tsx), l'app è avvolta nel `ClerkProvider`:

```tsx
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ServiceProvider>
        <App />
      </ServiceProvider>
    </ClerkProvider>
  </StrictMode>
);
```

#### UI di Autenticazione

In [App.tsx](../src/App.tsx), i componenti Clerk gestiscono login/signup:

```tsx
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';

const { isSignedIn, isLoaded } = useUser();

// Navbar con pulsanti di autenticazione
{!isSignedIn ? (
  <>
    <SignInButton mode="modal">
      <button>Sign In</button>
    </SignInButton>
    <SignUpButton mode="modal">
      <button>Sign Up</button>
    </SignUpButton>
  </>
) : (
  <UserButton afterSignOutUrl="/" />
)}
```

#### Fetch Autenticate

Ogni chiamata API include il token JWT nell'header `Authorization`:

```tsx
import { useAuth } from '@clerk/clerk-react';

const { getToken } = useAuth();

const token = await getToken();
const response = await fetch(`${API_URL}/accounts`, {
  headers: token ? { Authorization: `Bearer ${token}` } : {}
});
```

#### Repository Pattern

Il `TransactionRepository` riceve una funzione `authenticatedFetch` che include automaticamente il token:

```tsx
// ServiceContext.tsx
const { getToken } = useAuth();

const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = await getToken();
  
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` })
  };

  return fetch(url, {
    ...options,
    headers
  });
};

const transactionRepo = new HttpTransactionRepository(authenticatedFetch);
```

## Schema Database

Le tabelle `accounts` e `categories` includono la colonna `user_id`:

```sql
ALTER TABLE "accounts" ADD COLUMN "user_id" varchar(255) NOT NULL;
ALTER TABLE "categories" ADD COLUMN "user_id" varchar(255) NOT NULL;

CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");
```

La tabella `transactions` eredita il `userId` attraverso la foreign key su `accounts`.

## Variabili d'Ambiente

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### Backend (.env)

```env
CLERK_SECRET_KEY=sk_test_xxx
```

**⚠️ IMPORTANTE**: Non committare mai le chiavi segrete nel repository. Usa `.env.example` per documentare le variabili richieste.

## Configurazione Clerk Dashboard

1. Crea un account su [clerk.com](https://clerk.com)
2. Crea una nuova applicazione
3. Copia la `Publishable Key` e la `Secret Key`
4. Configura le URL di redirect:
   - Development: `http://localhost:5173`
   - Production: il tuo dominio

## Testing

### Mocking in Test

Per i test, l'autenticazione Clerk è mockkata. Vedi [Test Setup](./09-testing.md#authentication-mocking) per i dettagli.

```typescript
// Mock di Clerk in setup.ts
jest.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
    isSignedIn: true,
    isLoaded: true,
  }),
  ClerkProvider: ({ children }: any) => children,
  SignInButton: ({ children }: any) => <div>{children}</div>,
  SignUpButton: ({ children }: any) => <div>{children}</div>,
  UserButton: () => <div>User Button</div>,
  useUser: () => ({
    isSignedIn: true,
    isLoaded: true,
    user: { id: 'test-user' }
  })
}));
```

### Test User ID

Nei seed per test/development, usa un `userId` fisso:

```typescript
const TEST_USER_ID = 'user_test_demo_123';
```

## Multi-Tenancy

### Isolamento dei Dati

Ogni utente ha un `userId` univoco fornito da Clerk. Questo ID è usato per:

1. **Filtrare le query**: solo i dati dell'utente sono visibili
2. **Validare le modifiche**: solo il proprietario può modificare/eliminare
3. **Associare nuove risorse**: ogni nuovo account/categoria è associato al `userId`

### Esempio di Isolamento

Utente A con `userId: user_abc123`:
- Vede solo i suoi account/transazioni
- Non può accedere ai dati dell'Utente B

Utente B con `userId: user_xyz789`:
- Vede solo i suoi account/transazioni  
- Non può accedere ai dati dell'Utente A

### Sicurezza

- **JWT Verification**: Ogni richiesta verifica la validità del token
- **Server-side Filtering**: Il filtraggio avviene sempre sul backend
- **No Client Trust**: Il frontend non può bypassare i controlli di sicurezza

## Flusso di Autenticazione

1. **Login**: L'utente clicca "Sign In" → Modal Clerk
2. **Token Generation**: Clerk genera un JWT dopo l'autenticazione
3. **Token Storage**: Il token è memorizzato lato client da Clerk
4. **API Calls**: Ogni chiamata include `Authorization: Bearer <token>`
5. **Token Verification**: Il backend verifica il token con la Secret Key
6. **User ID Extraction**: Il `userId` è estratto dal token verificato
7. **Data Filtering**: Le query filtrano per `userId`

## Troubleshooting

### Token non valido

**Errore**: `401 Unauthorized - Invalid token`

**Soluzioni**:
- Verifica che `CLERK_SECRET_KEY` sia corretta nel backend
- Verifica che `VITE_CLERK_PUBLISHABLE_KEY` sia corretta nel frontend
- Controlla che le chiavi appartengano allo stesso progetto Clerk

### Dati non visibili dopo login

**Soluzioni**:
- Verifica che il seed abbia popolato dati con il tuo `userId`
- Controlla i log del backend per vedere il `userId` estratto
- Usa Drizzle Studio per verificare i dati nel DB

### CORS Errors

**Soluzioni**:
- Verifica che il backend abbia `cors()` configurato
- In produzione, limita i domini consentiti

## Sicurezza Avanzata

### Multi-Tenancy Completo

Il Finance Manager implementa multi-tenancy con isolamento completo dei dati:

#### Schema Database

**TUTTE** le tabelle includono `user_id`:

```typescript
// ✅ SICURO: transactions ha user_id diretto
export const transactions = pgTable('transactions', {
  userId: varchar('user_id', { length: 255 }).notNull(),
  accountId: uuid('account_id').notNull(),
  // ... altri campi
}, (table) => ({
  userIdIdx: index('transactions_user_id_idx').on(table.userId),
  userDateIdx: index('transactions_user_date_idx').on(table.userId, table.date.desc())
}));

// ✅ SICURO: tags ha user_id (no tag globali)
export const tags = pgTable('tags', {
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
}, (table) => ({
  userNameUnique: uniqueIndex('tags_user_name_unique').on(table.userId, table.name)
}));
```

**Vantaggi**:
- ✅ **No Data Leakage**: I tag sono privati per utente (nessuno vede "Spese Illecite" di altri)
- ✅ **Query Veloci**: Filtro diretto su `user_id` con indice, no JOIN necessari per sicurezza
- ✅ **Ownership Immediato**: `transactions.user_id` verifica proprietà senza query aggiuntive

#### Query Sicure

Backend filtra SEMPRE per `user_id`:

```typescript
// ✅ SICURO: Filtro diretto su transactions.userId
app.get('/api/transactions', authenticateClerk, async (req: any, res) => {
  const result = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.userId, req.userId),  // ← Filtro diretto
      isNull(transactions.deletedAt)
    ));
});

// ✅ SICURO: Inserimento con userId
app.post('/api/transactions', authenticateClerk, async (req: any, res) => {
  const data = {
    ...req.body,
    userId: req.userId  // ← userId forzato dal backend
  };
  const result = await db.insert(transactions).values(data).returning();
});
```

### Onboarding Automatico

Quando un nuovo utente si registra su Clerk e accede per la prima volta, il backend crea automaticamente categorie di default:

```typescript
// Backend: ensureUserHasCategories()
const DEFAULT_CATEGORIES = [
  { name: 'Alimentari', icon: '🛒', color: '#10B981', sortOrder: 1 },
  { name: 'Ristoranti', icon: '🍽️', color: '#F59E0B', sortOrder: 2 },
  // ... altre categorie
];

async function ensureUserHasCategories(userId: string) {
  const existingCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  if (existingCategories.length === 0) {
    console.log(`🎯 Onboarding user ${userId}: Creating default categories`);
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId }))
    );
  }
}

// Chiamato automaticamente in GET /api/categories
app.get('/api/categories', authenticateClerk, async (req: any, res) => {
  await ensureUserHasCategories(req.userId);  // ← Cold start handling
  const result = await db.select().from(categories).where(eq(categories.userId, req.userId));
  res.json(result);
});
```

**Vantaggi**:
- ✅ Nessuno stato "vuoto triste" per nuovi utenti
- ✅ Categorie pronte all'uso immediatamente
- ✅ Nessun clic extra richiesto

### Token Refresh Automatico

Il frontend chiama `getToken()` per **ogni** richiesta, garantendo token sempre freschi:

```typescript
// ✅ ServiceContext.tsx
const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // ⚠️ IMPORTANTE: getToken() chiamato SEMPRE qui
  const token = await getToken();  // ← Clerk gestisce refresh automatico
  
  const headers = {
    ...init?.headers,
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const response = await fetch(input, { ...init, headers });

  // Gestione errori 401
  if (response.status === 401) {
    console.error('Session expired or invalid token');
    // ClerkProvider reindirizza automaticamente al login
  }

  return response;
};
```

**Non fare mai**:
```typescript
// ❌ SBAGLIATO: Token cachato all'avvio
const token = await getToken();  // ← Chiamato UNA VOLTA
const authenticatedFetch = (url) => fetch(url, { 
  headers: { Authorization: `Bearer ${token}` }  // ← Token vecchio!
});
```

## Deployment

### Frontend

Imposta la variabile d'ambiente `VITE_CLERK_PUBLISHABLE_KEY` nel tuo hosting provider (Vercel, Netlify, ecc.)

### Backend

Imposta `CLERK_SECRET_KEY` come variabile d'ambiente sicura (non esporre pubblicamente)

### Database

Assicurati che la migrazione con le colonne `user_id` sia applicata in produzione:

```bash
npm run db:migrate
```

## Riferimenti

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React SDK](https://clerk.com/docs/references/react/overview)
- [Clerk Backend SDK](https://clerk.com/docs/references/backend/overview)
- [JWT Verification](https://clerk.com/docs/backend-requests/handling/manual-jwt)
