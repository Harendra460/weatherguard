import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../config/configuration';
import { UsersService } from '../users/users.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt', { infer: true }).secret,
    });
  }

  /**
   * Re-read role/status from the DB on every request so an admin's
   * decision (approve/reject/demote) takes effect immediately — we don't
   * trust stale claims baked into the token.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub).catch(() => null);
    if (!user) throw new UnauthorizedException();
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
