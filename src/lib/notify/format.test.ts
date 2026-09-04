import { afterEach, describe, expect, it } from "vitest";
import { adminOrderUrl } from "./format";

describe("adminOrderUrl", () => {
  const originalEnv = process.env.ADMIN_BASE_URL;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.ADMIN_BASE_URL;
    else process.env.ADMIN_BASE_URL = originalEnv;
  });

  it("monta a url com a var definida", () => {
    process.env.ADMIN_BASE_URL = "https://admin.camu.com.br";
    expect(adminOrderUrl("A1B2C3")).toBe(
      "https://admin.camu.com.br/vendas/pedidos/codigo/A1B2C3",
    );
  });

  it("remove a barra final da var antes de montar a url", () => {
    process.env.ADMIN_BASE_URL = "https://admin.camu.com.br/";
    expect(adminOrderUrl("A1B2C3")).toBe(
      "https://admin.camu.com.br/vendas/pedidos/codigo/A1B2C3",
    );
  });

  it("retorna null sem a var", () => {
    delete process.env.ADMIN_BASE_URL;
    expect(adminOrderUrl("A1B2C3")).toBeNull();
  });
});
