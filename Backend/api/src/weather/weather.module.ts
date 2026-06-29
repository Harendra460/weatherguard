import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { AlertsScheduler } from './alerts.scheduler';
import { WeatherController } from './weather.controller';
import { UsersModule } from '../users/users.module';
import { TelegramModule } from '../telegram/telegram.module';
import { CronSecretGuard } from '../common/guards/cron-secret.guard';

@Module({
  imports: [UsersModule, TelegramModule],
  controllers: [WeatherController],
  providers: [WeatherService, AlertsScheduler, CronSecretGuard],
})
export class WeatherModule {}
