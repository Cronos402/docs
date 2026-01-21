# Production Deployment Guide - Cronos402

## 🎯 Your Production Domains

All domains point to IP: **86.48.5.116**

| Service | Domain | Port | Repo | Purpose |
|---------|--------|------|------|---------|
| **Frontend** | cronos402.dev | 3002 | apps/app | Next.js dashboard UI |
| **Docs** | docs.cronos402.dev | 3003 | apps/docs | Documentation site |
| **OpenAPI-MCP** | openapi.cronos402.dev | 3001 | apps/openapi-mcp | OpenAPI → MCP converter |
| **Facilitator Proxy** | facilitator.cronos402.dev | 3004 | apps/facilitator | Cronos facilitator proxy |
| **MCP Service (Auth)** | mcp.cronos402.dev | 3005 | apps/mcp | MCP server + auth |
| **MCP Gateway** | gateway.cronos402.dev | 3006 | apps/mcp-gateway | Payment enforcement proxy |
| **MCP Indexer** | indexer.cronos402.dev | **3010** | apps/mcp-indexer | Analytics & server directory |

---

## 📋 Environment Variables by Service

### 1️⃣ **apps/facilitator** (facilitator.cronos402.dev)

**Status**: ✅ **NO ENVIRONMENT VARIABLES NEEDED!**

This is a simple proxy service that routes requests to official Cronos facilitators. It's completely stateless and has no external dependencies.

**What it does**:
- Proxies requests to `https://facilitator.cronoslabs.org` (Cronos official only)
- Provides health checks, retries, circuit breaker
- CORS already set to `origin: "*"` (allows all origins)
- Handles `/verify` and `/settle` endpoints for x402 payments

**Deploy first** - No dependencies on other services!

---

### 2️⃣ **apps/docs** (docs.cronos402.dev)

**Status**: ✅ **NO ENVIRONMENT VARIABLES NEEDED!**

Static documentation site built with Next.js and Fumadocs. No external APIs or services.

**What it does**:
- Renders markdown documentation
- Static site generation

**Deploy second** - No dependencies!

---

### 3️⃣ **apps/mcp** (mcp.cronos402.dev)

**Dependencies**:
- PostgreSQL database
- GitHub OAuth credentials
- Google OAuth credentials (optional)

**Required Environment Variables**:

```bash
NODE_ENV=production
PORT=3005

# Database
DATABASE_URL=postgresql://your-production-db-url

# GitHub OAuth (REQUIRED)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Better Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your_random_secret_here
BETTER_AUTH_URL=https://mcp.cronos402.dev

# CORS
TRUSTED_ORIGINS=https://cronos402.dev,https://docs.cronos402.dev,https://gateway.cronos402.dev,https://mcp.cronos402.dev,https://indexer.cronos402.dev,https://openapi.cronos402.dev,https://facilitator.cronos402.dev

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Analytics - Points to GATEWAY for real-time analytics ingestion
# The MCP service sends RPC logs to the gateway (NOT the indexer)
MCP_DATA_URL=https://gateway.cronos402.dev
MCP_DATA_SECRET=your_analytics_secret_here

# Facilitator
FACILITATOR_URL=https://facilitator.cronos402.dev
```

**What it does**:
- Handles authentication (GitHub, Google)
- MCP server with payment hooks
- User management
- Sends analytics to gateway via `/ingest/rpc`

**Deploy third** - Depends on facilitator & database

**OAuth Setup**:
1. Update GitHub OAuth App callback URL: `https://mcp.cronos402.dev/api/auth/callback/github`
2. Update Google OAuth App callback URL: `https://mcp.cronos402.dev/api/auth/callback/google`

---

### 4️⃣ **apps/mcp-gateway** (gateway.cronos402.dev)

**Dependencies**:
- Upstash Redis (REQUIRED)

**Required Environment Variables**:

```bash
# Upstash Redis (REQUIRED)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# MCP2 Public URL (REQUIRED)
MCP2_PUBLIC_URL=https://gateway.cronos402.dev
```

**What it does**:
- **Payment enforcement proxy** - Enforces x402 payments before proxying to upstream MCP servers
- **Receives analytics** from MCP servers via `POST /ingest/rpc`
- Stores MCP server configs in Redis
- Detects and tracks payments automatically
- Stores payment data in Redis for real-time access

**Data Flow**:
```
MCP Server → Gateway (/ingest/rpc) → Redis (real-time payments)
                                   ↓
                                Indexer (reads from Redis for long-term analytics)
```

**Deploy fourth** - Depends on Redis (Upstash)

---

### 5️⃣ **apps/mcp-indexer** (indexer.cronos402.dev)

**Port**: **3010** ⚠️ (NOT 3007)

**Dependencies**:
- PostgreSQL database (can be same as apps/mcp or separate)

**Required Environment Variables**:

```bash
NODE_ENV=production
PORT=3010

# PostgreSQL (stores historical RPC logs and server directory)
DATABASE_URL=postgresql://your-production-db-url

# Ingestion secret - validates POST /ingest/rpc requests
# Should match MCP_DATA_SECRET from services that send analytics
INGESTION_SECRET=your_ingestion_secret_here

# Moderation secret - for admin endpoints (generate with: openssl rand -base64 32)
# Used for POST /servers/:id/moderate and POST /score/recompute
MODERATION_SECRET=your_admin_secret_here
```

**What it does**:
- **Public MCP server directory** - Lists all indexed MCP servers
- **Long-term analytics** - Stores historical RPC logs in PostgreSQL
- **Server discovery** - Inspects MCP servers and extracts tools/metadata
- **Quality scoring** - Computes quality scores based on performance metrics
- **Moderation** - Approve/reject servers for public directory
- **Payment history** - Derives payment data from RPC logs

**API Endpoints**:
- `POST /ingest/rpc` - Receives RPC logs (requires INGESTION_SECRET)
- `POST /index/run` - Index a new MCP server by URL
- `GET /servers` - List all servers (with pagination & moderation filtering)
- `GET /server/:id` - Get server details, tools, payments, analytics
- `GET /explorer` - Live RPC activity feed (used by frontend explorer page)
- `POST /servers/:id/moderate` - Moderate a server (requires MODERATION_SECRET)
- `POST /score/recompute` - Recompute quality scores (requires MODERATION_SECRET)

**Used By**:
- **Frontend app** - Reads from `/explorer` and `/servers` endpoints to display:
  - Explorer page (live payments feed)
  - Server directory (list of MCP servers)
  - Server analytics dashboards

**Deploy fifth** - Depends on PostgreSQL

**Security Notes**:
- `INGESTION_SECRET`: Validates analytics from trusted sources (should match `MCP_DATA_SECRET`)
- `MODERATION_SECRET`: Admin-only endpoints for server approval (generate separately)

**Generate secrets**:
```bash
# Ingestion secret (should match MCP_DATA_SECRET)
openssl rand -base64 32

# Moderation secret (unique for admin access)
openssl rand -base64 32
```

---

### 6️⃣ **apps/app** (cronos402.dev)

**Dependencies**:
- MCP Service (auth)
- MCP Gateway
- Facilitator Proxy
- **MCP Indexer** ⚠️ (for explorer page!)
- OpenAPI-MCP

**Required Environment Variables**:

```bash
# Auth Service
NEXT_PUBLIC_AUTH_URL=https://mcp.cronos402.dev

# MCP Services
NEXT_PUBLIC_MCP2_URL=https://gateway.cronos402.dev
NEXT_PUBLIC_MCP_PROXY_URL=https://mcp.cronos402.dev

# MCP Indexer - REQUIRED for explorer page!
# The frontend calls /explorer endpoint to show live payments
NEXT_PUBLIC_MCP_DATA_URL=https://indexer.cronos402.dev

# API2 - OpenAPI to MCP converter
NEXT_PUBLIC_API2_URL=https://openapi.cronos402.dev

# Facilitator Proxy
NEXT_PUBLIC_FACILITATOR_URL=https://facilitator.cronos402.dev
```

**What it does**:
- Next.js dashboard frontend
- Connects users to MCP servers
- Handles payments UI
- Chat interface with AI
- **Explorer page** - Calls `NEXT_PUBLIC_MCP_DATA_URL/explorer` to show live payments

**⚠️ IMPORTANT**: If your explorer page isn't working, it's because `NEXT_PUBLIC_MCP_DATA_URL` isn't set or the indexer isn't running!

**Deploy LAST** - Depends on ALL other services

---

## 🚀 Deployment Order (Based on Dependencies)

### **Stage 1: Independent Services** (No dependencies)
Deploy these first in any order:

1. ✅ **apps/facilitator** (facilitator.cronos402.dev:3004)
   - No env vars needed
   - No dependencies

2. ✅ **apps/docs** (docs.cronos402.dev:3003)
   - No env vars needed
   - No dependencies

---

### **Stage 2: Core Backend** (Depends on database/external services)

3. 🔧 **apps/mcp** (mcp.cronos402.dev:3005)
   - **Needs**: PostgreSQL, GitHub OAuth, Better Auth secret
   - **Sends analytics to**: gateway.cronos402.dev
   - **Critical**: Update OAuth callback URLs!

---

### **Stage 3: Gateway & Indexer** (Depends on Redis/Database)

4. 🔧 **apps/mcp-gateway** (gateway.cronos402.dev:3006)
   - **Needs**: Upstash Redis
   - **Receives**: Analytics from MCP servers
   - **Stores**: Payments in Redis

5. 🔧 **apps/mcp-indexer** (indexer.cronos402.dev:**3010**)
   - **Needs**: PostgreSQL (can be same or different DB)
   - **Provides**: Server directory, explorer data, analytics
   - **Critical**: Explorer page won't work without this!

6. 🔧 **apps/openapi-mcp** (openapi.cronos402.dev:3001)
   - **Needs**: Check for env vars (likely minimal)

---

### **Stage 4: Frontend** (Depends on everything)

7. 🎨 **apps/app** (cronos402.dev:3002)
   - **Needs**: All services from stages 1-3
   - **Calls**: Every single service
   - **Explorer page**: Requires indexer.cronos402.dev
   - Deploy LAST to ensure all backends are ready

---

## 🔐 OAuth Callback URL Updates

### GitHub OAuth App
1. Go to: https://github.com/settings/developers
2. Find your OAuth App (Client ID: `Ov23lilMIeL74xKxu7BF`)
3. Add production callback: `https://mcp.cronos402.dev/api/auth/callback/github`
4. Keep the local callback too: `http://localhost:3005/api/auth/callback/github`

### Google OAuth App
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth Client (Client ID starts with `182809130692`)
3. Add production callback: `https://mcp.cronos402.dev/api/auth/callback/google`
4. Keep the local callback too: `http://localhost:3005/api/auth/callback/google`

---

## 📊 Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                     Stage 1: Independent                     │
├─────────────────────────────────────────────────────────────┤
│  facilitator (3004)        docs (3003)                      │
│         │                      │                             │
│         └──────────────────────┘                             │
│                    ▼                                         │
├─────────────────────────────────────────────────────────────┤
│                     Stage 2: Core Backend                    │
├─────────────────────────────────────────────────────────────┤
│            mcp (3005) ◄──── PostgreSQL                      │
│                 │            GitHub OAuth                     │
│                 │            Google OAuth                     │
│                 │ (sends analytics)                          │
│                 ▼                                            │
├─────────────────────────────────────────────────────────────┤
│                Stage 3: Gateway & Indexer                    │
├─────────────────────────────────────────────────────────────┤
│  mcp-gateway (3006) ◄──── Upstash Redis                     │
│       │ (receives analytics, stores payments)               │
│       │                                                       │
│  mcp-indexer (3010) ◄──── PostgreSQL                        │
│       │ (stores historical data, server directory)          │
│       │                                                       │
│  openapi-mcp (3001)                                          │
│         │                                                     │
│         └───────────────┐                                    │
│                         ▼                                     │
├─────────────────────────────────────────────────────────────┤
│                      Stage 4: Frontend                       │
├─────────────────────────────────────────────────────────────┤
│              app (3002) ◄──── ALL SERVICES                  │
│              - Calls indexer/explorer for live payments     │
│              - Calls indexer/servers for server directory   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

After deploying each stage, test:

### Stage 1 Tests
- [ ] `curl https://facilitator.cronos402.dev/health` → Should return 200 OK
- [ ] `curl https://docs.cronos402.dev` → Should return docs HTML

### Stage 2 Tests
- [ ] `curl https://mcp.cronos402.dev/health` → Should return 200 OK
- [ ] Visit `https://mcp.cronos402.dev/api/auth/session` → Should return session info
- [ ] Test GitHub OAuth login flow

### Stage 3 Tests
- [ ] `curl https://gateway.cronos402.dev/health` → Should return 200 OK
- [ ] Check Upstash Redis dashboard for connection
- [ ] `curl https://indexer.cronos402.dev/health` → Should return 200 OK
- [ ] `curl https://indexer.cronos402.dev/servers` → Should return server list JSON
- [ ] `curl https://indexer.cronos402.dev/explorer` → Should return RPC logs JSON

### Stage 4 Tests
- [ ] Visit `https://cronos402.dev` → Should load dashboard
- [ ] Test login → Should redirect to mcp.cronos402.dev
- [ ] Visit explorer page → Should show live payments (requires indexer!)
- [ ] Test MCP server connection
- [ ] Test payment flow

---

## ⚠️ Critical Gotchas

### 1. Database Connection
- Make sure your production `DATABASE_URL` is accessible from your deployment server (86.48.5.116)
- If using Neon or hosted Postgres, ensure firewall allows connections from your server IP
- `apps/mcp` and `apps/mcp-indexer` can share the same database or use separate ones

### 2. Upstash Redis
- Already configured ✅
- No changes needed

### 3. MCP_DATA_URL Confusion ⚠️
**IMPORTANT**: There are TWO different analytics endpoints:

**Backend (MCP service)**:
- `MCP_DATA_URL=https://gateway.cronos402.dev` ← MCP server sends logs HERE
- Gateway stores in Redis for real-time access

**Frontend (App)**:
- `NEXT_PUBLIC_MCP_DATA_URL=https://indexer.cronos402.dev` ← Frontend reads from HERE
- Indexer provides historical data and server directory

### 4. Explorer Page Not Working?
If your explorer page shows "Failed to fetch payments":
- ✅ Check `NEXT_PUBLIC_MCP_DATA_URL` is set to `https://indexer.cronos402.dev`
- ✅ Check indexer service is running on port 3010
- ✅ Check indexer has `DATABASE_URL` configured
- ✅ Test: `curl https://indexer.cronos402.dev/explorer`

### 5. CORS Issues
- All CORS configurations are now updated ✅
- `apps/mcp` uses `TRUSTED_ORIGINS` env var
- `apps/mcp-gateway` allows all origins by default

### 6. HTTPS vs HTTP
- All production URLs MUST use `https://`
- Your reverse proxy (nginx/caddy) on 86.48.5.116 must handle SSL termination
- Consider using Certbot for free Let's Encrypt SSL certificates

### 7. Session Cookies
- Better Auth uses cookies for session management
- Ensure your domain settings allow cross-domain cookies if needed
- Set `BETTER_AUTH_URL=https://mcp.cronos402.dev` (not localhost!)

---

## 🔧 Reverse Proxy Configuration (nginx example)

You'll need nginx or caddy on 86.48.5.116 to route domains to ports:

```nginx
# /etc/nginx/sites-available/cronos402.conf

# Frontend App
server {
    listen 80;
    server_name cronos402.dev;
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Docs
server {
    listen 80;
    server_name docs.cronos402.dev;
    location / {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# MCP Service
server {
    listen 80;
    server_name mcp.cronos402.dev;
    location / {
        proxy_pass http://localhost:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Cookie $http_cookie;
    }
}

# MCP Gateway
server {
    listen 80;
    server_name gateway.cronos402.dev;
    location / {
        proxy_pass http://localhost:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Facilitator
server {
    listen 80;
    server_name facilitator.cronos402.dev;
    location / {
        proxy_pass http://localhost:3004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# MCP Indexer (port 3010!)
server {
    listen 80;
    server_name indexer.cronos402.dev;
    location / {
        proxy_pass http://localhost:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# OpenAPI-MCP
server {
    listen 80;
    server_name openapi.cronos402.dev;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then run: `sudo certbot --nginx` to add SSL!

---

## 📝 Quick Deploy Commands

```bash
# Stage 1: Independent services
cd /Users/apple/dev/cronos/cronos402/apps/facilitator
npm install && npm start &

cd /Users/apple/dev/cronos/cronos402/apps/docs
npm install && npm run build && npm start &

# Stage 2: Core backend (after setting env vars)
cd /Users/apple/dev/cronos/cronos402/apps/mcp
# Create .env.production with variables above
npm install && npm run build && npm start &

# Stage 3: Gateway & Indexer
cd /Users/apple/dev/cronos/cronos402/apps/mcp-gateway
# Create .env.production with variables above
npm install && npm start &

cd /Users/apple/dev/cronos/cronos402/apps/mcp-indexer
# Create .env.production with PORT=3010, DATABASE_URL, and secrets
npm install && npm start &

# Stage 4: Frontend (last!)
cd /Users/apple/dev/cronos/cronos402/apps/app
# Create .env.production with NEXT_PUBLIC_MCP_DATA_URL=https://indexer.cronos402.dev
npm install && npm run build && npm start &
```

---

## ✅ Summary

### Services that DON'T need env vars:
1. ✅ **apps/facilitator** - Ready to deploy!
2. ✅ **apps/docs** - Ready to deploy!

### Services that NEED env vars:
3. 🔧 **apps/mcp** - PostgreSQL, GitHub OAuth, MCP_DATA_URL (gateway), MCP_DATA_SECRET
4. 🔧 **apps/mcp-gateway** - Upstash Redis
5. 🔧 **apps/mcp-indexer** - PostgreSQL, INGESTION_SECRET, MODERATION_SECRET (Port **3010**)
6. 🔧 **apps/app** - All service URLs (especially NEXT_PUBLIC_MCP_DATA_URL for explorer!)

### Key Points:
- ⚠️ **Indexer runs on port 3010** (not 3007)
- ⚠️ **Explorer page requires indexer** - Won't work without `NEXT_PUBLIC_MCP_DATA_URL`
- ⚠️ **Analytics flow**: MCP → Gateway (Redis) → Indexer (PostgreSQL) → Frontend
- ⚠️ **MODERATION_SECRET** - Generate with `openssl rand -base64 32` (for admin endpoints)
- ⚠️ **INGESTION_SECRET** - Should match `MCP_DATA_SECRET` from MCP service

### Next steps:
1. Update OAuth callback URLs (GitHub + Google)
2. Create `.env.production` files for each service
3. Set up nginx reverse proxy with SSL (port 3010 for indexer!)
4. Deploy in order: facilitator → docs → mcp → gateway → **indexer** → app
5. Test explorer page to verify indexer integration
