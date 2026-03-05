import prisma from '../config/db';
import { SyncBody } from '../validations/sync.validation';

export const synchronize = async (userId: string, data: SyncBody) => {
  const { lastSyncTimestamp, transactions } = data;

  // Execute PUSH and PULL atomically to prevent race conditions
  const { syncTimestamp, serverChanges } = await prisma.$transaction(async (tx) => {
    // 1. PUSH: Guardar cambios provenientes de la App
    if (transactions.length > 0) {
      await Promise.all(
        transactions.map((t) =>
          tx.transaction.upsert({
            where: { id: t.id },
            create: {
              id: t.id,
              userId,
              amount: t.amount,
              type: t.type,
              categoryId: t.categoryId,
              date: t.date,
              notes: t.notes,
              updatedAt: t.updatedAt,
              deletedAt: t.deletedAt,
            },
            update: {
              amount: t.amount,
              type: t.type,
              categoryId: t.categoryId,
              date: t.date,
              notes: t.notes,
              updatedAt: t.updatedAt,
              deletedAt: t.deletedAt,
            },
          })
        )
      );
    }

    // 2. PULL: Leer timestamp del servidor DENTRO de la transacción para evitar
    //    diferencias de reloj entre Node y Postgres
    const now = new Date();

    // Traemos todo lo que se haya actualizado DESPUÉS del último sync del cliente
    const changes = await tx.transaction.findMany({
      where: {
        userId,
        updatedAt: {
          gt: lastSyncTimestamp,
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    return { syncTimestamp: now.toISOString(), serverChanges: changes };
  });

  return {
    syncTimestamp,
    changes: serverChanges,
  };
};

