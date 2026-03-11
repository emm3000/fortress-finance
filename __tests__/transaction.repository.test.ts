import { TransactionRepository } from "@/db/transaction.repository";
import { SyncQueueRepository } from "@/db/syncQueue.repository";

const mockRunAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

jest.mock("@/db/database", () => ({
  getDatabase: jest.fn(async () => ({
    runAsync: mockRunAsync,
    getFirstAsync: mockGetFirstAsync,
  })),
}));

jest.mock("@/db/syncQueue.repository", () => ({
  SyncQueueRepository: {
    upsertOperation: jest.fn(),
  },
}));

describe("TransactionRepository", () => {
  const userId = "user-1";
  const transactionId = "tx-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a local transaction and enqueues an UPSERT operation", async () => {
    const transaction = {
      id: transactionId,
      user_id: userId,
      category_id: "cat-1",
      amount: 42,
      description: "Cafe",
      date: "2026-03-11T12:00:00.000Z",
      type: "EXPENSE" as const,
      is_synced: 0,
      updated_at: "2026-03-11T12:00:00.000Z",
      deleted_at: null,
    };

    await TransactionRepository.create(transaction);

    expect(mockRunAsync).toHaveBeenCalled();
    expect(SyncQueueRepository.upsertOperation).toHaveBeenCalledWith({
      userId,
      entityType: "TRANSACTION",
      entityId: transactionId,
      operation: "UPSERT",
      payload: {
        id: transactionId,
        amount: 42,
        type: "EXPENSE",
        categoryId: "cat-1",
        date: "2026-03-11T12:00:00.000Z",
        notes: "Cafe",
        updatedAt: "2026-03-11T12:00:00.000Z",
        deletedAt: null,
      },
    });
  });

  it("updates a transaction and resets sync state", async () => {
    await TransactionRepository.update(transactionId, userId, {
      amount: 99,
      type: "INCOME",
      category_id: "cat-2",
      description: "Pago",
      date: "2026-03-12T12:00:00.000Z",
    });

    expect(mockRunAsync).toHaveBeenCalled();
    expect(SyncQueueRepository.upsertOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        entityId: transactionId,
        operation: "UPSERT",
        payload: expect.objectContaining({
          id: transactionId,
          amount: 99,
          type: "INCOME",
          categoryId: "cat-2",
          notes: "Pago",
          deletedAt: null,
        }),
      })
    );
  });

  it("soft deletes a transaction and enqueues a DELETE operation", async () => {
    mockGetFirstAsync.mockResolvedValue({
      id: transactionId,
      user_id: userId,
      category_id: "cat-1",
      amount: 55,
      description: "Taxi",
      date: "2026-03-10T12:00:00.000Z",
      type: "EXPENSE",
      is_synced: 1,
      updated_at: "2026-03-10T12:00:00.000Z",
      deleted_at: null,
    });

    await TransactionRepository.softDelete(transactionId, userId);

    expect(mockRunAsync).toHaveBeenCalled();
    expect(SyncQueueRepository.upsertOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        entityId: transactionId,
        operation: "DELETE",
        payload: expect.objectContaining({
          id: transactionId,
          amount: 55,
          type: "EXPENSE",
          categoryId: "cat-1",
          notes: "Taxi",
        }),
      })
    );
  });
});
