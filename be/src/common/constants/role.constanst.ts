export const ROLE = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES_REP: 'SALES_REP',
} as const

export type RoleType = (typeof ROLE)[keyof typeof ROLE]