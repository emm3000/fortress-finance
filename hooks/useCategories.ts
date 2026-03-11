import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { CategoryService } from "@/services/category.service";
import { useAuthStore } from "@/store/auth.store";
import { useNetworkStore } from "@/store/network.store";

export const useCategories = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const isOnline = useNetworkStore((state) => state.isOnline);

  return useQuery({
    queryKey: queryKeys.categories(userId),
    queryFn: () => CategoryService.getCachedOrRemote(isOnline),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60,
  });
};
