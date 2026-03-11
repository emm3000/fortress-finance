import { useQuery } from '@tanstack/react-query';
import { queryKeys } from "@/constants/query-keys";
import { DashboardService } from "@/services/dashboard.service";
import { useAuthStore } from "@/store/auth.store";
import { useNetworkStore } from "@/store/network.store";
import { useCurrentPeriod } from "@/hooks/useCurrentPeriod";

export const useMonthlyDashboard = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const { year, month } = useCurrentPeriod();

  return useQuery({
    queryKey: queryKeys.dashboardMonthly(userId, year, month),
    queryFn: () => DashboardService.getMonthlyCachedOrRemote(userId!, year, month, isOnline),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
