import { FastifyInstance } from "fastify";

import { DnsController } from "./dns.controller";

export async function registerDnsRoutes(
  app: FastifyInstance,
  controller: DnsController
): Promise<void> {
  app.post("/api/dns", controller.create.bind(controller));

  app.get("/api/dns/:hostname/records", controller.records.bind(controller));

  app.get("/api/dns/:hostname", controller.resolve.bind(controller));

  app.delete("/api/dns/:hostname", controller.remove.bind(controller));
}
