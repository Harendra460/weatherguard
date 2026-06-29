import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { AppConfig } from '../config/configuration';
import { SocialProfile } from '../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService<AppConfig, true>) {
    const g = config.get('google', { infer: true });
    super({
      clientID: g.clientId,
      clientSecret: g.clientSecret,
      callbackURL: g.callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const social: SocialProfile = {
      email: profile.emails?.[0]?.value ?? '',
      provider: 'google',
      providerId: profile.id,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, social);
  }
}
