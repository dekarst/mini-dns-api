export type DnsRecordType = "A" | "CNAME";

export interface CreateDnsRecordInput {
  type: DnsRecordType;
  hostname: string;
  value: string;
}

export interface DnsRecord {
  id: number;
  hostname: string;
  type: DnsRecordType;
  value: string;
  createdAt: Date;
}

export interface ResolutionResult {
  hostname: string;
  resolvedIps: string[];
  recordType: DnsRecordType;
  pointsTo?: string;
}
