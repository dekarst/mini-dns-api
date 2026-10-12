
import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { env } from "./config/env";
import { DnsController } from "./dns/dns.controller";
import { DnsRepository } from "./dns/dns.repository";
import { DnsService } from "./dns/dns.service";
import { registerDnsRoutes } from "./dns/dns.routes";
import { registerErrorHandler } from "./middleware/error-handler";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  const repository = new DnsRepository();
  const service = new DnsService(repository);
  const controller = new DnsController(service);

  // Register OpenAPI documentation before registering API routes.
  app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Mini DNS API",
        description:
          "A DNS API supporting A and CNAME records, hostname resolution, record listing, and deletion.",
        version: "1.0.0",
        contact: {
          name: "Mini DNS API",
          url: "https://github.com/dekarst/mini-dns-api",
        },
      },
      servers: [
        {
          url: `http://localhost:${env.port}`,
          description: "Local development server",
        },
      ],
      tags: [
        {
          name: "Health",
          description: "API health checks",
        },
        {
          name: "DNS",
          description: "DNS record management and hostname resolution",
        },
      ],
    },
  });

  // Swagger UI will be available at /docs.
  app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  // Register routes after Swagger so it can discover their schemas.
  app.register(async (instance) => {
    instance.get(
      "/health",
      {
        schema: {
          tags: ["Health"],
          summary: "Check API health",
          description: "Returns the current API health status.",
          response: {
            200: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  example: "ok",
                },
              },
              required: ["status"],
            },
          },
        },
      },
      async () => ({
        status: "ok",
      }),
    );

    // Register your existing DNS routes exactly once.
    app.register(async (instance) => {
      await registerDnsRoutes(instance, controller);
    });

    // Keep your existing error handler registration.
    registerErrorHandler(app);
  });

  return app;
}
