import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

import {
  getCurrentPeriod,
  getMillisecondsUntilNextPeriodRefresh,
  useCurrentPeriod,
} from "@/hooks/useCurrentPeriod";

describe("useCurrentPeriod", () => {
  const appStateListeners: ((status: AppStateStatus) => void)[] = [];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 2, 31, 23, 59, 58, 0));
    appStateListeners.length = 0;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
      appStateListeners.push(listener);
      return {
        remove: jest.fn(() => {
          const index = appStateListeners.indexOf(listener);
          if (index >= 0) {
            appStateListeners.splice(index, 1);
          }
        }),
      };
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("refreshes the current period when the date crosses into a new month", () => {
    const { result } = renderHook(() => useCurrentPeriod());

    expect(result.current).toEqual({ year: 2026, month: 3 });

    act(() => {
      jest.setSystemTime(new Date(2026, 3, 1, 0, 0, 1, 0));
      jest.advanceTimersByTime(3_000);
    });

    expect(result.current).toEqual({ year: 2026, month: 4 });
  });

  it("refreshes when the app returns to the foreground", () => {
    const { result } = renderHook(() => useCurrentPeriod());

    act(() => {
      jest.setSystemTime(new Date(2026, 4, 1, 8, 0, 0, 0));
      appStateListeners.at(-1)?.("active");
    });

    expect(result.current).toEqual({ year: 2026, month: 5 });
  });

  it("exposes deterministic period helpers", () => {
    expect(getCurrentPeriod(new Date(2026, 10, 7, 10, 30, 0, 0))).toEqual({
      year: 2026,
      month: 11,
    });
    expect(getMillisecondsUntilNextPeriodRefresh(new Date(2026, 10, 7, 23, 59, 59, 500))).toBe(
      1_000
    );
  });
});
