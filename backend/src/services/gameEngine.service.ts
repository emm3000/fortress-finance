import prisma from '../config/db';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Perform daily liquidation for a single user.
 * Calculates expense sums, compares with budgets, and impacts castle HP.
 */
export const liquidateUser = async (userId: string, targetDate: Date = new Date()) => {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  return await prisma.$transaction(async (tx) => {
    // 1. Get user's budgets
    const budgets = await tx.budget.findMany({
      where: { userId },
    });

    if (budgets.length === 0) return { status: 'no_budgets' };

    // 2. Get castle state
    const castle = await tx.castleState.findUnique({
      where: { userId },
    });

    if (!castle) return { status: 'no_castle' };

    let totalDamage = 0;
    const events: { eventDesc: string; hpImpact: number }[] = [];

    // 3. Check each budget
    for (const budget of budgets) {
      const aggregate = await tx.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          userId,
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
          deletedAt: null,
        },
      });

      const totalSpent = Number(aggregate._sum.amount || 0);

      if (totalSpent > Number(budget.limitAmount)) {
        // Budget exceeded! Orc attack!
        const excess = totalSpent - Number(budget.limitAmount);
        // Basic damage logic: 5 HP + 1 HP for every 10 units exceeded (tweak as needed)
        const damage = 5 + Math.floor(excess / 10);
        totalDamage += damage;

        events.push({
          eventDesc: `¡Ataque de Orcos! Presupuesto excedido en categoría. Gasto: ${totalSpent}, Límite: ${budget.limitAmount}`,
          hpImpact: -damage,
        });
      }
    }

    // 4. Update Castle and Logs
    if (totalDamage > 0) {
      const newHp = Math.max(0, castle.hp - totalDamage);
      await tx.castleState.update({
        where: { userId },
        data: {
          hp: newHp,
          status: newHp === 0 ? 'RUINS' : 'UNDER_ATTACK',
        },
      });
    } else {
      // No budgets exceeded! The kingdom prospers (Sanación)
      const healing = 2; // Fixed healing per day of discipline
      const newHp = Math.min(castle.maxHp, castle.hp + healing);
      
      await tx.castleState.update({
        where: { userId },
        data: {
          hp: newHp,
          status: 'HEALTHY',
        },
      });

      events.push({
        eventDesc: 'Día de paz. La fortaleza se recupera.',
        hpImpact: healing,
      });
    }

    // Register events
    if (events.length > 0) {
      await tx.gameEventLog.createMany({
        data: events.map((e) => ({
          userId,
          eventDesc: e.eventDesc,
          hpImpact: e.hpImpact,
        })),
      });
    }

    return { status: 'success', totalDamage, eventsCount: events.length };
  });
};

/**
 * Batch liquidation for all users (Cron Job Entry point)
 */
export const runGlobalLiquidation = async () => {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  const results = [];
  for (const user of users) {
    try {
      const res = await liquidateUser(user.id);
      results.push({ userId: user.id, ...res });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error liquidating user ${user.id}:`, error);
      results.push({ userId: user.id, status: 'error', error });
    }

  }

  return results;
};
