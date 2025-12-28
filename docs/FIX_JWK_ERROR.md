# Fix: Token Verification Error "Failed to resolve JWK"

## Problema

Errore durante l'autenticazione:
```
Auth error: _TokenVerificationError: Failed to resolve JWK during verification.
reason: 'jwk-failed-to-resolve',
action: 'Set the CLERK_JWT_KEY environment variable.'
```

## Causa

Il middleware `verifyToken` di Clerk non riesce a risolvere la chiave pubblica JWT (JWK) dai server Clerk per verificare il token. Questo può accadere per:

1. Problemi di rete con i server Clerk
2. Configurazione errata delle variabili d'ambiente
3. Versione di `@clerk/backend` che richiede configurazione esplicita

## Soluzione 1: Aggiungere CLERK_JWT_KEY (Raccomandato)

### 1. Ottieni la chiave JWT pubblica da Clerk

1. Vai alla [Dashboard Clerk](https://dashboard.clerk.com)
2. Seleziona il tuo progetto
3. Vai a **API Keys**
4. Copia la **JWT Public Key** (formato PEM)

### 2. Aggiungi al file `.env`

```bash
# .env
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
```

**IMPORTANTE**: La chiave deve includere `-----BEGIN PUBLIC KEY-----` e `-----END PUBLIC KEY-----`

### 3. Il middleware ora usa CLERK_JWT_KEY se disponibile

```typescript
// server/index.ts
const verifyOptions: any = {
  secretKey: process.env.CLERK_SECRET_KEY!
};

if (process.env.CLERK_JWT_KEY) {
  verifyOptions.jwtKey = process.env.CLERK_JWT_KEY;
}

const verified = await verifyToken(token, verifyOptions);
```

## Soluzione 2: Verificare CLERK_SECRET_KEY

Assicurati che `CLERK_SECRET_KEY` sia corretta:

```bash
# Verifica nel terminale
echo $CLERK_SECRET_KEY
# Dovrebbe mostrare: sk_test_... o sk_live_...
```

Se non è impostata o è vuota:

```bash
# Crea .env file
cp .env.example .env

# Modifica .env con le tue chiavi Clerk
nano .env
```

## Soluzione 3: Riavviare il server

Dopo aver modificato `.env`, riavvia il server:

```bash
# Ferma server (Ctrl+C)
# Riavvia
npm run dev:all
```

## Verifica

Dopo aver applicato la soluzione, testa l'autenticazione:

1. Accedi al frontend: http://localhost:5173
2. Esegui il login con Clerk
3. Verifica nei log del backend:

```
✅ Nessun errore "Auth error"
✅ Richieste API completate con successo
```

## Debugging

Se il problema persiste:

```typescript
// Aggiungi log dettagliati in server/index.ts
console.log('Token:', token.substring(0, 20) + '...');
console.log('CLERK_SECRET_KEY set:', !!process.env.CLERK_SECRET_KEY);
console.log('CLERK_JWT_KEY set:', !!process.env.CLERK_JWT_KEY);
```

## Riferimenti

- [Clerk Backend JWT Verification](https://clerk.com/docs/backend-requests/handling/manual-jwt)
- [Clerk API Keys](https://dashboard.clerk.com)
