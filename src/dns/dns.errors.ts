export class DnsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "DnsError";
  }
}

export class InvalidHostnameError extends DnsError {
  constructor(hostname: string) {
    super("INVALID_HOSTNAME", `Invalid hostname: ${hostname}`, 400, { hostname });
  }
}

export class InvalidIpv4Error extends DnsError {
  constructor(value: string) {
    super("INVALID_IPV4", `Invalid IPv4 address: ${value}`, 400, { value });
  }
}

export class InvalidRecordTypeError extends DnsError {
  constructor(type: string) {
    super("INVALID_RECORD_TYPE", `Unsupported DNS record type: ${type}`, 400, { type });
  }
}

export class DuplicateRecordError extends DnsError {
  constructor(hostname: string, type: string, value: string) {
    super(
      "DUPLICATE_RECORD",
      `Record already exists: ${hostname} ${type} ${value}`,
      409,
      { hostname, type, value }
    );
  }
}

export class DnsRecordConflictError extends DnsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("DNS_RECORD_CONFLICT", message, 409, details);
  }
}

export class HostnameNotFoundError extends DnsError {
  constructor(hostname: string) {
    super("HOSTNAME_NOT_FOUND", `Hostname not found: ${hostname}`, 404, { hostname });
  }
}

export class DnsRecordNotFoundError extends DnsError {
  constructor(hostname: string, type: string, value: string) {
    super(
      "DNS_RECORD_NOT_FOUND",
      `DNS record not found: ${hostname} ${type} ${value}`,
      404,
      { hostname, type, value }
    );
  }
}

export class CircularCnameError extends DnsError {
  constructor(hostname: string) {
    super("CNAME_CYCLE", `Circular CNAME reference detected at ${hostname}`, 409, {
      hostname
    });
  }
}

export class CnameChainTooLongError extends DnsError {
  constructor(maxDepth: number) {
    super(
      "CNAME_CHAIN_TOO_LONG",
      `CNAME chain exceeds the maximum depth of ${maxDepth}`,
      409,
      { maxDepth }
    );
  }
}
