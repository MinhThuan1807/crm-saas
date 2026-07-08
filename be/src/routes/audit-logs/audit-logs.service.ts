import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repo';
import { GetAuditLogsQueryType } from './audit-logs.model';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}
  
  async logAction(params: {
    tenantId: string,
    userId: string
    action: string,
    targetType: string,
    targetId: string,
    targetName?: string | null,
    changes: any;
  }){
    return this.auditLogsRepository.create(params);
  }
  
  async getLogs(
    tenantId: string,
    query: GetAuditLogsQueryType
  ) {
    const limit = query.limit || 20;
    const {cursor, action, targetType, userId, search} = query;

    const logs = await this.auditLogsRepository.getLogsByTenant({
      tenantId,
      query: {
        limit,
        cursor,
        action,
        targetType,
        userId,
        search
      }
    });

    const hasNextPage = logs.length > limit;
    const data = hasNextPage ? logs.slice(0, -1) : logs;
    const nextCursor = hasNextPage ? logs[logs.length - 1].id : null;

    return { 
      data,
      pagination: {
        nextCursor,
        hasNextPage
      }
    };
  }
}
