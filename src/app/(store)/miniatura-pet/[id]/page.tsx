import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPetMiniatureRequest, publicMediaUrl } from "@/lib/pet-miniature";
import PetMiniaturePreview from "@/components/store/PetMiniaturePreview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prévia da miniatura",
  robots: { index: false },
};

type Params = { id: string };

export default async function MiniaturaPetAcompanharPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const request = await getPetMiniatureRequest(id);
  if (!request) notFound();

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 sm:px-10 md:py-16">
      <PetMiniaturePreview
        requestId={request.id}
        initialStatus={request.status}
        initialPreviewUrl={
          request.generated_image_path ? publicMediaUrl(request.generated_image_path) : null
        }
        initialError={request.ai_error}
      />
    </section>
  );
}
