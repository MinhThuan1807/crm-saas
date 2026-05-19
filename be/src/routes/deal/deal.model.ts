import { z } from 'zod'

// export const DealStageEnum = z.enum(['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'CLOSED_WON', 'CLOSED_LOST'])

export const DealStageConst = {
  PROSPECT: 'PROSPECT',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL: 'PROPOSAL',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST',
} as const;

export type DealStageType = typeof DealStageConst[keyof typeof DealStageConst];

export const DealBaseSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  tenantId: z.string(),
  ownerId: z.string(),
  title: z.string().min(1).max(200),
  value: z.coerce.number().nonnegative().default(0),
  stage: z.enum([DealStageConst.PROSPECT, DealStageConst.QUALIFIED, DealStageConst.PROPOSAL, DealStageConst.CLOSED_WON, DealStageConst.CLOSED_LOST]),
  closeDate: z.date().nullable(),
  note: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})
// ─────────────────────────────────────────
// CREATE — POST /deals
// ─────────────────────────────────────────
export const CreateDealBodySchema = DealBaseSchema.pick({
  contactId: true,
  // tenantId: true,
  ownerId: true,
  title: true,
  value: true,
  // stage: true,
  note: true,
})
  .extend({
    closeDate: z.coerce.date().nullable().optional(),
  })
  .strict()

export const CreateDealResSchema = DealBaseSchema.omit({ deletedAt: true })

export type CreateDealBodyType = z.infer<typeof CreateDealBodySchema>
export type CreateDealResType = z.infer<typeof CreateDealResSchema>

// ─────────────────────────────────────────
// UPDATE — PATCH /deals/:id
// ─────────────────────────────────────────

export const UpdateDealBodySchema = z
  .object({
    title: z.string().min(1).max(200),
    value: z.coerce.number().nonnegative().optional(),
    closeDate: z.coerce.date().nullable().optional(),
    note: z.string().nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Ít nhất phải có một trường được cập nhật' })

export const UpdateDealResSchema = CreateDealResSchema  

export type UpdateDealBodyType = z.infer<typeof UpdateDealBodySchema>
export type UpdateDealResType = z.infer<typeof UpdateDealResSchema>

// ─────────────────────────────────────────
// UPDATE STAGE — PATCH /deals/:id/stage
// ─────────────────────────────────────────
export const UpdateDealStageBodySchema = z.object({
  stage: z.enum([DealStageConst.PROSPECT, DealStageConst.QUALIFIED, DealStageConst.PROPOSAL, DealStageConst.CLOSED_WON, DealStageConst.CLOSED_LOST]),
}).strict()

export type UpdateDealStageBodyType = z.infer<typeof UpdateDealStageBodySchema>
export type UpdateDealStageResType = UpdateDealResType

// ─────────────────────────────────────────
// GET ONE — GET /deals/:id
// ─────────────────────────────────────────
export const GetDealResSchema = DealBaseSchema
  .omit({ deletedAt: true })
  .extend({
    contact: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      company: z.string().nullable(),
      position: z.string().nullable(),
    }),
    owner: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }),
    tasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      done: z.boolean(),
      dueDate: z.coerce.date().nullable(),
      createdAt: z.coerce.date(),
    })),
    activities: z.array(z.object({
      id: z.string(),
      type: z.string(),
      title: z.string().nullable(),
      note: z.string().nullable(),
      date: z.coerce.date(),
    })),
    aiSuggestions: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        content: z.string(),
        createdAt: z.coerce.date(),
      }),
    ),
  })

export type GetDealResType = z.infer<typeof GetDealResSchema>

// ─────────────────────────────────────────
// PIPELINE — GET /deals/pipeline
// ─────────────────────────────────────────
export const DealCardSchema = DealBaseSchema.omit({ deletedAt: true }).extend({
  contact: z.object({
    id: z.string(),
    name: z.string(),
  }),
  owner: z.object({
    id: z.string(),
    name: z.string(),
  }),
})
export type DealCardRes = z.infer<typeof DealCardSchema>

export const GetDealsPipelineResSchema = z.object({
  PROSPECT: z.array(DealCardSchema),
  QUALIFIED: z.array(DealCardSchema),
  PROPOSAL: z.array(DealCardSchema),
  CLOSED_WON: z.array(DealCardSchema),
  CLOSED_LOST: z.array(DealCardSchema),
});

export type GetDealsPipelineResType = z.infer<typeof GetDealsPipelineResSchema>;

