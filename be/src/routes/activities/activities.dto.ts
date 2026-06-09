import { createZodDto } from 'nestjs-zod'
import {
  CreateActivityForContactBodySchema,
  CreateActivityForDealBodySchema,
  UpdateActivityBodySchema,
  GetActivitiesQuerySchema,
  ActivityResSchema,
  GetActivitiesResSchema,
  GetActivitiesPaginatedResSchema,
} from './activities.model'

export class CreateActivityForContactBodyDto extends createZodDto(CreateActivityForContactBodySchema) {}

export class CreateActivityForDealBodyDto extends createZodDto(CreateActivityForDealBodySchema) {}

export class UpdateActivityBodyDto extends createZodDto(UpdateActivityBodySchema) {}

export class GetActivitiesQueryDto extends createZodDto(GetActivitiesQuerySchema) {}

export class ActivityResDto extends createZodDto(ActivityResSchema) {}

export class GetActivitiesResDto extends createZodDto(GetActivitiesResSchema) {}

export class GetActivitiesPaginatedResDto extends createZodDto(GetActivitiesPaginatedResSchema) {}
