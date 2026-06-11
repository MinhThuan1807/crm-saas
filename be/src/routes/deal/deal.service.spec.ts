import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { DealService } from './deal.service'
import { DealRepository } from './deal.repo'
import { DealStageConst } from './deal.model'
import { ContactsRepository } from '../contacts/contacts.repo'

// ─── Mock data ───────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-1'
const DEAL_ID = 'deal-1'

const mockDeal = {
  id: DEAL_ID,
  tenantId: TENANT_ID,
  contactId: 'contact-1',
  ownerId: 'owner-1',
  title: 'Test Deal',
  value: 1000,
  stage: DealStageConst.PROSPECT,
  closeDate: null,
  note: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  contact: { id: 'contact-1', name: 'John Doe' },
  owner: { id: 'owner-1', name: 'Jane Smith' },
}

const mockDealWithRelations = {
  ...mockDeal,
  tasks: [],
  activities: [],
  aiSuggestions: [],
}

// ─── Mock Repository ─────────────────────────────────────────────────────────

const mockDealRepo = {
  findAllByTenant: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStage: jest.fn(),
  softDelete: jest.fn(),
}

const mockContactsRepo = {
  findOne: jest.fn(),
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DealService', () => {
  let service: DealService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealService,
        { provide: DealRepository, useValue: mockDealRepo },
        { provide: ContactsRepository, useValue: mockContactsRepo },
      ],
    }).compile()

    service = module.get<DealService>(DealService)
    jest.clearAllMocks()
  })

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should call repo.create with tenantId and body', async () => {
      mockDealRepo.create.mockResolvedValue(mockDeal)

      const body = {
        title: 'New Deal',
        contactId: 'contact-1',
        ownerId: 'owner-1',
        value: 500,
        stage: DealStageConst.PROSPECT,
        closeDate: undefined,
        note: undefined,
      }

      const result = await service.create(TENANT_ID, body)

      expect(mockDealRepo.create).toHaveBeenCalledWith(TENANT_ID, body)
      expect(result).toEqual(mockDeal)
    })
  })

  // ── getPipeline ───────────────────────────────────────────────────────────

  describe('getPipeline', () => {
    it('should return object with all 5 stage keys even when no deals', async () => {
      mockDealRepo.findAllByTenant.mockResolvedValue([])

      const result = await service.getPipleline(TENANT_ID)

      expect(Object.keys(result)).toHaveLength(5)
      expect(result).toEqual({
        PROSPECT: [],
        QUALIFIED: [],
        PROPOSAL: [],
        CLOSED_WON: [],
        CLOSED_LOST: [],
      })
    })

    it('should group deals by stage correctly', async () => {
      const deals = [
        { ...mockDeal, id: 'deal-1', stage: DealStageConst.PROSPECT },
        { ...mockDeal, id: 'deal-2', stage: DealStageConst.PROSPECT },
        { ...mockDeal, id: 'deal-3', stage: DealStageConst.QUALIFIED },
      ]
      mockDealRepo.findAllByTenant.mockResolvedValue(deals)

      const result = await service.getPipleline(TENANT_ID)

      expect(result.PROSPECT).toHaveLength(2)
      expect(result.QUALIFIED).toHaveLength(1)
      expect(result.PROPOSAL).toHaveLength(0)
      expect(result.CLOSED_WON).toHaveLength(0)
      expect(result.CLOSED_LOST).toHaveLength(0)
    })

    it('should call findAllByTenant with correct tenantId', async () => {
      mockDealRepo.findAllByTenant.mockResolvedValue([])

      await service.getPipleline(TENANT_ID)

      expect(mockDealRepo.findAllByTenant).toHaveBeenCalledWith(TENANT_ID)
    })
  })

  // ── getDealById ───────────────────────────────────────────────────────────

  describe('getDealById', () => {
    it('should return deal when found', async () => {
      mockDealRepo.findOne.mockResolvedValue(mockDealWithRelations)

      const result = await service.getDealById(DEAL_ID, TENANT_ID)

      expect(result).toEqual(mockDealWithRelations)
      expect(mockDealRepo.findOne).toHaveBeenCalledWith(DEAL_ID, TENANT_ID)
    })

    it('should throw NotFoundException when deal not found', async () => {
      mockDealRepo.findOne.mockResolvedValue(null)

      await expect(service.getDealById(DEAL_ID, TENANT_ID)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException for deal from another tenant', async () => {
      mockDealRepo.findOne.mockResolvedValue(null) // repo returns null for wrong tenant

      await expect(service.getDealById(DEAL_ID, 'other-tenant')).rejects.toThrow(NotFoundException)
    })
  })

  // ── updateDealStage ───────────────────────────────────────────────────────

  describe('updateDealStage', () => {
    it('should update stage when deal exists', async () => {
      const updatedDeal = { ...mockDeal, stage: DealStageConst.QUALIFIED }
      mockDealRepo.findOne.mockResolvedValue(mockDeal)
      mockDealRepo.updateStage.mockResolvedValue(updatedDeal)

      const result = await service.updateDealStage(DEAL_ID, TENANT_ID, DealStageConst.QUALIFIED)

      expect(mockDealRepo.updateStage).toHaveBeenCalledWith(DEAL_ID, TENANT_ID, DealStageConst.QUALIFIED)
      expect(result.stage).toBe(DealStageConst.QUALIFIED)
    })

    it('should throw NotFoundException when deal not found', async () => {
      mockDealRepo.findOne.mockResolvedValue(null)

      await expect(service.updateDealStage(DEAL_ID, TENANT_ID, DealStageConst.QUALIFIED)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should not call updateStage when deal not found', async () => {
      mockDealRepo.findOne.mockResolvedValue(null)

      await expect(service.updateDealStage(DEAL_ID, TENANT_ID, DealStageConst.QUALIFIED)).rejects.toThrow()

      expect(mockDealRepo.updateStage).not.toHaveBeenCalled()
    })
  })

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update deal when it exists', async () => {
      const updatedDeal = { ...mockDeal, title: 'Updated Title' }
      mockDealRepo.findOne.mockResolvedValue(mockDeal)
      mockDealRepo.update.mockResolvedValue(updatedDeal)

      const result = await service.update(DEAL_ID, TENANT_ID, { title: 'Updated Title' })

      expect(mockDealRepo.update).toHaveBeenCalledWith(DEAL_ID, TENANT_ID, { title: 'Updated Title' })
      expect(result.title).toBe('Updated Title')
    })

    it('should throw NotFoundException when deal not found', async () => {
      mockDealRepo.findOne.mockResolvedValue(null)

      await expect(service.update(DEAL_ID, TENANT_ID, { title: 'x' })).rejects.toThrow(NotFoundException)
    })
  })

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should soft delete deal and return success message', async () => {
      mockDealRepo.findOne.mockResolvedValue(mockDeal)
      mockDealRepo.softDelete.mockResolvedValue({ ...mockDeal, deletedAt: new Date() })

      const result = await service.delete(DEAL_ID, TENANT_ID)

      expect(mockDealRepo.softDelete).toHaveBeenCalledWith(DEAL_ID, TENANT_ID)
      expect(result).toEqual({ message: 'Xóa deal thành công' })
    })

    it('should throw NotFoundException when deal not found', async () => {
      mockDealRepo.findOne.mockResolvedValue(null)

      await expect(service.delete(DEAL_ID, TENANT_ID)).rejects.toThrow(NotFoundException)
    })

    it('should not call softDelete when deal not found', async () => {
      mockDealRepo.findOne.mockResolvedValue(null)

      await expect(service.delete(DEAL_ID, TENANT_ID)).rejects.toThrow()

      expect(mockDealRepo.softDelete).not.toHaveBeenCalled()
    })
  })
})
