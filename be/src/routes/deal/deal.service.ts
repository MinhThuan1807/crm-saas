import { Injectable, NotFoundException, UnprocessableEntityException, ForbiddenException } from '@nestjs/common'
import {
  CreateDealBodyType,
  DealStageConst,
  DealStageType,
  DealCardRes,
  UpdateDealBodyType,
  GetDealsPipelineResSchema,
  GetDealsPipelineResType,
  DealCardSchema,
  AnalyzeDealBodyType,
  AnalyzeDealResType,
} from './deal.model'
import { DealRepository } from './deal.repo'
import { TaskRepository } from './task.repo'
import { CreateTaskBodyType, UpdateTaskBodyType } from './task.model'
import { AiService } from '../ai/ai.service'
import { ContactsRepository } from '../contacts/contacts.repo'
import { ROLE } from 'src/common/constants/role.constanst'
import { RedisService } from 'src/common/services/redis.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service';

export function getChangesDiff(oldObj: any, newObj: any): Record<string, { old: any; new: any }> {
  const diff: Record<string, { old: any; new: any }> = {};
  const ignoredFields = ['updatedAt', 'createdAt', 'deletedAt', 'tenantId', 'id'];
  for (const key of Object.keys(newObj)) {
    if (ignoredFields.includes(key)) continue;
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    // So sánh chuỗi/đối tượng hoặc Decimal
    const strOld = oldVal !== null && oldVal !== undefined ? String(oldVal) : '';
    const strNew = newVal !== null && newVal !== undefined ? String(newVal) : '';
    if (strOld !== strNew) {
      if (oldVal === null && newVal === undefined) continue;
      if (oldVal === undefined && newVal === null) continue;
      diff[key] = {
        old: oldVal !== undefined ? oldVal : null,
        new: newVal !== undefined ? newVal : null,
      };
    }
  }
  return diff;
}


@Injectable()
export class DealService {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly aiService: AiService,
    private readonly contactsRepo: ContactsRepository,
    private readonly taskRepo: TaskRepository,
    private readonly redisService: RedisService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(tenantId: string, data: CreateDealBodyType, userContext?: { userId: string; role: string }) {
    if (userContext?.role === ROLE.SALES_REP) {
      if (data.ownerId !== userContext.userId) {
        throw new ForbiddenException('Bạn chỉ có thể tạo deal do chính mình sở hữu')
      }
      const contact = await this.contactsRepo.findOne(data.contactId, userContext)
      if (!contact) {
        throw new NotFoundException('Liên hệ không tồn tại')
      }
    }
    const deal = await this.dealRepo.create(data)
    await this.redisService.invalidateTenantCache(tenantId)

    // Log action to audit logs
    if (userContext) {
      const changes: any = {};
      for (const [key, val] of Object.entries(deal)) {
        if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
        changes[key] = { old: null, new: val };
      }
      await this.auditLogsService.logAction({
        tenantId,
        userId: userContext.userId,
        action: 'CREATE',
        targetType: 'DEAL',
        targetId: deal.id,
        targetName: deal.title,
        changes,
      });
    }
    return deal
  }

  async getPipleline(tenantId: string, userContext?: { userId: string; role: string }) {
    const deals = await this.dealRepo.findAllByTenant(userContext)

    const stageMap: Record<DealStageType, DealCardRes[]> = {
      [DealStageConst.PROSPECT]: [],
      [DealStageConst.QUALIFIED]: [],
      [DealStageConst.PROPOSAL]: [],
      [DealStageConst.CLOSED_WON]: [],
      [DealStageConst.CLOSED_LOST]: [],
    }
    deals.forEach((deal) => {
      const parsed = DealCardSchema.parse(deal)
      stageMap[deal.stage].push(parsed)
    })
    return stageMap
  }

  async getDealById(dealId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const deal = await this.dealRepo.findOne(dealId, userContext)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }
    return deal
  }

  async update(dealId: string, tenantId: string, body: UpdateDealBodyType, userContext?: { userId: string; role: string }) {
    const oldDeal = await this.dealRepo.findOne(dealId, userContext)
    if (!oldDeal) {
      throw new NotFoundException('Không tìm thấy deal')
    }
    const updated = await this.dealRepo.update(dealId, body)
    await this.redisService.invalidateTenantCache(tenantId)
    if (userContext) {
      const changes = getChangesDiff(oldDeal, body)
      if (Object.keys(changes).length > 0) {
        await this.auditLogsService.logAction({
          tenantId,
          userId: userContext.userId,
          action: 'UPDATE',
          targetType: 'DEAL',
          targetId: dealId,
          targetName: updated.title,
          changes,
        });
      }
    }
    return updated
  }

  async updateDealStage(dealId: string, tenantId: string, stage: DealStageType, userContext?: { userId: string; role: string }) {
    const oldDeal = await this.dealRepo.findOne(dealId, userContext)
    if (!oldDeal) {
      throw new NotFoundException('Không tìm thấy deal')
    }
    if (!Object.values(DealStageConst).includes(stage)) {
      throw new UnprocessableEntityException('Giai đoạn không hợp lệ')
    }
    const updated = await this.dealRepo.updateStage(dealId, stage)
    await this.redisService.invalidateTenantCache(tenantId)
    if (userContext) {
      const changes = {
        stage: { old: oldDeal.stage, new: stage }
      };
      await this.auditLogsService.logAction({
        tenantId,
        userId: userContext.userId,
        action: 'UPDATE',
        targetType: 'DEAL',
        targetId: dealId,
        targetName: updated.title,
        changes,
      });
    }
    return updated
  }

  async delete(dealId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const deal = await this.dealRepo.findOne(dealId, userContext)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }
    await this.dealRepo.softDelete(dealId)
    await this.redisService.invalidateTenantCache(tenantId)

    if (userContext) {
      const changes: any = {};
      for (const [key, val] of Object.entries(deal)) {
        if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
        changes[key] = { old: val, new: null };
      }
      await this.auditLogsService.logAction({
        tenantId,
        userId: userContext.userId,
        action: 'DELETE',
        targetType: 'DEAL',
        targetId: dealId,
        targetName: deal.title,
        changes,
      });
    }

    return { message: 'Xóa deal thành công' }
  }

  async analyze(
    dealId: string,
    tenantId: string,
    userId: string,
    body: AnalyzeDealBodyType,
    userContext?: { userId: string; role: string },
  ): Promise<AnalyzeDealResType> {
    const deal = await this.dealRepo.findOne(dealId, userContext)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    if (!body || typeof body.meetingNote !== 'string') {
      throw new UnprocessableEntityException('Thiếu trường meetingNote')
    }

    const jobId = await this.aiService.enqueueAnalysis({
      dealId,
      tenantId,
      userId,
      meetingNote: body.meetingNote,
    })

    return { jobId }
  }

  async createTask(dealId: string, tenantId: string, data: CreateTaskBodyType) {
    const task = await this.taskRepo.create(dealId, data)
    await this.redisService.invalidateTenantCache(tenantId)
    return task
  }

  async createTasksBulk(dealId: string, tenantId: string, tasks: CreateTaskBodyType[]) {
    const result = await this.taskRepo.createMany(dealId, tasks)
    await this.redisService.invalidateTenantCache(tenantId)
    return result
  }

  async updateTask(dealId: string, tenantId: string, taskId: string, data: UpdateTaskBodyType) {
    const task = await this.taskRepo.update(dealId, taskId, data)
    await this.redisService.invalidateTenantCache(tenantId)
    return task
  }

  async deleteTask(dealId: string, tenantId: string, taskId: string) {
    const result = await this.taskRepo.delete(dealId, taskId)
    await this.redisService.invalidateTenantCache(tenantId)
    return result
  }
}
