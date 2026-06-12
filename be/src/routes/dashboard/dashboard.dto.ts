import { createZodDto } from 'nestjs-zod'
import { GetDashboardQuerySchema, DashboardResSchema } from './dashboard.model'

export class GetDashboardQueryDto extends createZodDto(GetDashboardQuerySchema) {}
export class DashboardResDto extends createZodDto(DashboardResSchema) {}
