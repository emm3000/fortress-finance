import { useInfiniteQuery } from "@tanstack/react-query";
import { TransactionRepository } from "../db/transaction.repository";
import { useAuthStore } from "../store/auth.store";

export const useTransactions = () => {
  const user = useAuthStore((state) => state.user);
  const limit = 20;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return [];
      return await TransactionRepository.getAll(user.id, limit, pageParam);
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the limit, we've reached the end
      if (lastPage.length < limit) return undefined;
      // Otherwise, the next offset is the total number of items fetched so far
      return allPages.flat().length;
    },
    enabled: !!user?.id,
    initialPageParam: 0,
  });

  // Flatten the pages for easy consumption by components
  const transactions = data?.pages.flat() || [];

  return {
    transactions,
    isLoading,
    isFetchingNextPage,
    hasMore: !!hasNextPage,
    refreshTransactions: () => refetch(),
    fetchNextPage: () => {
      if (hasNextPage) fetchNextPage();
    },
  };
};
