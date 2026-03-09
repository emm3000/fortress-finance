import 'dotenv/config';
import { env } from './config/env';
import app from './app';
import { initCronJobs } from './config/cron';

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server ready at: http://localhost:${String(env.PORT)}`);

  if (env.ENABLE_CRON) {
    // Iniciar Cron Jobs solo cuando la instancia está marcada para ello.
    initCronJobs();
    return;
  }

  // eslint-disable-next-line no-console
  console.log('⏸️ Cron Jobs deshabilitados en esta instancia (ENABLE_CRON=false)');
});

export default server;
