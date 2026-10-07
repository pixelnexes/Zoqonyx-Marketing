# ZOQONYX EMAIL MARKETING - Scheduler & Queue Architecture

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-07-SCHEDULER`  

---

## 1. Queue Architecture & Background Jobs

Zoqonyx relies on **BullMQ** running atop a persistent **Redis 7+** instance. Email operations are fully decoupled from web client HTTP lifecycles. If a user closes their browser or shuts down their workstation, campaign execution continues uninhibited server-side.

### 1.1. Core BullMQ Queues

| Queue Name | Job Types | Concurrency | Retry Policy |
| :--- | :--- | :--- | :--- |
| `campaign-scheduler-queue` | `evaluate-campaign-steps`, `schedule-next-batch` | 2 | 3 retries, exponential backoff (10s) |
| `email-dispatch-queue` | `dispatch-single-email`, `send-test-email` | 10 | 3 retries, exponential backoff (30s) |
| `inbound-sync-queue` | `poll-imap-inboxes`, `process-inbound-email` | 5 | 2 retries, fixed backoff (15s) |
| `webhook-event-queue` | `process-provider-event`, `dispatch-outbound-webhook`| 10 | 5 retries, exponential backoff (5s) |
| `maintenance-queue` | `reset-daily-quotas`, `aggregate-metrics`, `clean-stale-tokens` | 1 | Cron-triggered (Midnight UTC) |

---

## 2. Rate Limiting & The "Lowest-Limit Wins" Algorithm

To protect email sender reputation and adhere to provider thresholds, the dispatch engine computes the effective daily limit before every send batch:

$$\text{Effective Daily Limit} = \min\left(
  \text{Plan.maxDailyEmails},
  \text{Mailbox.dailyLimit},
  \text{Campaign.dailyLimit},
  \text{Provider.maxReportedLimit}
\right)$$

### 2.1. Micro-Pacing & Anti-Spam Jitter
- The worker does not blast 1,000 emails in a single second.
- Dispatches across a given mailbox are spaced by a randomized interval:
  $$T_{\text{delay}} = \text{base\_delay} + \text{random}(15\text{s}, 75\text{s})$$
- This mimics human sending patterns and satisfies ISP reputation algorithms.

---

## 3. Strict Idempotency & Crash Resilience

Every email dispatch job generates a deterministic idempotency key:
$$\text{IdempotencyKey} = \text{SHA256}(\text{campaignId} + \text{":"} + \text{leadId} + \text{":"} + \text{sequenceStepNumber})$$

1. Before dispatching to the provider, a database record in `ScheduledEmail` is marked with status `DISPATCHING` within an atomic transaction.
2. If a worker process abruptly dies or restarts mid-flight, Redis lock expiration recovers the job, and the worker checks if a `SentEmail` record already exists for this idempotency key.
3. If already sent, the job acknowledges completion immediately and **never** sends duplicate emails.
