import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import syncRoutes from './routes/sync.routes';
import budgetRoutes from './routes/budget.routes';
import castleRoutes from './routes/castle.routes';
import economyRoutes from './routes/economy.routes';
import notificationRoutes from './routes/notification.routes';
import { requireAuth } from './middlewares/requireAuth';
import { errorHandler } from './middlewares/errorHandler';
import { env } from './config/env';

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors());
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

// Ruta base
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Servicio en línea' });
});

// Ruta de ejemplo protegida
app.get('/api/me', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});

// Middleware genérico para manejo de errores
app.use(errorHandler);

export default app;
