/**
 * A Vercel rejeita (413) corpo de requisição > 4,5 MB em funções serverless — limite
 * de plataforma, não configurável. Fotos de celular passam disso fácil, então
 * reduzimos no navegador antes de enviar via Server Action.
 */
const TOTAL_BUDGET_BYTES = 3.8 * 1024 * 1024; // margem p/ overhead do multipart
const MAX_SIDE_START = 2048;
const MIN_QUALITY = 0.5;

async function encode(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff"; // PNG/WEBP com transparência → fundo branco no JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

async function compressOne(file: File, budget: number): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    let maxSide = MAX_SIDE_START;
    let quality = 0.85;
    let blob = await encode(bitmap, maxSide, quality);
    while (blob && blob.size > budget && (quality > MIN_QUALITY || maxSide > 800)) {
      if (quality > MIN_QUALITY) quality = Math.max(MIN_QUALITY, quality - 0.1);
      else maxSide = Math.round(maxSide * 0.8);
      blob = await encode(bitmap, maxSide, quality);
    }
    bitmap.close();
    // Só troca se de fato ficou menor que o original.
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file; // best-effort: se o navegador não decodificar, manda o original
  }
}

/** Reduz as fotos para que, juntas, caibam no limite de 4,5 MB da Vercel. */
export async function compressPhotos(files: File[]): Promise<File[]> {
  if (files.length === 0) return files;
  const perFile = TOTAL_BUDGET_BYTES / files.length;
  return Promise.all(files.map((f) => compressOne(f, perFile)));
}
