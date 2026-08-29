import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPetMiniatureRequest, publicMediaUrl } from "@/lib/pet-miniature";
import { getPetMiniaturePricing } from "@/lib/store";
import PetMiniaturePreview from "@/components/store/PetMiniaturePreview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prévia da miniatura",
  robots: { index: false },
};

type Params = { id: string };

export default async function MiniaturaPetAcompanharPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [request, pricing] = await Promise.all([
    getPetMiniatureRequest(id),
    getPetMiniaturePricing(),
  ]);
  if (!request) notFound();

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:px-10 md:py-16">
      <PetMiniaturePreview
        requestId={request.id}
        initialStatus={request.status}
        initialPaintedPreviewUrl={
          request.generated_image_painted_path
            ? publicMediaUrl(request.generated_image_painted_path)
            : null
        }
        initialPlainPreviewUrl={
          request.generated_image_plain_path
            ? publicMediaUrl(request.generated_image_plain_path)
            : null
        }
        semPinturaCents={pricing.semPinturaCents}
        comPinturaCents={pricing.comPinturaCents}
        initialError={request.ai_error}
      />
    </section>
  );
}
