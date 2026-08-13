import "dotenv/config";

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

export const env = {
  port: numberEnv("PORT", 3000),
  databaseUrl: process.env.DATABASE_URL ?? "./data/dns.sqlite",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  dnsQueryLogQueue: process.env.DNS_QUERY_LOG_QUEUE ?? "dns-query-logs",
  cnameMaxDepth: numberEnv("CNAME_MAX_DEPTH", 32)
};
