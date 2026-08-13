import { z } from "zod";

export const createDnsRecordSchema = z.object({
  type: z.enum(["A", "CNAME"]),
  hostname: z.string().min(1),
  value: z.string().min(1)
}).strict();

export const deleteDnsRecordQuerySchema = z.object({
  type: z.enum(["A", "CNAME"]),
  value: z.string().min(1)
}).strict();

export type CreateDnsRecordBody = z.infer<typeof createDnsRecordSchema>;
