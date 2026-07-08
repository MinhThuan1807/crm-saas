import { createZodDto } from 'nestjs-zod'
import { GetAuditLogsQuerySchema } from './audit-logs.model'

export class GetAuditLogsQueryDto extends createZodDto(GetAuditLogsQuerySchema) {}
