import type { Request, Response } from 'express';
import * as shopService from '../services/shop.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getShopItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await shopService.getAllShopItems();
  res.status(200).json(items);
});
