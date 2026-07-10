import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { TokenService } from './services/token.service';
import { HashingService } from './services/hashing.service';
import { SharedUserRepository } from './repositories/shared-user.repo';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from './services/redis.service';
import { MailService } from './services/mail.service';
import { ClsModule } from 'nestjs-cls';
import { CaslAbilityFactory } from './casl/casl-ability.factory';

// const sharedProviders = PrismaService;
const sharedProviders = [
  PrismaService,
  TokenService,
  HashingService,
  SharedUserRepository,
  RedisService,
  MailService,
  CaslAbilityFactory, // Register CaslAbilityFactory here
];
@Global()
@Module({
   imports: [
    JwtModule.register({}), 
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true
      }
    })
  ],
  providers: [...sharedProviders],
  exports: sharedProviders,
})
export class CommonModule { }

