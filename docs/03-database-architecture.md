# ZOQONYX EMAIL MARKETING - Database Architecture & Schema Specification

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-03-DB`  
**Engine:** PostgreSQL 15+ / 16  
**ORM:** Prisma ORM with strict TypeScript model generation  

---

## 1. Relational Schema Design Principles

1. **Multi-Tenant Ownership:** Every tenant-bound table contains a non-nullable `organizationId` foreign key with indexed cascading deletion or restricted safeguards.
2. **Deterministic Idempotency:** Critical event tables (`ScheduledEmail`, `SentEmail`, `InboundEmail`, `WebhookEvent`) enforce unique compound indices to prevent duplicate execution.
3. **Auditability & Timestamps:** All core models feature `createdAt` and `updatedAt` with microsecond precision, plus actor tracking where relevant.
4. **Credential Security:** Sensitive credentials are stored in dedicated tables (`ProviderCredential`, `MailboxCredential`) with column-level encryption markers.

---

## 2. Complete Entity-Relationship (ER) Model Overview

```
[User] ──< [OrganizationMember] >── [Organization] ──< [Subscription] >── [Plan]
                                          │
    ┌────────────────┬────────────────────┼───────────────────┬────────────────┐
    │                │                    │                   │                │
[Mailbox]       [Lead]              [Campaign]         [EmailTemplate]   [Suppression]
    │                │                    │                   │
    │                ├─< [LeadTag]        ├─< [Sequence]      └─< [TemplateCategory]
    │                │                    │       │
    │                ├─< [LeadCustomField]│   [SequenceStep]
    │                │                    │       │
    │                └────< [CampaignLead] >──────┘
    │                             │
    └───────────────┬─────────────┴───────────────┐
                    │                             │
            [ScheduledEmail]                 [SentEmail] ──< [InboundEmail / Reply]
                    │                             │
            [EmailActivityLog]            [Bounce / Unsubscribe]
```

---

## 3. Detailed Table & Model Specifications

### 3.1. Authentication, Users & Organizations

#### `User`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, default `gen_random_uuid()` | Primary identifier |
| `email` | String | Unique, Indexed, Lowercase | User email address |
| `passwordHash` | String | Not Null | Argon2 / bcrypt hashed password |
| `name` | String | Not Null | Display name |
| `isEmailVerified` | Boolean | Default `false` | Verification state |
| `isSuperAdmin` | Boolean | Default `false` | Platform-level administrator flag |
| `createdAt` | DateTime | Default `now()` | Timestamp |
| `updatedAt` | DateTime | Updated at `now()` | Timestamp |

#### `Organization`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Primary identifier |
| `name` | String | Not Null | Company or agency name |
| `slug` | String | Unique, Indexed | URL-safe slug |
| `logoUrl` | String | Nullable | Organization logo |
| `status` | Enum | `ACTIVE`, `SUSPENDED`, `TRIALING` | Account status |
| `timezone` | String | Default `'UTC'` | Default operational timezone |
| `createdAt` | DateTime | Default `now()` | Timestamp |
| `updatedAt` | DateTime | Updated at `now()` | Timestamp |

#### `OrganizationMember`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifier |
| `organizationId` | UUID | FK -> `Organization.id`, Indexed | Multi-tenant parent |
| `userId` | UUID | FK -> `User.id`, Indexed | Associated user |
| `role` | Enum | `OWNER`, `ADMIN`, `MANAGER`, `MEMBER` | Role-based permission tier |
| `createdAt` | DateTime | Default `now()` | Timestamp |
| Unique constraint: `(organizationId, userId)` |

---

### 3.2. Plans, Billing & Subscription

#### `Plan`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Plan identifier |
| `name` | String | Unique | e.g. `FREE`, `STARTER`, `PRO`, `BUSINESS`, `ENTERPRISE` |
| `description` | String | Not Null | Plan description |
| `priceMonthly` | Decimal | Default `0.00` | Price per month (USD) |
| `priceYearly` | Decimal | Default `0.00` | Price per year (USD) |
| `maxContacts` | Integer | Default `500` | Total contact allowance |
| `maxMailboxes` | Integer | Default `1` | Mailbox connection limit |
| `maxDailyEmails` | Integer | Default `50` | Daily send quota |
| `maxCampaigns` | Integer | Default `2` | Active campaign limit |
| `maxTeamMembers` | Integer | Default `1` | User seats allowed |
| `hasApiAccess` | Boolean | Default `false` | Enables public API & Webhooks |
| `hasAiAssistant` | Boolean | Default `false` | Enables AI template suggestions |
| `isActive` | Boolean | Default `true` | Availability for new subscriptions |

#### `Subscription`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifier |
| `organizationId` | UUID | Unique, FK -> `Organization.id` | One active sub per tenant |
| `planId` | UUID | FK -> `Plan.id` | Active plan reference |
| `status` | Enum | `ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`, `UNPAID` | Billing status |
| `billingInterval` | Enum | `MONTHLY`, `YEARLY` | Cycle |
| `currentPeriodStart` | DateTime | Not Null | Billing cycle start |
| `currentPeriodEnd` | DateTime | Not Null | Billing cycle renewal date |
| `stripeCustomerId` | String | Nullable, Indexed | Stripe customer token |
| `stripeSubscriptionId` | String | Nullable, Unique | Stripe subscription token |
| `isTestMode` | Boolean | Default `false` | Indicates simulated offline billing |

#### `DailyUsageMetric`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifier |
| `organizationId` | UUID | FK -> `Organization.id`, Indexed | Tenant identifier |
| `date` | Date | Indexed | Metric date (YYYY-MM-DD) |
| `emailsSent` | Integer | Default `0` | Daily total sends |
| `emailsFailed` | Integer | Default `0` | Daily failed sends |
| `repliesReceived` | Integer | Default `0` | Total replies detected |
| `bouncesDetected` | Integer | Default `0` | Hard/soft bounces |
| `unsubscribes` | Integer | Default `0` | Opt-outs recorded |
| Unique constraint: `(organizationId, date)` |

---

### 3.3. Mailboxes & Provider Credentials

#### `Mailbox`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Mailbox ID |
| `organizationId` | UUID | FK -> `Organization.id`, Indexed | Tenant ownership |
| `email` | String | Not Null, Indexed | Connected email address |
| `fromName` | String | Not Null | Sender display name |
| `replyToEmail` | String | Nullable | Custom reply-to destination |
| `providerType` | Enum | `SMTP_IMAP`, `MAILGUN`, `AMAZON_SES`, `SENDGRID`, `POSTMARK`, `GOOGLE_WORKSPACE`, `MICROSOFT_365` | Provider adapter |
| `status` | Enum | `ACTIVE`, `PAUSED`, `ERROR`, `DISCONNECTED` | Operational status |
| `dailyLimit` | Integer | Default `100` | Mailbox daily safety limit |
| `sentToday` | Integer | Default `0` | Counter reset at midnight |
| `lastSyncAt` | DateTime | Nullable | IMAP sync timestamp |
| `lastError` | String | Nullable | Diagnostic connection message |
| `spfValid` | Boolean | Default `false` | DNS SPF verification |
| `dkimValid` | Boolean | Default `false` | DNS DKIM verification |
| `dmarcValid` | Boolean | Default `false` | DNS DMARC verification |

#### `ProviderCredential`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifier |
| `mailboxId` | UUID | Unique, FK -> `Mailbox.id` | 1-to-1 secure relationship |
| `encryptedPayload` | Text | Not Null | AES-256-GCM ciphertext |
| `iv` | String | Not Null | Initialization vector |
| `authTag` | String | Not Null | Cryptographic authentication tag |
| `keyVersion` | Integer | Default `1` | Encryption key rotation version |

---

### 3.4. Leads, Tags & Suppression

#### `Lead`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Lead ID |
| `organizationId` | UUID | FK -> `Organization.id`, Indexed | Tenant ownership |
| `email` | String | Not Null, Indexed | Contact email address |
| `firstName` | String | Nullable | Given name |
| `lastName` | String | Nullable | Family name |
| `company` | String | Nullable | Company or organization |
| `jobTitle` | String | Nullable | Professional designation |
| `phone` | String | Nullable | Phone number |
| `website` | String | Nullable | Company URL |
| `industry` | String | Nullable | Business classification |
| `city` | String | Nullable | Location city |
| `state` | String | Nullable | Location state/province |
| `country` | String | Nullable | Location country |
| `status` | Enum | `NEW`, `QUEUED`, `CONTACTED`, `ACTIVE`, `REPLIED`, `INTERESTED`, `NOT_INTERESTED`, `BOUNCED`, `UNSUBSCRIBED`, `PAUSED`, `COMPLETED` | Current lifecycle state |
| `customFields` | JSONB | Default `'{}'` | Key-value extra properties |
| `source` | String | Default `'CSV_IMPORT'` | e.g. `API_IMPORT`, `MANUAL`, `LEAD_GEN` |
| `unsubscribeToken` | String | Unique, Indexed | Cryptographic one-click opt-out token |
| Unique constraint: `(organizationId, email)` |

#### `SuppressionList`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Identifier |
| `organizationId` | UUID | FK -> `Organization.id`, Indexed | Tenant ownership |
| `email` | String | Not Null, Indexed | Suppressed email address |
| `reason` | Enum | `UNSUBSCRIBED`, `HARD_BOUNCE`, `COMPLAINT`, `MANUAL_SUPPRESSION` | Reason for suppression |
| `createdAt` | DateTime | Default `now()` | Date suppressed |
| Unique constraint: `(organizationId, email)` |

---

### 3.5. Campaigns, Sequences & Execution

#### `Campaign`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Campaign ID |
| `organizationId` | UUID | FK -> `Organization.id`, Indexed | Tenant ownership |
| `name` | String | Not Null | Campaign title |
| `description` | String | Nullable | Purpose description |
| `status` | Enum | `DRAFT`, `READY`, `RUNNING`, `PAUSED`, `COMPLETED`, `ARCHIVED` | Campaign state |
| `mailboxId` | UUID | FK -> `Mailbox.id`, Indexed | Sending mailbox |
| `dailyLimit` | Integer | Default `50` | Campaign daily limit ceiling |
| `timezone` | String | Default `'UTC'` | Sending window timezone |
| `sendingDays` | Integer[] | Default `[1,2,3,4,5]` | 1=Mon, 7=Sun |
| `startHour` | Integer | Default `9` | 0–23 (e.g. 9 AM) |
| `endHour` | Integer | Default `17` | 0–23 (e.g. 5 PM) |
| `isTestMode` | Boolean | Default `false` | Dry-run execution mode |
| `autoEnrollRules` | JSONB | Nullable | Rules for automated lead ingestion |

#### `SequenceStep`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Step ID |
| `campaignId` | UUID | FK -> `Campaign.id`, Indexed | Parent campaign |
| `stepNumber` | Integer | Not Null | 1-based execution index |
| `stepType` | Enum | `EMAIL`, `WAIT_DAYS`, `CONDITION` | Action type |
| `waitDays` | Integer | Default `0` | Delay after previous step |
| `subject` | String | Nullable | Email subject line with template vars |
| `bodyHtml` | Text | Nullable | Email HTML content |
| `bodyText` | Text | Nullable | Email Plain text fallback |
| Unique constraint: `(campaignId, stepNumber)` |

#### `CampaignLead`
| Field | Type | Modifiers | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Association ID |
| `campaignId` | UUID | FK -> `Campaign.id`, Indexed | Campaign |
| `leadId` | UUID | FK -> `Lead.id`, Indexed | Lead |
| `currentStepNumber`| Integer | Default `1` | Sequence progression |
| `status` | Enum | `ENROLLED`, `IN_PROGRESS`, `PAUSED`, `REPLIED`, `BOUNCED`, `UNSUBSCRIBED`, `COMPLETED` | Execution state |
| `nextExecutionAt` | DateTime | Nullable, Indexed | Next scheduled step run time |
| Unique constraint: `(campaignId, leadId)` |

#### `ScheduledEmail` & `SentEmail`
- `ScheduledEmail`: Staged dispatch records carrying `idempotencyKey` (`cmp_lead_step_hash`), target mailbox, resolved subject/body, and scheduled timestamp.
- `SentEmail`: Immutable historical ledger containing provider `messageId`, timestamp, mailbox, headers, lead ID, campaign ID, and delivery status.
- `InboundEmail` / `Conversation`: Aggregated threads storing incoming customer replies, raw RFC822 headers, clean extracted plaintext, and sentiment categorization.
