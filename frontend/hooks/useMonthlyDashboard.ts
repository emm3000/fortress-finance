import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/dashboard.service';
import { useAuthStore } from '../store/auth.store';

export const useMonthlyDashboard = () => {
  const userId = useAuthStore((state) => state.user?.id);

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return useQuery({
    queryKey: ['dashboard', 'monthly', userId, year, month],
    queryFn: () => DashboardService.getMonthly(year, month),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
