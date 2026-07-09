import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOkResponse } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard'
import { CurrentUser } from 'src/common/decorators/current-user.decorator'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { MessageDto } from 'src/common/dto/message.dto'
import { ActivitiesService } from './activities.service'
import {
  ActivityResDto,
  CreateActivityForContactBodyDto,
  CreateActivityForDealBodyDto,
  GetActivitiesQueryDto,
  GetActivitiesResDto,
  GetActivitiesPaginatedResDto,
  UpdateActivityBodyDto,
} from './activities.dto'
import { SkipThrottle } from '@nestjs/throttler'

// ─── 1. CONTACT ACTIVITIES ────────────────────────────────────────────────────
@ApiTags('Activities - Contact')
@Controller('contacts/:contactId/activities')
@UseGuards(JwtAuthGuard)
@SkipThrottle()
export class ContactActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // POST /contacts/:contactId/activities
  @Post()
  @ApiOkResponse({ type: ActivityResDto })
  @ZodSerializerDto(ActivityResDto)
  createActivity(
    @CurrentUser() user: AccessTokenPayload,
    @Param('contactId') contactId: string,
    @Body() body: CreateActivityForContactBodyDto,
  ) {
    return this.activitiesService.createForContact(user.tenantId, contactId, user.userId, body, { userId: user.userId, role: user.role })
  }

  // GET /contacts/:contactId/activities
  @Get()
  @ApiOkResponse({ type: GetActivitiesResDto })
  @ZodSerializerDto(GetActivitiesResDto)
  getActivities(@CurrentUser() user: AccessTokenPayload, @Param('contactId') contactId: string) {
    return this.activitiesService.getByContact(user.tenantId, contactId, { userId: user.userId, role: user.role })
  }
}

// ─── 2. DEAL ACTIVITIES ───────────────────────────────────────────────────────
@ApiTags('Activities - Deal')
@Controller('deals/:dealId/activities')
@UseGuards(JwtAuthGuard)
@SkipThrottle()
export class DealActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // POST /deals/:dealId/activities
  @Post()
  @ApiOkResponse({ type: ActivityResDto })
  @ZodSerializerDto(ActivityResDto)
  createActivity(
    @CurrentUser() user: AccessTokenPayload,
    @Param('dealId') dealId: string,
    @Body() body: CreateActivityForDealBodyDto,
  ) {
    return this.activitiesService.createForDeal(user.tenantId, dealId, user.userId, body, { userId: user.userId, role: user.role })
  }

  // GET /deals/:dealId/activities
  @Get()
  @ApiOkResponse({ type: GetActivitiesResDto })
  @ZodSerializerDto(GetActivitiesResDto)
  getActivities(@CurrentUser() user: AccessTokenPayload, @Param('dealId') dealId: string) {
    return this.activitiesService.getByDeal(user.tenantId, dealId, { userId: user.userId, role: user.role })
  }
}

// ─── 3. GLOBAL ACTIVITIES ─────────────────────────────────────────────────────
@ApiTags('Activities')
@Controller('activities')
@UseGuards(JwtAuthGuard)
@SkipThrottle()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // GET /activities?page=1&limit=20&type=CALL&search=...&contactId=...&dealId=...
  // Declare before PATCH/DELETE :id so NestJS matches correctly
  @Get()
  @ApiOkResponse({ type: GetActivitiesPaginatedResDto })
  @ZodSerializerDto(GetActivitiesPaginatedResDto)
  getAll(@CurrentUser() user: AccessTokenPayload, @Query() query: GetActivitiesQueryDto) {
    return this.activitiesService.getAll(user.tenantId, query, { userId: user.userId, role: user.role })
  }

  // PATCH /activities/:id
  @Patch(':id')
  @ApiOkResponse({ type: ActivityResDto })
  @ZodSerializerDto(ActivityResDto)
  updateActivity(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') activityId: string,
    @Body() body: UpdateActivityBodyDto,
  ) {
    return this.activitiesService.updateActivity(activityId, user.tenantId, body, { userId: user.userId, role: user.role })
  }

  // DELETE /activities/:id
  @Delete(':id')
  @ApiOkResponse({ type: MessageDto })
  @ZodSerializerDto(MessageDto)
  deleteActivity(@CurrentUser() user: AccessTokenPayload, @Param('id') activityId: string) {
    return this.activitiesService.deleteActivity(activityId, user.tenantId, { userId: user.userId, role: user.role })
  }
}
