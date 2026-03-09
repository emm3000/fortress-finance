import prisma from '../config/db';
import { startOfMonth, endOfMonth } from 'date-fns';
import { sendPushNotification } from './notification.service';

/**
 * Perform daily liquidation for a single user.
 * Calculates expense sums, compares with budgets, and impacts castle HP.
 */
export const liquidateUser = async (userId: string, targetDate: Date = new Date()) => {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Get user's budgets
    const budgets = await tx.budget.findMany({
      where: { userId },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (budgets.length === 0) {
      return { status: 'no_budgets' };
    }

    // 2. Get castle state
    const castle = await tx.castleState.findUnique({
      where: { userId },
    });

    if (!castle) {
      return { status: 'no_castle' };
    }

    let totalDamage = 0;
    const events: { eventDesc: string; hpImpact: number }[] = [];
    const budgetAlerts: { title: string; body: string; type: 'ATTACK' }[] = [];

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

      const totalSpent = Number(aggregate._sum.amount ?? 0);
      const limitAmount = Number(budget.limitAmount);
      const ratio = limitAmount > 0 ? totalSpent / limitAmount : 0;
      const categoryName = budget.category.name;

      if (ratio >= 1) {
        // Budget exceeded! Orc attack!
        const excess = totalSpent - limitAmount;
        // Basic damage logic: 5 HP + 1 HP for every 10 units exceeded (tweak as needed)
        const damage = 5 + Math.floor(excess / 10);
        totalDamage += damage;

        events.push({
          eventDesc: `¡Ataque de Orcos! Presupuesto excedido en categoría. Gasto: ${String(totalSpent)}, Límite: ${budget.limitAmount.toString()}`,
          hpImpact: -damage,
        });

        budgetAlerts.push({
          title: `🚨 Presupuesto excedido: ${categoryName}`,
          body: `Ya consumiste ${String(totalSpent)} de ${String(limitAmount)} en esta categoría.`,
          type: 'ATTACK',
        });
        continue;
      }

      if (ratio >= 0.8) {
        budgetAlerts.push({
          title: `⚠️ Presupuesto en riesgo: ${categoryName}`,
          body: `Vas al ${String(Math.floor(ratio * 100))}% (${String(totalSpent)} de ${String(limitAmount)}).`,
          type: 'ATTACK',
        });
      }
    }

    // 4. Update Castle, Wallet and Logs
    if (totalDamage > 0) {
      // Impacto en el Castillo
      const newHp = Math.max(0, castle.hp - totalDamage);
      await tx.castleState.update({
        where: { userId },
        data: {
          hp: newHp,
          status: newHp === 0 ? 'RUINS' : 'UNDER_ATTACK',
        },
      });

      // Impacto en la Racha (se pierde la racha por exceder presupuestos)
      await tx.userWallet.update({
        where: { userId },
        data: { streakDays: 0 },
      });
    } else {
      // No budgets exceeded! The kingdom prospers (Sanación y Oro)
      const healing = 2; // Fixed healing per day of discipline
      const newHp = Math.min(castle.maxHp, castle.hp + healing);

      await tx.castleState.update({
        where: { userId },
        data: {
          hp: newHp,
          status: 'HEALTHY',
        },
      });

      // Acreditar Oro y aumentar racha
      const wallet = await tx.userWallet.findUnique({ where: { userId } });
      const currentStreak = wallet?.streakDays ?? 0;
      const newStreak = currentStreak + 1;

      // Recompensa: 10 base + 5 por cada día de racha (máximo 50 de bono)
      const goldReward = 10 + Math.min(50, currentStreak * 5);

      await tx.userWallet.update({
        where: { userId },
        data: {
          streakDays: newStreak,
          goldBalance: { increment: goldReward },
        },
      });

      events.push({
        eventDesc: `Día de paz. Racha de ${String(newStreak)} días. +${String(goldReward)} de oro recolectado.`,
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

    return { status: 'success', totalDamage, eventsCount: events.length, budgetAlerts };
  });

  // Enviar notificaciones fuera de la transacción para no bloquearla
  if (result.status === 'success' && typeof result.totalDamage === 'number') {
    if (Array.isArray(result.budgetAlerts) && result.budgetAlerts.length > 0) {
      for (const alert of result.budgetAlerts) {
        await sendPushNotification({
          userId,
          title: alert.title,
          body: alert.body,
          type: alert.type,
          dedupeWindowMinutes: 12 * 60,
        });
      }
    }

    if (result.totalDamage <= 0 && result.budgetAlerts.length === 0) {
      await sendPushNotification({
        userId,
        title: '🛡️ Tu reino prospera',
        body: 'Has cumplido tus metas. Tu castillo se recupera y has recolectado oro.',
        type: 'REWARD',
      });
    }
  }

  return result;
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
