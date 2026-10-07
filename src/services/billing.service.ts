import { prisma } from "../lib/prisma";
import { SubscriptionStatus, BillingInterval } from "@prisma/client";

export class BillingService {
  /**
   * Retrieves all active commercial plans from database.
   */
  static async getPlans() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    });
  }

  /**
   * Retrieves current organization subscription and computed usage vs. limits.
   */
  static async getOrganizationSubscription(organizationId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });

    const [leadCount, mailboxCount, activeCampaignCount, todayUsage] = await Promise.all([
      prisma.lead.count({ where: { organizationId } }),
      prisma.mailbox.count({ where: { organizationId } }),
      prisma.campaign.count({ where: { organizationId, status: "RUNNING" } }),
      prisma.dailyUsageMetric.findFirst({
        where: { organizationId, date: new Date() },
      }),
    ]);

    const plan = subscription?.plan || {
      name: "FREE",
      maxContacts: 500,
      maxMailboxes: 1,
      maxDailyEmails: 50,
      maxCampaigns: 2,
      maxTeamMembers: 1,
      hasApiAccess: false,
      hasAiAssistant: false,
    };

    return {
      subscription: subscription || {
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        isTestMode: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      plan,
      usage: {
        contacts: { current: leadCount, max: plan.maxContacts },
        mailboxes: { current: mailboxCount, max: plan.maxMailboxes },
        activeCampaigns: { current: activeCampaignCount, max: plan.maxCampaigns },
        emailsSentToday: { current: todayUsage?.emailsSent || 0, max: plan.maxDailyEmails },
      },
    };
  }

  /**
   * Enforces backend plan quotas before resource creation.
   */
  static async verifyQuota(
    organizationId: string,
    resource: "contacts" | "mailboxes" | "campaigns" | "dailyEmails"
  ): Promise<{ allowed: boolean; reason?: string }> {
    const data = await this.getOrganizationSubscription(organizationId);

    switch (resource) {
      case "contacts":
        if (data.usage.contacts.current >= data.usage.contacts.max) {
          return { allowed: false, reason: `Contact limit reached (${data.usage.contacts.max}). Please upgrade your plan.` };
        }
        break;
      case "mailboxes":
        if (data.usage.mailboxes.current >= data.usage.mailboxes.max) {
          return { allowed: false, reason: `Mailbox limit reached (${data.usage.mailboxes.max}). Please upgrade your plan.` };
        }
        break;
      case "campaigns":
        if (data.usage.activeCampaigns.current >= data.usage.activeCampaigns.max) {
          return { allowed: false, reason: `Active campaign limit reached (${data.usage.activeCampaigns.max}). Please upgrade your plan.` };
        }
        break;
      case "dailyEmails":
        if (data.usage.emailsSentToday.current >= data.usage.emailsSentToday.max) {
          return { allowed: false, reason: `Daily sending limit reached (${data.usage.emailsSentToday.max}). Please upgrade your plan.` };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Switches plan tier instantly in Test Mode (local dev & testing).
   */
  static async switchPlanInTestMode(organizationId: string, targetPlanName: string) {
    const plan = await prisma.plan.findUnique({
      where: { name: targetPlanName },
    });
    if (!plan) throw new Error(`Plan '${targetPlanName}' not found`);

    return prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTHLY,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isTestMode: true,
      },
      update: {
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        isTestMode: true,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }
}
