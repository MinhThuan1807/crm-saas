import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { TokenService } from './services/token.service';
import { HashingService } from './services/hashing.service';
import { SharedUserRepository } from './repositories/shared-user.repo';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from './services/redis.service';

// const sharedProviders = PrismaService;
const sharedProviders = [PrismaService, TokenService, HashingService , SharedUserRepository, RedisService];

@Module({
   imports: [
    JwtModule.register({}), 
  ],
  providers: [...sharedProviders],
  exports: sharedProviders,
})
export class CommonModule {}
