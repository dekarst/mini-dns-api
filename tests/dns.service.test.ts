import { beforeEach, describe, expect, it } from "vitest";

import { sqlite } from "../src/database/client";
import { DnsRepository } from "../src/dns/dns.repository";
import { DnsService } from "../src/dns/dns.service";
import {
  CircularCnameError,
  DnsRecordConflictError,
  DuplicateRecordError,
  HostnameNotFoundError,
  InvalidHostnameError,
  InvalidIpv4Error
} from "../src/dns/dns.errors";

function resetDatabase() {
  sqlite.exec("DELETE FROM dns_records");
  sqlite.exec("DELETE FROM dns_query_logs");
}

describe("DnsService", () => {
  const repository = new DnsRepository();
  const service = new DnsService(repository);

  beforeEach(() => {
    resetDatabase();
  });

  it("creates multiple A records", async () => {
    await service.createRecord({
      type: "A",
      hostname: "example.com",
      value: "192.168.1.1"
    });

    await service.createRecord({
      type: "A",
      hostname: "example.com",
      value: "192.168.1.2"
    });

    const result = await service.resolveHostname("example.com");

    expect(result.resolvedIps).toEqual(["192.168.1.1", "192.168.1.2"]);
    expect(result.recordType).toBe("A");
  });

  it("rejects duplicate records", async () => {
    const input = {
      type: "A" as const,
      hostname: "example.com",
      value: "192.168.1.1"
    };

    await service.createRecord(input);

    await expect(service.createRecord(input)).rejects.toBeInstanceOf(
      DuplicateRecordError
    );
  });

  it("rejects CNAME and A conflicts", async () => {
    await service.createRecord({
      type: "A",
      hostname: "example.com",
      value: "192.168.1.1"
    });

    await expect(
      service.createRecord({
        type: "CNAME",
        hostname: "example.com",
        value: "target.com"
      })
    ).rejects.toBeInstanceOf(DnsRecordConflictError);
  });

  it("rejects A records when CNAME exists", async () => {
    await service.createRecord({
      type: "CNAME",
      hostname: "www.example.com",
      value: "example.com"
    });

    await expect(
      service.createRecord({
        type: "A",
        hostname: "www.example.com",
        value: "192.168.1.1"
      })
    ).rejects.toBeInstanceOf(DnsRecordConflictError);
  });

  it("supports CNAME chains", async () => {
    await service.createRecord({
      type: "A",
      hostname: "origin.example.com",
      value: "192.168.1.10"
    });

    await service.createRecord({
      type: "CNAME",
      hostname: "b.example.com",
      value: "origin.example.com"
    });

    await service.createRecord({
      type: "CNAME",
      hostname: "a.example.com",
      value: "b.example.com"
    });

    const result = await service.resolveHostname("a.example.com");

    expect(result.resolvedIps).toEqual(["192.168.1.10"]);
    expect(result.recordType).toBe("CNAME");
    expect(result.pointsTo).toBe("b.example.com");
  });

  it("prevents CNAME cycles", async () => {
    await service.createRecord({
      type: "CNAME",
      hostname: "a.example.com",
      value: "b.example.com"
    });

    await service.createRecord({
      type: "CNAME",
      hostname: "b.example.com",
      value: "c.example.com"
    });

    await expect(
      service.createRecord({
        type: "CNAME",
        hostname: "c.example.com",
        value: "a.example.com"
      })
    ).rejects.toBeInstanceOf(CircularCnameError);
  });

  it("normalizes hostnames", async () => {
    const record = await service.createRecord({
      type: "A",
      hostname: "Example.COM.",
      value: "192.168.1.1"
    });

    expect(record.hostname).toBe("example.com");
  });

  it("rejects invalid hostnames", async () => {
    await expect(
      service.createRecord({
        type: "A",
        hostname: "-example.com",
        value: "192.168.1.1"
      })
    ).rejects.toBeInstanceOf(InvalidHostnameError);
  });

  it("rejects invalid IPv4 addresses", async () => {
    await expect(
      service.createRecord({
        type: "A",
        hostname: "example.com",
        value: "999.1.1.1"
      })
    ).rejects.toBeInstanceOf(InvalidIpv4Error);
  });

  it("returns not found for an unknown hostname", async () => {
    await expect(service.resolveHostname("missing.example.com")).rejects.toBeInstanceOf(
      HostnameNotFoundError
    );
  });

  it("deletes one A record without deleting other A records", async () => {
    await service.createRecord({
      type: "A",
      hostname: "example.com",
      value: "192.168.1.1"
    });

    await service.createRecord({
      type: "A",
      hostname: "example.com",
      value: "192.168.1.2"
    });

    await service.deleteRecord("example.com", "A", "192.168.1.1");

    const result = await service.resolveHostname("example.com");
    expect(result.resolvedIps).toEqual(["192.168.1.2"]);
  });
});
