import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { CreateDealBodyType, DealStageConst, DealStageType, UpdateDealBodyType } from './deal.model'

@Injectable()
export class DealRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAllByTenant(tenantId: string) {
    return this.prismaService.deal.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  findDealsByStage(stage: DealStageType) {
    return this.prismaService.deal.findMany({
      where: { stage: stage, deletedAt: null },
      include: {
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    })
  }

  findOne(dealId: string, tenantId: string) {
    return this.prismaService.deal.findFirst({
      where: { id: dealId, tenantId, deletedAt: null },
      include: {
        contact: true,
        owner: { select: { id: true, name: true, email: true } },
        tasks: { orderBy: { createdAt: 'asc' } },
        activities: { orderBy: { date: 'desc' }, take: 20 },
        aiSuggestions: { orderBy: { createdAt: 'desc' } },
      },
    })
  }

  create(tenantId: string, data: CreateDealBodyType) {
    return this.prismaService.deal.create({
      data: {
        tenantId,
        ownerId: data.ownerId,
        title: data.title,
        value: data.value ?? 0,
        stage: DealStageConst.PROSPECT,
        contactId: data.contactId,
        closeDate: data.closeDate ?? null,
        note: data.note ?? null,
      },
    })
  }

  update(dealId: string, tenantId: string, data: UpdateDealBodyType) {
    return this.prismaService.deal.update({
      where: { id: dealId, tenantId, deletedAt: null },
      data,
    })
  }

  updateStage(dealId: string, tenantId: string, stage: DealStageType) {
    return this.prismaService.deal.update({
      where: { id: dealId, tenantId, deletedAt: null },
      data: { stage },
    })
  }

  softDelete(dealId: string, tenantId: string) {
    return this.prismaService.deal.update({
      where: { id: dealId, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    })
  }
}
