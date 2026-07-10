import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { PrismaService } from 'src/common/services/prisma.service'
import { HashingService } from 'src/common/services/hashing.service'
import { LoginBodyType, RegisterBodyType } from './auth.model'
import slugify from 'slugify'
import { ROLE } from 'src/common/constants/role.constanst'
import { SharedUserRepository } from 'src/common/repositories/shared-user.repo'
import { AccessTokenPayloadCreate } from 'src/common/types/jwt.type'
import { TokenService } from 'src/common/services/token.service'
import { AuthRepository } from './auth.repo'
import { Response as ExpressResponse } from 'express'
import { COOKIE_OPTIONS } from './auth.constants'
import { RedisService } from 'src/common/services/redis.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService,
  ) {}

  async register(body: RegisterBodyType) {
    const slug = slugify(body.companyName)

    const existSlug = await this.sharedUserRepository.findSlug(slug)

    if (existSlug) {
      throw new ConflictException('Tên công ty đã tồn tại, vui lòng chọn tên khác')
    }

    const existUser = await this.authRepository.findUserByEmail(body.email)

    if (existUser) {
      throw new ConflictException('Email đã được sử dụng, vui lòng chọn email khác')
    }

    const hashedPassword = await this.hashingService.hash(body.password)

    const user = await this.sharedUserRepository.createTenantIncludeUser({
      companyName: body.companyName,
      slug,
      email: body.email,
      name: body.name,
      hashedPassword,
      role: ROLE.ADMIN,
    })
    return user
  }

  async login(body: LoginBodyType) {
    const user = await this.authRepository.findUserByEmail(body.email)

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw new UnprocessableEntityException({
        message: 'Sai mật khẩu. Vui lòng thử lại.',
        path: 'password',
      })
    }

    const tokens = await this.generateTokens({
      userId: user.id, 
      role: user.role, 
      tenantId: user.tenantId 
    })
    return tokens
  }

  async logout(refreshToken: string) {
    await this.redisService.delete(`auth:refresh:${refreshToken}`)
    return { message: 'Đăng xuất thành công' }
  }

  async generateTokens({ userId, role, tenantId }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        role,
        tenantId,
      }),
      this.tokenService.signRefreshToken({ userId }),
    ])

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    const ttlSeconds = Math.max(0, Math.floor(decodedRefreshToken.exp - Date.now() / 1000))

    await this.redisService.set(
      `auth:refresh:${refreshToken}`,
      { userId, role, tenantId },
      ttlSeconds,
    )

    return { accessToken, refreshToken }
  }

  async refreshToken(refreshToken: string, res: ExpressResponse) {
    if(!refreshToken) {
      throw new UnauthorizedException("Không tìm thấy refresh token")
    }

    let userId: string;
     try {
      const decoded = await this.tokenService.verifyRefreshToken(refreshToken);
      userId = decoded.userId;
    } catch (err) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

   const storedToken = await this.redisService.get(`auth:refresh:${refreshToken}`);
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token không tồn tại trong phiên làm việc');
    }

    await this.redisService.delete(`auth:refresh:${refreshToken}`)

    const tokens = await this.generateTokens({
      userId,
      role: storedToken.role,
      tenantId: storedToken.tenantId,
    })

    res.cookie('accessToken', tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })

    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return { message: 'Refresh token thành công' }
  }

  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })
    if (!user) return null;

    // Fetch permissions list via user's role (Using Redis Cache)
    const cacheKey = `tenant:${user.tenantId}:role:${user.role.name}:permissions`;
    let permissions = await this.redisService.get(cacheKey);

    if (!permissions) {
      const dbRolePermissions = await this.prismaService.rolePermission.findMany({
        where: {
          roleId: user.roleId,
        },
        include: {
          permission: true,
        },
      });

      permissions = dbRolePermissions.map((rp) => ({
        action: rp.permission.action,
        subject: rp.permission.subject,
        conditions: rp.conditions,
      }));

      // Cache in Redis (TTL: 1 hour)
      await this.redisService.set(cacheKey, permissions, 3600);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name, // Map string
      tenantId: user.tenantId,
      permissions, // Attach permissions array
    }
  }

 async validateGoogleUser(profile: { provider: string; providerAccountId: string; email: string; name: string }) {
    const { provider, providerAccountId, email, name } = profile;
    // 1. Check Google linked account
    const account = await this.prismaService.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: { include: { role: true } } },
    });
    if (account) {
      return {
        ...account.user,
        role: account.user.role.name as any,
      };
    }
    // 2. Find user by email
    let user = await this.prismaService.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (user) {
      await this.prismaService.account.create({
        data: {
          userId: user.id,
          provider,
          providerAccountId,
        },
      });
      return {
        ...user,
        role: user.role.name as any,
      };
    }
    // 3. If it's a completely new account
    const invitation = await this.prismaService.invitation.findFirst({
      where: {
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: { role: true }
    });
    let tenantId: string;
    let roleId: string;
    if (invitation) {
      tenantId = invitation.tenantId;
      roleId = invitation.roleId;
      await this.prismaService.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
    } else {
      // Register new company
      const slug = slugify(name + '-' + Math.floor(Math.random() * 1000));
      return this.prismaService.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: `${name}'s Company`, slug },
        });
        // Seed 3 default Roles for new Tenant
        const adminRole = await tx.role.create({
          data: { tenantId: tenant.id, name: 'ADMIN', description: 'Quản trị viên' }
        });
        const managerRole = await tx.role.create({
          data: { tenantId: tenant.id, name: 'MANAGER', description: 'Quản lý' }
        });
        const salesRepRole = await tx.role.create({
          data: { tenantId: tenant.id, name: 'SALES_REP', description: 'Nhân viên kinh doanh' }
        });
        // Assign permissions for ADMIN
        const systemManageAll = await tx.permission.findFirst({ where: { action: 'manage', subject: 'all' } });
        if (systemManageAll) {
          await tx.rolePermission.create({ data: { roleId: adminRole.id, permissionId: systemManageAll.id } });
        }
        // Assign permissions for other roles
        const allDomainPerms = await tx.permission.findMany({ where: { subject: { in: ['Contact', 'Deal', 'Task', 'Activity'] } } });
        for (const perm of allDomainPerms) {
          await tx.rolePermission.create({ data: { roleId: managerRole.id, permissionId: perm.id } });
          const isSubjectRestricted = ['Contact', 'Deal', 'Activity'].includes(perm.subject)
          await tx.rolePermission.create({
            data: {
              roleId: salesRepRole.id,
              permissionId: perm.id,
              conditions: isSubjectRestricted ? (perm.subject === 'Activity' ? { userId: '${user.id}' } : { ownerId: '${user.id}' }) : undefined
            }
          });
        }
        const newUser = await tx.user.create({
          data: { email, name, tenantId: tenant.id, password: null, roleId: adminRole.id },
        });
        
        await tx.account.create({
          data: { userId: newUser.id, provider, providerAccountId },
        });
        return { ...newUser, role: 'ADMIN' as any };
      });
    }
    // If joining via invitation
    const newUser = await this.prismaService.user.create({
      data: { email, name, tenantId, password: null, roleId },
      include: { role: true },
    });
    await this.prismaService.account.create({
      data: { userId: newUser.id, provider, providerAccountId },
    });
    return {
      ...newUser,
      role: newUser.role.name as any,
    };
  }
}
