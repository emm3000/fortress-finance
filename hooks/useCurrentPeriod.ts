import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export type CurrentPeriod = {
  year: number;
  month: number;
};

export const getCurrentPeriod = (now: Date = new Date()): CurrentPeriod => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
});

export const getMillisecondsUntilNextPeriodRefresh = (now: Date = new Date()) => {
  const nextRefresh = new Date(now);
  nextRefresh.setHours(24, 0, 0, 0);
  return Math.max(nextRefresh.getTime() - now.getTime(), 1_000);
};

export const useCurrentPeriod = () => {
  const [period, setPeriod] = useState<CurrentPeriod>(() => getCurrentPeriod());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const refreshPeriod = () => {
      setPeriod((current) => {
        const next = getCurrentPeriod();
        if (current.year === next.year && current.month === next.month) {
          return current;
        }
        return next;
      });
    };

    const scheduleRefresh = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        refreshPeriod();
        scheduleRefresh();
      }, getMillisecondsUntilNextPeriodRefresh());
    };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active") {
        return;
      }

      refreshPeriod();
      scheduleRefresh();
    };

    scheduleRefresh();

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.remove();
    };
  }, []);

  return period;
};
