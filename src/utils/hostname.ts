import { InvalidHostnameError, InvalidIpv4Error } from "../dns/dns.errors";

const HOSTNAME_MAX_LENGTH = 253;
const LABEL_MAX_LENGTH = 63;
const hostnameLabel = /^(?=.{1,63}$)(?!-)[A-Za-z0-9-]+(?<!-)$/;

export function normalizeHostname(input: string): string {
  const hostname = input.trim().replace(/\.$/, "").toLowerCase();

  if (
    hostname.length === 0 ||
    hostname.length > HOSTNAME_MAX_LENGTH ||
    hostname.includes("..") ||
    !hostname.split(".").every((label) => hostnameLabel.test(label))
  ) {
    throw new InvalidHostnameError(input);
  }

  if (hostname.split(".").some((label) => label.length > LABEL_MAX_LENGTH)) {
    throw new InvalidHostnameError(input);
  }

  return hostname;
}

export function validateIpv4(value: string): string {
  const parts = value.trim().split(".");

  if (parts.length !== 4) {
    throw new InvalidIpv4Error(value);
  }

  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      throw new InvalidIpv4Error(value);
    }

    const number = Number(part);
    if (number < 0 || number > 255) {
      throw new InvalidIpv4Error(value);
    }
  }

  return parts.map(Number).join(".");
}
