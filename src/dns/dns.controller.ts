import { FastifyReply, FastifyRequest } from "fastify";

import {
  createDnsRecordSchema,
  deleteDnsRecordQuerySchema
} from "./dns.schemas";
import { DnsService } from "./dns.service";
import { InvalidRecordTypeError } from "./dns.errors";

export class DnsController {
  constructor(private readonly service: DnsService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createDnsRecordSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Request body is invalid",
          details: parsed.error.flatten()
        }
      });
    }

    const record = await this.service.createRecord(parsed.data);

    return reply.status(201).send({
      hostname: record.hostname,
      type: record.type,
      value: record.value,
      createdAt: record.createdAt.toISOString()
    });
  }

  async resolve(
    request: FastifyRequest<{ Params: { hostname: string } }>,
    reply: FastifyReply
  ) {
    const result = await this.service.resolveHostname(request.params.hostname);
    return reply.status(200).send(result);
  }

  async records(
    request: FastifyRequest<{ Params: { hostname: string } }>,
    reply: FastifyReply
  ) {
    const result = await this.service.listRecords(request.params.hostname);
    return reply.status(200).send(result);
  }

  async remove(
    request: FastifyRequest<{
      Params: { hostname: string };
      Querystring: { type: string; value: string };
    }>,
    reply: FastifyReply
  ) {
    const parsed = deleteDnsRecordQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "Delete query parameters are invalid",
          details: parsed.error.flatten()
        }
      });
    }

    if (parsed.data.type !== "A" && parsed.data.type !== "CNAME") {
      throw new InvalidRecordTypeError(parsed.data.type);
    }

    await this.service.deleteRecord(
      request.params.hostname,
      parsed.data.type,
      parsed.data.value
    );

    return reply.status(200).send({
      message: "DNS record deleted",
      hostname: request.params.hostname.toLowerCase().replace(/\.$/, ""),
      type: parsed.data.type,
      value: parsed.data.value
    });
  }
}
