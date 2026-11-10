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

/** Prompt do "cantinho pet": a miniatura do pet dentro de uma urna de vidro,
 *  sobre base preta com grama e plaquinha dourada com o nome. Referências
 *  visuais: public/images/2026-10-27_ia_{mel,tofu}_peca-cupula-placa-*.png. */
function scenePrompt(petName: string | null): string {
  const plaque = petName
    ? [
        `PLAQUINHA COM O NOME: o texto da plaquinha é EXATAMENTE "${petName.toUpperCase()}"`,
        `(letras: ${[...petName.toUpperCase()].join(" - ")}), em letras maiúsculas pretas, gravadas e`,
        "centralizadas, com uma patinha preta de cada lado. Escreva o nome",
        "exatamente com essas letras, na mesma ordem, sem acrescentar, trocar,",
        "omitir nem repetir nenhuma letra, e sem nenhum outro texto na imagem.",
      ]
    : [
        "PLAQUINHA: placa dourada lisa, só com uma patinha preta de cada lado e",
        "nenhum texto no meio.",
      ];

  return [
    "Você é um gerador de prévias para uma loja de miniaturas impressas em 3D.",
    "A partir das fotos de referência do pet enviadas, gere UMA imagem de produto",
    "mostrando a miniatura colecionável desse pet exposta num 'cantinho pet':",
    "uma URNA DE VIDRO transparente em formato de cubo, com bordas de vidro",
    "levemente esverdeadas (vidro espesso, tom água-marinha), sobre uma",
    "BASE PRETA fosca e retangular. Dentro da urna, a miniatura do pet fica",
    "sentada sobre um DISCO CIRCULAR DE GRAMA sintética verde, apoiado no piso",
    "preto da base. Na frente da base preta há uma PLAQUINHA RETANGULAR DE LATÃO",
    "DOURADO ESCOVADO, centralizada.",
    ...plaque,
    "CENÁRIO: a urna está sobre uma mesa de madeira clara, com parede de",
    "fundo lisa em tom bege/cinza suave e luz de estúdio suave. Foto de produto",
    "nítida.",
    "ENQUADRAMENTO PADRONIZADO E IDÊNTICO EM TODAS AS IMAGENS: imagem quadrada",
    "1:1, câmera na altura da miniatura, de frente e centralizada, mostrando a",
    "urna inteira (do topo de vidro até a base e a plaquinha) com a mesma margem",
    "em volta, sempre na MESMA ESCALA aparente.",
    "A MINIATURA: é uma estatueta impressa em 3D (não o animal vivo), em pose",
    "estática sentada, olhando para a câmera, com textura de esculpido no pelo.",
    "FIDELIDADE MÁXIMA AO PET REAL: reproduza fielmente todas as características",
    "físicas visíveis nas fotos — proporções do corpo e do focinho, formato e",
    "porte das orelhas, comprimento e textura do pelo, cor exata da pelagem e de",
    "cada marcação, manchas, malhas, listras, pintas, máscara facial, meias nas",
    "patas, ponta da cauda, cor dos olhos e do focinho, e qualquer traço",
    "distintivo (cicatriz, pelo torto, heterocromia). Se as fotos mostrarem",
    "ângulos diferentes, combine as informações para acertar todos os detalhes.",
    "Não inclua pessoas, móveis ou objetos além da urna e da miniatura.",
  ].join(" ");
}

function paintedPrompt(petName: string | null): string {
  return [
    scenePrompt(petName),
    "Esta versão é PINTADA À MÃO: cores fiéis à pelagem e às marcações do animal",
    "nas fotos, com acabamento de tinta acrílica bem aplicada, como uma",
    "miniatura colecionável pintada profissionalmente. Cada mancha, malha e",
    "detalhe de cor deve estar na MESMA POSIÇÃO e proporção que aparece nas fotos.",
  ].join(" ");
}

function plainPrompt(petName: string | null): string {
  return [
    scenePrompt(petName),
    "Esta versão é SEM PINTURA: a estatueta é uma peça simples, direto da",
    "impressora, em plástico fosco de UMA ÚNICA COR sólida e neutra (ex.: cinza,",
    "branco ou bege claro) igual em toda a peça — sem nenhuma cor da pelagem do",
    "animal, sem pintura, sem detalhes de cor. Mesma pose, forma, enquadramento e",
    "escala da versão pintada — o relevo da peça ainda deve deixar ver o pelo, as",
    "orelhas, o focinho e demais traços físicos do pet, só que sem cor. A urna,",
    "a grama e a plaquinha continuam com as cores normais descritas acima.",
  ].join(" ");
}

async function generateOne(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  photos: AiImageInput[],
): Promise<AiImageResult> {
  const response = await ai.models.generateContent({
    model,
    config: { imageConfig: { aspectRatio: "1:1" } },
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

function requireClient(): { ai: GoogleGenAI; model: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("IA de imagem não configurada: defina GEMINI_API_KEY em .env.local");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  return { ai, model };
}

/** Gera as duas prévias da miniatura (pintada e sem pintura) no cantinho pet,
 *  com o nome do pet na plaquinha, a partir das fotos — via Gemini. */
export async function generatePetMiniatureImages(
  photos: AiImageInput[],
  petName: string | null,
): Promise<PetMiniatureImages> {
  if (photos.length === 0) {
    throw new Error("Nenhuma foto do pet fornecida para gerar a prévia.");
  }
  const { ai, model } = requireClient();

  const [painted, plain] = await Promise.all([
    generateOne(ai, model, paintedPrompt(petName), photos),
    generateOne(ai, model, plainPrompt(petName), photos),
  ]);

  return { painted, plain };
}

/** Gera só a prévia PINTADA — usada no fluxo "expressa", que só vende a
 *  versão pintada (sem opção sem pintura). */
export async function generatePetMiniaturePaintedImage(
  photos: AiImageInput[],
  petName: string | null,
): Promise<AiImageResult> {
  if (photos.length === 0) {
    throw new Error("Nenhuma foto do pet fornecida para gerar a prévia.");
  }
  const { ai, model } = requireClient();
  return generateOne(ai, model, paintedPrompt(petName), photos);
}
