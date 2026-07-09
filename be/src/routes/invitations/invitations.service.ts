import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { HashingService } from 'src/common/services/hashing.service'
import { TokenService } from 'src/common/services/token.service'
import { MailService } from 'src/common/services/mail.service'
import { RedisService } from 'src/common/services/redis.service'
import { SharedUserRepository } from 'src/common/repositories/shared-user.repo'
import { InvitationRepository } from './invitation.repo'
import { CreateInvitationType, AcceptInvitationType, UpdateInvitationType } from './invitations.model'
import { v4 as uuidv4 } from 'uuid'
import envConfig from 'src/common/config'
import { PrismaService } from 'src/common/services/prisma.service'

@Injectable()
export class InvitationsService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly sharedUserRepo: SharedUserRepository,
    private readonly invitationRepo: InvitationRepository,
    private readonly prismaService: PrismaService
  ) {}

  // ─── CREATE INVITATION ────────────────────────────────────────────────────

async createInvitation(body: CreateInvitationType, tenantId: string) {
    const existingUser = await this.sharedUserRepo.findUniqueEmail(body.email)
    if (existingUser) {
      throw new ConflictException('Email này đã đăng ký tài khoản ở một workspace khác')
    }
    const tenant = await this.sharedUserRepo.findTenantUnique(tenantId)
    if (!tenant) {
      throw new NotFoundException('Không tìm thấy workspace')
    }
    // Tìm Role trong tenant dựa trên tên gửi lên
    const dbRole = await this.prismaService.role.findFirst({
      where: { tenantId, name: body.role }
    })
    if (!dbRole) {
      throw new BadRequestException('Vai trò không hợp lệ')
    }
    await this.invitationRepo.deleteManyByEmail(body.email)
    const token = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    const invitation = await this.invitationRepo.create({
      email: body.email,
      roleId: dbRole.id,
      token,
      expiresAt,
      tenantId,
    })
    const inviteLink = `${envConfig.FRONTEND_URL}/invite?token=${token}`
    await this.mailService.sendInvitationEmail({
      to: body.email,
      companyName: tenant.name,
      role: body.role,
      inviteLink,
    })
    return {
      ...invitation,
      role: body.role,
    }
  }


  // ─── GET INVITATIONS ──────────────────────────────────────────────────────

  async getInvitationsByTenant(tenantId: string) {
    return this.invitationRepo.findManyByTenant(tenantId)
  }

  // ─── REVOKE INVITATION ────────────────────────────────────────────────────

  async revokeInvitation(id: string, tenantId: string) {
    const invitation = await this.invitationRepo.findByIdAndTenant(id, tenantId)
    if (!invitation) {
      throw new NotFoundException('Không tìm thấy lời mời hoặc lời mời không thuộc workspace này')
    }

    return this.invitationRepo.deleteById(id)
  }

  // ─── VERIFY TOKEN ─────────────────────────────────────────────────────────

async verifyInvitationToken(token: string) {
    const invitation = await this.invitationRepo.findByToken(token)
    if (!invitation) {
      throw new BadRequestException('Lời mời không hợp lệ hoặc link đã hỏng')
    }
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Lời mời này đã được chấp nhận hoặc đã bị hủy')
    }
    if (invitation.expiresAt < new Date()) {
      await this.invitationRepo.updateStatus(invitation.id, 'EXPIRED')
      throw new BadRequestException('Lời mời này đã hết hạn (quá 7 ngày)')
    }
    return {
      email: invitation.email,
      role: invitation.role.name, // Trả về chuỗi tên role
      companyName: invitation.tenant.name,
      token: invitation.token,
    }
  }

  // ─── ACCEPT INVITATION ────────────────────────────────────────────────────

 async acceptInvitation(body: AcceptInvitationType) {
    const invitation = await this.invitationRepo.findByTokenOnly(body.token)
    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Lời mời không hợp lệ hoặc đã hết hạn')
    }
    const existingUser = await this.sharedUserRepo.findUniqueEmail(invitation.email)
    if (existingUser) {
      throw new ConflictException('Email này đã đăng ký tài khoản ở một workspace khác')
    }
    const hashedPassword = await this.hashingService.hash(body.password)
    const newUser = await this.sharedUserRepo.createUserAndAcceptInvitation({
      email: invitation.email,
      name: body.name,
      hashedPassword,
      roleId: invitation.roleId, // Truyền roleId của thư mời
      tenantId: invitation.tenantId,
      invitationId: invitation.id,
    })
    // Ký tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId: newUser.id,
        role: newUser.role, // Đây đã là chuỗi được map từ sharedUserRepo
        tenantId: newUser.tenantId,
      }),
      this.tokenService.signRefreshToken({ userId: newUser.id }),
    ])
    const decoded = await this.tokenService.verifyRefreshToken(refreshToken)
    const ttlSeconds = Math.max(0, Math.floor(decoded.exp - Date.now() / 1000))
    await this.redisService.set(
      `auth:refresh:${refreshToken}`,
      { userId: newUser.id, role: newUser.role, tenantId: newUser.tenantId },
      ttlSeconds,
    )
    return {
      message: 'Đăng ký tài khoản thành công',
      accessToken,
      refreshToken,
    }
  }

  // ─── UPDATE INVITATION ────────────────────────────────────────────────────

 async updateInvitation(id: string, body: UpdateInvitationType, tenantId: string) {
    const invitation = await this.invitationRepo.findByIdAndTenant(id, tenantId)
    if (!invitation) {
      throw new NotFoundException('Không tìm thấy lời mời')
    }
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể chỉnh sửa lời mời đang ở trạng thái chờ kích hoạt')
    }
    const updateData: any = {
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
    if (body.email && body.email !== invitation.email) {
      const existingUser = await this.sharedUserRepo.findUniqueEmail(body.email)
      if (existingUser) throw new ConflictException('Email này đã đăng ký tài khoản')
      const existingInv = await this.invitationRepo.findDuplicateEmail(body.email, tenantId, id)
      if (existingInv) throw new ConflictException('Đã có một lời mời khác cho email này')
      updateData.email = body.email
    }
    if (body.role) {
      const dbRole = await this.prismaService.role.findFirst({ where: { tenantId, name: body.role } })
      if (!dbRole) throw new BadRequestException('Vai trò không hợp lệ')
      updateData.roleId = dbRole.id
    }
    const updatedInvitation = await this.invitationRepo.update(id, updateData)
    const tenant = await this.sharedUserRepo.findTenantUnique(tenantId)
    const inviteLink = `${envConfig.FRONTEND_URL}/invite?token=${updateData.token}`
    await this.mailService.sendInvitationEmail({
      to: updatedInvitation.email,
      companyName: tenant?.name || 'Workspace CRM',
      role: updatedInvitation.role.name,
      inviteLink,
    })
    return {
      ...updatedInvitation,
      role: updatedInvitation.role.name,
    }
  }
}
