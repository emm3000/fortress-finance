import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import syncRoutes from './routes/sync.routes';
import budgetRoutes from './routes/budget.routes';
import castleRoutes from './routes/castle.routes';
import economyRoutes from './routes/economy.routes';
import notificationRoutes from './routes/notification.routes';
import onboardingRoutes from './routes/onboarding.routes';
import transactionRoutes from './routes/transaction.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { requireAuth } from './middlewares/requireAuth';
import { errorHandler } from './middlewares/errorHandler';
import { env } from './config/env';
import prisma from './config/db';
import { sendError, sendOk } from './utils/response';

const app = express();
const allowedCorsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Mobile apps, curl and server-to-server requests may not send Origin.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedCorsOrigins.length === 0 && env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    if (allowedCorsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
};

// Middlewares globales
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/castle', castleRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta base
app.get('/api/health', (req: Request, res: Response) => {
  sendOk(res, { status: 'OK', message: 'Servicio en línea' });
});

app.get('/api/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendOk(res, { status: 'READY', message: 'Servicio y base de datos disponibles' });
  } catch {
    sendError(res, 503, 'Servicio no listo');
  }
});

// Ruta de ejemplo protegida
app.get('/api/me', requireAuth, (req: Request, res: Response) => {
  sendOk(res, { user: req.user });
});

// Global error-handling middleware
app.use(errorHandler);

export default app;
