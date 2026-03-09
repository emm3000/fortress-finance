import type { Request, Response } from 'express';
import * as syncService from '../services/sync.service';
import type { SyncBody } from '../validations/sync.validation';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';

type SyncRequest = Request<Record<string, never>, unknown, SyncBody>;

export const syncTransactions = asyncHandler(async (req: SyncRequest, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const result = await syncService.synchronize(userId, req.body);
  res.status(200).json(result);
});
