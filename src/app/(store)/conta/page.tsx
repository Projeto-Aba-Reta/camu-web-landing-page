import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentCustomerEmail } from "@/lib/auth/session";
import { getCustomerDashboard } from "@/lib/account";
import { logoutCustomer } from "@/app/actions/auth";
import OrderTimelineVertical from "@/components/store/OrderTimelineVertical";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false },
};

export default async function ContaPage() {
  const email = await getCurrentCustomerEmail();
  if (!email) redirect("/login");

  const items = await getCustomerDashboard(email);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:px-10 md:py-16">
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

      {items.length === 0 ? (
        <div className="rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-6 text-center font-sans text-sm text-charcoal/70">
          <p className="mb-4">Nenhum pedido por aqui ainda.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/loja"
              className="rounded-full border-[3px] border-charcoal bg-teal px-5 py-2.5 font-heading text-[13px] font-bold text-charcoal"
            >
              Ver catálogo
            </Link>
            <Link
              href="/miniatura-pet"
              className="rounded-full border-[3px] border-charcoal bg-coral px-5 py-2.5 font-heading text-[13px] font-bold text-charcoal"
            >
              Miniatura do seu pet
            </Link>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {items.map((item) => (
            <li
              key={item.key}
              className="sticker-shadow rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-5"
            >
              <div className="flex gap-4">
                {item.previewImageUrl && (
                  <div className="hidden overflow-hidden rounded-xl border-2 border-charcoal sm:block">
                    <Image
                      src={item.previewImageUrl}
                      alt={`Prévia de ${item.title}`}
                      width={96}
                      height={96}
                      className="h-24 w-24 object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-heading text-[15px] font-bold text-charcoal">
                      {item.title}
                    </h2>
                    <span className="rounded-full border-2 border-charcoal bg-teal px-2.5 py-0.5 font-heading text-[11px] font-bold text-charcoal">
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 font-sans text-[12px] text-charcoal/50">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {item.timelineIndex !== null && (
                <div className="mt-5">
                  <OrderTimelineVertical
                    currentIndex={item.timelineIndex}
                    stepDates={item.stepDates}
                  />
                </div>
              )}

              <Link
                href={item.href}
                className="mt-4 inline-block font-heading text-[13px] font-bold text-teal-dark underline underline-offset-4 hover:text-charcoal"
              >
                Ver detalhes →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
