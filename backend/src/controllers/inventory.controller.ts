import { Request, Response, NextFunction } from 'express';
import * as inventoryService from '../services/inventory.service';
import { AppError } from '../utils/AppError';

export const getMyInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'No autorizado');

    const inventory = await inventoryService.getUserInventory(userId);
    res.status(200).json(inventory);
  } catch (error) {
    next(error);
  }
};

export const purchaseItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'No autorizado');

    const { itemId } = req.body;
    const result = await inventoryService.purchaseItem(userId, itemId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const equipItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'No autorizado');

    const { inventoryId, isEquipped } = req.body;
    const result = await inventoryService.toggleEquipItem(userId, inventoryId, isEquipped);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
