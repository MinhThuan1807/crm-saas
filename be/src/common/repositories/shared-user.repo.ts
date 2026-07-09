import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/services/prisma.service";
import { UserType } from "src/routes/auth/auth.model";
import { ROLE, RoleType } from "../constants/role.constanst";

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUniqueEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      include: { role: true },
    })
  }

  async findTenantUnique(tenantId: string) {
    return this.prismaService.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    })
  }

  async findSlug(slug: string) {
    return this.prismaService.tenant.findUnique({
      where: { slug },
    })
  }

  // Tự động tạo Tenant cùng 3 Role mặc định + Phân quyền
  async createTenantIncludeUser(payload: {
    companyName: string
    slug: string
    email: string
    name: string
    hashedPassword: string
    role: RoleType
  }): Promise<UserType & { role: { name: string } }> {
    return this.prismaService.$transaction(async (tx) => {
      // 1. Tạo Tenant mới
      const tenant = await tx.tenant.create({
        data: {
          name: payload.companyName,
          slug: payload.slug,
        },
      })

      // 2. Tạo 3 Role mặc định
      const adminRole = await tx.role.create({
        data: { tenantId: tenant.id, name: 'ADMIN', description: 'Quản trị viên doanh nghiệp' }
      })
      const managerRole = await tx.role.create({
        data: { tenantId: tenant.id, name: 'MANAGER', description: 'Quản lý đội ngũ' }
      })
      const salesRepRole = await tx.role.create({
        data: { tenantId: tenant.id, name: 'SALES_REP', description: 'Nhân viên kinh doanh' }
      })

      // 3. Gán quyền manage:all cho ADMIN
      const systemManageAll = await tx.permission.findFirst({
        where: { action: 'manage', subject: 'all' }
      })
      if (systemManageAll) {
        await tx.rolePermission.create({
          data: { roleId: adminRole.id, permissionId: systemManageAll.id }
        })
      }

      // 4. Gán quyền cho MANAGER & SALES_REP
      const allDomainPerms = await tx.permission.findMany({
        where: { subject: { in: ['Contact', 'Deal', 'Task', 'Activity'] } }
      })
      for (const perm of allDomainPerms) {
        // MANAGER
        await tx.rolePermission.create({
          data: { roleId: managerRole.id, permissionId: perm.id }
        })
        // SALES_REP (ABAC)
        const isSubjectRestricted = ['Contact', 'Deal', 'Activity'].includes(perm.subject)
        await tx.rolePermission.create({
          data: {
            roleId: salesRepRole.id,
            permissionId: perm.id,
            conditions: isSubjectRestricted 
              ? (perm.subject === 'Activity' ? { userId: '${user.id}' } : { ownerId: '${user.id}' })
              : undefined
          }
        })
      }

      // 5. Tạo người dùng ADMIN đầu tiên
      const user = await tx.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          password: payload.hashedPassword,
          roleId: adminRole.id,
          tenantId: tenant.id,
        },
        include: { role: true },
      })

      return {
        ...user,
        role: user.role.name as any, // Trả về dạng chuỗi tương thích ngược
      }
    })
  }

  async createUserAndAcceptInvitation(payload: {
    email: string
    name: string
    hashedPassword: string
    roleId: string
    tenantId: string
    invitationId: string
  }) {
    return this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          password: payload.hashedPassword,
          roleId: payload.roleId,
          tenantId: payload.tenantId,
        },
        include: { role: true },
      })

      await tx.invitation.update({
        where: { id: payload.invitationId },
        data: { status: 'ACCEPTED' },
      })

      return {
        ...user,
        role: user.role.name, // Map sang tên vai trò dạng chuỗi
      }
    })
  }
}