import "server-only";
import { generatePetMiniatureImage } from "./ai-image";
import {
  downloadPhotosBase64,
  getPetMiniatureRequest,
  markFailed,
  markProcessing,
  markReady,
} from "./pet-miniature";

/**
 * Roda o pipeline de geração de imagem por IA pra uma encomenda: busca as
 * fotos, chama o provider e salva o resultado (ou marca falha). Chamada via
 * `after()` a partir da server action de intake/retry, pra não segurar a
 * resposta ao cliente pela duração da geração.
 */
export async function runPetMiniatureGeneration(requestId: string): Promise<void> {
  try {
    const request = await getPetMiniatureRequest(requestId);
    if (!request) return;

    const photos = await downloadPhotosBase64(request);
    const result = await generatePetMiniatureImage(photos);
    await markReady(requestId, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha desconhecida ao gerar a prévia.";
    console.error("[pet-miniature-pipeline]", message);
    await markFailed(requestId, message);
  }
}

/** Reprocessa as mesmas fotos já salvas, sem exigir novo upload. */
export async function retryPetMiniatureGeneration(requestId: string): Promise<void> {
  await markProcessing(requestId);
  await runPetMiniatureGeneration(requestId);
}
