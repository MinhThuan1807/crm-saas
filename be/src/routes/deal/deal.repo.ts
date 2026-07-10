import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { CreateDealBodyType, DealStageConst, DealStageType, UpdateDealBodyType } from './deal.model'

@Injectable()
export class DealRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findAllByTenant(filters?: { ownerId?: string }) {
    return this.prismaService.deal.findMany({
      where: { 
        deletedAt: null,
        ...(filters?.ownerId && { ownerId: filters.ownerId })
      },
      include: {
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  findDealsByStage(stage: DealStageType, filters?: { ownerId?: string }) {
    return this.prismaService.deal.findMany({
      where: { 
        stage: stage, 
        deletedAt: null,
        ...(filters?.ownerId && { ownerId: filters.ownerId })
      },
      include: {
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    })
  }

  findOne(dealId: string, filters?: { ownerId?: string }) {
    return this.prismaService.deal.findFirst({
      where: { 
        id: dealId, 
        deletedAt: null,
        ...(filters?.ownerId && { ownerId: filters.ownerId })
      },
      include: {
        contact: true,
        owner: { select: { id: true, name: true, email: true } },
        tasks: { orderBy: { createdAt: 'asc' } },
        activities: { orderBy: { date: 'desc' }, take: 20 },
        aiSuggestions: { orderBy: { createdAt: 'desc' } },
      },
    })
  }

  create(data: CreateDealBodyType) {
    return this.prismaService.deal.create({
      data: {
        ownerId: data.ownerId,
        title: data.title,
        value: data.value ?? 0,
        stage: DealStageConst.PROSPECT,
        contactId: data.contactId,
        closeDate: data.closeDate ?? null,
        note: data.note ?? null,
      } as any,
    })
  }

  update(dealId: string, data: UpdateDealBodyType) {
    return this.prismaService.deal.update({
      where: { id: dealId, deletedAt: null },
      data,
    })
  }

  updateStage(dealId: string, stage: DealStageType) {
    return this.prismaService.deal.update({
      where: { id: dealId, deletedAt: null },
      data: { stage },
    })
  }

  softDelete(dealId: string) {
    return this.prismaService.deal.update({
      where: { id: dealId, deletedAt: null },
      data: { deletedAt: new Date() },
    })
  }

  // Tạo Deal mới đi kèm stage tùy chọn (dành cho Import Excel)
  createWithStage(data: {
    ownerId: string
    title: string
    value: number
    stage: DealStageType
    contactId: string
    closeDate?: Date | null
    note?: string | null
  }) {
    return this.prismaService.deal.create({
      data: {
        ownerId: data.ownerId,
        title: data.title,
        value: data.value,
        stage: data.stage,
        contactId: data.contactId,
        closeDate: data.closeDate ?? null,
        note: data.note ?? null,
      } as any,
    })
  }
}

