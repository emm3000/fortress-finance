import type { Request, Response } from 'express';
import * as castleService from '../services/castle.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';
import { sendOk } from '../utils/response';

export const getCastleState = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const castle = await castleService.getCastleByUserIdOrThrow(userId);
  sendOk(res, castle);
});
