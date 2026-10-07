# ZOQONYX EMAIL MARKETING - Multi-Tenant Architecture

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-09-TENANT`  

---

## 1. Multi-Tenant Architectural Pattern

Zoqonyx employs a **Shared Database, Isolated Row-Level Tenancy** model. This is the industry-standard architecture for high-efficiency B2B SaaS platforms, enabling rapid provisioning, centralized migration management, and low operational overhead while maintaining airtight security boundaries.

### 1.1. Tenant Hierarchy
```
[Platform Level]
  ├── Platform Super Admins
  ├── Global Feature Flags & Plans
  └── Organizations (Tenants)
       │
       ├── Organization A (Tenant 1)
       │    ├── Owner / Admins / Members
       │    ├── Mailboxes (SMTP / Mailgun)
       │    ├── Leads & Custom Fields
       │    ├── Campaigns & Sequences
       │    ├── Suppression List
       │    └── Subscription & Usage Quota
       │
       └── Organization B (Tenant 2)
            ├── Owner / Admins / Members
            ├── Mailboxes (SES / SendGrid)
            ├── Leads & Custom Fields
            ├── Campaigns & Sequences
            ├── Suppression List
            └── Subscription & Usage Quota
```

---

## 2. Tenant Context Resolution Pipeline

1. **Incoming Request:** Every API request carries a session cookie or API key (`Bearer zoq_...`).
2. **Context Middleware:** The authentication guard verifies the token, resolves the user ID, and checks the user's membership in the target `organizationId`.
3. **Context Injection:** Injects a validated `TenantContext` object into request lifecycle:
   ```typescript
   export interface TenantContext {
     userId: string;
     organizationId: string;
     userRole: OrganizationRole;
     planTier: string;
     isSuperAdmin: boolean;
   }
   ```
4. **Service-Level Scoping:** All database calls require `organizationId` from `TenantContext`.

---

## 3. Cross-Tenant Isolation Enforcement Rules

- **Rule 1:** Every tenant-bound table in Prisma schema has a mandatory `organizationId String` column.
- **Rule 2:** Prisma query extensions or service repository wrappers automatically append `where: { organizationId }` to every `findMany`, `findFirst`, `update`, and `delete`.
- **Rule 3:** Direct UUID lookups (e.g. `findUnique({ where: { id } })`) are strictly forbidden unless verified against `organizationId` in a compound `findFirst({ where: { id, organizationId } })`.
