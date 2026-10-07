# ZOQONYX EMAIL MARKETING - Product Requirements Document (PRD)

**Product Name:** Zoqonyx Email Marketing  
**Developer & Legal Entity:** Nawix Tech Solution  
**Official Portal:** [https://newixtechsolutions.com/](https://newixtechsolutions.com/)  
**Document Version:** 1.0.0 (Commercial Production Specification)  
**Status:** Approved for Architecture & Implementation  

---

## 1. Executive Summary & Product Vision

Zoqonyx Email Marketing is a multi-tenant commercial SaaS platform engineered for scalable cold email outreach, automated lead nurturing, multi-mailbox orchestration, deliverability protection, and seamless integration with external lead generation pipelines.

Unlike simplistic personal email senders or unmaintainable single-user scripts, Zoqonyx is built from the ground up as an enterprise-grade multi-tenant platform. It offers organizations isolated workspace security, dynamic sequence automation with automated reply-detection cancellation, mailbox rotation, database-backed tiered subscriptions, comprehensive deliverability analytics (SPF/DKIM/DMARC), and public API access for direct lead ingestion.

---

## 2. Target Audience & Commercial Use Cases

1. **In-House Growth Teams (Nawix Tech Solution & internal teams):** High-volume, hyper-targeted B2B client acquisition with automated multi-touch follow-ups and CRM sync.
2. **Lead Generation & Marketing Agencies:** Managing multi-client outreach campaigns with dedicated mailboxes, custom domain configurations, and client-level isolation.
3. **Commercial B2B SaaS Companies:** Automated outbound sales cadences with automated reply detection, auto-unsubscribes, and zero manual sequence intervention.
4. **Independent Sales Representatives & Consultants:** Low-overhead mailbox connection (SMTP/IMAP/Mailgun/SES) with high inbox deliverability.

---

## 3. Core Product Modules & Functional Specifications

### 3.1. Organization & Multi-Tenant Management
- **Hierarchical Isolation:** Platform → Organizations → Users / Mailboxes / Leads / Campaigns / Sequences / Analytics.
- **Strict Role-Based Access Control (RBAC):**
  - `Platform Owner` / `Platform Admin`: Global system management, plan creation, abuse monitoring, tenant inspection.
  - `Organization Owner`: Full organization control, billing, member invites, mailbox connection, API keys.
  - `Organization Admin`: Operational management, campaigns, templates, leads, inbox.
  - `Manager`: Campaign and lead creation, template editing, reply review.
  - `Member`: Read and action leads, view campaigns, handle conversations.
- **Data Isolation Guarantee:** Every tenant entity carries a validated `organizationId`. Cross-tenant data leakage is strictly blocked at the backend ORM/service layer with zero reliance on client-side filtering.

### 3.2. Authentication & Account Security
- **Authentication Methods:** Secure email & password auth using Argon2/bcrypt hashing, cryptographic session tokens, secure HttpOnly cookie persistence.
- **Password Lifecycle:** Forgot password, token-based password reset, email verification, session expiration, brute-force mitigation, and IP rate limiting.
- **Audit Logging:** System logs all authentication events, mailbox credential updates, lead imports, export requests, and permission modifications.

### 3.3. Mailbox Connection & Email Provider Abstraction
- **Provider-Agnostic Interface (`EmailProvider`):** Standardized contract for connection validation, test sending, rate limit retrieval, bulk dispatching, and webhook parsing.
- **Supported Connection Types:**
  - **Custom SMTP/IMAP:** Guided port/security configuration (SSL/TLS, STARTTLS), live credential testing, inbound IMAP reply-checker.
  - **Mailgun:** First-class API integration (API key, sending domain, region US/EU), domain verification, automated webhook handling.
  - **Amazon SES, SendGrid, Postmark, Google Workspace, Microsoft 365:** Ready provider adapters.
- **Zero Raw Credential Exposure:** All SMTP passwords, API keys, and IMAP secrets are encrypted at rest using AES-256-GCM. Admin and team UIs mask all sensitive tokens.

### 3.4. Lead Management & Spreadsheet Ingestion Wizard
- **Comprehensive Lead Schema:** First name, last name, email, company, job title, industry, phone, website, city, state, country, custom key-value attributes, and tagging.
- **Spreadsheet Import Engine:**
  - Ingestion of `.csv`, `.xlsx`, and `.xls`.
  - **Intelligent Column Detection:** Automatic discovery and mapping of Email (`email`, `Email Address`, `contact_email`), Full Name / First Name (`name`, `Full Name`, `Contact Person` with smart split), Company, and Job Title.
  - Manual mapping override UI with column preview and validation.
  - Real-time deduplication against existing organization records and global suppression tables.
- **Lead Status Lifecycle:** `NEW` → `QUEUED` → `CONTACTED` → `ACTIVE` → `REPLIED` → `INTERESTED` → `NOT_INTERESTED` → `BOUNCED` → `UNSUBSCRIBED` → `PAUSED` → `COMPLETED`.

### 3.5. Campaign Automation & Visual Sequence Builder
- **Multi-Touch Sequences:** Dynamic step sequences (e.g., Email 1 → Wait 3 Days → Email 2 → Wait 4 Days → Email 3 → Final Email).
- **Conditional Branching Rules:**
  - If lead replied → Immediately halt sequence, cancel all pending jobs, create thread in Unified Inbox.
  - If lead bounced (Hard) → Stop sequence, tag lead `BOUNCED`, register to organization suppression list.
  - If lead clicked unsubscribe link → Halt all future sends, mark `UNSUBSCRIBED`, record in global suppression.
  - Custom conditions: opened, clicked, or tagged.
- **Dynamic Personalization:** Mustache/Liquid-style variables (`{{first_name}}`, `{{company_name}}`, `{{city}}`) with robust fallback filters (e.g., `{{first_name | fallback:"there"}}`).
- **Template Recommendation Engine:** AI/rule-based assistant matching industry, tone, goal, and service. Content requires human review and confirmation before campaign launch.

### 3.6. Scheduler & Deliverability Protection Engine
- **Sending Window & Timezone Awareness:** Strict time windows (e.g., Mon–Fri, 09:00 AM – 05:00 PM in recipient/mailbox timezone).
- **Lowest-Limit Rule Enforcement:** Sending throttle dynamically resolves the minimum of:
  $$\text{Effective Daily Limit} = \min(\text{Plan Limit}, \text{Mailbox Limit}, \text{Provider Limit}, \text{Campaign Limit}, \text{User Limit})$$
- **Micro-Pacing & Jitter:** Dispatches emails with randomized spacing (30–90 seconds) across active mailboxes to prevent burst spikes.
- **Deliverability Advisor:** Live DNS auditing (SPF, DKIM, DMARC), bounce rate warning thresholds, and complaint monitoring. Honest deliverability guidance without false "100% inbox guarantee" claims.

### 3.7. Unified Inbound Inbox & Reply Engine
- **Automated Thread Detection:** Tracks Message-IDs, In-Reply-To headers, Subject prefixes (`Re:`, `Fwd:`), and normalized email addresses across IMAP sync and provider webhooks.
- **Smart Sequence Interruption:** Instant transactional worker locks sequence state upon reply detection to ensure zero subsequent follow-ups are ever sent to an engaged lead.
- **In-App Conversation View:** Contextual lead sidebar displaying campaign history, custom notes, lead status changes, and direct reply capability.

### 3.8. External Lead Generator Direct Integration & Public API
- **Direct API Ingestion:** `POST /api/v1/leads/import` with API key authentication for external lead-scraping and CRM pipelines.
- **Campaign Auto-Enrollment Rules:** Configurable rule engine (e.g., Industry = "Dental Clinics" AND Country = "US") automatically routes newly ingested leads into active campaigns.
- **Organization Webhooks:** Real-time outbound webhooks for events: `lead.created`, `campaign.started`, `email.sent`, `email.replied`, `email.bounced`, `lead.unsubscribed`.

### 3.9. Database-Driven Billing & Subscription Engine
- **Tiered Plans:** `FREE`, `STARTER`, `PRO`, `BUSINESS`, `ENTERPRISE`.
- **Dynamic Feature Matrix:** Database-configured quotas for contacts, mailboxes, active campaigns, team seats, daily sending allowances, and API access.
- **Stripe & Test Mode Billing:** Subscription lifecycle support (checkout, trial, upgrade, downgrade, cancel, failed payment webhook sync) with offline Test Mode support for local dev and staging environments.

### 3.10. Super Platform Admin Console (`/admin`)
- **Global Overview:** System-wide metrics, active tenant counts, message throughput, provider health.
- **Tenant & User Management:** Suspend/activate organizations, manually adjust plan quotas, impersonate workspaces for troubleshooting.
- **Provider & Feature Flag Control:** Enable/disable providers (Mailgun, SES, SMTP), toggle AI modules, open/click tracking defaults.
- **System Health:** Live BullMQ queue backlog, Redis memory, PostgreSQL connection pools, error logs.

---

## 4. Non-Functional & Operational Requirements

1. **Reliability & Idempotency:** Every scheduled dispatch utilizes a deterministic idempotency key (`campaignId:leadId:sequenceStepId`). Duplicate dispatches are impossible even during worker retries or server crashes.
2. **Asynchronous Architecture:** Background processing powered by Redis and BullMQ. Front-end sessions or browser closures never disrupt campaign schedules.
3. **Performance:** Sub-100ms API response times for authenticated endpoints, database cursor-based pagination for million-record lead tables.
4. **Portability & Local Execution:** One-click Windows batch scripts (`START-ZOPONICS.bat`, etc.) and Docker Compose configuration for immediate standalone execution.
