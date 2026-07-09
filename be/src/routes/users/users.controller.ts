import { Controller, Get, Patch, Delete, Put, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { ROLE } from "src/common/constants/role.constanst";
import { AccessTokenPayload } from "src/common/types/jwt.type";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./users.dto";

@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@CurrentUser() user: AccessTokenPayload) {
    return this.usersService.getUsersByTenant(user.tenantId);
  }

  @Get('roles')
  getRoles(@CurrentUser() user: AccessTokenPayload) {
    return this.usersService.getRolesByTenant(user.tenantId);
  }

  @Get('permissions')
  getPermissions() {
    return this.usersService.getAllPermissions();
  }

  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @Put('roles/:roleId/permissions')
  updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: { permissionIds: string[] },
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.usersService.updateRolePermissions(user.tenantId, roleId, body.permissionIds);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @Post('roles')
  createRole(
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.usersService.createRole(user.tenantId, body);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @Patch('roles/:roleId')
  updateRole(
    @Param('roleId') roleId: string,
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.usersService.updateRole(user.tenantId, roleId, body);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @Delete('roles/:roleId')
  deleteRole(
    @Param('roleId') roleId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.usersService.deleteRole(user.tenantId, roleId);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.usersService.updateUser(id, body, currentUser.tenantId, currentUser.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @Delete(':id')
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.usersService.deleteUser(id, currentUser.tenantId, currentUser.userId);
  }
}
