import { describe, expect, it } from "vitest";
import { timelineIndex } from "./status";
import type { OrderStatus } from "./types";

describe("timelineIndex", () => {
  const cases: [OrderStatus, number][] = [
    ["pending", 0],
    ["paid", 1],
    ["in_production", 1],
    ["finishing", 2],
    ["shipped", 3],
    ["delivered", 4],
    ["cancelled", -1],
  ];

  it.each(cases)("%s -> passo %i", (status, expected) => {
    expect(timelineIndex(status)).toBe(expected);
  });

  it("status desconhecido cai no passo 0", () => {
    expect(timelineIndex("qualquer_coisa" as OrderStatus)).toBe(0);
  });
});
