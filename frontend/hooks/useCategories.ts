import { useQuery } from "@tanstack/react-query";
import { CategoryRepository } from "../db/category.repository";
import { useAuthStore } from "../store/auth.store";

export const useCategories = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ["categories", userId],
    queryFn: () => CategoryRepository.getAll(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60,
  });
};
