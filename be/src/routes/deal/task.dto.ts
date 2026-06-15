import { createZodDto } from 'nestjs-zod'
import {
  CreateTaskBodySchema,
  CreateTasksBulkBodySchema,
  UpdateTaskBodySchema,
  TaskResSchema,
} from './task.model'

export class CreateTaskBodyDto extends createZodDto(CreateTaskBodySchema) {}
export class CreateTasksBulkBodyDto extends createZodDto(CreateTasksBulkBodySchema) {}
export class UpdateTaskBodyDto extends createZodDto(UpdateTaskBodySchema) {}
export class TaskResDto extends createZodDto(TaskResSchema) {}
