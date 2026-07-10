import { Injectable, NotFoundException, UnprocessableEntityException, ForbiddenException } from '@nestjs/common'
import {
  CreateDealBodyType,
  DealStageConst,
  DealStageType,
  DealCardRes,
  UpdateDealBodyType,
  DealCardSchema,
  AnalyzeDealBodyType,
  AnalyzeDealResType,
} from './deal.model'
import { DealRepository } from './deal.repo'
import { TaskRepository } from './task.repo'
import { CreateTaskBodyType, UpdateTaskBodyType } from './task.model'
import { AiService } from '../ai/ai.service'
import { ContactsRepository } from '../contacts/contacts.repo'
import { RedisService } from 'src/common/services/redis.service'
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CaslAbilityFactory } from 'src/common/casl/casl-ability.factory'
import { subject } from '@casl/ability'

export function getChangesDiff(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  const ignoredFields = ['updatedAt', 'createdAt', 'deletedAt', 'tenantId', 'id'];
  for (const key of Object.keys(newObj)) {
    if (ignoredFields.includes(key)) continue;
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    // Compare string/object or Decimal
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
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async create(tenantId: string, data: CreateDealBodyType, user: { userId: string; role: string; tenantId: string }) {
    const ability = await this.caslAbilityFactory.createForUser(user);

    // Check Deal creation permission
    if (ability.cannot('create', 'Deal')) {
      throw new ForbiddenException('Bạn không có quyền tạo deal');
    }

    // If only allowed to create deals owned by oneself
    if (ability.cannot('manage', 'all')) {
      if (data.ownerId !== user.userId) {
        throw new ForbiddenException('Bạn chỉ có thể tạo deal do chính mình sở hữu');
      }
      const contact = await this.contactsRepo.findOne(data.contactId);
      if (!contact || ability.cannot('read', subject('Contact', contact as unknown as Record<string, unknown>))) {
        throw new NotFoundException('Liên hệ không tồn tại');
      }
    }

    const deal = await this.dealRepo.create(data)
    await this.redisService.invalidateTenantCache(tenantId)

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, val] of Object.entries(deal)) {
      if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
      changes[key] = { old: null, new: val };
    }
    await this.auditLogsService.logAction({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      targetType: 'DEAL',
      targetId: deal.id,
      targetName: deal.title,
      changes,
    });

    return deal
  }

  async getPipleline(tenantId: string, user: { userId: string; role: string; tenantId: string }) {
    const ability = await this.caslAbilityFactory.createForUser(user);
    const filters: { ownerId?: string } = {};
    if (ability.cannot('read', 'Deal')) {
      throw new ForbiddenException('Bạn không có quyền xem cơ hội bán hàng');
    }

    if (ability.cannot('read', subject('Deal', { ownerId: 'other' } as any))) {
      filters.ownerId = user.userId;
    }

    const deals = await this.dealRepo.findAllByTenant(filters)

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

  async getDealById(dealId: string, tenantId: string, user: { userId: string; role: string; tenantId: string }) {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('read', subject('Deal', deal as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Không tìm thấy deal') // 404 to prevent scanning
    }
    return deal
  }

  async update(dealId: string, tenantId: string, body: UpdateDealBodyType, user: { userId: string; role: string; tenantId: string }) {
    const oldDeal = await this.dealRepo.findOne(dealId)
    if (!oldDeal) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('update', subject('Deal', oldDeal as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const updated = await this.dealRepo.update(dealId, body)
    await this.redisService.invalidateTenantCache(tenantId)

    const changes = getChangesDiff(oldDeal, body)
    if (Object.keys(changes).length > 0) {
      await this.auditLogsService.logAction({
        tenantId,
        userId: user.userId,
        action: 'UPDATE',
        targetType: 'DEAL',
        targetId: dealId,
        targetName: updated.title,
        changes,
      });
    }
    return updated
  }

  async updateDealStage(dealId: string, tenantId: string, stage: DealStageType, user: { userId: string; role: string; tenantId: string }) {
    const oldDeal = await this.dealRepo.findOne(dealId)
    if (!oldDeal) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('update', subject('Deal', oldDeal as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    if (!Object.values(DealStageConst).includes(stage)) {
      throw new UnprocessableEntityException('Giai đoạn không hợp lệ')
    }

    const updated = await this.dealRepo.updateStage(dealId, stage)
    await this.redisService.invalidateTenantCache(tenantId)

    const changes = {
      stage: { old: oldDeal.stage, new: stage }
    };
    await this.auditLogsService.logAction({
      tenantId,
      userId: user.userId,
      action: 'UPDATE',
      targetType: 'DEAL',
      targetId: dealId,
      targetName: updated.title,
      changes,
    });

    return updated
  }

  async delete(dealId: string, tenantId: string, user: { userId: string; role: string; tenantId: string }) {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('delete', subject('Deal', deal as unknown as Record<string, unknown>))) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    await this.dealRepo.softDelete(dealId)
    await this.redisService.invalidateTenantCache(tenantId)

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, val] of Object.entries(deal)) {
      if (['createdAt', 'updatedAt', 'deletedAt', 'id', 'tenantId'].includes(key)) continue;
      changes[key] = { old: val, new: null };
    }
    await this.auditLogsService.logAction({
      tenantId,
      userId: user.userId,
      action: 'DELETE',
      targetType: 'DEAL',
      targetId: dealId,
      targetName: deal.title,
      changes,
    });

    return { message: 'Xóa deal thành công' }
  }

  async analyze(
    dealId: string,
    tenantId: string,
    userId: string,
    body: AnalyzeDealBodyType,
    user: { userId: string; role: string; tenantId: string },
  ): Promise<AnalyzeDealResType> {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('read', subject('Deal', deal as any))) {
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

  // ─── SECURITY RULES FOR TASK OPERATIONS BASED ON DEAL PERMISSIONS ───

  async createTask(dealId: string, tenantId: string, data: CreateTaskBodyType, user: { userId: string; role: string; tenantId: string }) {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) throw new NotFoundException('Không tìm thấy deal')

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('update', subject('Deal', deal as any))) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const task = await this.taskRepo.create(dealId, tenantId, data)
    await this.redisService.invalidateTenantCache(tenantId)
    return task
  }

  async createTasksBulk(dealId: string, tenantId: string, tasks: CreateTaskBodyType[], user: { userId: string; role: string; tenantId: string }) {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) throw new NotFoundException('Không tìm thấy deal')

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('update', subject('Deal', deal as any))) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const result = await this.taskRepo.createMany(dealId, tenantId, tasks)
    await this.redisService.invalidateTenantCache(tenantId)
    return result
  }

  async updateTask(dealId: string, tenantId: string, taskId: string, data: UpdateTaskBodyType, user: { userId: string; role: string; tenantId: string }) {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) throw new NotFoundException('Không tìm thấy deal')

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('update', subject('Deal', deal as any))) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const task = await this.taskRepo.update(dealId, taskId, data)
    await this.redisService.invalidateTenantCache(tenantId)
    return task
  }

  async deleteTask(dealId: string, tenantId: string, taskId: string, user: { userId: string; role: string; tenantId: string }) {
    const deal = await this.dealRepo.findOne(dealId)
    if (!deal) throw new NotFoundException('Không tìm thấy deal')

    const ability = await this.caslAbilityFactory.createForUser(user);
    if (ability.cannot('update', subject('Deal', deal as any))) {
      throw new NotFoundException('Không tìm thấy deal')
    }

    const result = await this.taskRepo.delete(dealId, taskId)
    await this.redisService.invalidateTenantCache(tenantId)
    return result
  }
}
