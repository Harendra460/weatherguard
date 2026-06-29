import { Body, Controller, Logger, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { UsersService } from '../users/users.service';
import { AppConfig } from '../config/configuration';

/** Minimal shape of a Telegram update we care about. */
interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number };
  };
}

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegram: TelegramService,
    private readonly users: UsersService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Webhook endpoint. The secret lives in the path so only Telegram (which we
   * configured via setWebhook) can reach it. Handles the `/start <token>`
   * deep link that binds a chat to a user account.
   */
  @Post('webhook/:secret')
  async webhook(@Param('secret') secret: string, @Body() update: TelegramUpdate) {
    const expected = this.config.get('telegram', { infer: true }).webhookSecret;
    if (secret !== expected) return { ok: false };

    const text = update.message?.text ?? '';
    const chatId = update.message?.chat?.id;
    if (!chatId) return { ok: true };

    const match = /^\/start(?:\s+(\S+))?/.exec(text);
    if (match) {
      const token = match[1];
      if (!token) {
        await this.telegram.sendMessage(
          String(chatId),
          'Open WeatherGuard in the web app and use the "Connect Telegram" link to get started.',
        );
        return { ok: true };
      }
      const linked = await this.users.linkTelegramByToken(token, String(chatId));
      await this.telegram.sendMessage(
        String(chatId),
        linked
          ? '🔗 Telegram connected! Your account is now linked to WeatherGuard.'
          : '⚠️ That link has expired. Generate a fresh one from the web app.',
      );
    }
    return { ok: true };
  }
}
