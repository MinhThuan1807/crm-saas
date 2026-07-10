import { Injectable } from '@nestjs/common'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { UpdateKpiTargetDto } from './reports.dto'
import { OverviewReportService } from './services/overview-report.service'
import { TeamReportService } from './services/team-report.service'
import { PipelineReportService } from './services/pipeline-report.service'
import { ActivityReportService } from './services/activity-report.service'

@Injectable()
export class ReportsService {
  constructor(
    private readonly overviewReportService: OverviewReportService,
    private readonly teamReportService: TeamReportService,
    private readonly pipelineReportService: PipelineReportService,
    private readonly activityReportService: ActivityReportService,
  ) {}

  getOverview(
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    user: AccessTokenPayload,
  ) {
    return this.overviewReportService.getOverview(startDateStr, endDateStr, user)
  }

  getTeamPerformance(
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    user: AccessTokenPayload,
  ) {
    return this.teamReportService.getTeamPerformance(startDateStr, endDateStr, user)
  }

  updateKpiTarget(
    dto: UpdateKpiTargetDto,
    user: AccessTokenPayload,
  ) {
    return this.teamReportService.updateKpiTarget(dto, user)
  }

  getPipelineAnalysis(
    user: AccessTokenPayload,
  ) {
    return this.pipelineReportService.getPipelineAnalysis(user)
  }

  getActivitiesReport(
    startDateStr: string | undefined,
    endDateStr: string | undefined,
    user: AccessTokenPayload,
  ) {
    return this.activityReportService.getActivitiesReport(startDateStr, endDateStr, user)
  }
}
