import type { NextFunction, Request, Response } from 'express';
import * as transactionService from '../services/transaction.service';
import { AppError } from '../utils/AppError';
import type { UpdateTransactionInput } from '../validations/transaction.validation';

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'Usuario no identificado');
    }

    const transactionId = req.params.id;
    if (typeof transactionId !== 'string') {
      throw new AppError(400, 'ID de transacción inválido');
    }
    const payload = req.body as UpdateTransactionInput;
    const updated = await transactionService.updateTransaction(userId, transactionId, payload);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'Usuario no identificado');
    }

    const transactionId = req.params.id;
    if (typeof transactionId !== 'string') {
      throw new AppError(400, 'ID de transacción inválido');
    }
    await transactionService.deleteTransaction(userId, transactionId);
    res.status(200).json({ message: 'Transacción eliminada' });
  } catch (error) {
    next(error);
  }
};
