import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { UsersService } from '../users/users.service';
import { TelegramService } from '../telegram/telegram.service';
import { WeatherService } from './weather.service';
import { AppConfig } from '../config/configuration';

/**
 * Periodically pushes weather alerts. The cron expression is configurable
 * (ALERT_CRON) and registered dynamically at boot.
 */
@Injectable()
export class AlertsScheduler implements OnModuleInit {
  private readonly logger = new Logger(AlertsScheduler.name);

  constructor(
    private readonly users: UsersService,
    private readonly weather: WeatherService,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const { alertCron: cronExpr, alertCronEnabled } = this.config.get('weather', { infer: true });
    if (!alertCronEnabled) {
      this.logger.log('In-process alert cron disabled; expecting an external trigger.');
      return;
    }
    const job = new CronJob(cronExpr, () => void this.runAlertCycle());
    this.registry.addCronJob('weather-alerts', job as never);
    job.start();
    this.logger.log(`Alert job scheduled with cron "${cronExpr}"`);
  }

  /**
   * One alert cycle. The recipient list comes from findAlertRecipients(),
   * which ONLY returns APPROVED + Telegram-linked users — this is where the
   * "only approved users get alerts" guarantee is enforced at the data layer.
   * Exposed publicly so it can be triggered on demand (see WeatherController).
   */
  async runAlertCycle(): Promise<{ sent: number }> {
    const recipients = await this.users.findAlertRecipients();
    this.logger.log(`Running alert cycle for ${recipients.length} approved recipient(s)`);

    let sent = 0;
    for (const user of recipients) {
      const prefs = user.preferences;
      if (!prefs?.city || !user.telegramChatId) continue;
      const snapshot = await this.weather.getCurrent(prefs.city, prefs.lat, prefs.lon);
      await this.telegram.sendMessage(user.telegramChatId, this.weather.formatAlert(snapshot));
      sent++;
    }
    return { sent };
  }
}
