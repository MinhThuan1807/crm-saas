import { Module } from '@nestjs/common'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'
import { ReportsRepository } from './reports.repo'
import { PrismaService } from 'src/common/services/prisma.service'

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, PrismaService],
})
export class ReportsModule {}
