import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { Observable } from 'rxjs'

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    if (user && user.tenantId) {
      this.cls.set('tenantId', user.tenantId)
    }
    return next.handle()
  }
}
