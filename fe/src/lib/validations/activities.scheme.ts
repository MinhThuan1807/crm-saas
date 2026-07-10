import { z } from "zod";

// ─── ENUM ─────────────────────────────────────────────────────────────────────
export const ActivityType = {
  CALL: "CALL",
  EMAIL: "EMAIL",
  MEETING: "MEETING",
  NOTE: "NOTE",
} as const;

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const ActivityTypeEnum = z.enum([
  ActivityType.CALL,
  ActivityType.EMAIL,
  ActivityType.MEETING,
  ActivityType.NOTE,
]);

// ─── ACTIVITY ITEM — full shape from API (with relations) ──────────────────────
export const ActivityItemSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  contactId: z.string().nullable(),
  dealId: z.string().nullable(),
  userId: z.string(),
  title: z.string().nullable(),
  type: ActivityTypeEnum,
  note: z.string(),
  date: z.coerce.date(),
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
});

export type ActivityItem = z.infer<typeof ActivityItemSchema>;

// ─── RESPONSE SCHEMAS ─────────────────────────────────────────────────────────

// GET /contacts/:id/activities  |  GET /deals/:id/activities
export const GetActivitiesListResSchema = z.object({
  data: z.array(ActivityItemSchema),
});

export type GetActivitiesListResType = z.infer<
  typeof GetActivitiesListResSchema
>;

// GET /activities (paginated)
export const GetActivitiesPaginatedResSchema = z.object({
  data: z.array(ActivityItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type GetActivitiesPaginatedResType = z.infer<
  typeof GetActivitiesPaginatedResSchema
>;

// ─── QUERY PARAMS ─────────────────────────────────────────────────────────────
export const GetActivitiesParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  type: ActivityTypeEnum.optional(),
  search: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
});

export type GetActivitiesParamsType = z.infer<typeof GetActivitiesParamsSchema>;

// ─── CREATE FOR CONTACT — POST /contacts/:contactId/activities ────────────────
export const CreateActivityForContactBodySchema = z
  .object({
    type: ActivityTypeEnum,
    title: z.string().nullable().optional(),
    note: z.string().min(1, "Nội dung không được để trống"),
    date: z.coerce.date().optional(),
  })
  .strict();

export type CreateActivityForContactBodyType = z.infer<
  typeof CreateActivityForContactBodySchema
>;

// ─── CREATE FOR DEAL — POST /deals/:dealId/activities ────────────────────────
export const CreateActivityForDealBodySchema = z
  .object({
    type: ActivityTypeEnum,
    title: z.string().nullable().optional(),
    note: z.string().min(1, "Nội dung không được để trống"),
    date: z.coerce.date().optional(),
    contactId: z.string().optional(),
  })
  .strict();

export type CreateActivityForDealBodyType = z.infer<
  typeof CreateActivityForDealBodySchema
>;

// ─── UPDATE — PATCH /activities/:id ──────────────────────────────────────────
// Partial, at least 1 field — used for ActivityForm (edit mode) + zodResolver
export const UpdateActivityBodySchema = z
  .object({
    type: ActivityTypeEnum.optional(),
    title: z.string().nullable().optional(),
    note: z.string().min(1, "Nội dung không được để trống").optional(),
    date: z.coerce.date().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Ít nhất phải có một trường được cập nhật",
  });

export type UpdateActivityBodyType = z.infer<typeof UpdateActivityBodySchema>;

// ─── FORM SCHEMA — used for ActivityForm (create + edit) ─────────────────────
// Not strict because shadcn Dialog injects internal fields
export const ActivityFormSchema = z.object({
  type: ActivityTypeEnum,
  title: z.string().nullable().optional(),
  note: z.string().min(1, "Nội dung không được để trống"),
  date: z.date().optional(),
});

export type ActivityFormValues = z.infer<typeof ActivityFormSchema>;
