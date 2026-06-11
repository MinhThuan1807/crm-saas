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
import { AiService } from '../ai/ai.service'
import { ContactsRepository } from '../contacts/contacts.repo'
import { ROLE } from 'src/common/constants/role.constanst'

@Injectable()
export class DealService {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly aiService: AiService,
    private readonly contactsRepo: ContactsRepository,
  ) {}

  async create(tenantId: string, data: CreateDealBodyType, userContext?: { userId: string; role: string }) {
    if (userContext?.role === ROLE.SALES_REP) {
      if (data.ownerId !== userContext.userId) {
        throw new ForbiddenException('Bạn chỉ có thể tạo deal do chính mình sở hữu')
      }
      const contact = await this.contactsRepo.findOne(data.contactId, tenantId, userContext)
      if (!contact) {
        throw new NotFoundException('Liên hệ không tồn tại')
      }
    }
    return this.dealRepo.create(tenantId, data)
  }

  async getPipleline(tenantId: string, userContext?: { userId: string; role: string }) {
    const deals = await this.dealRepo.findAllByTenant(tenantId, userContext)

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
    const deal = await this.dealRepo.findOne(dealId, tenantId, userContext)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }
    return deal
  }

  async update(dealId: string, tenantId: string, body: UpdateDealBodyType, userContext?: { userId: string; role: string }) {
    const deal = await this.dealRepo.findOne(dealId, tenantId, userContext)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }
    return this.dealRepo.update(dealId, tenantId, body)
  }

  async updateDealStage(dealId: string, tenantId: string, stage: DealStageType, userContext?: { userId: string; role: string }) {
    const deal = await this.dealRepo.findOne(dealId, tenantId, userContext)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }
    if (!Object.values(DealStageConst).includes(stage)) {
      throw new UnprocessableEntityException('Giai đoạn không hợp lệ')
    }

    return this.dealRepo.updateStage(dealId, tenantId, stage)
  }

  async delete(dealId: string, tenantId: string, userContext?: { userId: string; role: string }) {
    const deal = await this.dealRepo.findOne(dealId, tenantId, userContext)
    if (!deal) {
      throw new NotFoundException('Không tìm thấy deal')
    }
    await this.dealRepo.softDelete(dealId, tenantId)
    return { message: 'Xóa deal thành công' }
  }

  async analyze(
    dealId: string,
    tenantId: string,
    userId: string,
    body: AnalyzeDealBodyType,
    userContext?: { userId: string; role: string },
  ): Promise<AnalyzeDealResType> {
    const deal = await this.dealRepo.findOne(dealId, tenantId, userContext)
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
}
