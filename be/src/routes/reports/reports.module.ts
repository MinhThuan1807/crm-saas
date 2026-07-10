import { Module } from '@nestjs/common'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'
import { ReportsRepository } from './reports.repo'
import { PrismaService } from 'src/common/services/prisma.service'
import { OverviewReportService } from './services/overview-report.service'
import { TeamReportService } from './services/team-report.service'
import { PipelineReportService } from './services/pipeline-report.service'
import { ActivityReportService } from './services/activity-report.service'

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsRepository,
    PrismaService,
    OverviewReportService,
    TeamReportService,
    PipelineReportService,
    ActivityReportService,
  ],
})
export class ReportsModule {}
