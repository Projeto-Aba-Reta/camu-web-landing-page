"use client";

export default function QtyStepper({
  qty,
  onChange,
  size = "md",
}: {
  qty: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
  const num = size === "sm" ? "px-3.5 py-1.5 text-[13px]" : "px-4 py-2 text-sm";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border-2 border-charcoal">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        onClick={() => onChange(Math.max(1, qty - 1))}
        className={`${pad} font-heading text-base font-bold text-charcoal transition-colors hover:bg-charcoal/5`}
      >
        −
      </button>
      <span
        className={`${num} border-x-2 border-charcoal font-sans font-bold text-charcoal`}
        aria-live="polite"
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(qty + 1)}
        className={`${pad} font-heading text-base font-bold text-charcoal transition-colors hover:bg-charcoal/5`}
      >
        +
      </button>
    </div>
  );
}
