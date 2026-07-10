import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { CreateContactBodyType, GetContactsQueryType } from './contacts.model'

@Injectable()
export class ContactsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(ownerId: string, data: CreateContactBodyType) {
    return this.prismaService.contact.create({
      data: {
        ownerId,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        position: data.position ?? null,
        tags: data.tags ?? []
      } as any,
    })
  }

  findAll(query: GetContactsQueryType, filters?: { ownerId?: string }) {
    return this.prismaService.contact.findMany({
      where: {
        deletedAt: null,
        ...(filters?.ownerId && { ownerId: filters.ownerId }),
        ...(query.tag && {
          tags: { has: query.tag },
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
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    })
  }

  findOne(contactId: string, filters?: { ownerId?: string }) {
    return this.prismaService.contact.findFirst({
      where: { 
        id: contactId, 
        deletedAt: null,
        ...(filters?.ownerId && { ownerId: filters.ownerId }),
      },
      include: {
        deals: { where: { deletedAt: null } },
        activities: { orderBy: { date: 'desc' }, take: 10 },
      },
    })
  }

  update(contactId: string, data: Partial<CreateContactBodyType>) {
    return this.prismaService.contact.update({
      where: { id: contactId, deletedAt: null },
      data: { ...data },
    })
  }

  delete(contactId: string) {
    return this.prismaService.contact.update({
      where: { id: contactId },
      data: { deletedAt: new Date() },
    })
  }

  findDeleted(contactId: string, filters?: { ownerId?: string }) {
    return this.prismaService.contact.findFirst({
      where: { 
        id: contactId, 
        deletedAt: { not: null },
        ...(filters?.ownerId && { ownerId: filters.ownerId }),
      },
    })
  }

  restore(contactId: string) {
    return this.prismaService.contact.update({
      where: { id: contactId },
      data: { deletedAt: null },
    })
  }

  // Find User by email to assign as Owner
  findUserByEmail(email: string) {
    return this.prismaService.user.findFirst({
      where: { email },
    });
  }

  // Search for existing Contact by email or phone number
  findByEmailOrPhone(email?: string | null, phone?: string | null) {
    if (!email && !phone) return null;
    return this.prismaService.contact.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });
  }
}

