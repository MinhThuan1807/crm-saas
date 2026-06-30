import { z } from 'zod'
import { zIsoDatetime } from 'src/common/utils/zod.util'

export const TaskBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  dealId: z.string(),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200),
  done: z.boolean().default(false),
  dueDate: zIsoDatetime.nullable().optional(),
  createdAt: zIsoDatetime,
})

// CREATE
export const CreateTaskBodySchema = TaskBaseSchema.pick({
  title: true,
}).extend({
  dueDate: zIsoDatetime.nullable().optional(),
}).strict()

// CREATE BULK
export const CreateTasksBulkBodySchema = z.object({
  tasks: z.array(CreateTaskBodySchema),
}).strict()

// UPDATE
export const UpdateTaskBodySchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200).optional(),
  done: z.boolean().optional(),
  dueDate: zIsoDatetime.nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'Ít nhất phải có một trường được cập nhật',
})

// RESPONSES
export const TaskResSchema = TaskBaseSchema

export type CreateTaskBodyType = z.infer<typeof CreateTaskBodySchema>
export type CreateTasksBulkBodyType = z.infer<typeof CreateTasksBulkBodySchema>
export type UpdateTaskBodyType = z.infer<typeof UpdateTaskBodySchema>
export type TaskResType = z.infer<typeof TaskResSchema>
