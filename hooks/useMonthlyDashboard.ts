import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardService } from "@/services/dashboard.service";
import { useAuthStore } from "@/store/auth.store";
import { useNetworkStore } from "@/store/network.store";

export const useMonthlyDashboard = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const isOnline = useNetworkStore((state) => state.isOnline);

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return useQuery({
    queryKey: ['dashboard', 'monthly', userId, year, month],
    queryFn: () => DashboardService.getMonthlyCachedOrRemote(year, month, isOnline),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
