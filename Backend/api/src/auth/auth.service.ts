import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, SocialProfile } from '../users/users.service';
import { AppConfig } from '../config/configuration';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** Find-or-create the user, then mint a JWT for the dashboard. */
  async loginWithSocial(profile: SocialProfile): Promise<string> {
    const adminEmails = this.config.get('adminEmails', { infer: true });
    const user = await this.users.upsertFromSocial(profile, adminEmails);
    return this.jwt.sign({ sub: user.id, email: user.email });
  }
}
