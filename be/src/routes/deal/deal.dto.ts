import { createZodDto } from 'nestjs-zod'
import {
  CreateDealBodySchema,
  CreateDealResSchema,
  UpdateDealStageBodySchema,
  UpdateDealBodySchema,
  GetDealResSchema,
  GetDealsPipelineResSchema,
  UpdateDealResSchema,
  AnalyzeDealResSchema,
  AnalyzeDealBodySchema,
} from './deal.model'

export class CreateDealBodyDto extends createZodDto(CreateDealBodySchema) {}
export class CreateDealResDto extends createZodDto(CreateDealResSchema) {}

export class UpdateDealStageBodyDto extends createZodDto(UpdateDealStageBodySchema) {}
export class UpdateDealBodyDto extends createZodDto(UpdateDealBodySchema) {}
export class UpdateDealResDto extends createZodDto(UpdateDealResSchema) {}

export class GetDealResDto extends createZodDto(GetDealResSchema) {}
export class GetDealsPipelineResDto extends createZodDto(GetDealsPipelineResSchema) {}

export class AnalyzeDealBodyDto extends createZodDto(AnalyzeDealBodySchema) {}
export class AnalyzeDealResDto extends createZodDto(AnalyzeDealResSchema) {}
