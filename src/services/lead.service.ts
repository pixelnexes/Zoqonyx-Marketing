import { prisma } from "../lib/prisma";
import { CleanedLeadRow } from "../lib/spreadsheet-parser";
import { LeadStatus, SuppressionReason } from "@prisma/client";

export class LeadService {
  /**
   * High-speed bulk ingestion of leads with automatic deduplication and suppression filtering.
   */
  static async importLeads(
    organizationId: string,
    leads: CleanedLeadRow[],
    source = "CSV_IMPORT",
    targetCampaignId?: string,
    autoEnroll = false
  ) {
    if (!leads.length) {
      return {
        importedCount: 0,
        duplicatesCount: 0,
        suppressedCount: 0,
        enrolledCount: 0,
        leadIds: [],
      };
    }

    // 1. Fetch existing leads for this organization to deduplicate
    const existingLeads = await prisma.lead.findMany({
      where: {
        organizationId,
        email: { in: leads.map((l) => l.email.toLowerCase().trim()) },
      },
      select: { email: true },
    });
    const existingEmailSet = new Set(existingLeads.map((l) => l.email.toLowerCase().trim()));

    // 2. Fetch suppressed emails
    const suppressedLeads = await prisma.suppressionList.findMany({
      where: {
        organizationId,
        email: { in: leads.map((l) => l.email.toLowerCase().trim()) },
      },
      select: { email: true },
    });
    const suppressedEmailSet = new Set(suppressedLeads.map((s) => s.email.toLowerCase().trim()));

    // 3. Filter eligible leads
    const leadsToInsert: any[] = [];
    let duplicatesCount = 0;
    let suppressedCount = 0;
    const seenInBatch = new Set<string>();

    for (const lead of leads) {
      const email = lead.email.toLowerCase().trim();
      if (seenInBatch.has(email) || existingEmailSet.has(email)) {
        duplicatesCount++;
        continue;
      }
      if (suppressedEmailSet.has(email)) {
        suppressedCount++;
        continue;
      }

      seenInBatch.add(email);
      leadsToInsert.push({
        organizationId,
        email,
        firstName: lead.firstName || null,
        lastName: lead.lastName || null,
        company: lead.company || null,
        jobTitle: lead.jobTitle || null,
        phone: lead.phone || null,
        website: lead.website || null,
        city: lead.city || null,
        state: lead.state || null,
        country: lead.country || null,
        industry: lead.industry || null,
        customFields: lead.customFields || {},
        source,
        status: LeadStatus.NEW,
      });
    }

    if (leadsToInsert.length === 0) {
      return {
        importedCount: 0,
        duplicatesCount,
        suppressedCount,
        enrolledCount: 0,
        leadIds: [],
      };
    }

    // 4. Batch insert
    await prisma.lead.createMany({
      data: leadsToInsert,
      skipDuplicates: true,
    });

    // Retrieve inserted records to get IDs
    const createdLeads = await prisma.lead.findMany({
      where: {
        organizationId,
        email: { in: leadsToInsert.map((l) => l.email) },
      },
      select: { id: true, email: true, industry: true, country: true },
    });

    let enrolledCount = 0;

    // 5. Auto-Enrollment into target campaign if requested
    if (targetCampaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: targetCampaignId, organizationId },
      });

      if (campaign) {
        const enrollments = createdLeads.map((lead) => ({
          campaignId: campaign.id,
          leadId: lead.id,
          currentStepNumber: 1,
        }));

        await prisma.campaignLead.createMany({
          data: enrollments,
          skipDuplicates: true,
        });
        enrolledCount = enrollments.length;
      }
    } else if (autoEnroll) {
      // Check active campaigns with autoEnrollRules matching leads
      const activeCampaigns = await prisma.campaign.findMany({
        where: { organizationId, status: { in: ["RUNNING", "READY"] } },
      });

      for (const campaign of activeCampaigns) {
        if (!campaign.autoEnrollRules) continue;
        const rules = campaign.autoEnrollRules as Record<string, any>;

        const matchingLeads = createdLeads.filter((lead) => {
          if (rules.industry && lead.industry && !lead.industry.toLowerCase().includes(String(rules.industry).toLowerCase())) {
            return false;
          }
          if (rules.country && lead.country && !lead.country.toLowerCase().includes(String(rules.country).toLowerCase())) {
            return false;
          }
          return true;
        });

        if (matchingLeads.length > 0) {
          await prisma.campaignLead.createMany({
            data: matchingLeads.map((l) => ({
              campaignId: campaign.id,
              leadId: l.id,
              currentStepNumber: 1,
            })),
            skipDuplicates: true,
          });
          enrolledCount += matchingLeads.length;
        }
      }
    }

    return {
      importedCount: createdLeads.length,
      duplicatesCount,
      suppressedCount,
      enrolledCount,
      leadIds: createdLeads.map((l) => l.id),
    };
  }

  /**
   * Search, filter, and paginate leads for organization.
   */
  static async getLeads(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: LeadStatus;
      tagId?: string;
    }
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (options.status) {
      where.status = options.status;
    }

    if (options.search) {
      const s = options.search.trim();
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { company: { contains: s, mode: "insensitive" } },
        { jobTitle: { contains: s, mode: "insensitive" } },
      ];
    }

    if (options.tagId) {
      where.tags = { some: { tagId: options.tagId } };
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tags: {
            include: { tag: true },
          },
          campaignLeads: {
            include: { campaign: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Suppresses an email across the entire organization.
   */
  static async suppressEmail(
    organizationId: string,
    email: string,
    reason: SuppressionReason = SuppressionReason.MANUAL_SUPPRESSION
  ) {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Create suppression record
    await prisma.suppressionList.upsert({
      where: {
        organizationId_email: { organizationId, email: cleanEmail },
      },
      create: {
        organizationId,
        email: cleanEmail,
        reason,
      },
      update: { reason },
    });

    // 2. Mark any existing lead record as UNSUBSCRIBED or BOUNCED
    await prisma.lead.updateMany({
      where: { organizationId, email: cleanEmail },
      data: {
        status: reason === SuppressionReason.HARD_BOUNCE ? LeadStatus.BOUNCED : LeadStatus.UNSUBSCRIBED,
      },
    });

    // 3. Cancel any pending scheduled emails for this lead
    const lead = await prisma.lead.findFirst({
      where: { organizationId, email: cleanEmail },
    });

    if (lead) {
      await prisma.scheduledEmail.updateMany({
        where: { leadId: lead.id, status: "PENDING" },
        data: { status: "CANCELLED", errorMessage: `Cancelled due to suppression (${reason})` },
      });
      await prisma.campaignLead.updateMany({
        where: { leadId: lead.id },
        data: { status: reason === SuppressionReason.HARD_BOUNCE ? "BOUNCED" : "UNSUBSCRIBED" },
      });
    }
  }
}
