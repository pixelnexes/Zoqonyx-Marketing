# ZOQONYX EMAIL MARKETING - Environment Variables Specification

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-15-ENV`  

---

## 1. Environment Configuration Reference (`.env.example`)

```ini
# ==============================================================================
# ZOQONYX EMAIL MARKETING - ENVIRONMENT CONFIGURATION
# Developed by Nawix Tech Solution (https://newixtechsolutions.com/)
# ==============================================================================

# Application Runtime
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Security & Master Encryption Key (32-byte hex for AES-256-GCM)
# Generate with: openssl rand -hex 32
ENCRYPTION_MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
SESSION_SECRET=super_secret_session_key_for_zoqonyx_platform_auth_jwt_token_2026

# PostgreSQL Database (Prisma ORM)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zoqonyx_db?schema=public"

# Redis Connection (BullMQ Queue & Session Cache)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Initial Super Admin Provisioning (First Boot)
ADMIN_EMAIL=admin@zoqonyx.internal
ADMIN_INITIAL_PASSWORD=ZoqonyxAdmin2026!Secure

# Optional Stripe Integration (Leave empty for Offline Test Mode)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Optional AI Assistance (OpenAI or Gemini API Key for template recommendations)
AI_API_KEY=

# Rate Limiting & Safety Controls
MAX_IMPORT_FILE_SIZE_MB=25
DEFAULT_MICRO_PACE_DELAY_SEC=45
```
