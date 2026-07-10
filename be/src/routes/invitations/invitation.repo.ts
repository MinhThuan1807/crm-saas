import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'

@Injectable()
export class InvitationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(payload: {
    email: string
    roleId: string
    tenantId: string
    token: string
    expiresAt: Date
  }) {
    return this.prismaService.invitation.create({
      data: { ...payload, status: 'PENDING' },
      include: { role: true },
    })
  }

  async findManyByTenant(tenantId: string) {
    const invitations = await this.prismaService.invitation.findMany({
      where: { tenantId },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    })
    return invitations.map((inv) => ({
      ...inv,
      role: inv.role.name, // Map sang string
    }))
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    return this.prismaService.invitation.findFirst({
      where: { id, tenantId },
      include: { role: true },
    })
  }

  async findByToken(token: string) {
    return this.prismaService.invitation.findUnique({
      where: { token },
      include: { 
        tenant: { select: { name: true } },
        role: true 
      },
    })
  }

  async findByTokenOnly(token: string) {
    return this.prismaService.invitation.findUnique({
      where: { token },
      include: { role: true },
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

  async updateStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED') {
    return this.prismaService.invitation.update({
      where: { id },
      data: { status },
    })
  }

  async update(
    id: string,
    data: {
      email?: string;
      token?: string;
      expiresAt?: Date;
      status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
      roleId?: string;
    },
  ) {
    return this.prismaService.invitation.update({
      where: { id },
      data,
      include: { role: true },
    })
  }

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
