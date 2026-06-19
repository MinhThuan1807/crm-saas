import { Body, Controller, Get, Post, UseGuards, Req, Res } from '@nestjs/common'
import { Response, Request } from 'express'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  LoginBodyDto,
  LoginResDto,
  RegisterBodyDto,
  RegisterResDto,
  RefreshTokenResDto,
  LogoutResDto,
} from './auth.dto'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from 'src/common/decorators/current-user.decorator'
import { RolesGuard } from 'src/common/guards/roles.guard'
import { Roles } from 'src/common/decorators/roles.decorator'
import { ROLE } from 'src/common/constants/role.constanst'
import { MessageDto } from 'src/common/dto/message.dto'
import envConfig from 'src/common/config'
import { COOKIE_OPTIONS } from './auth.constants'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { AuthGuard } from '@nestjs/passport'

// COOKIE_OPTIONS moved to auth.constants to avoid circular imports

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodSerializerDto(RegisterResDto)
  register(@Body() body: RegisterBodyDto) {
    return this.authService.register(body)
  }

  @Post('login')
  @ZodSerializerDto(MessageDto)
  async login(@Body() body: LoginBodyDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(body)

    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 phút
    })

    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    })
    console.log(refreshToken)
    return { message: 'Đăng nhập thành công' }
  }

  @Post('logout')
  @ZodSerializerDto(MessageDto)
  logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const refreshToken = req.cookies['refreshToken']

    // Phải truyền đúng options khi clear, không thì browser không xóa được
    res.clearCookie('accessToken', COOKIE_OPTIONS)
    res.clearCookie('refreshToken', COOKIE_OPTIONS)

    return this.authService.logout(refreshToken)
  }

  @Post('refresh-token')
  @ZodSerializerDto(MessageDto)
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refreshToken
     console.log('=== REFRESH TOKEN FROM COOKIE ===', refreshToken)
    return this.authService.refreshToken(refreshToken, res)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.getProfile(user.userId)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.MANAGER)
  @Get('admin')
  getAdminProfile(@CurrentUser() user: AccessTokenPayload) {
    return { message: 'Đường dẫn cho ADMIN', user }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Luồng tự động chuyển hướng sang Google Login
  }
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    // req.user chứa thông tin từ GoogleStrategy trả ra ở validate()
    const user = await this.authService.validateGoogleUser(req.user);
    // Sinh accessToken và refreshToken tương tự hàm login truyền thống
    const { accessToken, refreshToken } = await this.authService.generateTokens({
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });
    // Thiết lập cookie tương tự hàm login
    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Chuyển hướng người dùng về trang chủ của Frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  }

}
