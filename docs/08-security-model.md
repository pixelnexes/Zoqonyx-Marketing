# ZOQONYX EMAIL MARKETING - Security Model & Threat Mitigation

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-08-SECURITY`  

---

## 1. Authentication & Session Security

1. **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using **Argon2id** (memory cost: 64MB, time cost: 3 iterations, parallelism: 4) with bcrypt as a compliant fallback.
2. **Session Persistence:** Authenticated sessions use cryptographically secure random session tokens (256-bit entropy), stored server-side and attached via `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
3. **Brute Force & Rate Limiting:** Login endpoints are protected by IP and account-based rate limiters (maximum 5 failed attempts per 15 minutes before exponential cooldown).

---

## 2. Multi-Tenant Authorization & Row-Level Data Isolation

1. **Backend-Enforced Tenancy:** Frontend UI state is strictly untrusted. Every database query in services and API handlers strictly scopes where clause by `organizationId`.
2. **Zero Cross-Tenant Leakage:** A user belonging to Organization A attempting to read `/api/v1/leads/:id` belonging to Organization B receives an instant `404 Not Found` or `403 Forbidden`.
3. **Role-Based Access Control (RBAC):** Every action checks the user's role in the organization:
   - `OWNER`: Billing, destructive deletions, API keys, member management.
   - `ADMIN`: Mailboxes, campaigns, templates, leads.
   - `MANAGER` / `MEMBER`: Campaign operations, lead inspection, reply handling.

---

## 3. Secret Management & Credential Protection

1. **Encryption at Rest:** Mailbox passwords, Mailgun API keys, and SES secret keys are encrypted with **AES-256-GCM** using a master key derived from the secure environment.
2. **Masked Secret Output:** Administrative and standard API responses mask secret keys (e.g. `mai_sec_***abcd`). Cleartext credentials never leave the backend decryptor.
3. **Zero Secret Logging:** Logging utilities sanitize payloads to ensure passwords, Authorization headers, and encryption keys are never written to disk or console.

---

## 4. Anti-Abuse & Deliverability Integrity Policy

Zoqonyx enforces legitimate commercial outreach standards:
- **No IP/Credential Rotation for Evasion:** The system strictly prohibits automated rotation of forged headers or stolen SMTP accounts.
- **Mandatory Opt-Out:** Every commercial outreach email contains a verifiable one-click unsubscribe URL.
- **Immediate Bounce & Spam Suppression:** Hard bounces and complaint events automatically register to the global suppression list to prevent blacklisting.
