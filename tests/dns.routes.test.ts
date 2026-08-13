import { beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/app";
import { sqlite } from "../src/database/client";

describe("DNS HTTP API", () => {
  beforeEach(() => {
    sqlite.exec("DELETE FROM dns_records");
    sqlite.exec("DELETE FROM dns_query_logs");
  });

  it("creates and resolves an A record", async () => {
    const app = buildApp();

    const create = await app.inject({
      method: "POST",
      url: "/api/dns",
      payload: {
        type: "A",
        hostname: "example.com",
        value: "192.168.1.1"
      }
    });

    expect(create.statusCode).toBe(201);

    const resolve = await app.inject({
      method: "GET",
      url: "/api/dns/example.com"
    });

    expect(resolve.statusCode).toBe(200);
    expect(resolve.json()).toMatchObject({
      hostname: "example.com",
      resolvedIps: ["192.168.1.1"],
      recordType: "A"
    });

    await app.close();
  });

  it("returns 409 for duplicate records", async () => {
    const app = buildApp();

    const payload = {
      type: "A",
      hostname: "example.com",
      value: "192.168.1.1"
    };

    await app.inject({
      method: "POST",
      url: "/api/dns",
      payload
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/dns",
      payload
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("DUPLICATE_RECORD");

    await app.close();
  });

  it("lists direct records", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/api/dns",
      payload: {
        type: "A",
        hostname: "example.com",
        value: "192.168.1.1"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/dns/example.com/records"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      hostname: "example.com",
      records: [{ type: "A", value: "192.168.1.1" }]
    });

    await app.close();
  });

  it("deletes an exact record", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/api/dns",
      payload: {
        type: "A",
        hostname: "example.com",
        value: "192.168.1.1"
      }
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/dns/example.com?type=A&value=192.168.1.1"
    });

    expect(response.statusCode).toBe(200);

    const records = await app.inject({
      method: "GET",
      url: "/api/dns/example.com/records"
    });

    expect(records.json().records).toEqual([]);

    await app.close();
  });
});
