"use client";

import { useEffect } from "react";
import { trackError } from "@/lib/analytics";

// Substitui o root layout quando ele mesmo quebra — sem CSS global, só estilos inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    trackError("render_global", error.message, error.digest ? { digest: error.digest } : undefined);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF7F2",
          color: "#1B1F1E",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1>Deu ruim por aqui</h1>
          <p>Algo quebrou. Tenta de novo em instantes.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#0FBFA0",
              color: "#1B1F1E",
              border: "3px solid #1B1F1E",
              borderRadius: 999,
              padding: "12px 24px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
