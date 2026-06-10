import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { HashingService } from 'src/common/services/hashing.service';
import { TokenService } from 'src/common/services/token.service';
import { MailService } from 'src/common/services/mail.service';
import { CreateInvitationType, AcceptInvitationType, UpdateInvitationType } from './invitations.model';
import { v4 as uuidv4 } from 'uuid';
import envConfig from 'src/common/config';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async createInvitation(
    body: CreateInvitationType,
    tenantId: string,
  ) {
    // 1. Check if email is already registered in the system (since email is globally unique)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existingUser) {
      throw new ConflictException('Email này đã đăng ký tài khoản ở một workspace khác');
    }

    // 2. Fetch tenant name for email context
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    if (!tenant) {
      throw new NotFoundException('Không tìm thấy workspace');
    }

    // 3. Delete any previous pending invitation for this email in this tenant to prevent unique violations
    await this.prisma.invitation.deleteMany({
      where: { tenantId, email: body.email },
    });

    // 4. Generate token and expiry (7 days)
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 5. Create invitation in DB
    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email: body.email,
        role: body.role,
        token,
        expiresAt,
        status: 'PENDING',
      },
    });

    // 6. Send the invitation email asynchronously
    const inviteLink = `${envConfig.FRONTEND_URL}/invite?token=${token}`;
    await this.mailService.sendInvitationEmail({
      to: body.email,
      companyName: tenant.name,
      role: body.role,
      inviteLink,
    });

    return invitation;
  }

  async getInvitationsByTenant(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(id: string, tenantId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, tenantId },
    });
    if (!invitation) {
      throw new NotFoundException('Không tìm thấy lời mời hoặc lời mời không thuộc workspace này');
    }

    return this.prisma.invitation.delete({
      where: { id },
    });
  }

  async verifyInvitationToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { tenant: { select: { name: true } } },
    });

    if (!invitation) {
      throw new BadRequestException('Lời mời không hợp lệ hoặc link đã hỏng');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Lời mời này đã được chấp nhận hoặc đã bị hủy');
    }

    if (invitation.expiresAt < new Date()) {
      // Update status to EXPIRED to keep DB clean
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Lời mời này đã hết hạn (quá 7 ngày)');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      companyName: invitation.tenant.name,
      token: invitation.token,
    };
  }

  async acceptInvitation(body: AcceptInvitationType) {
    // 1. Verify token validation
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: body.token },
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Lời mời không hợp lệ hoặc đã hết hạn');
    }

    // Double check email availability
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });
    if (existingUser) {
      throw new ConflictException('Email này đã đăng ký tài khoản ở một workspace khác');
    }

    // 2. Hash password & write user + update status in transaction
    const hashedPassword = await this.hashingService.hash(body.password);
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          name: body.name,
          password: hashedPassword,
          role: invitation.role,
          tenantId: invitation.tenantId,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return user;
    });

    // 3. Automatically issue login tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId: newUser.id,
        role: newUser.role,
        tenantId: newUser.tenantId,
      }),
      this.tokenService.signRefreshToken({ userId: newUser.id }),
    ]);

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });

    return {
      message: 'Đăng ký tài khoản thành công',
      accessToken,
      refreshToken,
    };
  }

  async updateInvitation(
    id: string,
    body: UpdateInvitationType,
    tenantId: string,
  ) {
    // 1. Find the invitation
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, tenantId },
    });
    if (!invitation) {
      throw new NotFoundException('Không tìm thấy lời mời');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể chỉnh sửa lời mời đang ở trạng thái chờ kích hoạt');
    }

    const updateData: any = {};

    // 2. If email is being updated
    if (body.email && body.email !== invitation.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: body.email },
      });
      if (existingUser) {
        throw new ConflictException('Email này đã đăng ký tài khoản ở một workspace khác');
      }

      const existingInv = await this.prisma.invitation.findFirst({
        where: {
          tenantId,
          email: body.email,
          id: { not: id },
        },
      });
      if (existingInv) {
        throw new ConflictException('Đã có một lời mời khác cho email này trong hệ thống');
      }

      updateData.email = body.email;
    }

    if (body.role) {
      updateData.role = body.role;
    }

    // 3. Regenerate token and reset expiration (7 days) since credentials changed
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    updateData.token = token;
    updateData.expiresAt = expiresAt;

    // 4. Update in database
    const updatedInvitation = await this.prisma.invitation.update({
      where: { id },
      data: updateData,
    });

    // 5. Fetch tenant details
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // 6. Send email
    const inviteLink = `${envConfig.FRONTEND_URL}/invite?token=${token}`;
    await this.mailService.sendInvitationEmail({
      to: updatedInvitation.email,
      companyName: tenant?.name || 'Workspace CRM',
      role: updatedInvitation.role,
      inviteLink,
    });

    return updatedInvitation;
  }
}
