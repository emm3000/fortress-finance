import type { Request, Response } from 'express';
import * as castleService from '../services/castle.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';

export const getCastleState = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const castle = await castleService.getCastleByUserId(userId);
  if (!castle) {
    throw new AppError(404, 'Castillo no encontrado para este usuario');
  }
  res.status(200).json(castle);
});
