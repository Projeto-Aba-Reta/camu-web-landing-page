"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DashboardItem } from "@/lib/account";
import OrderTimelineVertical from "@/components/store/OrderTimelineVertical";

type TabKey = "order" | "delivered" | "approval";

function OrderCard({ item }: { item: DashboardItem }) {
  return (
    <li className="sticker-shadow rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-5">
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
  );
}

export default function ContaOrders({ items }: { items: DashboardItem[] }) {
  const approval = items.filter((i) => i.stage === "approval");
  const orders = items.filter((i) => i.stage === "order" && !i.isDelivered);
  const delivered = items.filter((i) => i.stage === "order" && i.isDelivered);

  const [tab, setTab] = useState<TabKey>("order");
  const visible = tab === "order" ? orders : tab === "delivered" ? delivered : approval;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "order", label: "Pagamento em diante", count: orders.length },
    { key: "delivered", label: "Entregues", count: delivered.length },
    { key: "approval", label: "Em aprovação", count: approval.length },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border-[3px] border-charcoal px-4 py-2 font-heading text-[13px] font-bold transition-colors ${
              tab === t.key
                ? "bg-teal text-charcoal"
                : "bg-transparent text-charcoal hover:bg-charcoal/5"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-6 text-center font-sans text-sm text-charcoal/70">
          {tab === "order" && "Nenhum pedido do pagamento em diante ainda."}
          {tab === "delivered" && "Nenhum pedido entregue ainda."}
          {tab === "approval" && "Nenhuma prévia em aprovação no momento."}
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {visible.map((item) => (
            <OrderCard key={item.key} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
