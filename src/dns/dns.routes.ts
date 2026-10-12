
import type { FastifyInstance } from "fastify";
import type { DnsController } from "./dns.controller";

export async function registerDnsRoutes(
  app: FastifyInstance,
  controller: DnsController,
): Promise<void> {
  // Create a DNS record
  app.post(
    "/api/dns",
    {
      schema: {
        tags: ["DNS"],
        summary: "Create a DNS record",
        description: "Creates an A or CNAME DNS record.",
        body: {
          type: "object",
          required: ["type", "hostname", "value"],
          properties: {
            type: {
              type: "string",
              enum: ["A", "CNAME"],
              description: "DNS record type",
            },
            hostname: {
              type: "string",
              description: "Hostname for the DNS record",
              examples: ["example.com"],
            },
            value: {
              type: "string",
              description: "IP address for A records or target hostname for CNAME records",
              examples: ["192.0.2.1"],
            },
            ttl: {
              type: "integer",
              minimum: 1,
              description: "Time to live in seconds",
              examples: [3600],
            },
          },
        },
        response: {
          201: {
            description: "DNS record created successfully",
            type: "object",
          },
          400: {
            description: "Invalid DNS record",
            type: "object",
          },
          409: {
            description: "DNS record already exists",
            type: "object",
          },
        },
      },
    },
    controller.create.bind(controller),
  );

  // Resolve a hostname
  app.get(
    "/api/dns/:hostname",
    {
      schema: {
        tags: ["DNS"],
        summary: "Resolve a hostname",
        params: {
          type: "object",
          required: ["hostname"],
          properties: {
            hostname: {
              type: "string",
              description: "Hostname to resolve",
              examples: ["example.com"],
            },
          },
        },
        response: {
          200: {
            description: "Hostname resolved successfully",
            type: "object",
          },
          404: {
            description: "Hostname not found",
            type: "object",
          },
        },
      },
    },
    controller.resolve.bind(controller),
  );

  // List records for a hostname
  app.get(
    "/api/dns/:hostname/records",
    {
      schema: {
        tags: ["DNS"],
        summary: "List DNS records",
        params: {
          type: "object",
          required: ["hostname"],
          properties: {
            hostname: {
              type: "string",
              examples: ["example.com"],
            },
          },
        },
        response: {
          200: {
            description: "DNS records retrieved successfully",
            type: "array",
            items: {
              type: "object",
            },
          },
          404: {
            description: "No matching records found",
            type: "object",
          },
        },
      },
    },
    controller.records.bind(controller),
  );

  // Delete a DNS record
  app.delete(
    "/api/dns/:hostname",
    {
      schema: {
        tags: ["DNS"],
        summary: "Delete a DNS record",
        params: {
          type: "object",
          required: ["hostname"],
          properties: {
            hostname: {
              type: "string",
              examples: ["example.com"],
            },
          },
        },
        querystring: {
          type: "object",
          required: ["type", "value"],
          properties: {
            type: {
              type: "string",
              enum: ["A", "CNAME"],
            },
            value: {
              type: "string",
              examples: ["192.0.2.1"],
            },
          },
        },
        response: {
          200: {
            description: "DNS record deleted successfully",
            type: "object",
          },
          404: {
            description: "DNS record not found",
            type: "object",
          },
        },
      },
    },
    controller.remove.bind(controller),
  );
}
