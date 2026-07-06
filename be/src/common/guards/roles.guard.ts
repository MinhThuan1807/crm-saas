import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { ROLES_KEY } from "../decorators/roles.decorator"
import { RoleType } from "../constants/role.constanst"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // ← inject Reflector

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ]
    )

    if (!requiredRoles) return true;
    const user = context.switchToHttp().getRequest().user;

    return requiredRoles.some((role) => user.role === role);
  }
}