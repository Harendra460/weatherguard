import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SocialProfile } from '../users/users.service';
import { AppConfig } from '../config/configuration';
import { GoogleOauthGuard } from './google-oauth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Step 1: kick off Google's consent screen. The originating app is passed as
   * `?app=user|admin`; GoogleOauthGuard forwards it through Google as `state`.
   */
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  google(): void {
    // Passport handles the redirect.
  }

  /**
   * Step 2: Google redirects back here. We mint a JWT and bounce the browser to
   * the app that started login (read from the OAuth `state`) with the token in
   * the URL fragment. (See README for the production-grade alternative: httpOnly
   * cookie.)
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async callback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const token = await this.auth.loginWithSocial(req.user as SocialProfile);
    const isUserApp = req.query.state === 'user';
    const webUrl = this.config.get(isUserApp ? 'userWebUrl' : 'adminWebUrl', {
      infer: true,
    });
    res.redirect(`${webUrl}/auth/callback#token=${token}`);
  }
}
