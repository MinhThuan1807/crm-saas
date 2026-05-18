import { z } from "zod";

import { UserSchema } from "./auth.schema";

export const UserOptionSchema = UserSchema.pick({
  id: true,
  email: true,
  name: true,
  role: true,
});

export const GetUsersResSchema = z.union([
  z.array(UserOptionSchema),
  z.object({
    data: z.array(UserOptionSchema),
  }),
]);

export type UserOption = z.infer<typeof UserOptionSchema>;
