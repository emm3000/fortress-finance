import type { Request, Response, NextFunction } from 'express';
import * as castleService from '../services/castle.service';
import { AppError } from '../utils/AppError';

export const getCastleState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'Usuario no identificado');
    }

    const castle = await castleService.getCastleByUserId(userId);
    if (!castle) {
      throw new AppError(404, 'Castillo no encontrado para este usuario');
    }

    res.status(200).json(castle);
  } catch (error) {
    next(error);
  }
};
