import { Injectable } from '@nestjs/common'
import { RefreshTokenType } from './auth.model'
import { UserType } from 'src/routes/auth/auth.model'
import { PrismaService } from 'src/common/services/prisma.service'
import { ROLE } from 'src/common/constants/role.constanst'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(email: string) {
    return await this.prismaService.user.findUnique({
      where: { email },
    })
  }

  async findRefreshTokenIncludeUser(refreshToken: string): Promise<RefreshTokenType & { user: UserType }> {
    return await this.prismaService.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { tenant: true } } },
    })
  }

  async deleteRefreshToken(token: string) {
    return await this.prismaService.refreshToken.delete({
      where: { token },
    })
  }
}
