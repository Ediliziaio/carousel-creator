/**
 * Client per i Pages Functions di video generation (Fal.ai).
 * Niente FAL_KEY esposto al browser — tutto via /api/video/*.
 */

export type VideoModel = "wan-fast" | "kling" | "luma" | "veo3";

export interface GenerateVideoOptions {
  prompt: string;
  model?: VideoModel;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: "9:16" | "16:9" | "1:1";
}

export interface VideoJobInfo {
  requestId: string;
  model: VideoModel;
  modelLabel: string;
  estimatedCost: string;
  pollUrl: string;
}

export async function startVideoGeneration(opts: GenerateVideoOptions): Promise<VideoJobInfo> {
  const res = await fetch("/api/video/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    let msg = `Errore ${res.status}`;
    try {
      const d = (await res.json()) as { error?: string };
      if (d.error) msg = d.error;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  return (await res.json()) as VideoJobInfo;
}

export interface VideoJobStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | string;
  videoUrl?: string;
  progress?: string;
}

export async function pollVideoStatus(pollUrl: string): Promise<VideoJobStatus> {
  const res = await fetch(pollUrl);
  if (!res.ok) {
    let msg = `Errore ${res.status}`;
    try {
      const d = (await res.json()) as { error?: string };
      if (d.error) msg = d.error;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  return (await res.json()) as VideoJobStatus;
}

/**
 * Wrapper completo: genera video e fa polling automatico finché completato.
 * Chiamata `onProgress` con string descrittiva ad ogni poll.
 */
export async function generateVideoAndWait(
  opts: GenerateVideoOptions,
  onProgress?: (msg: string, info?: VideoJobInfo) => void,
  signal?: AbortSignal,
): Promise<string> {
  const job = await startVideoGeneration(opts);
  onProgress?.(`Job avviato (${job.modelLabel}, ~$${job.estimatedCost})`, job);
  while (true) {
    if (signal?.aborted) throw new Error("Generazione annullata");
    await new Promise((r) => setTimeout(r, 3000));
    const status = await pollVideoStatus(job.pollUrl);
    if (status.status === "COMPLETED") {
      if (!status.videoUrl) throw new Error("Job completato ma nessun URL video");
      onProgress?.("Completato");
      return status.videoUrl;
    }
    if (status.status === "IN_PROGRESS") {
      onProgress?.(status.progress ?? "Rendering in corso…");
    } else {
      onProgress?.(status.progress ?? `Stato: ${status.status}`);
    }
  }
}
