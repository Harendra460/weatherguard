import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AppConfig } from '../config/configuration';

/**
 * Thin wrapper over the Telegram Bot HTTP API. We only need sendMessage and
 * a deep-link builder, so we avoid a heavy SDK dependency (startup mindset).
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  private get token(): string {
    return this.config.get('telegram', { infer: true }).botToken;
  }

  /** t.me deep link that carries the one-time link token as the /start payload. */
  buildDeepLink(linkToken: string): string {
    const username = this.config.get('telegram', { infer: true }).botUsername;
    return `https://t.me/${username}?start=${linkToken}`;
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.token) {
      this.logger.warn(`[telegram disabled] would send to ${chatId}: ${text}`);
      return;
    }
    try {
      await axios.post(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      });
    } catch (err) {
      this.logger.error(`Failed to message ${chatId}`, err as Error);
    }
  }

  sendApprovalMessage(chatId: string, name?: string): Promise<void> {
    const who = name ? ` ${name}` : '';
    return this.sendMessage(
      chatId,
      `✅ <b>You're approved${who}!</b>\nYou'll start receiving WeatherGuard alerts for your saved location.`,
    );
  }
}
