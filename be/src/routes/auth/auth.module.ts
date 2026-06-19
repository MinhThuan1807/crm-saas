import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { CommonModule } from 'src/common/common.module'
import { AuthRepository } from './auth.repo'
import { JwtModule } from '@nestjs/jwt'
import envConfig from 'src/common/config'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { GoogleStrategy } from './strategies/google.strategy'

@Module({
  imports: [
    CommonModule,
    JwtModule.register({
      secret: envConfig.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, AuthRepository, JwtStrategy, GoogleStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
