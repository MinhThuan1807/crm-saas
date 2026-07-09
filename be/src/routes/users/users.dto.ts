import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { ROLE } from 'src/common/constants/role.constanst';

export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Họ và tên không được để trống').optional(),
  role: z.string().optional(),
}).strict();

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
export type UpdateUserType = z.infer<typeof UpdateUserSchema>;
