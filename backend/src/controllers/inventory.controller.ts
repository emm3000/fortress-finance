import type { Request, Response } from 'express';
import * as inventoryService from '../services/inventory.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserIdOrThrow } from '../utils/http';
import type { PurchaseInput, EquipInput } from '../validations/economy.validation';

type PurchaseRequest = Request<Record<string, never>, unknown, PurchaseInput>;
type EquipRequest = Request<Record<string, never>, unknown, EquipInput>;

export const getMyInventory = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const inventory = await inventoryService.getUserInventory(userId);
  res.status(200).json(inventory);
});

export const purchaseItem = asyncHandler(async (req: PurchaseRequest, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const { itemId } = req.body;
  const result = await inventoryService.purchaseItem(userId, itemId);
  res.status(201).json(result);
});

export const equipItem = asyncHandler(async (req: EquipRequest, res: Response) => {
  const userId = getUserIdOrThrow(req, 'No autorizado');
  const { inventoryId, isEquipped } = req.body;
  const result = await inventoryService.toggleEquipItem(userId, inventoryId, isEquipped);
  res.status(200).json(result);
});
