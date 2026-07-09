import {
  Body,
  Controller,
  Patch,
  Post,
  UseGuards,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOkResponse } from '@nestjs/swagger'
import { AnalyzeDealBodyType, CreateDealBodyType, DealStageType, UpdateDealBodyType } from './deal.model'
import { DealService } from './deal.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateDealBodyDto,
  CreateDealResDto,
  GetDealResDto,
  GetDealsPipelineResDto,
  UpdateDealResDto,
} from './deal.dto'
import {
  CreateTaskBodyDto,
  CreateTasksBulkBodyDto,
  UpdateTaskBodyDto,
  TaskResDto,
} from './task.dto'
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard'
import { CurrentUser } from 'src/common/decorators/current-user.decorator'
import { AccessTokenPayload } from 'src/common/types/jwt.type'
import { MessageDto } from 'src/common/dto/message.dto'
import { AiService } from '../ai/ai.service'
import { AiRateLimitGuard } from 'src/common/guards/ai-rate-limit.guard'
import { subscribeToAiStream } from '../ai/ai.sse'
import { Res } from '@nestjs/common'
import { Response } from 'express'
import { SkipThrottle } from '@nestjs/throttler'

@UseGuards(JwtAuthGuard)
@ApiTags('Deals')
@Controller('deals')
@SkipThrottle()
export class DealController {
  constructor(
    private readonly dealService: DealService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  @ApiOkResponse({ type: CreateDealResDto })
  @ZodSerializerDto(CreateDealResDto)
  create(@Body() body: CreateDealBodyType, @CurrentUser() user: AccessTokenPayload) {
    return this.dealService.create(user.tenantId, { ...body }, { userId: user.userId, role: user.role })
  }

  @Get('pipeline')
  @ApiOkResponse({ type: GetDealsPipelineResDto })
  @ZodSerializerDto(GetDealsPipelineResDto)
  getPipeline(@CurrentUser() user: AccessTokenPayload) {
    return this.dealService.getPipleline(user.tenantId, { userId: user.userId, role: user.role })
  }

  @Get(':id')
  @ApiOkResponse({ type: GetDealResDto })
  @ZodSerializerDto(GetDealResDto)
  getDealById(@Param('id') dealId: string, @CurrentUser() user: AccessTokenPayload) {
    return this.dealService.getDealById(dealId, user.tenantId, { userId: user.userId, role: user.role })
  }

  @Patch(':id/stage')
  @ApiOkResponse({ type: UpdateDealResDto })
  @ZodSerializerDto(UpdateDealResDto)
  updateStage(
    @Param('id') dealId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: { stage: DealStageType },
  ) {
    return this.dealService.updateDealStage(dealId, user.tenantId, body.stage, { userId: user.userId, role: user.role })
  }

  @Patch(':id')
  @ApiOkResponse({ type: UpdateDealResDto })
  @ZodSerializerDto(UpdateDealResDto)
  update(@Param('id') dealId: string, @CurrentUser() user: AccessTokenPayload, @Body() body: UpdateDealBodyType) {
    return this.dealService.update(dealId, user.tenantId, body, { userId: user.userId, role: user.role })
  }

  @Delete(':id')
  @ApiOkResponse({ type: MessageDto })
  @ZodSerializerDto(MessageDto)
  delete(@Param('id') dealId: string, @CurrentUser() user: AccessTokenPayload) {
    return this.dealService.delete(dealId, user.tenantId, { userId: user.userId, role: user.role })
  }

  @UseGuards(AiRateLimitGuard)
  @Post(':id/analyze')
  @HttpCode(202)
  async analyze(
    @Param('id') dealId: string,
    @Body() body: AnalyzeDealBodyType,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    try {
      return await this.dealService.analyze(dealId, user.tenantId, user.userId, body, { userId: user.userId, role: user.role })
    } catch (err) {
      if (err instanceof HttpException) throw err
      // log original error for debugging before returning generic 503
      // eslint-disable-next-line no-console
      console.error('analyze() unexpected error', { err })
      throw new HttpException('AI analysis temporarily unavailable. Please try later.', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  @Get(':id/ai-stream')
  async aiStream(@Param('id') dealId: string, @CurrentUser() user: AccessTokenPayload, @Res() res: Response) {
    // verify deal exists and belongs to tenant
    await this.dealService.getDealById(dealId, user.tenantId, { userId: user.userId, role: user.role })

    // subscribe and keep connection open
    subscribeToAiStream(user.tenantId, dealId, res)
    // Express response will be kept open by SSE helper
    return
  }

  @Post(':id/tasks')
  @ApiOkResponse({ type: TaskResDto })
  @ZodSerializerDto(TaskResDto)
  async createTask(
    @Param('id') dealId: string,
    @Body() body: CreateTaskBodyDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.dealService.createTask(dealId, user.tenantId, body)
  }

  @Post(':id/tasks/bulk')
  async createTasksBulk(
    @Param('id') dealId: string,
    @Body() body: CreateTasksBulkBodyDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.dealService.createTasksBulk(dealId, user.tenantId, body.tasks)
  }

  @Patch(':id/tasks/:taskId')
  @ApiOkResponse({ type: TaskResDto })
  @ZodSerializerDto(TaskResDto)
  async updateTask(
    @Param('id') dealId: string,
    @Param('taskId') taskId: string,
    @Body() body: UpdateTaskBodyDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.dealService.updateTask(dealId, user.tenantId, taskId, body)
  }

  @Delete(':id/tasks/:taskId')
  async deleteTask(
    @Param('id') dealId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    await this.dealService.deleteTask(dealId, user.tenantId, taskId)
    return { ok: true }
  }
}
