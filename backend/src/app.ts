import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ruta base
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Servicio en línea' });
});

import { errorHandler } from './middlewares/errorHandler';

// Middleware genérico para manejo de errores
app.use(errorHandler);

export default app;
