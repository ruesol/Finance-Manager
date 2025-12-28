# Deployment

This document covers deployment strategies, production configuration, and hosting options.

## Production Checklist

Before deploying to production:

- [ ] All tests pass (`npm test`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CORS origins restricted
- [ ] Error logging configured
- [ ] Performance tested (Lighthouse)
- [ ] Security audit completed (`npm audit`)
- [ ] SSL certificate configured
- [ ] Backup strategy in place

## Build Process

### Frontend Build

```bash
npm run build
```

**Output**: `dist/` folder

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js       # Minified JS
│   ├── index-[hash].css      # Purged CSS
│   └── favicon.svg
└── _redirects                # For SPA routing
```

**Optimizations Applied**:
- Code minification
- Tree shaking
- CSS purging (unused classes removed)
- Asset compression
- Hash-based caching

### Backend Build

```bash
npm run build:server
```

Uses `tsc` to compile TypeScript to JavaScript:

```
dist/
├── api/
│   ├── server.js
│   └── routes/
├── db/
│   ├── client.js
│   └── schema.js
└── package.json
```

## Environment Configuration

### Production Environment Variables

**File**: `.env.production`

```bash
# Database
DATABASE_URL=postgresql://prod_user:secure_password@db.example.com:5432/finance_prod

# API Server
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Frontend
VITE_API_URL=https://api.yourdomain.com/api

# Security
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=your-secret-key-here

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=error
```

### Sensitive Variables

Store sensitive values in secure secret management:

- **AWS Secrets Manager**
- **Azure Key Vault**
- **Google Secret Manager**
- **HashiCorp Vault**

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode)

**Architecture**:
```
Internet → Nginx → Node.js → PostgreSQL
```

**Setup Steps**:

1. **Provision Server**:
```bash
# Ubuntu 24.04 LTS
ssh root@your-server-ip
```

2. **Install Dependencies**:
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Nginx
sudo apt-get install -y nginx
```

3. **Setup Application**:
```bash
# Create app user
sudo useradd -m -s /bin/bash financeapp

# Clone repository
cd /home/financeapp
git clone <repository-url> app
cd app

# Install dependencies
npm ci --production

# Build
npm run build
```

4. **Configure PostgreSQL**:
```bash
sudo -u postgres psql
CREATE DATABASE finance_prod;
CREATE USER financeapp WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE finance_prod TO financeapp;
\q
```

5. **Configure Nginx**:

**/etc/nginx/sites-available/finance-manager**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /home/financeapp/app/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/finance-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL with Let's Encrypt**:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

7. **Create Systemd Service**:

**/etc/systemd/system/finance-manager.service**:
```ini
[Unit]
Description=Finance Manager API
After=network.target postgresql.service

[Service]
Type=simple
User=financeapp
WorkingDirectory=/home/financeapp/app
Environment=NODE_ENV=production
EnvironmentFile=/home/financeapp/app/.env.production
ExecStart=/usr/bin/node dist/api/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable finance-manager
sudo systemctl start finance-manager
sudo systemctl status finance-manager
```

### Option 2: Docker Deployment

**Dockerfile**:
```dockerfile
# Frontend build stage
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend build stage
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build:server

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules ./node_modules
COPY package.json ./

# Copy frontend
COPY --from=frontend-build /app/dist ./public

EXPOSE 3001

CMD ["node", "dist/api/server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://financeapp:password@db:5432/finance_prod
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=finance_prod
      - POSTGRES_USER=financeapp
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy**:
```bash
docker-compose up -d
```

### Option 3: Platform as a Service (Heroku, Railway)

**Railway Deployment**:

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add PostgreSQL:
```bash
railway add --plugin postgresql
```

4. Configure build:

**railway.json**:
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm run build && npm run build:server"
  },
  "deploy": {
    "startCommand": "node dist/api/server.js",
    "restartPolicyType": "on_failure"
  }
}
```

5. Deploy:
```bash
railway up
```

### Option 4: Serverless (Vercel + Supabase)

**Vercel Configuration**:

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

**API Routes**: Convert Express routes to serverless functions

**/api/accounts.ts**:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/client';
import { accountsTable } from '../src/db/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const accounts = await db.select().from(accountsTable);
    return res.json(accounts);
  }
  
  if (req.method === 'POST') {
    const account = await db.insert(accountsTable).values(req.body).returning();
    return res.status(201).json(account[0]);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

**Deploy**:
```bash
vercel
```

## Database Migration

### Production Migration Strategy

1. **Backup Database**:
```bash
pg_dump -h db.example.com -U financeapp finance_prod > backup.sql
```

2. **Test Migration Locally**:
```bash
# Create test database from backup
psql -U postgres -c "CREATE DATABASE finance_test;"
psql -U postgres finance_test < backup.sql

# Run migration
DATABASE_URL=postgresql://postgres@localhost/finance_test npm run db:push
```

3. **Apply to Production**:
```bash
# During maintenance window
npm run db:push
```

4. **Rollback Plan**:
```sql
-- Keep rollback SQL ready
-- Example: if adding column
ALTER TABLE accounts DROP COLUMN new_column;
```

## Monitoring & Logging

### Application Monitoring

**Sentry Integration**:

```typescript
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1
  });
}

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());
```

### Logging

**Winston Logger**:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Use in code
logger.info('Account created', { accountId: account.id });
logger.error('Database error', { error: err.message });
```

### Health Checks

**Endpoint**: `/api/health`

```typescript
router.get('/health', async (req, res) => {
  try {
    // Check database
    await db.select().from(accountsTable).limit(1);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## Performance Optimization

### Frontend Optimizations

1. **Enable Compression** (gzip/brotli):
```nginx
# Nginx
gzip on;
gzip_types text/css application/javascript application/json;
```

2. **Cache Static Assets**:
```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **CDN**: Use Cloudflare or similar

### Backend Optimizations

1. **Connection Pooling**:
```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

2. **Redis Caching** (optional):
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache dashboard stats
const cacheKey = 'dashboard:stats';
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}
const stats = await calculateStats();
await redis.setex(cacheKey, 300, JSON.stringify(stats)); // 5 min cache
```

## Security

### Production Security Checklist

- [ ] HTTPS enabled (SSL/TLS)
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using ORM)
- [ ] XSS protection (Content-Security-Policy)
- [ ] Helmet.js middleware
- [ ] Regular dependency updates
- [ ] Strong database passwords
- [ ] Firewall configured
- [ ] Non-root user for app

**Helmet.js**:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

**Rate Limiting**:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Backup Strategy

### Database Backups

**Automated Backup Script**:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="finance_prod"

# Create backup
pg_dump -h localhost -U financeapp $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-bucket/backups/
```

**Cron Job**:
```bash
# Daily at 2 AM
0 2 * * * /home/financeapp/backup.sh
```

## Monitoring Dashboards

### Recommended Tools

- **Application**: Sentry, New Relic
- **Infrastructure**: Datadog, Grafana
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: Loggly, Papertrail

## Rollback Procedure

If deployment fails:

1. **Stop new version**:
```bash
sudo systemctl stop finance-manager
```

2. **Restore previous code**:
```bash
git checkout previous-tag
npm ci
npm run build
```

3. **Rollback database** (if needed):
```bash
psql -U financeapp finance_prod < backup.sql
```

4. **Restart**:
```bash
sudo systemctl start finance-manager
```

## Related Documentation

- [Getting Started](./02-getting-started.md)
- [Development Workflow](./08-development-workflow.md)
- [Testing](./09-testing.md)
