import type { Request, Response, NextFunction } from 'express';
import * as syncService from '../services/sync.service';
import type { SyncBody } from '../validations/sync.validation';

type SyncRequest = Request<Record<string, never>, unknown, SyncBody>;

export const syncTransactions = async (req: SyncRequest, res: Response, next: NextFunction) => {
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
