import { ROLE } from 'src/common/constants/role.constanst';
import z from 'zod';

export const CreateInvitationSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  role: z.enum([ROLE.ADMIN, ROLE.MANAGER, ROLE.SALES_REP]),
}).strict();

export type CreateInvitationType = z.infer<typeof CreateInvitationSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string(),
  name: z.string().min(1, 'Họ và tên không được để trống'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  confirmPassword: z.string(),
}).strict().superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Mật khẩu xác nhận không khớp',
    });
  }
});

export type AcceptInvitationType = z.infer<typeof AcceptInvitationSchema>;

export const UpdateInvitationSchema = z.object({
  email: z.string().email('Email không hợp lệ').optional(),
  role: z.enum([ROLE.ADMIN, ROLE.MANAGER, ROLE.SALES_REP]).optional(),
}).strict();

export type UpdateInvitationType = z.infer<typeof UpdateInvitationSchema>;
