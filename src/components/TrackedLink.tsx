"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackFunnel, type FunnelEvent } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  event: FunnelEvent;
  eventProps?: Record<string, string | number | boolean>;
};

/** `next/link` que dispara um evento de funil no clique. */
export default function TrackedLink({ event, eventProps, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackFunnel(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
