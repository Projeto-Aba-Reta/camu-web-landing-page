import { ORDER_TIMELINE } from "@/lib/status";

/**
 * Timeline de acompanhamento (tela 6). `currentIndex` = último passo atingido
 * (-1 = cancelado). `stepDates` traz a data de cada passo já concluído.
 */
export default function OrderTimeline({
  currentIndex,
  stepDates,
}: {
  currentIndex: number;
  stepDates: (string | null)[];
}) {
  const total = ORDER_TIMELINE.length;
  const progressPct =
    currentIndex <= 0 ? 0 : Math.min(1, currentIndex / (total - 1)) * 100;

  return (
    <div className="relative px-2.5">
      {/* trilho */}
      <div className="absolute left-[5%] right-[5%] top-[26px] h-1 rounded bg-charcoal/12" />
      <div
        className="absolute left-[5%] top-[26px] h-1 rounded bg-teal"
        style={{ width: `${progressPct * 0.9}%` }}
      />
      <ol className="relative grid grid-cols-5 gap-2.5">
        {ORDER_TIMELINE.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <li key={step.key} className="flex flex-col items-center text-center">
              <div
                className={`mb-2.5 flex items-center justify-center rounded-full border-[3px] border-charcoal font-heading text-lg font-extrabold ${
                  done ? "bg-teal text-charcoal" : "bg-offwhite text-charcoal/40"
                }`}
                style={{ height: 52, width: 52 }}
              >
                {done ? "✓" : i + 1}
              </div>
              <div className="font-heading text-[12.5px] font-bold text-charcoal">
                {step.label}
              </div>
              <div className="font-sans text-[11px] text-charcoal/50">
                {stepDates[i] ?? "—"}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
