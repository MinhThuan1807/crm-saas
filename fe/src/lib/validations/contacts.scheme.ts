import z from "zod";
export const ContactTagConst  = {
  Enterprise: "Enterprise",
  Vip: "Vip",
  Potential: "Tiềm năng"
} as const;

export type ContactTagType  = typeof ContactTagConst [keyof typeof ContactTagConst ];

// ─────────────────────────────────────────
// BASE SCHEMAS — Không dùng trực tiếp làm Res/Body
// ─────────────────────────────────────────
const ContactBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(2, "Tên liên hệ phải có ít nhất 2 ký tự").max(100, "Tên liên hệ không được vượt quá 100 ký tự"),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không hợp lệ.")
    .optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  tags: z.array(z.enum([
    ContactTagConst.Enterprise,
    ContactTagConst.Vip,
    ContactTagConst.Potential,
  ])).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type ContactBaseType = z.infer<typeof ContactBaseSchema>;

// ─────────────────────────────────────────
// CREATE — POST /contacts
// ─────────────────────────────────────────
export const CreateContactBodySchema = ContactBaseSchema.pick({
  // id: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  position: true,
  tags: true,
}).strict();

export const CreateContactResSchema = ContactBaseSchema.omit({
  deletedAt: true,
});

export type CreateContactBodyType = z.infer<typeof CreateContactBodySchema>;

export type Contact = z.infer<typeof CreateContactResSchema>;

// ─────────────────────────────────────────
// UPDATE — PATCH /contacts/:id
// ─────────────────────────────────────────
export const UpdateContactBodySchema = CreateContactBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Ít nhất phải có một trường được cập nhật",
  });

export const UpdateContactResSchema = CreateContactResSchema; // trả về giống Create

export type UpdateContactBodyType = z.infer<typeof UpdateContactBodySchema>;
export type UpdateContactResType = z.infer<typeof UpdateContactResSchema>;

// ─────────────────────────────────────────
// GET ONE — GET /contacts/:id
// ─────────────────────────────────────────
export const GetContactResSchema = ContactBaseSchema.omit({
  deletedAt: true,
}).extend({
  deals: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      stage: z.string(),
      value: z.coerce.number(),
    }),
  ),
  activities: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      note: z.string(),
      date: z.coerce.date(),
    }),
  ),
});
export type GetContactResType = z.infer<typeof GetContactResSchema>;

export const GetContactWithDealsActivitiesResSchema = ContactBaseSchema.omit({
  deletedAt: true,
}).extend({
  deals: z.array(
    z.object({
      id: z.string(),
      value: z.coerce.number(),
    }),
  ),
  activities: z.array(
    z.object({
      id: z.string(),
      date: z.coerce.date(),
    }),
  ),
});
export type GetContactWithDealsActivitiesResType = z.infer<
  typeof GetContactWithDealsActivitiesResSchema
>;

// ─────────────────────────────────────────
// GET ALL — GET /contacts
// ─────────────────────────────────────────
export const GetContactsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  tag: z.string().optional(),
});

export const GetContactsResSchema = z.object({
  data: z.array(CreateContactResSchema), // dùng lại, không expose deletedAt
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasNextPage: z.boolean(),
  }),
});

export const GetContactsWithDealsActivitiesResSchema = z.object({
  data: z.array(GetContactWithDealsActivitiesResSchema), // dùng lại, không expose deletedAt
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasNextPage: z.boolean(),
  }),
});

export type GetContactsQueryType = z.infer<typeof GetContactsQuerySchema>;
export type GetContactsResType = z.infer<
  typeof GetContactsWithDealsActivitiesResSchema
>;
