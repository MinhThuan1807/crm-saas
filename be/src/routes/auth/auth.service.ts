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
      throw new UnauthorizedException('Email không tồn tại!')
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordValid) {
      throw new UnprocessableEntityException({
        message: 'Sai mật khẩu. Vui lòng thử lại.',
        path: 'password',
      })
    }

    const tokens = await this.generateTokens({ userId: user.id, role: user.role, tenantId: user.tenantId })
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
      maxAge: 15 * 60 * 1000, // 15 phút
    })

    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    })

    return { message: 'Refresh token thành công' }
  }

  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      },
    })
    return user
  }
    async validateGoogleUser(profile: { provider: string; providerAccountId: string; email: string; name: string }) {
    const { provider, providerAccountId, email, name } = profile;

    // 1. Kiểm tra xem tài khoản Google này đã được liên kết với User nào chưa
    const account = await this.prismaService.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });

    if (account) {
      return account.user;
    }

    // 2. Nếu chưa có Account, kiểm tra xem đã có User nào đăng ký bằng Email này chưa
    let user = await this.prismaService.user.findUnique({
      where: { email },
    });

    // 3. Nếu trùng khớp Email -> Tự động liên kết tài khoản Google này với User đó
    if (user) {
      await this.prismaService.account.create({
        data: {
          userId: user.id,
          provider,
          providerAccountId,
        },
      });
      return user;
    }

    // 4. Nếu chưa có User nào tồn tại -> Thực hiện đăng ký mới
    // 4a. Kiểm tra xem Email có thư mời (Invitation) nào đang chờ không
    const invitation = await this.prismaService.invitation.findFirst({
      where: {
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    let tenantId: string;

    if (invitation) {
      // Tham gia Tenant được mời
      tenantId = invitation.tenantId;
      
      // Đánh dấu thư mời đã được chấp nhận
      await this.prismaService.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
    } else {
      // Không có thư mời -> Tạo mới một Tenant
      const slug = slugify(name + '-' + Math.floor(Math.random() * 1000));
      const tenant = await this.prismaService.tenant.create({
        data: {
          name: `${name}'s Company`,
          slug,
        },
      });
      tenantId = tenant.id;
    }

    // 4b. Tạo User mới (password = null)
    user = await this.prismaService.user.create({
      data: {
        email,
        name,
        tenantId,
        password: null, // Không có mật khẩu vì dùng SSO
        role: invitation ? invitation.role : 'ADMIN', // Nếu tạo tenant mới thì làm ADMIN
      },
    });

    // 4c. Tạo liên kết Account
    await this.prismaService.account.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId,
      },
    });

    return user;
  }

}
