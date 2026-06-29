import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AppConfig } from '../config/configuration';

export interface WeatherSnapshot {
  city: string;
  description: string;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  isMock: boolean;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  /**
   * Fetch current conditions from OpenWeatherMap. If no API key is set we
   * return deterministic MOCK data so the alert pipeline is fully testable
   * without external dependencies (this powers the "simulated weather alert").
   */
  async getCurrent(city: string, lat?: number, lon?: number): Promise<WeatherSnapshot> {
    const key = this.config.get('weather', { infer: true }).openWeatherKey;
    if (!key) return this.mock(city);

    try {
      const params: Record<string, string | number> = { units: 'metric', appid: key };
      if (lat != null && lon != null) {
        params.lat = lat;
        params.lon = lon;
      } else {
        params.q = city;
      }
      const { data } = await axios.get(
        'https://api.openweathermap.org/data/2.5/weather',
        { params },
      );
      return {
        city: data.name ?? city,
        description: data.weather?.[0]?.description ?? 'unknown',
        tempC: Math.round(data.main?.temp ?? 0),
        feelsLikeC: Math.round(data.main?.feels_like ?? 0),
        humidity: data.main?.humidity ?? 0,
        isMock: false,
      };
    } catch (err) {
      this.logger.warn(`OpenWeather failed for ${city}; using mock. ${String(err)}`);
      return this.mock(city);
    }
  }

  formatAlert(w: WeatherSnapshot): string {
    const tag = w.isMock ? ' <i>(simulated)</i>' : '';
    return (
      `🌦️ <b>WeatherGuard alert — ${w.city}</b>${tag}\n` +
      `${this.cap(w.description)}\n` +
      `🌡️ ${w.tempC}°C (feels like ${w.feelsLikeC}°C)\n` +
      `💧 Humidity ${w.humidity}%`
    );
  }

  private mock(city: string): WeatherSnapshot {
    const seed = city.length;
    return {
      city,
      description: ['clear sky', 'light rain', 'overcast clouds'][seed % 3],
      tempC: 12 + (seed % 15),
      feelsLikeC: 11 + (seed % 15),
      humidity: 40 + (seed % 50),
      isMock: true,
    };
  }

  private cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
