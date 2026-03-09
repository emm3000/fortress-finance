import type { Request, Response } from 'express';
import * as castleService from '../services/castle.service';
import { asyncHandler } from '../utils/asyncHandler';
import { errorCatalog } from '../utils/errorCatalog';
import { getUserIdOrThrow } from '../utils/http';
import { sendOk } from '../utils/response';

export const getCastleState = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const castle = await castleService.getCastleByUserId(userId);
  if (!castle) {
    throw errorCatalog.resource.notFound('Castillo no encontrado para este usuario');
  }
  sendOk(res, castle);
});
