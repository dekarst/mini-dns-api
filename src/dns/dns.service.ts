import {
  CircularCnameError,
  CnameChainTooLongError,
  DnsRecordConflictError,
  DnsRecordNotFoundError,
  DuplicateRecordError,
  HostnameNotFoundError
} from "./dns.errors";
import { DnsRepository } from "./dns.repository";
import { CreateDnsRecordInput, DnsRecord, ResolutionResult } from "./dns.types";
import { normalizeHostname, validateIpv4 } from "../utils/hostname";
import { dnsQueryLogQueue } from "../queue/dns-query.queue";
import { env } from "../config/env";

export class DnsService {
  constructor(private readonly repository: DnsRepository) {}

  async createRecord(input: CreateDnsRecordInput): Promise<DnsRecord> {
    const hostname = normalizeHostname(input.hostname);
    const value =
      input.type === "A"
        ? validateIpv4(input.value)
        : normalizeHostname(input.value);

    const existing = await this.repository.findByHostname(hostname);

    if (existing.some((record) => record.type === input.type && record.value === value)) {
      throw new DuplicateRecordError(hostname, input.type, value);
    }

    if (input.type === "CNAME") {
      if (existing.length > 0) {
        throw new DnsRecordConflictError(
          "A hostname with a CNAME cannot have other records",
          { hostname }
        );
      }

      await this.assertNoCnameCycle(hostname, value);
    } else {
      if (existing.some((record) => record.type === "CNAME")) {
        throw new DnsRecordConflictError(
          "Cannot create an A record because hostname already has a CNAME",
          { hostname }
        );
      }
    }

    return this.repository.create(hostname, input.type, value);
  }

  async listRecords(hostnameInput: string): Promise<{
    hostname: string;
    records: Array<{ type: string; value: string }>;
  }> {
    const hostname = normalizeHostname(hostnameInput);
    const records = await this.repository.findByHostname(hostname);

    return {
      hostname,
      records: records.map(({ type, value }) => ({ type, value }))
    };
  }

  async deleteRecord(
    hostnameInput: string,
    type: "A" | "CNAME",
    valueInput: string
  ): Promise<void> {
    const hostname = normalizeHostname(hostnameInput);
    const value = type === "A" ? validateIpv4(valueInput) : normalizeHostname(valueInput);

    const deleted = await this.repository.deleteExact(hostname, type, value);

    if (!deleted) {
      throw new DnsRecordNotFoundError(hostname, type, value);
    }
  }

  async resolveHostname(hostnameInput: string): Promise<ResolutionResult> {
    const hostname = normalizeHostname(hostnameInput);
    const result = await this.resolve(hostname, new Set<string>(), 0);

    void dnsQueryLogQueue
      .add("dns-query", {
        hostname,
        resolvedIps: result.resolvedIps,
        recordType: result.recordType,
        createdAt: new Date().toISOString()
      })
      .catch((error) => {
        console.error("Failed to enqueue DNS query log", error);
      });

    return result;
  }

  private async resolve(
    hostname: string,
    visited: Set<string>,
    depth: number
  ): Promise<ResolutionResult> {
    if (depth > env.cnameMaxDepth) {
      throw new CnameChainTooLongError(env.cnameMaxDepth);
    }

    if (visited.has(hostname)) {
      throw new CircularCnameError(hostname);
    }

    visited.add(hostname);

    const records = await this.repository.findByHostname(hostname);

    if (records.length === 0) {
      throw new HostnameNotFoundError(hostname);
    }

    const aRecords = records.filter((record) => record.type === "A");
    if (aRecords.length > 0) {
      return {
        hostname,
        resolvedIps: aRecords.map((record) => record.value),
        recordType: "A"
      };
    }

    const cname = records.find((record) => record.type === "CNAME");
    if (!cname) {
      throw new HostnameNotFoundError(hostname);
    }

    const target = await this.resolve(cname.value, visited, depth + 1);

    return {
      hostname,
      resolvedIps: target.resolvedIps,
      recordType: "CNAME",
      pointsTo: cname.value
    };
  }

  private async assertNoCnameCycle(hostname: string, target: string): Promise<void> {
    const visited = new Set<string>([hostname]);
    let current = target;

    for (let depth = 0; depth <= env.cnameMaxDepth; depth++) {
      if (visited.has(current)) {
        throw new CircularCnameError(current);
      }

      visited.add(current);

      const records = await this.repository.findByHostname(current);
      const cname = records.find((record) => record.type === "CNAME");

      if (!cname) {
        return;
      }

      current = cname.value;
    }

    throw new CnameChainTooLongError(env.cnameMaxDepth);
  }
}
