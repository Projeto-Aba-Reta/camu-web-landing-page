"use client";

import { useEffect } from "react";
import { trackError } from "@/lib/analytics";

const MAX_PER_PAGE = 10;
// Ruído sem ação possível (extensões, scripts de terceiros, observers).
const IGNORE =
  /ResizeObserver loop|^Script error\.?$|Non-Error promise rejection|chrome-extension|moz-extension/i;

/** Captura erros JS não tratados e promises rejeitadas em qualquer página. */
export default function GlobalErrorTracker() {
  useEffect(() => {
    let count = 0;
    const report = (origem: string, message: string) => {
      if (count >= MAX_PER_PAGE || !message || IGNORE.test(message)) return;
      count += 1;
      trackError(origem, message);
    };
    const onError = (e: ErrorEvent) =>
      report("js_nao_tratado", e.message || String(e.error ?? ""));
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      report("promise_rejeitada", r instanceof Error ? r.message : String(r ?? ""));
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
