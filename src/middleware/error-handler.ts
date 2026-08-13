import { FastifyInstance } from "fastify";

import { DnsError } from "../dns/dns.errors";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DnsError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {})
        }
      });
    }

    console.error(error);

    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred"
      }
    });
  });
}
