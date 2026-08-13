import Fastify from "fastify";

import { DnsController } from "./dns/dns.controller";
import { DnsRepository } from "./dns/dns.repository";
import { DnsService } from "./dns/dns.service";
import { registerDnsRoutes } from "./dns/dns.routes";
import { registerErrorHandler } from "./middleware/error-handler";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  const repository = new DnsRepository();
  const service = new DnsService(repository);
  const controller = new DnsController(service);

  app.get("/health", async () => ({
    status: "ok"
  }));

  registerDnsRoutes(app, controller);
  registerErrorHandler(app);

  return app;
}
