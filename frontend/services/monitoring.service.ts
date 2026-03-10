import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const APP_ENV =
  Constants.expoConfig?.extra?.appEnv ??
  process.env.EXPO_PUBLIC_APP_ENV?.trim() ??
  (__DEV__ ? "development" : "production");

let initialized = false;

export const initializeMonitoring = () => {
  if (initialized || !SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    environment: APP_ENV,
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
