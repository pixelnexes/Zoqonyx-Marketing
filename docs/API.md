# ZOQONYX EMAIL MARKETING - Public Developer API & Integration Guide

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Base Endpoint:** `https://your-domain.com/api/v1`  
**Authentication:** API Key (`Authorization: Bearer zoq_live_...`)  

---

## 1. Connecting External Lead Generators to Zoqonyx

If you operate custom scrapers, Apollo, ZoomInfo, Clay, LinkedIn automation, or proprietary lead generators, you can stream prospects directly into Zoqonyx via our high-speed JSON Ingestion API.

### 1.1. Single or Bulk Lead Import (`POST /api/v1/leads/import`)

#### Request Headers
```http
POST /api/v1/leads/import HTTP/1.1
Host: your-domain.com
Authorization: Bearer zoq_live_9f83a2bc7190e4...
Content-Type: application/json
```

#### Request Payload (Single Lead or Array)
```json
{
  "leads": [
    {
      "email": "dr.smith@dallasdentalclinic.com",
      "firstName": "Robert",
      "lastName": "Smith",
      "company": "Dallas Dental Clinic",
      "jobTitle": "Lead Dentist & Owner",
      "phone": "+1-214-555-0199",
      "website": "https://dallasdentalclinic.com",
      "industry": "Healthcare / Dental",
      "city": "Dallas",
      "state": "TX",
      "country": "United States",
      "customFields": {
        "monthlyPatients": 450,
        "currentEHR": "Dentrix"
      },
      "tags": ["Dental", "Texas", "Apollo-Lead"]
    }
  ],
  "campaignId": "cmp_optional_target_campaign_id",
  "autoEnroll": true
}
```

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "importedCount": 1,
  "duplicatesCount": 0,
  "suppressedCount": 0,
  "enrolledCampaignCount": 1,
  "leadIds": ["lead_87fc2019-38b4-4b5c-a841-897c5512019a"]
}
```

---

## 2. API Key Generation & Management

1. In the Zoqonyx Dashboard, navigate to **Settings** → **API & Integrations**.
2. Click **Create New API Key**, provide a label (e.g. `Dental Scraper Bot`).
3. Copy the key (`zoq_live_...`). It is shown only once and hashed using SHA-256 for secure backend verification.
4. If a key is compromised, click **Revoke** to instantly terminate its access.

---

## 3. Webhooks: Real-Time Event Streaming

Configure an endpoint in Zoqonyx to receive outbound JSON webhooks when events occur:

| Event Name | Description |
| :--- | :--- |
| `lead.created` | Emitted when a new lead is ingested |
| `campaign.started` | Emitted when a campaign enters `RUNNING` status |
| `email.sent` | Emitted when an email is successfully dispatched |
| `email.replied` | Emitted when a prospect replies to an outreach cadence |
| `email.bounced` | Emitted upon hard or soft bounce event |
| `lead.unsubscribed` | Emitted when a lead opts out |

#### Sample Webhook Payload (`email.replied`)
```json
{
  "event": "email.replied",
  "timestamp": "2026-10-07T03:00:00.000Z",
  "organizationId": "org_91204891-231a-45c1-90ef-8172901c",
  "data": {
    "leadId": "lead_87fc2019-38b4-4b5c-a841-897c5512019a",
    "leadEmail": "dr.smith@dallasdentalclinic.com",
    "campaignId": "cmp_65b38102-12aa-45cd-a991-8921bfa981",
    "subject": "Re: Modernizing patient intake for Dallas Dental Clinic",
    "replySnippet": "Hi, thanks for reaching out. We are indeed looking to upgrade our EHR automation next month. Can you send a demo video?",
    "sequenceStopped": true
  }
}
```
