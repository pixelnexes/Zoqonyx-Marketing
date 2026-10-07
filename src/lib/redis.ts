import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const redisConnection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

export const QUEUE_NAMES = {
  CAMPAIGN_SCHEDULER: "zoqonyx-campaign-scheduler",
  EMAIL_DISPATCH: "zoqonyx-email-dispatch",
  INBOUND_SYNC: "zoqonyx-inbound-sync",
  WEBHOOK_DISPATCH: "zoqonyx-webhook-dispatch",
  MAINTENANCE: "zoqonyx-maintenance",
} as const;

export const campaignSchedulerQueue = new Queue(QUEUE_NAMES.CAMPAIGN_SCHEDULER, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export const emailDispatchQueue = new Queue(QUEUE_NAMES.EMAIL_DISPATCH, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 15000,
    },
    removeOnComplete: 2000,
    removeOnFail: 5000,
  },
});

export const inboundSyncQueue = new Queue(QUEUE_NAMES.INBOUND_SYNC, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 10000,
    },
    removeOnComplete: 500,
  },
});
