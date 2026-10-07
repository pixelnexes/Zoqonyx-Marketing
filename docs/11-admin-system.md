# ZOQONYX EMAIL MARKETING - Super Admin System Specification

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-11-ADMIN`  
**Route:** `/admin`  

---

## 1. Purpose & Access Control

The Super Admin System is the master control plane for Nawix Tech Solution operators. It provides platform-wide observability, customer organization lifecycle management, system health auditing, plan adjustments, and abuse mitigation.

- **Authentication Guard:** Only users with `isSuperAdmin === true` in the `User` table can access `/admin` or `/api/v1/admin/*`.
- **First-Run Provisioning:** On fresh database deployment, super admin account is provisioned via environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` or initial seeding script).
- **Audit Trails:** All administrative operations (suspending an organization, overriding quotas, toggling feature flags) write an immutable entry to `AuditLog`.

---

## 2. Super Admin Functional Modules

1. **Platform Overview:** Global tenant counts, active sending mailboxes, 24-hour dispatch volume, platform deliverability health, revenue run-rate.
2. **Organizations Management:**
   - Search and filter all organizations.
   - View usage quotas vs. plan limits.
   - Change plan tier or inject custom overrides (e.g. increase daily send allowance for VIP tenants).
   - Suspend / Unsuspend organization accounts for terms of service or payment enforcement.
3. **Users & Impersonation:** View global user accounts, password reset status, email verification states.
4. **Email Providers & Feature Flags:**
   - Globally toggle provider adapters (`Mailgun`, `SES`, `SendGrid`, `SMTP`).
   - Globally toggle open/click tracking defaults or AI recommendation engine.
5. **System Health & Queue Inspector:**
   - Real-time Redis queue lengths (`campaign-scheduler`, `email-dispatch`, `inbound-sync`).
   - PostgreSQL connection pool utilization.
   - Recent worker error logs and exception stack traces.
