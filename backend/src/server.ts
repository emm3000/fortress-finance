import 'dotenv/config';
import { env } from './config/env';
import app from './app';
import { initCronJobs } from './config/cron';

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server ready at: http://localhost:${env.PORT}`);

  // Iniciar Cron Jobs
  initCronJobs();
});

export default server;

