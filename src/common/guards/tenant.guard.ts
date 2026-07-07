import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.body?.tenantId ?? request.query?.tenantId ?? request.params?.tenantId;

    if (!user?.tenantId || !tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    if (user.tenantId !== tenantId) {
      throw new UnauthorizedException('Tenant mismatch');
    }

    return true;
  }
}
