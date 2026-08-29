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

const BASE_PROMPT = [
  "Você é um gerador de prévias para uma loja de miniaturas impressas em 3D.",
  "A partir das fotos de referência do pet enviadas, gere UMA imagem mostrando",
  "como seria uma miniatura colecionável impressa em 3D desse pet: pose",
  "estática de estatueta sobre uma base circular simples, fotografada em",
  "estúdio com fundo neutro claro. Não é para ficar fotorrealista — deve",
  "parecer um produto impresso em 3D de verdade, não o animal em si.",
].join(" ");

const PAINTED_PROMPT = [
  BASE_PROMPT,
  "Esta versão é PINTADA À MÃO: cores fiéis à pelagem e às marcações do animal",
  "nas fotos, com acabamento de tinta acrílica bem aplicada, como uma",
  "miniatura colecionável pintada profissionalmente.",
].join(" ");

const PLAIN_PROMPT = [
  BASE_PROMPT,
  "Esta versão é SEM PINTURA: uma peça mais simples, direto da impressora,",
  "em plástico fosco de UMA ÚNICA COR sólida e neutra (ex.: cinza, branco ou",
  "bege claro) igual em toda a peça — sem nenhuma cor da pelagem do animal,",
  "sem pintura, sem detalhes de cor. Mesma pose e forma da versão pintada.",
].join(" ");

async function generateOne(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  photos: AiImageInput[],
): Promise<AiImageResult> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
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

export type PetMiniatureImages = {
  painted: AiImageResult;
  plain: AiImageResult;
};

/** Gera as duas prévias da miniatura (pintada e sem pintura) a partir das
 *  fotos do pet, via Gemini (image generation). */
export async function generatePetMiniatureImages(
  photos: AiImageInput[],
): Promise<PetMiniatureImages> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("IA de imagem não configurada: defina GEMINI_API_KEY em .env.local");
  }
  if (photos.length === 0) {
    throw new Error("Nenhuma foto do pet fornecida para gerar a prévia.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

  const [painted, plain] = await Promise.all([
    generateOne(ai, model, PAINTED_PROMPT, photos),
    generateOne(ai, model, PLAIN_PROMPT, photos),
  ]);

  return { painted, plain };
}
