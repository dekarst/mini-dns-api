import { describe, expect, it } from "vitest";

import { InvalidHostnameError, InvalidIpv4Error } from "../src/dns/dns.errors";
import { normalizeHostname, validateIpv4 } from "../src/utils/hostname";

describe("hostname utilities", () => {
  it("normalizes case and trailing dot", () => {
    expect(normalizeHostname("Example.COM.")).toBe("example.com");
  });

  it("rejects empty hostname", () => {
    expect(() => normalizeHostname("")).toThrow(InvalidHostnameError);
  });

  it("rejects malformed labels", () => {
    expect(() => normalizeHostname("example..com")).toThrow(InvalidHostnameError);
    expect(() => normalizeHostname("-example.com")).toThrow(InvalidHostnameError);
    expect(() => normalizeHostname("example-.com")).toThrow(InvalidHostnameError);
  });

  it("validates IPv4", () => {
    expect(validateIpv4("192.168.1.1")).toBe("192.168.1.1");
    expect(validateIpv4("0.0.0.0")).toBe("0.0.0.0");
    expect(validateIpv4("255.255.255.255")).toBe("255.255.255.255");
  });

  it("rejects invalid IPv4", () => {
    expect(() => validateIpv4("999.1.1.1")).toThrow(InvalidIpv4Error);
    expect(() => validateIpv4("192.168.1")).toThrow(InvalidIpv4Error);
    expect(() => validateIpv4("abc.def.1.1")).toThrow(InvalidIpv4Error);
  });
});
