import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "../config/env";
import { dnsQueryLogs, dnsRecords } from "./schema";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const directory = dirname(env.databaseUrl);
if (directory && directory !== ".") {
  mkdirSync(directory, { recursive: true });
}

export const sqlite = new Database(env.databaseUrl);
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS dns_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(hostname, type, value)
  );

  CREATE TABLE IF NOT EXISTS dns_query_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT NOT NULL,
    resolved_ips TEXT NOT NULL,
    record_type TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
`);

export const db = drizzle(sqlite, {
  schema: { dnsRecords, dnsQueryLogs }
});
