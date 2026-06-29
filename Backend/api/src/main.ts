import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  const allowlist = [
    config.get('adminWebUrl', { infer: true }),
    config.get('userWebUrl', { infer: true }),
  ];
  const isDev = config.get('nodeEnv', { infer: true }) !== 'production';
  // In dev, also allow localhost and private-LAN origins on any port so the app
  // can be opened from a phone/another device (e.g. http://192.168.1.56:5175)
  // without hardcoding the machine's IP.
  const devLanOrigin =
    /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      // No origin = same-origin / non-browser clients (curl, server-to-server).
      if (!origin || allowlist.includes(origin)) return callback(null, true);
      if (isDev && devLanOrigin.test(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  });

  // Global DTO validation + stripping of unknown properties.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const port = config.get('port', { infer: true });
  // Bind to 0.0.0.0 so the API is reachable from other devices on the LAN
  // (e.g. a phone hitting http://<machine-ip>:4000), not just localhost.
  await app.listen(port, '0.0.0.0');
  Logger.log(`WeatherGuard API listening on http://0.0.0.0:${port}`, 'Bootstrap');
}
void bootstrap();
