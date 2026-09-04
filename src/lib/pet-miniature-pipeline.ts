import "server-only";
import { generatePetMiniatureImages, generatePetMiniaturePaintedImage } from "./ai-image";
import {
  downloadPhotosBase64,
  getPetMiniatureRequest,
  markFailed,
  markProcessing,
  markReady,
  markReadyPainted,
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
    const result = await generatePetMiniatureImages(photos);
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

/** Fluxo "expressa": gera só a prévia PINTADA (esse fluxo só vende a versão
 *  pintada) a partir das fotos enviadas pós-pagamento. Chamada via `after()`
 *  a partir de `uploadExpressPetPhotos`. */
export async function runExpressPetMiniatureGeneration(requestId: string): Promise<void> {
  try {
    const request = await getPetMiniatureRequest(requestId);
    if (!request) return;

    const photos = await downloadPhotosBase64(request);
    const result = await generatePetMiniaturePaintedImage(photos);
    await markReadyPainted(requestId, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha desconhecida ao gerar a prévia.";
    console.error("[pet-miniature-pipeline:express]", message);
    await markFailed(requestId, message);
  }
}
