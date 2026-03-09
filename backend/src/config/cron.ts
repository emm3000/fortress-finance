import cron from 'node-cron';
import * as gameEngine from '../services/gameEngine.service';
import { logger } from '../utils/logger';

/**
 * Configure and start background cron jobs
 */
export const initCronJobs = () => {
  // Daily liquidation at 00:00 (Midnight)
  // '0 0 * * *'
  // For testing/demo, we can use every hour or a manual trigger endpoint
  cron.schedule('0 0 * * *', async () => {
    logger.info('Starting daily liquidation cron');
    try {
      const results = await gameEngine.runGlobalLiquidation();
      logger.info('Daily liquidation cron completed', { processedUsers: results.length });
    } catch (error) {
      logger.error('Daily liquidation cron failed', { error });
    }
  });

  logger.info('Cron jobs initialized');
};
