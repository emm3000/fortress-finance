import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { TransactionRepository } from "@/db/transaction.repository";
import { useAuthStore } from "@/store/auth.store";

export const useTransactions = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const limit = 20;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["transactions", userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return [];
      return await TransactionRepository.getAll(userId, limit, pageParam);
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page has fewer items than the limit, we've reached the end
      if (lastPage.length < limit) return undefined;
      // Keep pagination O(1): next offset = current offset + items in last page.
      const currentOffset = typeof lastPageParam === "number" ? lastPageParam : 0;
      return currentOffset + lastPage.length;
    },
    enabled: !!userId,
    initialPageParam: 0,
  });

  const transactions = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);
  const refreshTransactions = useCallback(() => refetch(), [refetch]);
  const fetchMoreTransactions = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  return {
    transactions,
    isLoading,
    isFetchingNextPage,
    hasMore: !!hasNextPage,
    refreshTransactions,
    fetchNextPage: fetchMoreTransactions,
  };
};
