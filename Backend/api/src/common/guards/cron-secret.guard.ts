import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AppConfig } from '../../config/configuration';

/**
 * Allows the request only if it carries the shared cron secret in the
 * `x-cron-secret` header. Used by external schedulers (e.g. a Render Cron Job)
 * to trigger an alert cycle without an admin login.
 */
@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(ctx: ExecutionContext): boolean {
    const expected = this.config.get('cronSecret', { infer: true });
    // Fail closed: if no secret is configured, never allow the open trigger.
    if (!expected) throw new ForbiddenException('Cron trigger not configured');

    const req = ctx.switchToHttp().getRequest<Request>();
    const provided = req.header('x-cron-secret');
    if (provided !== expected) throw new ForbiddenException('Invalid cron secret');

    return true;
  }
}
