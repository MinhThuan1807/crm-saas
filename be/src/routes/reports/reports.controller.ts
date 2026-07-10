import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOkResponse } from '@nestjs/swagger'
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
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @ApiOkResponse({ type: OverviewResDto })
  @ZodSerializerDto(OverviewResDto)
  getOverview(
    @Query() query: ReportsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.getOverview(query.startDate, query.endDate, user)
  }

  @Get('team-performance')
  @ApiOkResponse({ type: TeamPerformanceResDto })
  @ZodSerializerDto(TeamPerformanceResDto)
  getTeamPerformance(
    @Query() query: ReportsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.getTeamPerformance(query.startDate, query.endDate, user)
  }

  @Post('kpi')
  updateKpiTarget(
    @Body() body: UpdateKpiTargetDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.updateKpiTarget(body, user)
  }

  @Get('pipeline-analysis')
  @ApiOkResponse({ type: PipelineAnalysisResDto })
  @ZodSerializerDto(PipelineAnalysisResDto)
  getPipelineAnalysis(
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.getPipelineAnalysis(user)
  }

  @Get('activities')
  @ApiOkResponse({ type: ActivitiesReportResDto })
  @ZodSerializerDto(ActivitiesReportResDto)
  getActivitiesReport(
    @Query() query: ReportsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.reportsService.getActivitiesReport(query.startDate, query.endDate, user)
  }
}
