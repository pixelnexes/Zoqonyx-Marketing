import { createCampaignSchedulerWorker } from "./campaign-scheduler.worker";
import { createEmailDispatchWorker } from "./email-dispatch.worker";
import { createInboundSyncWorker } from "./inbound-sync.worker";
import { campaignSchedulerQueue, inboundSyncQueue } from "../lib/redis";

console.log("=================================================");
console.log("ZOQONYX EMAIL MARKETING - BACKGROUND WORKER CLUSTER");
console.log("Developed by Nawix Tech Solution (https://newixtechsolutions.com/)");
console.log("=================================================");

const schedulerWorker = createCampaignSchedulerWorker();
const dispatchWorker = createEmailDispatchWorker();
const inboundWorker = createInboundSyncWorker();

// Schedule periodic cron triggers
async function setupCronTriggers() {
  try {
    // Tick scheduler every 30 seconds
    await campaignSchedulerQueue.add(
      "tick-scheduler",
      {},
      {
        repeat: { every: 30000 },
        jobId: "periodic-scheduler-tick",
      }
    );

    // Tick IMAP sync every 60 seconds
    await inboundSyncQueue.add(
      "tick-imap-sync",
      {},
      {
        repeat: { every: 60000 },
        jobId: "periodic-imap-sync-tick",
      }
    );

    console.log("[Worker] Recurring scheduler & IMAP sync triggers registered in Redis.");
  } catch (err) {
    console.error("[Worker] Warning: Could not register repeat triggers in Redis:", err);
  }
}

setupCronTriggers();

// Graceful shutdown handling
const shutdown = async () => {
  console.log("\n[Worker] Gracefully closing BullMQ workers...");
  await Promise.all([
    schedulerWorker.close(),
    dispatchWorker.close(),
    inboundWorker.close(),
  ]);
  console.log("[Worker] All workers closed cleanly. Exiting.");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
