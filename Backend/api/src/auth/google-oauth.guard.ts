import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

/**
 * Google OAuth guard that remembers which frontend started the login.
 * The originating app ('user' | 'admin') is passed through Google as the OAuth
 * `state` param and read back in the callback to redirect to the right SPA.
 */
@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext): Record<string, unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const app = req.query.app === 'user' ? 'user' : 'admin';
    return { state: app };
  }
}
