import { Request, Response, NextFunction } from 'express';
import * as shopService from '../services/shop.service';


export const getShopItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await shopService.getAllShopItems();
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};
