import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/services/prisma.service";
import { GetAuditLogsQueryType } from "./audit-logs.model";

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(
    params: {
    tenantId: string,
    userId: string
    action: string,
    targetType: string,
    targetId: string,
    targetName?: string | null,
    changes: any;
  }
  )  {
    return this.prismaService.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetName: params.targetName ?? null,
        changes: params.changes
      }
    })
  }

  async getLogsByTenant(params: {
    tenantId: string,
    query: GetAuditLogsQueryType,
  }){
    return this.prismaService.auditLog.findMany({
      where: {
        ...(params.query.action && { action: params.query.action }),
        ...(params.query.targetType && { targetType: params.query.targetType }),
        ...(params.query.userId && { userId: params.query.userId }),
        ...(params.query.search && {
          OR: [
            { targetName: { contains: params.query.search, mode: 'insensitive' } },
            { user: { name: { contains: params.query.search, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      take: params.query.limit + 1,
      cursor: params.query.cursor ? { id: params.query.cursor } : undefined,
      skip: params.query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    })
  }
}
