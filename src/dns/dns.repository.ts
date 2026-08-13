import { eq, and } from "drizzle-orm";

import { db } from "../database/client";
import { dnsQueryLogs, dnsRecords } from "../database/schema";
import { DnsRecord, DnsRecordType } from "./dns.types";

function mapRecord(row: typeof dnsRecords.$inferSelect): DnsRecord {
  return {
    id: row.id,
    hostname: row.hostname,
    type: row.type as DnsRecordType,
    value: row.value,
    createdAt: new Date(row.createdAt)
  };
}

export class DnsRepository {
  async findByHostname(hostname: string): Promise<DnsRecord[]> {
    const rows = await db
      .select()
      .from(dnsRecords)
      .where(eq(dnsRecords.hostname, hostname));

    return rows.map(mapRecord);
  }

  async findExact(
    hostname: string,
    type: DnsRecordType,
    value: string
  ): Promise<DnsRecord | undefined> {
    const rows = await db
      .select()
      .from(dnsRecords)
      .where(
        and(
          eq(dnsRecords.hostname, hostname),
          eq(dnsRecords.type, type),
          eq(dnsRecords.value, value)
        )
      )
      .limit(1);

    return rows[0] ? mapRecord(rows[0]) : undefined;
  }

  async create(
    hostname: string,
    type: DnsRecordType,
    value: string
  ): Promise<DnsRecord> {
    const createdAt = new Date();

    const result = await db
      .insert(dnsRecords)
      .values({
        hostname,
        type,
        value,
        createdAt
      })
      .returning();

    return mapRecord(result[0]);
  }

  async deleteExact(
    hostname: string,
    type: DnsRecordType,
    value: string
  ): Promise<boolean> {
    const result = await db
      .delete(dnsRecords)
      .where(
        and(
          eq(dnsRecords.hostname, hostname),
          eq(dnsRecords.type, type),
          eq(dnsRecords.value, value)
        )
      );

    return result.changes > 0;
  }

  async createQueryLog(
    hostname: string,
    resolvedIps: string[],
    recordType: DnsRecordType
  ): Promise<void> {
    await db.insert(dnsQueryLogs).values({
      hostname,
      resolvedIps: JSON.stringify(resolvedIps),
      recordType,
      createdAt: new Date()
    });
  }
}
