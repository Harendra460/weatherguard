import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { TelegramService } from '../telegram/telegram.service';
import { RequestAccessDto } from './dto/request-access.dto';
import { DecideUserDto } from './dto/decide-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard) // every route here requires a valid JWT
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly telegram: TelegramService,
  ) {}

  /** The signed-in user's own record + their Telegram deep link. */
  @Get('me')
  async me(@CurrentUser() principal: AuthUser) {
    const user = await this.users.findById(principal.userId);
    let telegramDeepLink: string | undefined;
    if (!user.telegramChatId) {
      const token = await this.users.ensureTelegramLinkToken(principal.userId);
      telegramDeepLink = this.telegram.buildDeepLink(token);
    }
    return { user, telegramDeepLink };
  }

  /** Request access to the alert service. */
  @Post('me/request-access')
  requestAccess(@CurrentUser() p: AuthUser, @Body() dto: RequestAccessDto) {
    return this.users.requestAccess(p.userId, dto);
  }

  // ---------------- Admin-only ----------------

  @Get('pending')
  @UseGuards(AdminGuard)
  pending() {
    return this.users.findPending();
  }

  @Get()
  @UseGuards(AdminGuard)
  all() {
    return this.users.findAll();
  }

  @Patch(':id/decision')
  @UseGuards(AdminGuard)
  async decide(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: DecideUserDto,
  ) {
    const { user, shouldNotify } = await this.users.decide(id, dto.decision, admin.email);
    if (shouldNotify && user.telegramChatId) {
      await this.telegram.sendApprovalMessage(user.telegramChatId, user.displayName);
    }
    return user;
  }
}
