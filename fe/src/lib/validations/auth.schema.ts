import z from "zod";

export const UserSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không hợp lệ."), 
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự.").max(80, "Tên không được vượt quá 80 ký tự."),
  role: z.enum(["ADMIN", "MANAGER", "SALES_REP"]),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự.").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Phải có chữ hoa, chữ thường, số và ký tự đặc biệt"
  ),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

// createdAt: z.coerce.date() auto convert string to date, if conversion fails it will throw validation error. Same for updatedAt
// updatedAt: z.coerce.date()

export type UserType = z.infer<typeof UserSchema>;

export const RegisterBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
}).extend({
  confirmPassword: z.string().min(8, "Mật khẩu xác nhận phải có ít nhất 8 ký tự."),
  companyName: z.string().min(2, "Tên công ty phải có ít nhất 2 ký tự.").max(100, "Tên công ty không được vượt quá 100 ký tự."),
}).strict().superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      message: 'Mật khẩu xác nhận không khớp.',
      path: ["confirmPassword"],
    })
  }
});

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;

export const RegisterResSchema = UserSchema.omit({
  password: true,
})

export type RegisterResType = z.infer<typeof RegisterResSchema>;

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
}).strict();

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

export const LoginResSchema = z.object({
  refreshToken: z.string(),
  accessToken: z.string(),
})

export type LoginResType = z.infer<typeof LoginResSchema>;

export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.string(),
  // tenantId: z.string(),
  // expireAt: z.date()
})


export const RefreshTokenBodySchema = z.object({
  refreshToken: z.string(),
}).strict();

export const RefreshTokenResSchema = LoginResSchema

export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;
export type RefreshTokenResType = z.infer<typeof RefreshTokenResSchema>;
