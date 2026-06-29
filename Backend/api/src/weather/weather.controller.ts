import { Controller, Post, UseGuards } from '@nestjs/common';
import { AlertsScheduler } from './alerts.scheduler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';

@Controller('weather')
export class WeatherController {
  constructor(private readonly scheduler: AlertsScheduler) {}

  /** Admin-only: fire a weather alert cycle immediately (for demos/testing). */
  @Post('run-now')
  @UseGuards(JwtAuthGuard, AdminGuard)
  runNow() {
    return this.scheduler.runAlertCycle();
  }

  /**
   * Trigger for external schedulers (e.g. a Render Cron Job). Authenticated by
   * the shared cron secret instead of an admin login, so a plain HTTP request
   * on a timer can drive alerts when the in-process cron is disabled.
   */
  @Post('run-cron')
  @UseGuards(CronSecretGuard)
  runCron() {
    return this.scheduler.runAlertCycle();
  }
}
