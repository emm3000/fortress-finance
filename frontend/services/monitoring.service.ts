import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

let initialized = false;

export const initializeMonitoring = () => {
  if (initialized || !SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    environment: Constants.expoConfig?.extra?.eas?.projectId ? "production" : "development",
    tracesSampleRate: __DEV__ ? 0 : 0.2,
  });

  initialized = true;
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
};
