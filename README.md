# Mini DNS API

A simplified but realistic DNS service implemented with TypeScript, Fastify, SQLite/Drizzle, and BullMQ/Redis.

## Features

- A records with multiple IPv4 addresses per hostname.
- One CNAME per hostname.
- CNAME cannot coexist with any other record.
- Duplicate record prevention.
- CNAME chaining.
- Circular CNAME detection.
- Maximum CNAME resolution depth.
- DNS hostname and IPv4 validation.
- Case-insensitive hostname normalization.
- Consistent error responses.
- Unit/integration tests.
- Asynchronous DNS query logging using BullMQ + Redis.

## Requirements

- Node.js 22+
- npm
- Redis 7+

## Local setup

```bash
npm install
cp .env.example .env
```

Create the SQLite directory:

```bash
mkdir -p data
```

Run the API:

```bash
npm run dev
```

Run the worker in another terminal:

```bash
npm run worker
```

API:

```text
http://localhost:3000
```

Health check:

```text
GET /health
```

The API is available on port 3000.

## API

### POST /api/dns

Create an A record:

```bash
curl -X POST http://localhost:3000/api/dns \
  -H 'content-type: application/json' \
  -d '{
    "type": "A",
    "hostname": "example.com",
    "value": "192.168.1.1"
  }'
```

Create a CNAME:

```bash
curl -X POST http://localhost:3000/api/dns \
  -H 'content-type: application/json' \
  -d '{
    "type": "CNAME",
    "hostname": "www.example.com",
    "value": "example.com"
  }'
```

Successful creation returns `201 Created`.

Invalid input returns `400 Bad Request`.

Duplicate or conflicting records return `409 Conflict`.

### GET /api/dns/:hostname

Resolve a hostname.

```bash
curl http://localhost:3000/api/dns/www.example.com
```

Example:

```json
{
  "hostname": "www.example.com",
  "resolvedIps": ["192.168.1.1", "192.168.1.2"],
  "recordType": "CNAME",
  "pointsTo": "example.com"
}
```

Direct A records return:

```json
{
  "hostname": "example.com",
  "resolvedIps": ["192.168.1.1", "192.168.1.2"],
  "recordType": "A"
}
```

A missing hostname returns `404`.

A circular or excessively long CNAME chain returns `409`.

### GET /api/dns/:hostname/records

Lists records directly attached to the hostname. It does not follow CNAMEs.

```bash
curl http://localhost:3000/api/dns/example.com/records
```

Example:

```json
{
  "hostname": "example.com",
  "records": [
    {
      "type": "A",
      "value": "192.168.1.1"
    },
    {
      "type": "A",
      "value": "192.168.1.2"
    }
  ]
}
```

### DELETE /api/dns/:hostname?type=A&value=192.168.1.1

Delete one exact record:

```bash
curl -X DELETE \
  'http://localhost:3000/api/dns/example.com?type=A&value=192.168.1.1'
```

Successful deletion returns `200 OK`.

A missing record returns `404`.

## DNS design decisions

### Hostname normalization

Hostnames are DNS names, so comparison is case-insensitive. The service converts hostnames to lowercase and removes a trailing dot.

For example:

```text
Example.COM.
```

is stored and looked up as:

```text
example.com
```

Labels are limited to 63 characters and the complete hostname to 253 characters for normal hostname input.

### A records

Multiple A records are permitted:

```text
example.com -> 192.168.1.1
example.com -> 192.168.1.2
```

The same A record cannot be inserted twice.

### CNAME records

Only one CNAME is permitted per hostname.

A CNAME cannot coexist with A records or any other record type.

### CNAME chains

Chains are supported:

```text
a.example.com -> b.example.com
b.example.com -> c.example.com
c.example.com -> 192.168.1.1
```

The resolver follows the chain until A records are found.

Circular references are rejected during CNAME creation when possible and are also detected defensively during resolution using a visited set.

A maximum depth protects the resolver from pathological chains.

### HTTP status codes

| Situation | Status |
|---|---:|
| Record created | 201 |
| Successful read/delete | 200 |
| Invalid request | 400 |
| Hostname/record not found | 404 |
| DNS record conflict / cycle | 409 |
| Unexpected server error | 500 |

## Error format

Errors use a consistent shape:

```json
{
  "error": {
    "code": "DNS_RECORD_CONFLICT",
    "message": "Cannot create CNAME record because hostname already has A records",
    "details": {
      "hostname": "example.com"
    }
  }
}
```

## Asynchronous processing

The senior-level asynchronous requirement is implemented as DNS query logging.

When a resolve request is received:

1. The API resolves the hostname synchronously because the caller needs the DNS answer.
2. The API places a query-log event onto a BullMQ queue.
3. The HTTP response is not blocked by persistence of the analytics event.
4. A separate worker consumes events from Redis.
5. The worker writes the query log to SQLite.
6. BullMQ handles retries for transient worker failures.

The design intentionally separates DNS resolution latency from analytics/logging latency.

The queue is Redis-backed because BullMQ requires a Redis-compatible backend and provides reliable background-job primitives, retries, and worker concurrency.

## Project structure

```text
src/
├── app.ts
├── server.ts
├── config/
│   └── env.ts
├── database/
│   ├── client.ts
│   └── schema.ts
├── dns/
│   ├── dns.controller.ts
│   ├── dns.errors.ts
│   ├── dns.repository.ts
│   ├── dns.routes.ts
│   ├── dns.schemas.ts
│   ├── dns.service.ts
│   └── dns.types.ts
├── middleware/
│   └── error-handler.ts
├── queue/
│   ├── dns-query.queue.ts
│   └── dns-query.worker.ts
└── utils/
    └── hostname.ts
```

## Testing

Run:

```bash
npm test
```

Tests cover:

- A record creation.
- Multiple A records.
- Duplicate records.
- CNAME creation.
- CNAME/A conflicts.
- Multiple CNAME prevention.
- CNAME chains.
- Circular references.
- Invalid hostnames.
- Invalid IPv4 addresses.
- Record listing.
- Record deletion.
- HTTP response behavior.

## AI tool usage disclosure

AI tools were used during development of this assessment.

OpenAI ChatGPT was used for:

- Architecture brainstorming.
- DNS behavior and edge-case analysis.
- Test-case planning.
- Implementation assistance.
- Documentation and README drafting.
- Code review suggestions.

The generated implementation should be reviewed, tested, and modified by the candidate before submission. The candidate remains responsible for understanding and validating the submitted code.

The ChatGPT conversation/history associated with this work should be included with the assessment submission as requested by the assessment instructions.
