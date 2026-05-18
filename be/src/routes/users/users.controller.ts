import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { AccessTokenPayload } from "src/common/types/jwt.type";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@CurrentUser() user: AccessTokenPayload) {
    return this.usersService.getUsersByTenant(user.tenantId);
  }
}
