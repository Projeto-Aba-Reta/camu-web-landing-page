import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// Só inicializa em produção. Em desenvolvimento o mesmo token de produção
// mandaria pageviews e $exception de localhost pro projeto real, o que polui o
// error tracking com erros de compilação do dev server e mistura tráfego de
// teste com o de produção.
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
