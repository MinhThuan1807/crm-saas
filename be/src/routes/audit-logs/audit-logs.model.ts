import { z } from 'zod'
import { zDate } from 'src/common/utils/zod.util'

export const AuditLogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  targetName: z.string().nullable(),
  changes: z.any(),
  createdAt: zDate,
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
  }).optional(),
})

export const GetAuditLogsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  cursor: z.string().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
}).strict()

export type GetAuditLogsQueryType = z.infer<typeof GetAuditLogsQuerySchema>
