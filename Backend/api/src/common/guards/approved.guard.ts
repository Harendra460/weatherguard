import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../interfaces/auth-user.interface';
import { UserStatus } from '../enums/user.enums';

/**
 * Gate for endpoints that only APPROVED users may hit. This is the
 * request-layer half of the approval guarantee; the scheduler enforces
 * the same rule at the data layer (see WeatherModule).
 */
@Injectable()
export class ApprovedGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Your access is not approved');
    }
    return true;
  }
}
