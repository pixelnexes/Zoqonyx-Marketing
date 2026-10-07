# ZOQONYX EMAIL MARKETING - System Architecture Document

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-02-ARCH`  
**Architecture Classification:** Multi-Tenant Distributed Web Application & Event-Driven Worker Cluster  

---

## 1. High-Level Architectural Overview

Zoqonyx Email Marketing is engineered with a modular, decoupling-first architecture. It combines a high-performance Next.js 14+ Full-Stack Web Application with an event-driven Node.js background worker cluster orchestrating high-concurrency email dispatch, IMAP synchronization, webhook processing, and analytics aggregation.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT CLIENTS                                    |
|   Web Browsers (Admin/App)  |  External Lead Generators  |  Email Provider Hooks  |
+------------------------------------+-----------------------------+----------------+
                                     |                             |
                                     v                             v
+-----------------------------------------------------------------------------------+
|                        REVERSE PROXY & LOAD BALANCER (Nginx)                      |
|                 SSL Termination | Rate Limiting | Compression | WAF               |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                     ZOQONYX APPLICATION CORE (Next.js / Node.js)                  |
|                                                                                   |
|  [ Public Routes ]           [ Protected App Layer ]        [ Public API v1 ]     |
|  - Landing & Docs            - Organization Auth Context    - API Key Auth        |
|  - Pricing & FAQ             - Campaigns & Sequences        - Lead Ingestion      |
|  - Unsubscribe Engine        - Mailbox Management           - Auto-Enrollment     |
|  - Health & Metrics          - Unified Inbox & Analytics    - Webhook Dispatcher  |
|                                                                                   |
|  -------------------------------------------------------------------------------  |
|  [ Domain Service Layer ]                                                         |
|  - TenantSecurityService     - EncryptionVaultService       - TemplateRenderer    |
|  - PlanEnforcementEngine     - DeliverabilityAdvisor        - InboundReplyMatcher |
+----------------------+-----------------------------+------------------------------+
                       |                             |
                       v                             v
+-------------------------------+             +-------------------------------------+
|      PRIMARY DATABASE         |             |       REDIS & BULLMQ ENGINE         |
|   PostgreSQL 16 (Relational)  |             |  - campaign-scheduler-queue         |
|  - Multi-Tenant Schema        |             |  - email-dispatch-queue             |
|  - Row-Level Organization FKs |             |  - imap-reply-poller-queue          |
|  - Prisma ORM / Migrations    |             |  - provider-webhook-queue           |
|  - Connection Pooling         |             |  - analytics-aggregator-queue       |
+-------------------------------+             +------------------+------------------+
                                                                 |
                                                                 v
+-----------------------------------------------------------------------------------+
|                         BACKGROUND WORKER CLUSTER                                 |
|                                                                                   |
|  [ Campaign Scheduler Worker ]             [ Email Dispatch Worker ]              |
|  - Evaluates sequence step conditions      - Lowest-limit rate throttle           |
|  - Verifies sending windows & timezones    - Random jitter micro-pacing           |
|  - Enqueues dispatch jobs with idempotency - Idempotency lock acquisition         |
|                                                                                   |
|  [ Inbound IMAP & Webhook Worker ]         [ Maintenance & Analytics Worker ]     |
|  - Syncs connected inboxes periodically    - Daily usage quota resets             |
|  - Detects replies, extracts clean text    - Aggregates campaign CTR / open rates |
|  - Halts sequence & notifies user          - Cleans stale session & token cache   |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                      EXTERNAL EMAIL PROVIDERS & API ECOSYSTEM                     |
|    Mailgun API  |  Amazon SES  |  SendGrid  |  Custom SMTP/IMAP  |  Postmark      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Topology & Separation of Concerns

### 2.1. Frontend & Application Layer (`apps/web` or root Next.js app)
- **Framework:** Next.js (App Router), React 18/19, TypeScript.
- **Styling & UI System:** Tailwind CSS, Radix UI primitives / shadcn component patterns, Lucide icons, Framer Motion for micro-interactions, Recharts for analytics data visualization.
- **Rendering Strategy:** 
  - *Static Site Generation (SSG) & Incremental Static Regeneration (ISR):* High-converting commercial landing pages, pricing tables, documentation, legal compliance terms.
  - *Server-Side Rendering (SSR) & React Server Components (RSC):* Data-heavy dashboard views, authenticated layout validation, organization contextual switching.
  - *Client-Side Interactivity (CSR):* Visual campaign sequence builder, interactive lead import wizard with spreadsheet column auto-mapping, unified conversation threads.

### 2.2. Backend API Services
- **Authentication & Tenancy Guard:** Centralized middleware resolving cryptographic session cookies or API keys to `TenantContext` (`organizationId`, `userId`, `role`, `planTier`).
- **Provider Abstraction Layer:** Common interface `EmailProvider` encapsulating protocol differences between RESTful email APIs (Mailgun, SES, SendGrid) and raw sockets (Nodemailer SMTP/IMAP).
- **Encryption Vault:** Hardware-agnostic AES-256-GCM encryption for stored mailbox secrets and provider API keys with per-tenant salt vectors.

### 2.3. Distributed Job Queues & Asynchronous Workers
- **Queue Technology:** BullMQ over Redis.
- **Worker Isolation:** Workers run independently from the web process to ensure long-running IMAP syncs, large spreadsheet parsings, or bulk campaign dispatches never block HTTP request lifecycles.
- **Graceful Shutdown & Resilience:** All workers intercept `SIGINT`/`SIGTERM` to complete current email dispatches and release Redis locks before exiting.

---

## 3. Data Flow Architecture

### 3.1. Lead Ingestion & Automated Campaign Enrollment
1. External Lead Generator calls `POST /api/v1/leads/import` with API Key.
2. System validates API key, verifies tenant active quota limits (contacts cap).
3. Payload is validated with Zod, deduplicated against existing lead records and global suppression lists.
4. Auto-enrollment rule evaluator checks if lead matches active campaign criteria.
5. If matched, lead is assigned to campaign and step 1 dispatch job is scheduled in Redis.

### 3.2. Automated Email Sequence Dispatch Flow
1. **Scheduler Tick:** Evaluates active campaigns and pending sequence steps.
2. **Pre-Flight Deliverability Check:**
   - Verify lead status $\neq$ `REPLIED`, `UNSUBSCRIBED`, `BOUNCED`, `PAUSED`.
   - Verify lead email is not in `SuppressionList`.
   - Verify mailbox status is `ACTIVE` and within sending window (e.g. 9am–5pm recipient timezone).
   - Check available daily quota across (Plan, Mailbox, Campaign).
3. **Idempotency Lock:** Inserts `ScheduledEmail` with unique key `cmp_lead_step_hash` inside a database transaction.
4. **Dispatch:** Calls `EmailProvider.send()`, handles personalized template rendering with fallback variables.
5. **Post-Send Recording:** Records `SentEmail` with provider Message-ID, updates daily usage counters, schedules next sequence step (e.g. +3 days).

### 3.3. Reply Interruption & Unified Inbox Sync
1. Inbound message received via IMAP polling worker or Mailgun Inbound Webhook.
2. Message headers (`In-Reply-To`, `References`, Subject `Re:...`, Sender email) are matched against `SentEmail` history.
3. Matching `CampaignLead` is transactionally updated to status `REPLIED`.
4. BullMQ executes `cancel-pending-sequence-jobs` for this lead, purging scheduled follow-ups.
5. Inbound conversation thread is created/updated in Unified Inbox, and user is notified.

---

## 4. Scalability & Resilience Strategy

| Vector | Strategy |
| :--- | :--- |
| **Database Throughput** | Connection pooling via Prisma / PgBouncer, B-Tree indexes on `organizationId`, `campaignId`, `email`, `status`. Cursor-based pagination for million-record tables. |
| **Worker Scaling** | Queue workers can be horizontally scaled across multiple Node.js worker instances without job duplication thanks to BullMQ distributed atomic locks. |
| **Rate Limit Protection** | Micro-pacing and randomized delay jitter (30–90 seconds per mailbox) prevent spam trigger spikes and ISP connection choking. |
| **Crash Recovery** | Persisted Redis queue ensures all scheduled follow-ups and pending imports resume seamlessly upon server reboot. |
