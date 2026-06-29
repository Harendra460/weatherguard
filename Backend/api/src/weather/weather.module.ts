import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { AlertsScheduler } from './alerts.scheduler';
import { WeatherController } from './weather.controller';
import { UsersModule } from '../users/users.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [UsersModule, TelegramModule],
  controllers: [WeatherController],
  providers: [WeatherService, AlertsScheduler],
})
export class WeatherModule {}
