import { SyncService } from "@/services/sync.service";
import { SyncMetaRepository } from "@/db/syncMeta.repository";
import { SyncQueueRepository, type SyncOperation } from "@/db/syncQueue.repository";
import { TransactionRepository } from "@/db/transaction.repository";
import { CastleRepository } from "@/db/castle.repository";
import { supabase } from "@/services/supabase.client";

jest.mock("@/db/syncMeta.repository", () => ({
  SyncMetaRepository: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock("@/db/syncQueue.repository", () => ({
  SyncQueueRepository: {
    getDueOperations: jest.fn(),
    markSucceeded: jest.fn(),
    markFailed: jest.fn(),
    getQueueStatus: jest.fn(),
  },
}));

jest.mock("@/db/transaction.repository", () => ({
  TransactionRepository: {
    markAsSynced: jest.fn(),
    upsertManyFromRemote: jest.fn(),
  },
}));

jest.mock("@/db/castle.repository", () => ({
  CastleRepository: {
    upsert: jest.fn(),
  },
}));

jest.mock("@/db/category.repository", () => ({
  CategoryRepository: {
    upsertMany: jest.fn(),
  },
}));

jest.mock("@/services/supabase.client", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe("SyncService.fullSync", () => {
  let consoleErrorSpy: jest.SpyInstance;
  const queuedOperation: SyncOperation = {
    id: "op-1",
    user_id: "user-1",
    entity_type: "TRANSACTION",
    entity_id: "tx-1",
    operation: "UPSERT",
    payload: JSON.stringify({
      id: "tx-1",
      amount: 50,
      type: "EXPENSE",
      categoryId: "cat-1",
      date: "2026-03-11T12:00:00.000Z",
      notes: "Cafe",
      updatedAt: "2026-03-11T12:00:00.000Z",
      deletedAt: null,
    }),
    status: "PENDING",
    attempts: 0,
    next_retry_at: null,
    last_error: null,
    created_at: "2026-03-11T12:00:00.000Z",
    updated_at: "2026-03-11T12:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(SyncMetaRepository.get).mockResolvedValue(null);
    jest.mocked(TransactionRepository.markAsSynced).mockResolvedValue(undefined);
    jest.mocked(TransactionRepository.upsertManyFromRemote).mockResolvedValue(undefined);
    jest.mocked(CastleRepository.upsert).mockResolvedValue(undefined);
    jest.mocked(SyncQueueRepository.markSucceeded).mockResolvedValue(undefined);
    jest.mocked(SyncQueueRepository.markFailed).mockResolvedValue(undefined);
    jest.mocked(SyncQueueRepository.getQueueStatus).mockResolvedValue({
      pendingCount: 0,
      failedCount: 0,
      nextRetryAt: null,
      lastError: null,
    });
    jest.mocked(SyncMetaRepository.set).mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("marks acknowledged operations as synced and removes them from the queue", async () => {
    jest.mocked(SyncQueueRepository.getDueOperations).mockResolvedValue([queuedOperation]);
    jest.mocked(supabase.rpc).mockResolvedValue({
      data: {
        syncTimestamp: "2026-03-11T12:05:00.000Z",
        acknowledgedOperationIds: ["op-1"],
        changes: {
          transactions: [],
          castle: null,
          wallet: null,
        },
      },
      count: null,
      error: null,
      status: 200,
      statusText: "OK",
    });

    const result = await SyncService.fullSync("user-1");

    expect(supabase.rpc).toHaveBeenCalledWith("sync_client_state", {
      p_last_sync_timestamp: null,
      p_transactions: [
        {
          operationId: "op-1",
          id: "tx-1",
          amount: 50,
          type: "EXPENSE",
          categoryId: "cat-1",
          date: "2026-03-11T12:00:00.000Z",
          notes: "Cafe",
          updatedAt: "2026-03-11T12:00:00.000Z",
          deletedAt: null,
        },
      ],
    });
    expect(TransactionRepository.markAsSynced).toHaveBeenCalledWith(["tx-1"]);
    expect(SyncQueueRepository.markSucceeded).toHaveBeenCalledWith(["op-1"]);
    expect(result.hasTransactionsUpdates).toBe(true);
  });

  it("does not requeue acknowledged operations when local persistence fails later", async () => {
    jest
      .mocked(SyncQueueRepository.getDueOperations)
      .mockResolvedValueOnce([queuedOperation])
      .mockResolvedValueOnce([]);
    jest.mocked(supabase.rpc).mockResolvedValue({
      data: {
        syncTimestamp: "2026-03-11T12:05:00.000Z",
        acknowledgedOperationIds: ["op-1"],
        changes: {
          transactions: [],
          castle: null,
          wallet: null,
        },
      },
      count: null,
      error: null,
      status: 200,
      statusText: "OK",
    });
    jest
      .mocked(SyncMetaRepository.set)
      .mockRejectedValue(new Error("failed to persist sync metadata"));

    await expect(SyncService.fullSync("user-1")).rejects.toThrow(
      "failed to persist sync metadata"
    );

    expect(TransactionRepository.markAsSynced).toHaveBeenCalledWith(["tx-1"]);
    expect(SyncQueueRepository.markSucceeded).toHaveBeenCalledWith(["op-1"]);
    expect(SyncQueueRepository.markFailed).not.toHaveBeenCalled();
  });
});
