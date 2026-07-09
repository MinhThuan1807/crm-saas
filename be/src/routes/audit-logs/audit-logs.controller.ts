import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ROLE } from 'src/common/constants/role.constanst';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuditLogsService } from './audit-logs.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetAuditLogsQueryDto } from './audit-logs.dto';
import { AccessTokenPayload } from 'src/common/types/jwt.type';
import { SkipThrottle } from '@nestjs/throttler';


@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@SkipThrottle()
@Roles(ROLE.ADMIN, ROLE.MANAGER)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}  
  
  @Get()
  async getLogs(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: GetAuditLogsQueryDto
  ) {
    return this.auditLogsService.getLogs(user.tenantId, query);
  }
}
