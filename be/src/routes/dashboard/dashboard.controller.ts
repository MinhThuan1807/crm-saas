import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard'
import { CurrentUser } from 'src/common/decorators/current-user.decorator'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { ZodSerializerDto } from 'nestjs-zod'
import { DashboardService } from './dashboard.service'
import { GetDashboardQueryDto, DashboardResDto } from './dashboard.dto'

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ZodSerializerDto(DashboardResDto)
  getDashboardData(
    @Query() query: GetDashboardQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.dashboardService.getDashboardData(user.tenantId, query.period, {
      userId: user.userId,
      role: user.role,
    })
  }
}
