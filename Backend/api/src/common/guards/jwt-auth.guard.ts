import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Requires a valid JWT. Populates req.user via JwtStrategy. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
