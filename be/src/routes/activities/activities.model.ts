import { z } from 'zod'
import { zIsoDatetime } from 'src/common/utils/zod.util'

// ─── ACTIVITY TYPE CONSTANT ───────────────────────────────────────────────────
export const ActivityTypeConst = {
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  NOTE: 'NOTE',
} as const

export type ActivityTypeType = (typeof ActivityTypeConst)[keyof typeof ActivityTypeConst]

// ─── ENUM ────────────────────────────────────────────────────────────────────
export const ActivityTypeEnum = z.enum([
  ActivityTypeConst.CALL,
  ActivityTypeConst.EMAIL,
  ActivityTypeConst.MEETING,
  ActivityTypeConst.NOTE,
])

// ─── BASE SCHEMA (response shape with relations) ───────────────────────────────
export const ActivityBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  contactId: z.string().nullable(),
  dealId: z.string().nullable(),
  userId: z.string(),
  title: z.string().nullable(),
  type: ActivityTypeEnum,
  note: z.string(),
  date: zIsoDatetime,
  user: z.object({
    id: z.string(),
    name: z.string(),
  }),
  contact: z
    .object({
      id: z.string(),
      name: z.string(),
      company: z.string().nullable(),
    })
    .nullable(),
  deal: z
    .object({
      id: z.string(),
      title: z.string(),
    })
    .nullable(),
})

export type ActivityBaseType = z.infer<typeof ActivityBaseSchema>

// ─── CREATE FOR CONTACT ───────────────────────────────────────────────────────
// POST /contacts/:contactId/activities
export const CreateActivityForContactBodySchema = z
  .object({
    type: ActivityTypeEnum,
    title: z.string().optional().nullable(),
    note: z.string().min(1, 'Nội dung không được để trống'),
    date: zIsoDatetime.optional(),
  })
  .strict()

export type CreateActivityForContactBodyType = z.infer<typeof CreateActivityForContactBodySchema>

// ─── CREATE FOR DEAL ──────────────────────────────────────────────────────────
// POST /deals/:dealId/activities
export const CreateActivityForDealBodySchema = z
  .object({
    type: ActivityTypeEnum,
    title: z.string().optional().nullable(),
    note: z.string().min(1, 'Nội dung không được để trống'),
    date: zIsoDatetime.optional(),
    contactId: z.string().optional(), // optional — can attach contact
  })
  .strict()

export type CreateActivityForDealBodyType = z.infer<typeof CreateActivityForDealBodySchema>

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// PATCH /activities/:id — partial, at least 1 field
export const UpdateActivityBodySchema = z
  .object({
    type: ActivityTypeEnum.optional(),
    title: z.string().optional().nullable(),
    note: z.string().min(1).optional(),
    date: zIsoDatetime.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ít nhất phải có một trường được cập nhật',
  })

export type UpdateActivityBodyType = z.infer<typeof UpdateActivityBodySchema>

// ─── GET ACTIVITIES QUERY ─────────────────────────────────────────────────────
// GET /activities?page=1&limit=20&type=CALL&search=...&contactId=...&dealId=...
export const GetActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: ActivityTypeEnum.optional(),
  search: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
})

export type GetActivitiesQueryType = z.infer<typeof GetActivitiesQuerySchema>

// ─── RESPONSE SCHEMAS ─────────────────────────────────────────────────────────

// Single activity response (CREATE + PATCH)
export const ActivityResSchema = ActivityBaseSchema

// List response (GET /contacts/:id/activities, GET /deals/:id/activities)
export const GetActivitiesResSchema = z.object({
  data: z.array(ActivityBaseSchema),
})

// Paginated list response (GET /activities)
export const GetActivitiesPaginatedResSchema = z.object({
  data: z.array(ActivityBaseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

export type GetActivitiesResType = z.infer<typeof GetActivitiesResSchema>
export type GetActivitiesPaginatedResType = z.infer<typeof GetActivitiesPaginatedResSchema>
