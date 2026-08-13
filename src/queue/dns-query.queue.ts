import { Queue } from "bullmq";
import IORedis from "ioredis";

import { env } from "../config/env";
import { DnsRecordType } from "../dns/dns.types";

export interface DnsQueryLogJob {
  hostname: string;
  resolvedIps: string[];
  recordType: DnsRecordType;
  createdAt: string;
}

const connection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null
});

export const dnsQueryLogQueue = new Queue<DnsQueryLogJob>(
  env.dnsQueryLogQueue,
  {
    connection
  }
);
