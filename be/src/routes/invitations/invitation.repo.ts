import { Injectable } from '@nestjs/common'
import { RoleType } from 'src/common/constants/role.constanst'
import { PrismaService } from 'src/common/services/prisma.service'

@Injectable()
export class InvitationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(payload: {
    email: string
    role: RoleType
    tenantId: string
    token: string
    expiresAt: Date
  }) {
    return this.prismaService.invitation.create({
      data: { ...payload, status: 'PENDING' },
    })
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findManyByTenant(tenantId: string) {
    return this.prismaService.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    return this.prismaService.invitation.findFirst({
      where: { id, tenantId },
    })
  }

  async findByToken(token: string) {
    return this.prismaService.invitation.findUnique({
      where: { token },
      include: { tenant: { select: { name: true } } },
    })
  }

  async findByTokenOnly(token: string) {
    return this.prismaService.invitation.findUnique({
      where: { token },
    })
  }

  async findDuplicateEmail(email: string, tenantId: string, excludeId: string) {
    return this.prismaService.invitation.findFirst({
      where: {
        tenantId,
        email,
        id: { not: excludeId },
      },
    })
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED') {
    return this.prismaService.invitation.update({
      where: { id },
      data: { status },
    })
  }

  async update(id: string, data: Partial<{ email: string; role: RoleType; token: string; expiresAt: Date }>) {
    return this.prismaService.invitation.update({
      where: { id },
      data,
    })
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async deleteManyByEmail(email: string) {
    return this.prismaService.invitation.deleteMany({
      where: { email },
    })
  }

  async deleteById(id: string) {
    return this.prismaService.invitation.delete({
      where: { id },
    })
  }
}