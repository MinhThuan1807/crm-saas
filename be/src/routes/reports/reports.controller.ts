import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard'
import { CurrentUser } from 'src/common/decorators/current-user.decorator'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { ZodSerializerDto } from 'nestjs-zod'
import { ReportsService } from './reports.service'
import {
  ReportsQueryDto,
  UpdateKpiTargetDto,
  OverviewResDto,
  TeamPerformanceResDto,
  PipelineAnalysisResDto,
  ActivitiesReportResDto,
} from './reports.dto'

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ZodSerializerDto(OverviewResDto)
  getOverview(
    @Query() query: ReportsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.getOverview(user.tenantId, query.startDate, query.endDate, {
      userId: user.userId,
      role: user.role,
    })
  }

  @Get('team-performance')
  @ZodSerializerDto(TeamPerformanceResDto)
  getTeamPerformance(
    @Query() query: ReportsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.getTeamPerformance(user.tenantId, query.startDate, query.endDate, {
      userId: user.userId,
      role: user.role,
    })
  }

  @Post('kpi')
  updateKpiTarget(
    @Body() body: UpdateKpiTargetDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.updateKpiTarget(user.tenantId, body, {
      role: user.role,
    })
  }

  @Get('pipeline-analysis')
  @ZodSerializerDto(PipelineAnalysisResDto)
  getPipelineAnalysis(
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.getPipelineAnalysis(user.tenantId, {
      userId: user.userId,
      role: user.role,
    })
  }

  @Get('activities')
  @ZodSerializerDto(ActivitiesReportResDto)
  getActivitiesReport(
    @Query() query: ReportsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.getActivitiesReport(user.tenantId, query.startDate, query.endDate, {
      userId: user.userId,
      role: user.role,
    })
  }
}
