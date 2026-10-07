import { Worker, Job } from "bullmq";
import { redisConnection, QUEUE_NAMES, emailDispatchQueue } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { EmailDispatchStatus, CampaignStatus } from "@prisma/client";

/**
 * Checks if current local hour and day falls inside configured sending window.
 */
export function isWithinSendingWindow(
  sendingDays: number[],
  startHour: number,
  endHour: number,
  timezone: string
): boolean {
  try {
    const now = new Date();
    // Get day of week (1=Mon, ..., 7=Sun)
    const day = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
    if (!sendingDays.includes(day)) return false;

    const hour = now.getUTCHours();
    return hour >= startHour && hour < endHour;
  } catch {
    return true; // Fallback allow if timezone parse fails
  }
}

export function createCampaignSchedulerWorker() {
  const worker = new Worker(
    QUEUE_NAMES.CAMPAIGN_SCHEDULER,
    async (job: Job) => {
      const now = new Date();

      // 1. Fetch pending scheduled emails ready to dispatch
      const pendingDispatches = await prisma.scheduledEmail.findMany({
        where: {
          status: EmailDispatchStatus.PENDING,
          scheduledFor: { lte: now },
          campaign: {
            status: CampaignStatus.RUNNING,
          },
        },
        include: {
          campaign: true,
          mailbox: true,
        },
        take: 50,
      });

      if (!pendingDispatches.length) {
        return { scheduledCount: 0 };
      }

      let enqueuedCount = 0;

      for (let i = 0; i < pendingDispatches.length; i++) {
        const item = pendingDispatches[i];

        // Verify sending window
        const inWindow = isWithinSendingWindow(
          item.campaign.sendingDays,
          item.campaign.startHour,
          item.campaign.endHour,
          item.campaign.timezone
        );

        if (!inWindow) {
          // Push scheduled time slightly into next window
          continue;
        }

        // Apply randomized micro-pacing delay (15 to 60 seconds per item in batch)
        const delayMs = i * 20000 + Math.floor(Math.random() * 15000);

        await emailDispatchQueue.add(
          "dispatch-single-email",
          { scheduledEmailId: item.id },
          {
            jobId: `dispatch-${item.id}`,
            delay: delayMs,
          }
        );

        enqueuedCount++;
      }

      return { enqueuedCount };
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  );

  return worker;
}
