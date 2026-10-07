# ZOQONYX EMAIL MARKETING - Legal Compliance & Outreach Standards Checklist

**Product Name:** Zoqonyx Email Marketing  
**Developer:** Nawix Tech Solution ([https://newixtechsolutions.com/](https://newixtechsolutions.com/))  
**Document Code:** `DOC-19-LEGAL`  

---

## 1. Global Outreach Compliance Frameworks

Zoqonyx Email Marketing is engineered to comply with global commercial outreach legislation, including the US **CAN-SPAM Act**, Canadian **CASL**, EU **GDPR**, and UK **Data Protection Act (2018)**.

### 1.1. Technical Compliance Implementations

1. **Mandatory One-Click Unsubscribe Mechanism:**
   - Every outbound email automatically includes an explicit opt-out link: `/unsubscribe/:token` or custom unsubscribe header (`List-Unsubscribe`).
   - Clicking unsubscribe immediately updates the lead status to `UNSUBSCRIBED` and writes the email to `SuppressionList` without requiring account login or survey completion.
2. **Physical Address / Sender Identification:**
   - Organization settings provide fields for physical postal address and registered business name, injectable via `{{sender_address}}` in footers.
3. **Accurate Header Information:**
   - From Name, From Email, and Reply-To headers reflect genuine sending identities and do not spoof or mislead recipients.
4. **Immediate Suppression & Deletion (GDPR "Right to be Forgotten"):**
   - Organization administrators can trigger permanent erasure of lead records upon request.
   - Suppressed addresses are hashed or flagged to guarantee no future campaigns target them.
5. **No False Inbox Guarantees:**
   - The platform clearly positions itself as a deliverability and cadence tool, avoiding misleading promises of "100% spam-filter bypass".
