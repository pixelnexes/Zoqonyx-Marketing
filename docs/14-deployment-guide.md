# ZOQONYX EMAIL MARKETING - Deployment & DevOps Guide

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-14-DEPLOY`  

---

## 1. Local Windows & Development Environment

Zoqonyx includes ready-to-run Windows batch scripts for zero-friction local execution:
- `START-ZOPONICS.bat` - Checks Node.js/PostgreSQL/Redis prerequisites, starts services, runs migrations, seeds demo data, and opens browser.
- `STOP-ZOPONICS.bat` - Gracefully terminates background worker and web processes.
- `RESTART-ZOPONICS.bat` - Clean reboot of all application layers.
- `HEALTH-CHECK-ZOPONICS.bat` - Pings database, Redis, worker queues, and HTTP endpoints.
- `RESET-ZOPONICS-DEV.bat` - Resets test database and reseeds fresh demo organization.

---

## 2. Production Docker & Container Topology

The platform provides a production-ready `docker-compose.production.yml` topology:

```
[Internet] ──► [Nginx Reverse Proxy / SSL (Port 80/443)]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  [zoponics-web (Port 3000)]  [zoponics-worker]
         │                       │
         └───────────┬───────────┘
                     ▼
       [PostgreSQL 16] & [Redis 7]
```

### 2.1. Environment Provisioning Steps (VPS / Cloud)
1. Clone repository to `/opt/zoqonyx`.
2. Configure `.env.production` with secure database credentials, JWT/session secrets, master encryption key, and admin credentials.
3. Execute `docker compose -f docker-compose.production.yml up -d --build`.
4. Run database migrations: `docker compose exec zoponics-web npx prisma migrate deploy`.
5. Verify health: `curl https://your-domain.com/api/health`.
