import cron from 'node-cron';
import * as gameEngine from '../services/gameEngine.service';

/**
 * Configure and start background cron jobs
 */
export const initCronJobs = () => {
  // Daily liquidation at 00:00 (Midnight)
  // '0 0 * * *'
  // For testing/demo, we can use every hour or a manual trigger endpoint
  cron.schedule('0 0 * * *', async () => {
    // eslint-disable-next-line no-console
    console.log('🕒 Iniciando liquidación diaria...');
    try {
      const results = await gameEngine.runGlobalLiquidation();
      // eslint-disable-next-line no-console
      console.log(`✅ Liquidación completada. Usuarios procesados: ${String(results.length)}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error en el cron de liquidación:', error);
    }
  });

  // eslint-disable-next-line no-console
  console.log('⏰ Cron Jobs inicializados');
};
