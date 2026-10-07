# ZOQONYX EMAIL MARKETING - Billing, Plans & Monetization Architecture

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-12-BILLING`  

---

## 1. Database-Driven Plan System

Zoqonyx enforces a completely dynamic, database-driven plan tier model. Plans, features, and quotas are never hardcoded in frontend components. The platform administrator can adjust limits, add promotional tiers, or tweak pricing directly in the database or admin console.

### 1.1. Default Commercial Plan Tiers

| Plan Tier | Monthly Price | Yearly Price | Max Contacts | Max Mailboxes | Daily Send Quota | Active Campaigns | Team Seats | API & Webhooks | AI Assistant |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FREE** | $0 | $0 | 250 | 1 | 25 | 1 | 1 | No | No |
| **STARTER** | $29/mo | $290/yr | 2,500 | 3 | 300 | 5 | 2 | No | Yes |
| **PRO** | $79/mo | $790/yr | 10,000 | 10 | 1,500 | 25 | 5 | Yes | Yes |
| **BUSINESS**| $199/mo | $1,990/yr | 50,000 | 30 | 5,000 | Unlimited | 15 | Yes | Yes |
| **ENTERPRISE**| Custom | Custom | Unlimited | Custom | Custom | Unlimited | Unlimited | Yes | Yes |

---

## 2. Stripe & Test Mode Architecture

1. **Production Mode:** Integration with Stripe Checkout and Stripe Customer Portal using signed webhooks (`customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`).
2. **Offline Test Mode:** When testing locally or staging without live Stripe keys, the application supports simulated subscription switches via `POST /api/v1/billing/test-mode-switch` to test quota upgrades and downgrades without payment gateway friction.
3. **Webhook Verification:** Cryptographic signature verification (`stripe.webhooks.constructEvent`) ensures frontend payment states cannot be spoofed.
