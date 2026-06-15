import { z } from 'zod'

export const TaskBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  dealId: z.string(),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200),
  done: z.boolean().default(false),
  dueDate: z.coerce.date().nullable().optional(),
  createdAt: z.date(),
})

// CREATE
export const CreateTaskBodySchema = TaskBaseSchema.pick({
  title: true,
}).extend({
  dueDate: z.coerce.date().nullable().optional(),
}).strict()

// CREATE BULK
export const CreateTasksBulkBodySchema = z.object({
  tasks: z.array(CreateTaskBodySchema),
}).strict()

// UPDATE
export const UpdateTaskBodySchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200).optional(),
  done: z.boolean().optional(),
  dueDate: z.coerce.date().nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'Ít nhất phải có một trường được cập nhật',
})

// RESPONSES
export const TaskResSchema = TaskBaseSchema

export type CreateTaskBodyType = z.infer<typeof CreateTaskBodySchema>
export type CreateTasksBulkBodyType = z.infer<typeof CreateTasksBulkBodySchema>
export type UpdateTaskBodyType = z.infer<typeof UpdateTaskBodySchema>
export type TaskResType = z.infer<typeof TaskResSchema>
