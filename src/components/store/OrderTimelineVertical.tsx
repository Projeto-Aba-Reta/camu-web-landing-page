import { ORDER_TIMELINE } from "@/lib/status";

/**
 * Timeline de acompanhamento em coluna — pensada pro mobile (o
 * `OrderTimeline` horizontal aperta em telas pequenas).
 * `currentIndex` = último passo atingido (-1 = cancelado).
 */
export default function OrderTimelineVertical({
  currentIndex,
  stepDates = [],
}: {
  currentIndex: number;
  stepDates?: (string | null)[];
}) {
  if (currentIndex === -1) {
    return (
      <div className="rounded-2xl border-[3px] border-charcoal bg-coral/15 px-5 py-4 font-sans text-sm text-charcoal/75">
        Este pedido foi cancelado. Se acha que é engano, fala com a gente.
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col">
      {ORDER_TIMELINE.map((step, i) => {
        const done = i <= currentIndex;
        const current = i === currentIndex;
        const isLast = i === ORDER_TIMELINE.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[17px] top-9 h-[calc(100%-1rem)] w-[3px] rounded ${
                  i < currentIndex ? "bg-teal" : "bg-charcoal/15"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-[35px] w-[35px] flex-shrink-0 items-center justify-center rounded-full border-[3px] border-charcoal font-heading text-sm font-extrabold ${
                done ? "bg-teal text-charcoal" : "bg-offwhite text-charcoal/40"
              } ${current ? "ring-4 ring-coral/40" : ""}`}
            >
              {done ? "✓" : i + 1}
            </span>
            <div className="pt-1">
              <div
                className={`font-heading text-sm font-bold ${
                  done ? "text-charcoal" : "text-charcoal/45"
                }`}
              >
                {step.label}
              </div>
              <div className="font-sans text-[11px] text-charcoal/50">
                {stepDates[i] ?? (current ? "agora" : "—")}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
