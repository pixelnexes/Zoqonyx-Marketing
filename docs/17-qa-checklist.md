# ZOQONYX EMAIL MARKETING - Quality Assurance (QA) Checklist

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-17-QA`  

---

## 1. 48-Point Quality Assurance Matrix

| # | Check Item | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| 1 | User registration & password hashing | Create user, verify Argon2 hash in DB | PASS |
| 2 | Login authentication & session cookie | Login, verify `HttpOnly` cookie set | PASS |
| 3 | Password reset workflow | Request token, update password, test login | PASS |
| 4 | Multi-tenant organization creation | Register new workspace, verify `Organization` row | PASS |
| 5 | Mailbox connection (SMTP/IMAP) | Input host/port/auth, verify connection test | PASS |
| 6 | Mailgun API connection | Input API key + domain, verify ping | PASS |
| 7 | Credential encryption at rest | Inspect DB `ProviderCredential`, confirm ciphertext | PASS |
| 8 | CSV lead spreadsheet upload | Upload CSV, verify parse | PASS |
| 9 | XLSX lead spreadsheet upload | Upload XLSX, verify multi-column parse | PASS |
| 10 | Auto-detection of Email column | Confirm `email`, `Email Address` auto-mapped | PASS |
| 11 | Auto-detection of Name column | Confirm `name`, `First Name` auto-mapped | PASS |
| 12 | Smart full name splitting | `"Jane Doe"` split to First: Jane, Last: Doe | PASS |
| 13 | Duplicate lead prevention | Ingest duplicate email, verify deduplication | PASS |
| 14 | Invalid email format filtering | Ingest `bad@email..com`, verify rejected | PASS |
| 15 | Campaign creation & naming | Create campaign with timezone and schedule | PASS |
| 16 | Sequence builder (Multi-step) | Add Step 1, Wait 3 Days, Step 2 | PASS |
| 17 | Dynamic variable rendering | Test `{{first_name}}`, `{{company}}` | PASS |
| 18 | Safe fallback rendering | Verify missing variable renders fallback value | PASS |
| 19 | Test email dispatch | Send single test email to inspector address | PASS |
| 20 | Dry-run campaign execution | Verify simulation mode without external send | PASS |
| 21 | Campaign launch state transition | `DRAFT` -> `READY` -> `RUNNING` validation | PASS |
| 22 | BullMQ queue scheduling | Verify Redis job creation with timestamp | PASS |
| 23 | Email dispatch execution | Verify provider `sendEmail` called with HTML/Text | PASS |
| 24 | Inbound reply detection (IMAP) | Poller discovers `In-Reply-To`, tags `REPLIED` | PASS |
| 25 | Follow-up auto-stop on reply | Verify future sequence steps cancelled | PASS |
| 26 | Unified Inbox conversation view | Inbound email displays in conversation thread | PASS |
| 27 | Hard bounce handling | Webhook/worker marks lead `BOUNCED` | PASS |
| 28 | Global suppression enrollment | Bounced/Unsubscribed email added to suppression | PASS |
| 29 | One-click unsubscribe link | Click `/unsubscribe/:token`, verify lead marked | PASS |
| 30 | Sending window enforcement | Verify send blocked outside configured hours | PASS |
| 31 | Sending days enforcement | Verify send blocked on non-sending days (e.g. Sun) | PASS |
| 32 | Lowest-limit calculation | Min(Plan, Mailbox, Campaign) strictly enforced | PASS |
| 33 | Micro-pacing & randomized delay | Jitter delay applied between consecutive sends | PASS |
| 34 | Idempotency key protection | Duplicate job execution blocked by SHA256 key | PASS |
| 35 | Multi-tenant isolation | Tenant A query unable to access Tenant B leads | PASS |
| 36 | RBAC role restrictions | Member forbidden from modifying billing/mailboxes | PASS |
| 37 | Deliverability Advisor DNS check | Verify SPF, DKIM, DMARC audit logic | PASS |
| 38 | Public API Key authentication | `Bearer zoq_...` authenticated for API calls | PASS |
| 39 | High-volume lead API import | External tool pushes JSON leads into database | PASS |
| 40 | Auto-enrollment rule execution | Ingested lead matching rule automatically queued | PASS |
| 41 | Super Admin dashboard (`/admin`) | Platform totals, tenant quotas, health check | PASS |
| 42 | Tenant suspension by Admin | Suspended tenant blocked from API and dispatches | PASS |
| 43 | Billing tier matrix enforcement | Quota exceeded returns upgrade required error | PASS |
| 44 | Test Mode billing toggle | Upgrade plan simulated without live Stripe card | PASS |
| 45 | Public landing page responsiveness | Desktop, tablet, mobile layouts validated | PASS |
| 46 | Data export (CSV/XLSX) | Export leads and analytics successfully | PASS |
| 47 | Windows BAT launcher scripts | `START-ZOPONICS.bat` boots app cleanly | PASS |
| 48 | Production Docker build | Container images build and run without error | PASS |
