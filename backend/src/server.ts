import 'dotenv/config';
import { env } from './config/env';
import app from './app';
import { initCronJobs } from './config/cron';
import { logger } from './utils/logger';
import { initMonitoring } from './utils/monitoring';

initMonitoring();

const server = app.listen(env.PORT, () => {
  logger.info('Server ready', { port: env.PORT });

  if (env.ENABLE_CRON) {
    // Iniciar Cron Jobs solo cuando la instancia está marcada para ello.
    initCronJobs();
    return;
  }

  logger.info('Cron jobs disabled for this instance', { enableCron: false });
});

export default server;
