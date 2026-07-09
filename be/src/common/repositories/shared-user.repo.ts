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

  async createTenantIncludeUser(payload: {
    companyName: string
    slug: string
    email: string
    name: string
    hashedPassword: string
    role: RoleType
  }): Promise<UserType> {
    const tenant = await this.prismaService.tenant.create({
      data: {
        name: payload.companyName,
        slug: payload.slug,
        users: {
          create: {
            email: payload.email,
            name: payload.name,
            password: payload.hashedPassword,
            role: payload.role,
          },
        },
      },
      include: { users: true },
    })
    return tenant.users[0]
  }

  /**
   * Creates a new user from an invitation and marks the invitation as ACCEPTED
   * within a single transaction to ensure data integrity.
   */
  async createUserAndAcceptInvitation(payload: {
    email: string
    name: string
    hashedPassword: string
    role: RoleType
    tenantId: string
    invitationId: string
  }) {
    return this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          password: payload.hashedPassword,
          role: payload.role,
          tenantId: payload.tenantId,
        },
      })

      await tx.invitation.update({
        where: { id: payload.invitationId },
        data: { status: 'ACCEPTED' },
      })

      return user
    })
  }
}