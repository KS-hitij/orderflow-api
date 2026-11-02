import { createApp } from './app';
import { config } from './config/env';
import { createContainer } from './container';
import { logger } from './lib/logger';

async function main(): Promise<void> {
  const container = createContainer();
  await container.authService.ensureAdmin(config.adminEmail, config.adminPassword);
  container.worker.start();

  const app = createApp(container);
  const server = app.listen(config.port, () => {
    logger.info('server listening', { port: config.port, env: config.env });
  });

  const shutdown = (signal: string) => {
    logger.info('shutting down', { signal });
    server.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('fatal startup error', { error: String(err) });
  process.exit(1);
});
