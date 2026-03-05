import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service';

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};
