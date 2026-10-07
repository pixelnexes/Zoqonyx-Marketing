# ZOQONYX EMAIL MARKETING - Troubleshooting Guide

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-16-TROUBLE`  

---

## 1. Common Diagnostics & Solutions

### 1.1. Mailbox Fails Connection Test
- **Symptom:** `Invalid login` or `Connection timeout`.
- **Resolution:**
  - Verify SMTP/IMAP port and security settings (Port 587 uses STARTTLS, Port 465 uses SSL/TLS).
  - For Google Workspace / Gmail: Must generate an **App Password**; standard account passwords will fail due to 2FA.
  - For Microsoft 365: Ensure SMTP AUTH is enabled in the Exchange Admin Center.

### 1.2. Sequence Stopped Prematurely
- **Symptom:** Campaign has pending leads, but next step is not enqueued.
- **Resolution:**
  - Check if lead received a reply (which intentionally stops follow-up cadences).
  - Verify lead status is not `UNSUBSCRIBED` or `BOUNCED`.
  - Check if organization daily send quota or mailbox daily limit has been exhausted.
  - Verify current time falls within configured sending hours (e.g. 9:00 AM - 5:00 PM).

### 1.3. Redis Queue Connection Failure
- **Symptom:** Worker logs `ECONNREFUSED 127.0.0.1:6379`.
- **Resolution:**
  - Ensure Redis service is running locally or via Docker (`docker compose up -d redis`).
  - Verify `REDIS_HOST` and `REDIS_PORT` in `.env`.
