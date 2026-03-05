import { Request, Response, NextFunction } from 'express';
import * as syncService from '../services/sync.service';

export const syncTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no identificado' });
      return;
    }

    const result = await syncService.synchronize(userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
