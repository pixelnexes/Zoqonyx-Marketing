# ZOQONYX EMAIL MARKETING - API Specification

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-04-API`  
**Base URL:** `/api/v1`  
**Protocol:** HTTPS / JSON REST  

---

## 1. Authentication & Security Headers

The API supports two authentication mechanisms:
1. **Session Cookie Auth:** For internal Next.js dashboard interactions via secure `HttpOnly` cookie.
2. **API Key Authentication:** For programmatic external integrations (lead generators, CRMs, scripts).

```http
Authorization: Bearer zoq_live_abc123...
Content-Type: application/json
X-Zoqonyx-Organization: <optional-explicit-org-id>
```

---

## 2. API Endpoints Catalog

### 2.1. Authentication & Session
- `POST /api/v1/auth/signup` - Register a new user and organization.
- `POST /api/v1/auth/login` - Authenticate and establish session cookie.
- `POST /api/v1/auth/logout` - Invalidate session.
- `POST /api/v1/auth/forgot-password` - Issue password reset link.
- `POST /api/v1/auth/reset-password` - Complete password reset with token.
- `GET /api/v1/auth/me` - Fetch authenticated user profile and active organizations.

### 2.2. Organizations & Team Management
- `GET /api/v1/organizations` - List accessible organizations.
- `POST /api/v1/organizations` - Create a new organization workspace.
- `GET /api/v1/organizations/:id` - Retrieve organization details and quotas.
- `PUT /api/v1/organizations/:id` - Update organization profile.
- `GET /api/v1/organizations/:id/members` - List organization members.
- `POST /api/v1/organizations/:id/members/invite` - Invite a team member.
- `DELETE /api/v1/organizations/:id/members/:userId` - Remove a member.

### 2.3. Mailboxes & Deliverability
- `GET /api/v1/mailboxes` - List connected mailboxes with deliverability status.
- `POST /api/v1/mailboxes` - Connect a new mailbox (SMTP/IMAP, Mailgun, SES, SendGrid).
- `POST /api/v1/mailboxes/:id/test` - Perform live connection and SMTP handshake test.
- `POST /api/v1/mailboxes/:id/test-email` - Send test email to verify inbox delivery.
- `DELETE /api/v1/mailboxes/:id` - Disconnect and delete mailbox.
- `GET /api/v1/mailboxes/:id/deliverability` - Audit SPF, DKIM, DMARC DNS health.

### 2.4. Leads & Import Engine
- `GET /api/v1/leads` - Filter, search, and paginate organization leads.
- `POST /api/v1/leads` - Create a single lead.
- `POST /api/v1/leads/import` - **High-Volume Public Ingestion Endpoint** for external lead generators. Accepts single JSON or array of leads with deduplication and auto-enrollment triggers.
- `POST /api/v1/leads/import-file` - Upload `.csv` or `.xlsx` spreadsheet for column detection.
- `POST /api/v1/leads/import-confirm` - Confirm spreadsheet column mappings and execute bulk import.
- `GET /api/v1/leads/:id` - Retrieve full lead profile with timeline, campaigns, and replies.
- `DELETE /api/v1/leads/:id` - Delete lead record.

### 2.5. Campaigns & Sequence Automation
- `GET /api/v1/campaigns` - List organization campaigns.
- `POST /api/v1/campaigns` - Create a new campaign.
- `GET /api/v1/campaigns/:id` - Fetch campaign configuration, sequences, and metrics.
- `PUT /api/v1/campaigns/:id` - Update campaign parameters and sending schedule.
- `POST /api/v1/campaigns/:id/sequences` - Save multi-step sequence configuration.
- `POST /api/v1/campaigns/:id/start` - Validate prerequisites and launch campaign.
- `POST /api/v1/campaigns/:id/pause` - Pause running campaign dispatches.
- `POST /api/v1/campaigns/:id/test-run` - Execute dry-run test send to designated tester address.
- `GET /api/v1/campaigns/:id/analytics` - Fetch granular campaign performance data.

### 2.6. Email Templates & AI Recommendation
- `GET /api/v1/templates` - List email templates.
- `POST /api/v1/templates` - Create reusable template.
- `POST /api/v1/templates/recommend` - AI template assistant generates recommended outreach copy based on industry, tone, and objective.
- `POST /api/v1/templates/preview` - Render template with live sample lead variables.

### 2.7. Unified Inbox & Conversations
- `GET /api/v1/inbox` - List inbound conversation threads.
- `GET /api/v1/inbox/:id` - View full conversation history.
- `POST /api/v1/inbox/:id/reply` - Send manual direct reply via connected mailbox.
- `PUT /api/v1/inbox/:id/status` - Mark thread (`INTERESTED`, `NOT_INTERESTED`, `CLOSED`).

### 2.8. Suppression & Unsubscribe Handling
- `GET /api/v1/suppressions` - List suppressed addresses.
- `POST /api/v1/suppressions` - Manually suppress an email address or domain.
- `DELETE /api/v1/suppressions/:id` - Remove from suppression.
- `GET /unsubscribe/:token` - Public consumer one-click opt-out landing and processing.

### 2.9. API Keys & Webhook Subscriptions
- `GET /api/v1/api-keys` - List created API keys (masked).
- `POST /api/v1/api-keys` - Generate new API key (displayed once).
- `DELETE /api/v1/api-keys/:id` - Revoke API key.
- `GET /api/v1/webhooks` - List configured outbound webhook endpoints.
- `POST /api/v1/webhooks` - Register webhook subscription for platform events.

### 2.10. Billing, Plans & Subscriptions
- `GET /api/v1/plans` - List available commercial subscription plans.
- `GET /api/v1/billing/subscription` - Current organization subscription and usage quota.
- `POST /api/v1/billing/create-checkout` - Generate Stripe checkout session.
- `POST /api/v1/billing/create-portal` - Stripe customer billing portal session.
- `POST /api/v1/billing/test-mode-switch` - Toggle simulated billing for local dev/testing.
- `POST /api/v1/webhooks/stripe` - Stripe verified webhook ingestion.

### 2.11. Super Admin API (`/api/v1/admin`)
- `GET /api/v1/admin/overview` - Platform total metrics, revenue, active mailboxes.
- `GET /api/v1/admin/organizations` - Global organization directory with quotas.
- `PUT /api/v1/admin/organizations/:id/status` - Suspend or reactivate organization.
- `PUT /api/v1/admin/organizations/:id/plan` - Admin plan quota override.
- `GET /api/v1/admin/system/health` - Database, Redis, Queue worker status.
- `GET /api/v1/admin/feature-flags` - Global feature flags configuration.
