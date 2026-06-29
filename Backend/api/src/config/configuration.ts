export interface AppConfig {
  port: number;
  nodeEnv: string;
  adminWebUrl: string;
  userWebUrl: string;
  apiPublicUrl: string;
  mongoUri: string;
  google: { clientId: string; clientSecret: string; callbackUrl: string };
  jwt: { secret: string; expiresIn: string };
  adminEmails: string[];
  telegram: { botToken: string; botUsername: string; webhookSecret: string };
  weather: { openWeatherKey: string; alertCron: string; alertCronEnabled: boolean };
  // Shared secret an external scheduler (e.g. a Render Cron Job) must present to
  // trigger an alert cycle via POST /weather/run-cron.
  cronSecret: string;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  adminWebUrl: process.env.ADMIN_WEB_URL ?? 'http://localhost:5173',
  userWebUrl: process.env.USER_WEB_URL ?? 'http://localhost:5174',
  apiPublicUrl: process.env.API_PUBLIC_URL ?? 'http://localhost:4000',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/weatherguard',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:4000/auth/google/callback',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    botUsername: process.env.TELEGRAM_BOT_USERNAME ?? '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? 'webhook-secret',
  },
  weather: {
    openWeatherKey: process.env.OPENWEATHER_API_KEY ?? '',
    alertCron: process.env.ALERT_CRON ?? '0 7 * * *',
    // Set false to disable the in-process cron (e.g. on a free host that sleeps);
    // an external scheduler then drives alerts via POST /weather/run-cron.
    alertCronEnabled: (process.env.ALERT_CRON_ENABLED ?? 'true') !== 'false',
  },
  cronSecret: process.env.CRON_SECRET ?? '',
});
