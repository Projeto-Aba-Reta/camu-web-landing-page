"use client";

import { useEffect, useState } from "react";
import { trackError } from "@/lib/analytics";

/** Como `useState<string | null>`, mas registra o erro como evento toda vez que
 *  uma mensagem nova aparece. `origem` identifica o formulário/fluxo. */
export function useTrackedError(origem: string, initial: string | null = null) {
  const [error, setError] = useState<string | null>(initial);
  useEffect(() => {
    if (error) trackError(origem, error);
  }, [error, origem]);
  return [error, setError] as const;
}
