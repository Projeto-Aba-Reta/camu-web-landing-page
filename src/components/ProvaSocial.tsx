import Image from "next/image";
import { deliveredGallery, ordersDelivered } from "@/lib/data";

export default function ProvaSocial() {
  // Sem fotos reais ainda: não renderiza (evita galeria placeholder na home).
  if (deliveredGallery.length === 0) return null;

  return (
    <section className="bg-offwhite px-6 py-16 sm:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">
            Peças que já foram pra casa
          </h2>
          {ordersDelivered != null && (
            <span className="font-heading text-sm font-bold text-teal-dark">
              +{ordersDelivered} pedidos entregues
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {deliveredGallery.map((item) => (
            <div
              key={item.src}
              className="overflow-hidden rounded-[18px] border-[3px] border-charcoal bg-offwhite-2"
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={400}
                height={400}
                className="aspect-square w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
