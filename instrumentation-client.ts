import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// Local development shares the production project token, so a dev server that
// initialized PostHog would report dev-only events and exceptions (e.g. React
// dev-build errors on localhost) to the production project. Initialize only in
// production to keep that noise out of error tracking.
if (process.env.NODE_ENV === "production" && token) {
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
  });
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization
// approaches, especially components like a PostHogProvider. instrumentation-client.ts is
// the correct solution for initializing client-side PostHog in Next.js 15.3+ apps.
