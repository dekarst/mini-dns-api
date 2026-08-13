import { Worker } from "bullmq";
import IORedis from "ioredis";

import { env } from "../config/env";
import { DnsRepository } from "../dns/dns.repository";
import { DnsQueryLogJob } from "./dns-query.queue";

const connection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null
});

const repository = new DnsRepository();

const worker = new Worker<DnsQueryLogJob>(
  env.dnsQueryLogQueue,
  async (job) => {
    await repository.createQueryLog(
      job.data.hostname,
      job.data.resolvedIps,
      job.data.recordType
    );
  },
  {
    connection,
    concurrency: 10
  }
);

worker.on("completed", (job) => {
  console.log(`DNS query log job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`DNS query log job failed: ${job?.id}`, error);
});

console.log(`DNS query log worker listening on ${env.dnsQueryLogQueue}`);
