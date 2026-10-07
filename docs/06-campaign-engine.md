# ZOQONYX EMAIL MARKETING - Campaign & Sequence Engine

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-06-CAMPAIGN`  

---

## 1. Sequence Execution Model

The Campaign Engine governs multi-touch outreach cadences, step timing, personalization compilation, condition evaluation, and immediate auto-interruption when a prospect replies.

### 1.1. Visual Sequence Structure Example
```
[CAMPAIGN LAUNCH]
       │
       ▼
[STEP 1: INITIAL EMAIL] ─── (Personalized template, Subject + Body)
       │
       ▼
[WAIT: 3 DAYS] ──────────── (Respects Sending Window: Mon–Fri 9am–5pm)
       │
       ├─ IF Lead Replied ───────► [STOP SEQUENCE & MOVE TO INBOX]
       ├─ IF Lead Bounced ───────► [STOP SEQUENCE & SUPPRESS]
       ├─ IF Lead Unsubscribed ──► [STOP SEQUENCE & SUPPRESS]
       │
       ▼
[STEP 2: FOLLOW-UP 1] ──── (Reply in same thread or fresh subject)
       │
       ▼
[WAIT: 4 DAYS]
       │
       ▼
[STEP 3: VALUE ADD] ────── (Case study or helpful resource)
       │
       ▼
[WAIT: 5 DAYS]
       │
       ▼
[STEP 4: FINAL BREAKUP] ── (Polite closing message)
       │
       ▼
[CAMPAIGN COMPLETED]
```

---

## 2. Dynamic Personalization & Safe Variable Rendering

The Template Engine supports flexible template tags with automatic fallback safety.

### 2.1. Supported Variables
- `{{first_name}}` - Lead's first name
- `{{last_name}}` - Lead's last name
- `{{company_name}}` / `{{company}}` - Company name
- `{{job_title}}` - Job title
- `{{website}}` - Company website
- `{{city}}` / `{{state}}` / `{{country}}` - Lead location
- `{{custom.<field_name>}}` - Dynamic custom properties from CSV/API
- `{{unsubscribe_url}}` - One-click CAN-SPAM / GDPR compliant unsubscribe link

### 2.2. Fallback Filter Rule
Variables can define default fallbacks:
```handlebars
Hi {{first_name | fallback:"there"}},

I noticed {{company_name | fallback:"your company"}} has been expanding...
```
**Safety Invariant:** If a tag has no value and no explicit fallback, it gracefully renders as an empty string or standard neutral term. The engine **never** outputs `Hi undefined`, `Hi null`, or raw unrendered mustache tags `Hi {{first_name}}`.

---

## 3. Campaign Pre-Flight Validation Checklist

Before a campaign status transitions from `DRAFT` or `READY` to `RUNNING`, the engine executes an automated 9-point validation check:
1. **Mailbox Connection:** Sending mailbox must be in `ACTIVE` state with valid credentials.
2. **Domain Authentication:** Deliverability Advisor checks SPF and DKIM status.
3. **Audience Count:** Campaign has at least 1 valid enrolled lead.
4. **Suppression Filtering:** All enrolled leads are cross-checked against the organization's `SuppressionList` table.
5. **Template Syntax:** All sequence steps are compiled and validated for syntax errors.
6. **Sending Schedule:** Daily limit > 0, sending window hours and days are defined.
7. **Unsubscribe Mechanism:** Mandatory unsubscribe footer is injected or present.
8. **Plan Quota Verification:** Organization has sufficient daily send quota remaining under active plan.
9. **Dry Run / Test Send Option:** User has capability to verify a live test message in their own inbox.
