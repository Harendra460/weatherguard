import { Controller, Post, UseGuards } from '@nestjs/common';
import { AlertsScheduler } from './alerts.scheduler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('weather')
@UseGuards(JwtAuthGuard, AdminGuard)
export class WeatherController {
  constructor(private readonly scheduler: AlertsScheduler) {}

  /** Admin-only: fire a weather alert cycle immediately (for demos/testing). */
  @Post('run-now')
  runNow() {
    return this.scheduler.runAlertCycle();
  }
}
