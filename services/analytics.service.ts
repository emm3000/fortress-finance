type AnalyticsEventName = "transaction_created";

type AnalyticsPayload = Record<string, unknown>;

export const AnalyticsService = {
  track(event: AnalyticsEventName, payload: AnalyticsPayload) {
    // MVP v1: local instrumentation. Replace with provider (PostHog/Segment/etc.) later.
    console.log("[analytics]", event, payload);
  },
};
