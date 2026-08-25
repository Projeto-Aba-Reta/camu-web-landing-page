import "server-only";
import { GoogleGenAI } from "@google/genai";

/** Interface isolando o provider de geração de imagem por IA do resto do pipeline. */
export type AiImageInput = {
  mimeType: string;
  base64: string;
};

export type AiImageResult = {
  mimeType: string;
  base64: string;
};

const PROMPT = [
  "Você é um gerador de prévias para uma loja de miniaturas impressas em 3D.",
  "A partir das fotos de referência do pet enviadas, gere UMA imagem mostrando",
  "como seria uma miniatura colecionável impressa em 3D desse pet: material",
  "plástico fosco, pose estática de estatueta, cores fiéis à pelagem do animal",
  "nas fotos, sobre uma base circular simples, fotografada em estúdio com fundo",
  "neutro claro. Não é para ficar fotorrealista — deve parecer um produto",
  "impresso em 3D de verdade, não o animal em si.",
].join(" ");

/** Gera a prévia da miniatura a partir das fotos do pet, via Gemini (image generation). */
export async function generatePetMiniatureImage(
  photos: AiImageInput[],
): Promise<AiImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("IA de imagem não configurada: defina GEMINI_API_KEY em .env.local");
  }
  if (photos.length === 0) {
    throw new Error("Nenhuma foto do pet fornecida para gerar a prévia.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          ...photos.map((p) => ({ inlineData: { mimeType: p.mimeType, data: p.base64 } })),
        ],
      },
    ],
  });

  const base64 = response.data;
  const inlinePart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
    ?.inlineData;
  if (!base64 || !inlinePart?.mimeType) {
    throw new Error("O provider de IA não retornou uma imagem.");
  }

  return { mimeType: inlinePart.mimeType, base64 };
}
