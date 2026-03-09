import type { Request, Response } from 'express';
import * as shopService from '../services/shop.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendOk } from '../utils/response';

export const getShopItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await shopService.getAllShopItems();
  sendOk(res, items);
});
