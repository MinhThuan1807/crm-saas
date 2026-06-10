import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { ROLE } from "src/common/constants/role.constanst";
import { AccessTokenPayload } from "src/common/types/jwt.type";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./users.dto";

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@CurrentUser() user: AccessTokenPayload) {
    return this.usersService.getUsersByTenant(user.tenantId);
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
