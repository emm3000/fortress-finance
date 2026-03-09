import type { Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();
  res.status(200).json(categories);
});
