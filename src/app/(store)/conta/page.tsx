import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomerEmail } from "@/lib/auth/session";
import { getCustomerDashboard, getPendingPhotosOrders } from "@/lib/account";
import { logoutCustomer } from "@/app/actions/auth";
import { STORE_ENABLED } from "@/lib/features";
import ContaOrders from "@/components/store/ContaOrders";
import ContaTracker from "@/components/store/ContaTracker";
import TrackedLink from "@/components/TrackedLink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false },
};

export default async function ContaPage() {
  const email = await getCurrentCustomerEmail();
  if (!email) redirect("/login");

  const [items, pendingPhotosOrders] = await Promise.all([
    getCustomerDashboard(email),
    getPendingPhotosOrders(email),
  ]);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:px-10 md:py-16">
      <ContaTracker pedidos={items.length} fotosPendentes={pendingPhotosOrders.length} />
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-charcoal sm:text-3xl">
            Meus pedidos
          </h1>
          <p className="mt-1 font-sans text-sm text-charcoal/60">{email}</p>
        </div>
        <form action={logoutCustomer}>
          <button
            type="submit"
            className="rounded-full border-2 border-charcoal bg-transparent px-4 py-2 font-heading text-[13px] font-bold text-charcoal transition-colors hover:bg-charcoal/5"
          >
            Sair
          </button>
        </form>
      </div>

      {pendingPhotosOrders.length > 0 && (
        <div className="mb-8 rounded-2xl border-[3px] border-charcoal bg-coral/15 p-5">
          <h2 className="mb-3 font-heading text-[15px] font-bold text-charcoal">
            Falta mandar as fotos do seu pet 📸
          </h2>
          <ul className="flex flex-col gap-3">
            {pendingPhotosOrders.map((o) => (
              <li
                key={o.orderCode}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-charcoal bg-offwhite-2 px-4 py-3"
              >
                <span className="font-sans text-[13px] text-charcoal/75">
                  Pedido <strong className="font-bold text-charcoal">#{o.orderCode}</strong> —{" "}
                  {o.missingCount === 1
                    ? "1 pet sem foto"
                    : `${o.missingCount} pets sem foto`}
                </span>
                <TrackedLink
                  href={o.href}
                  event="conta_fotos_pendentes_click"
                  eventProps={{ pedido: o.orderCode }}
                  className="sticker-shadow rounded-full border-[3px] border-charcoal bg-teal px-4 py-2 font-heading text-[12px] font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
                >
                  Enviar as fotos
                </TrackedLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-6 text-center font-sans text-sm text-charcoal/70">
          <p className="mb-4">Nenhum pedido por aqui ainda.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {STORE_ENABLED && (
              <Link
                href="/loja"
                className="rounded-full border-[3px] border-charcoal bg-teal px-5 py-2.5 font-heading text-[13px] font-bold text-charcoal"
              >
                Ver catálogo
              </Link>
            )}
            <Link
              href="/miniatura-pet"
              className="rounded-full border-[3px] border-charcoal bg-coral px-5 py-2.5 font-heading text-[13px] font-bold text-charcoal"
            >
              Miniatura do seu pet
            </Link>
          </div>
        </div>
      ) : (
        <ContaOrders items={items} />
      )}
    </section>
  );
}
