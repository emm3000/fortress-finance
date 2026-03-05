import prisma from '../config/db';
import { SyncBody } from '../validations/sync.validation';

export const synchronize = async (userId: string, data: SyncBody) => {
  const { lastSyncTimestamp, transactions } = data;

  // 1. PUSH: Guardar cambios provenientes de la App
  if (transactions.length > 0) {
    await prisma.$transaction(
      transactions.map((tx) =>
        prisma.transaction.upsert({
          where: { id: tx.id },
          create: {
            id: tx.id,
            userId,
            amount: tx.amount,
            type: tx.type,
            categoryId: tx.categoryId,
            date: tx.date,
            notes: tx.notes,
            updatedAt: tx.updatedAt,
            deletedAt: tx.deletedAt,
          },
          update: {
            amount: tx.amount,
            type: tx.type,
            categoryId: tx.categoryId,
            date: tx.date,
            notes: tx.notes,
            updatedAt: tx.updatedAt,
            deletedAt: tx.deletedAt,
          },
        })
      )
    );
  }

  // 2. PULL: Obtener cambios desde el servidor para la App
  // Traemos todo lo que se haya actualizado DESPUÉS del último sync del cliente
  const serverChanges = await prisma.transaction.findMany({
    where: {
      userId,
      updatedAt: {
        gt: lastSyncTimestamp,
      },
    },
    orderBy: { updatedAt: 'asc' },
  });

  return {
    syncTimestamp: new Date().toISOString(),
    changes: serverChanges,
  };
};
