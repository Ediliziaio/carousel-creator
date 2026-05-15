/**
 * Cloudflare Pages Function: proxy verso Fal.ai per generazione video.
 *
 * Setup env vars su Cloudflare Pages → Settings → Environment variables (Encrypted):
 *   FAL_KEY  (API key Fal.ai — registrati su fal.ai e crea una key)
 *
 * Fal.ai aggrega molti modelli video. Endpoint pay-per-use:
 *   - kling-video: $0.10-0.50 (Kling 1.0/2.0)
 *   - luma-dream-machine: $0.30 (Luma)
 *   - veo-3: $0.40-1 (Google Veo)
 *   - wan-2-1: $0.04 (Wan 2.1 ridotto)
 *   - hunyuan-video: $0.15
 *
 * Tutti i modelli sono async: prima request → request_id, poi poll status.
 * Per MVP usiamo l'endpoint SUBSCRIBE che fa polling automatico server-side e
 * ritorna il risultato finale (timeout max 5 min su Cloudflare Pages free).
 */

interface Env {
  FAL_KEY?: string;
}

interface RequestBody {
  prompt: string;
  model?: VideoModel;
  /** Image-to-video: se passi un image_url, il video parte da quell'immagine. */
  imageUrl?: string;
  /** Durata in secondi (5 default, 10 max per la maggior parte dei modelli). */
  duration?: number;
  /** Aspect ratio: 9:16 verticale (default story/reels), 16:9 landscape, 1:1 square. */
  aspectRatio?: "9:16" | "16:9" | "1:1";
}

type VideoModel = "wan-fast" | "kling" | "luma" | "veo3";

/** Mapping nome friendly → endpoint Fal.ai. */
const MODELS: Record<VideoModel, { endpoint: string; label: string; pricePerSec: number }> = {
  "wan-fast": {
    endpoint: "fal-ai/wan/v2.1/text-to-video/turbo",
    label: "Wan 2.1 Turbo (economico)",
    pricePerSec: 0.008,
  },
  kling: {
    endpoint: "fal-ai/kling-video/v2.1/standard/text-to-video",
    label: "Kling 2.1 (qualità alta)",
    pricePerSec: 0.05,
  },
  luma: {
    endpoint: "fal-ai/luma-dream-machine",
    label: "Luma Dream Machine (cinematic)",
    pricePerSec: 0.06,
  },
  veo3: {
    endpoint: "fal-ai/veo3",
    label: "Veo 3 (top tier)",
    pricePerSec: 0.2,
  },
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (!env.FAL_KEY) {
    return jsonError(
      501,
      "Video AI non configurato: imposta FAL_KEY come Encrypted env var su Cloudflare Pages.",
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonError(400, "Body JSON non valido");
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt || prompt.length > 1000) {
    return jsonError(400, "Prompt mancante o troppo lungo (max 1000 caratteri).");
  }

  const model = body.model && MODELS[body.model] ? body.model : "wan-fast";
  const aspectRatio = body.aspectRatio ?? "9:16";
  const duration = Math.max(3, Math.min(10, body.duration ?? 5));

  const endpoint = MODELS[model].endpoint;
  const url = `https://queue.fal.run/${endpoint}`;

  // Payload comune a tutti i modelli. I parametri specifici (es. resolution)
  // sono lasciati al default del modello — l'utente avanzato potrà editare poi.
  const payload: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    duration,
  };
  if (body.imageUrl) payload.image_url = body.imageUrl;

  // 1) Submit job sulla queue Fal.
  let submitRes: Response;
  try {
    submitRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return jsonError(502, `Fal.ai unreachable: ${(e as Error).message}`);
  }
  if (!submitRes.ok) {
    const txt = await submitRes.text();
    return jsonError(submitRes.status, `Fal.ai error: ${txt.slice(0, 300)}`);
  }
  const submitJson = (await submitRes.json()) as { request_id?: string; status?: string };
  const requestId = submitJson.request_id;
  if (!requestId) {
    return jsonError(502, "Fal.ai non ha ritornato request_id");
  }

  return new Response(
    JSON.stringify({
      requestId,
      model,
      modelLabel: MODELS[model].label,
      estimatedCost: (MODELS[model].pricePerSec * duration).toFixed(3),
      pollUrl: `/api/video/status?id=${encodeURIComponent(requestId)}&endpoint=${encodeURIComponent(endpoint)}`,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
