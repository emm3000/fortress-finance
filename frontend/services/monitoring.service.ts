import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const APP_ENV =
  Constants.expoConfig?.extra?.appEnv ??
  process.env.EXPO_PUBLIC_APP_ENV?.trim() ??
  (__DEV__ ? "development" : "production");

let initialized = false;
const monitoringEnabled = Boolean(SENTRY_DSN);

const getTracingSampleRate = () => {
  switch (APP_ENV) {
    case "production":
      return 0.2;
    case "qa":
    case "preview":
      return 0.5;
    default:
      return 1;
  }
};

const getProfileSampleRate = () => {
  if (APP_ENV === "production") {
    return 0.1;
  }

  if (APP_ENV === "qa" || APP_ENV === "preview") {
    return 0.25;
  }

  return 0;
};

export const initializeMonitoring = () => {
  if (initialized || !monitoringEnabled) {
    return monitoringEnabled;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: monitoringEnabled,
    environment: APP_ENV,
    tracesSampleRate: getTracingSampleRate(),
    profilesSampleRate: getProfileSampleRate(),
    enableCaptureFailedRequests: true,
    attachStacktrace: true,
  });

  Sentry.setTags({
    app_env: APP_ENV,
    execution_environment: Constants.executionEnvironment ?? "unknown",
  });

  initialized = true;
  return monitoringEnabled;
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (!monitoringEnabled) {
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
};

export const isMonitoringEnabled = () => monitoringEnabled;

export const setMonitoringUser = (user: { id: string; email?: string | null; name?: string | null } | null) => {
  if (!monitoringEnabled) {
    return;
  }

  Sentry.setUser(
    user
      ? {
          id: user.id,
          email: user.email ?? undefined,
          username: user.name ?? undefined,
        }
      : null
  );
};
