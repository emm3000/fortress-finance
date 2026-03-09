import type { Prisma } from '@prisma/client';

export type BudgetDto = Prisma.BudgetGetPayload<{
  include: {
    category: {
      select: {
        name: true;
        icon: true;
        type: true;
      };
    };
  };
}>;

