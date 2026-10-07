# ZOQONYX EMAIL MARKETING - Testing Strategy & Quality Assurance Matrix

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-13-TEST`  

---

## 1. Multi-Tier Testing Pyramid

Zoqonyx enforces a rigorous testing regimen covering unit logic, database boundaries, asynchronous queue lifecycles, provider adapters, and multi-tenant security guarantees.

```
       / \
      /   \     E2E Tests (Playwright) - Signup, Campaign Launch, Ingestion Flow
     /-----\
    /       \   Integration & API Tests (Vitest + Supertest) - Auth, RBAC, Tenancy
   /---------\
  /           \ Unit Tests (Vitest) - Template Rendering, Idempotency, Limits, Dedupe
 /-------------\
```

---

## 2. Critical Test Scenarios & Invariant Verification

1. **Authentication & Multi-Tenancy:**
   - Registration, password hashing, session issuance.
   - Cross-tenant data isolation: User A cannot read User B's leads or campaigns.
   - Role-based permissions (Member cannot invite admin or access billing).
2. **Spreadsheet Ingestion & Auto-Column Detection:**
   - Detects `email`, `Email Address`, `contact_email` across diverse CSV/XLSX structures.
   - Smart name splitting: `"Dr. Jane Doe"` → First: `"Jane"`, Last: `"Doe"`.
   - Deduplication against existing leads and suppression table.
3. **Template Engine & Fallbacks:**
   - Variables replace correctly.
   - Missing fields cleanly evaluate to default fallback or empty string (never `"undefined"`).
4. **Campaign Sequence & Idempotency:**
   - Dispatches step 1, respects delay before step 2.
   - Re-running worker on same job produces exactly 1 send (zero duplicates).
   - Sending halts immediately when lead replies, bounces, or unsubscribes.
5. **Scheduler & Limits:**
   - Enforces the minimum of `(Plan, Mailbox, Campaign)`.
   - Dispatches only within configured sending windows and days.
