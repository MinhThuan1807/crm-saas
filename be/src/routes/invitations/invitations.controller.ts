import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, AcceptInvitationDto, UpdateInvitationDto } from './invitations.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLE } from 'src/common/constants/role.constanst';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AccessTokenPayload } from 'src/common/types/jwt.type';
import { COOKIE_OPTIONS } from '../auth/auth.constants';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @Post()
  createInvitation(
    @Body() body: CreateInvitationDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.invitationsService.createInvitation(body, user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @Get()
  getInvitations(@CurrentUser() user: AccessTokenPayload) {
    return this.invitationsService.getInvitationsByTenant(user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @Delete(':id')
  revokeInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.invitationsService.revokeInvitation(id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.MANAGER)
  @Patch(':id')
  updateInvitation(
    @Param('id') id: string,
    @Body() body: UpdateInvitationDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.invitationsService.updateInvitation(id, body, user.tenantId);
  }

  @Get('verify/:token')
  verifyToken(@Param('token') token: string) {
    return this.invitationsService.verifyInvitationToken(token);
  }

  @Post('accept')
  async acceptInvitation(
    @Body() body: AcceptInvitationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.invitationsService.acceptInvitation(body);

    res.cookie('accessToken', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      message: result.message,
    };
  }
}
