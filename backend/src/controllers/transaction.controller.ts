import type { Request, Response } from 'express';
import * as transactionService from '../services/transaction.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getStringParamOrThrow, getUserIdOrThrow } from '../utils/http';
import { sendOk } from '../utils/response';
import type { UpdateTransactionInput } from '../validations/transaction.validation';

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const transactionId = getStringParamOrThrow(req, 'id', 'ID de transacción inválido');
  const payload = req.body as UpdateTransactionInput;
  const updated = await transactionService.updateTransaction(userId, transactionId, payload);
  sendOk(res, updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdOrThrow(req);
  const transactionId = getStringParamOrThrow(req, 'id', 'ID de transacción inválido');
  await transactionService.deleteTransaction(userId, transactionId);
  sendOk(res, { message: 'Transacción eliminada' });
});
