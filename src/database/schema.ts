import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const dnsRecords = sqliteTable(
  "dns_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    hostname: text("hostname").notNull(),
    type: text("type").notNull(),
    value: text("value").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    hostnameTypeValueUnique: uniqueIndex("dns_hostname_type_value_unique")
      .on(table.hostname, table.type, table.value)
  })
);

export const dnsQueryLogs = sqliteTable("dns_query_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hostname: text("hostname").notNull(),
  resolvedIps: text("resolved_ips").notNull(),
  recordType: text("record_type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});
