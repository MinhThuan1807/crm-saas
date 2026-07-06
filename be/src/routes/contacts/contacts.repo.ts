import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { CreateContactBodyType, GetContactsQueryType } from './contacts.model'
import { ROLE } from 'src/common/constants/role.constanst'

@Injectable()
export class ContactsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(tenantId: string, ownerId: string, data: CreateContactBodyType) {
    return this.prismaService.contact.create({
      data: {
        tenantId,
        ownerId,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        position: data.position ?? null,
        tags: data.tags ?? []
      },
    })
  }

  findAll(tenantId: string, query: GetContactsQueryType, userContext?: { userId: string; role: string }) {
    const isSalesRep = userContext?.role === ROLE.SALES_REP
    return this.prismaService.contact.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(isSalesRep && { ownerId: userContext.userId }),
        ...(query.tag && {
          tags: {
            has: query.tag,
          },
        }),
        OR: query.search
          ? [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        deals: { where: { deletedAt: null } },
        activities: { orderBy: { date: 'desc' }, take: 10 },
      },
      take: query.limit + 1, // take 1 more to check if there is a next page
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    })
  }

  findOne(contactId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const isSalesRep = userContext?.role === ROLE.SALES_REP
    return this.prismaService.contact.findFirst({
      where: { 
        id: contactId, 
        tenantId, 
        deletedAt: null,
        ...(isSalesRep && { ownerId: userContext.userId }),
      },
      include: {
        deals: { where: { deletedAt: null } },
        activities: { orderBy: { date: 'desc' }, take: 10 },
      },
    })
  }

  update(contactId: string, tenantId: string, data: Partial<CreateContactBodyType>) {
    return this.prismaService.contact.update({
      where: { id: contactId, tenantId, deletedAt: null },
      data: { ...data },
    })
  }

  // soft delete, only updates the deletedAt field
  delete(contactId: string, tenantId: string) {
    return this.prismaService.contact.update({
      where: { id: contactId, tenantId },
      data: { deletedAt: new Date() },
    })
  }

  findDeleted(contactId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const isSalesRep = userContext?.role === ROLE.SALES_REP
    return this.prismaService.contact.findFirst({
      where: { 
        id: contactId, 
        tenantId, 
        deletedAt: { not: null },
        ...(isSalesRep && { ownerId: userContext.userId }),
      },
    })
  }
  restore(contactId: string, tenantId: string) {
    return this.prismaService.contact.update({
      where: { id: contactId, tenantId },
      data: { deletedAt: null },
    })
  }
}

