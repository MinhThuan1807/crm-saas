import { z } from "zod";

// ─── Enum — mirror backend DealStage ─────────────────────────────────────────
export const DealStage = {
  PROSPECT: "PROSPECT",
  QUALIFIED: "QUALIFIED",
  PROPOSAL: "PROPOSAL",
  CLOSED_WON: "CLOSED_WON",
  CLOSED_LOST: "CLOSED_LOST",
} as const;

export type DealStage = (typeof DealStage)[keyof typeof DealStage];

// ─── Base schemas (nội bộ) ────────────────────────────────────────────────────
const DealOwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const DealContactCardSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// ─── Deal Card — dùng trong pipeline view ────────────────────────────────────
export const DealCardSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  contactId: z.string(),
  ownerId: z.string(),
  title: z.string(),
  value: z.coerce.number(),
  stage: z.enum([
    "PROSPECT",
    "QUALIFIED",
    "PROPOSAL",
    "CLOSED_WON",
    "CLOSED_LOST",
  ]),
  closeDate: z.coerce.date(),
  note: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  contact: DealContactCardSchema,
  owner: DealOwnerSchema,
});

export type DealCard = z.infer<typeof DealCardSchema>;

// ─── Pipeline Response — GET /deals/pipeline ─────────────────────────────────
export const PipelineResSchema = z.object({
  PROSPECT: z.array(DealCardSchema),
  QUALIFIED: z.array(DealCardSchema),
  PROPOSAL: z.array(DealCardSchema),
  CLOSED_WON: z.array(DealCardSchema),
  CLOSED_LOST: z.array(DealCardSchema),
});

export type PipelineRes = z.infer<typeof PipelineResSchema>;

// ─── Deal Detail — GET /deals/:id ─────────────────────────────────────────────
export const DealDetailSchema = DealCardSchema.extend({
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
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      done: z.boolean(),
      dueDate: z.coerce.date().nullable(),
      createdAt: z.coerce.date(),
    }),
  ),
  activities: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string().nullable(),
      note: z.string(),
      date: z.coerce.date(),
    }),
  ),
  aiSuggestions: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      content: z.string(),
      createdAt: z.coerce.date(),
    }),
  ),
});

export type DealDetail = z.infer<typeof DealDetailSchema>;

// ─── CREATE — POST /deals ─────────────────────────────────────────────────────
export const CreateDealBodySchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  contactId: z.string().min(1, "Vui lòng chọn liên hệ"),
  ownerId: z.string().min(1, "Vui lòng chọn người phụ trách"),
  value: z.coerce.number().nonnegative("Giá trị không được âm").default(0),
  closeDate: z.coerce.date(),
  note: z.string().optional(),
});

export type CreateDealBodyType = z.infer<typeof CreateDealBodySchema>;

// ─── UPDATE — PATCH /deals/:id ────────────────────────────────────────────────
export const UpdateDealBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    value: z.coerce.number().nonnegative().optional(),
    closeDate: z.coerce.date().nullable().optional(),
    note: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Ít nhất phải có một trường được cập nhật",
  });

export type UpdateDealBodyType = z.infer<typeof UpdateDealBodySchema>;

// ─── UPDATE STAGE — PATCH /deals/:id/stage ───────────────────────────────────
export const UpdateDealStageBodySchema = z.object({
  stage: z.enum([
    "PROSPECT",
    "QUALIFIED",
    "PROPOSAL",
    "CLOSED_WON",
    "CLOSED_LOST",
  ]),
});

export type UpdateDealStageBodyType = z.infer<typeof UpdateDealStageBodySchema>;
