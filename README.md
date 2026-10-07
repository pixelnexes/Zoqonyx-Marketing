# ZOQONYX EMAIL MARKETING — Enterprise Cold Outreach SaaS

> **Engineered & Maintained by NAWIX TECH SOLUTION**  
> **Website:** [https://newixtechsolutions.com/](https://newixtechsolutions.com/)

---

## 🚀 Overview

**ZOQONYX EMAIL MARKETING** is a multi-tenant commercial Cold Email & Outreach Automation Platform designed for B2B agencies, lead generation firms, and sales teams. It enables high-volume outbound campaigns (1,000+ emails/day per tenant) across multiple rotated mailboxes with automated follow-up sequences, deliverability protection, and inbox sync.

---

## ✨ Key Capabilities

1. **High-Volume Multi-Mailbox Dispatch (1,000+ Emails/Day):**
   - Connect multiple SMTP/IMAP, Hostinger Business, Google Workspace, and Microsoft 365 accounts.
   - Built-in multi-mailbox rotation, daily sending limits, hourly pacing, and jitter delay.
   - Live socket SMTP verification and RFC-compliant Message-ID headers.

2. **Categorized Lead Management & Folders:**
   - 16+ pre-configured niche folder tabs (Cafes, Dentists, Gyms, IT Software, Real Estate, etc.).
   - Spreadsheet Import Wizard (CSV/XLSX) with automatic header detection and append mode (zero accidental overwrites).
   - Instant 1-Click CSV and Excel exports.
   - Bulk selection and single-lead deletion tools.

3. **Multi-Step Visual Sequence Builder:**
   - Visual cadence timeline with custom wait days (Day 0, Day 3, Day 7).
   - Dynamic tag interpolation (`{{first_name}}`, `{{company}}`, `{{city}}`, `{{job_title}}`).
   - One-click Test Run email preview.

4. **Inbox & Deliverability Engine:**
   - Unified two-way inbox with real-time reply detection.
   - Automated sequence auto-pause when a prospect replies.
   - SPF, DKIM, DMARC, and MX DNS verification audit.

5. **Multi-Tenant SaaS Architecture:**
   - Built-in organization isolation, role-based access control (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`), and API key intake for scraping integrations.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router, Server Actions, API Routes)
- **Language:** TypeScript
- **Styling:** TailwindCSS & Custom SaaS Design System
- **ORM / Persistence:** Prisma ORM (PostgreSQL) with High-Availability Local Failover Engine
- **Icons & UI:** Lucide React, Framer Motion
- **Parsing & Exports:** XLSX, Papaparse

---

## 📦 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🌐 Hostinger Deployment Guide

### Option A: Hostinger VPS Deployment (Recommended for High Volume)

#### 1. Connect to VPS via SSH
```bash
ssh root@YOUR_SERVER_IP
```

#### 2. Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
npm install -g pm2
```

#### 3. Clone Repository & Install
```bash
cd /var/www
git clone https://github.com/pixelnexes/Zoqonyx-Marketing.git zoqonyx
cd zoqonyx
npm install
```

#### 4. Configure Environment
```bash
cp .env.production.example .env
nano .env # Set your JWT_SECRET and domain variables
```

#### 5. Build & Start with PM2
```bash
npm run build
pm2 start npm --name "zoqonyx" -- start
pm2 save
pm2 startup
```

#### 6. Configure Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable SSL via Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option B: Hostinger Cloud Web App (Node.js Application)

1. Open **Hostinger hPanel** → **Node.js**
2. Create a new Node.js application:
   - **Node.js version:** 20.x or 18.x
   - **Application root:** `/home/u123456789/domains/yourdomain.com/public_html`
   - **Application startup file:** `node_modules/next/dist/bin/next`
   - **Startup argument:** `start -p 3000`
3. In **Git Deployment**, connect repository: `https://github.com/pixelnexes/Zoqonyx-Marketing.git` (branch `main`).
4. Set Environment Variables (`JWT_SECRET`, `NODE_ENV=production`).
5. Run **Deploy / Build**.

---

## 🛡️ License & Support

Proprietary commercial software engineered for **NAWIX TECH SOLUTION**.  
For enterprise support or integration queries: [https://newixtechsolutions.com/](https://newixtechsolutions.com/)
