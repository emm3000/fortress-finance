import type { NextFunction, Request, Response } from 'express';

type AsyncController<TRequest extends Request, TResponse extends Response> = (
  req: TRequest,
  res: TResponse,
) => Promise<void>;

export const asyncHandler = <TRequest extends Request, TResponse extends Response>(
  controller: AsyncController<TRequest, TResponse>,
) => {
  return (req: TRequest, res: TResponse, next: NextFunction): void => {
    void controller(req, res).catch(next);
  };
};
