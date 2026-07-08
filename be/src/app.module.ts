import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core/constants'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { APP_PIPE } from '@nestjs/core/constants'
import { MyZodValidationPipe } from './common/pipe/custom-zod-validation.pipe'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { AuthModule } from './routes/auth/auth.module'
import { ContactsModule } from './routes/contacts/contacts.module';
import { ActivitiesModule } from './routes/activities/activities.module';
import { DealModule } from './routes/deal/deal.module';
import { UsersModule } from './routes/users/users.module';
import { InvitationsModule } from './routes/invitations/invitations.module';
import { DashboardModule } from './routes/dashboard/dashboard.module';
import { ReportsModule } from './routes/reports/reports.module';
import { AiModule } from './routes/ai/ai.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor'
import { AuditLogsModule } from './routes/audit-logs/audit-logs.module';
@Module({
  imports: [
    CommonModule, AuthModule, ContactsModule, 
    ActivitiesModule, DealModule, UsersModule, 
    InvitationsModule, DashboardModule, ReportsModule,
    AiModule, AuditLogsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: MyZodValidationPipe,
    },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule { }
