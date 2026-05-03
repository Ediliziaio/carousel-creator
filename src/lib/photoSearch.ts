/**
 * Wrapper unificato per ricerca foto stock gratuite (Unsplash + Pexels).
 *
 * Le chiavi API sono lette da env Vite. Se mancano, l'API ritorna error.
 * Set su Cloudflare Pages → Settings → Environment variables come "Plain text":
 *   VITE_UNSPLASH_ACCESS_KEY
 *   VITE_PEXELS_API_KEY
 *
 * Entrambi i provider hanno tier gratuiti generosi (Unsplash 50 req/h demo,
 * Pexels 200 req/h). Niente costi a consumo.
 */

export interface PhotoResult {
  id: string;
  url: string; // URL ottimizzato per preview (max ~640px)
  fullUrl: string; // URL alta risoluzione per upload
  thumbUrl: string; // miniatura griglia
  width: number;
  height: number;
  author: string;
  authorUrl: string;
  source: "unsplash" | "pexels";
  /** URL da chiamare quando l'utente sceglie la foto, per "trigger download" (Unsplash policy). */
  downloadTrackingUrl?: string;
}

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;
const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

export function isPhotoSearchConfigured(): boolean {
  return Boolean(UNSPLASH_KEY || PEXELS_KEY);
}

export async function searchPhotos(
  query: string,
  opts: { perPage?: number } = {},
): Promise<PhotoResult[]> {
  const perPage = opts.perPage ?? 12;
  const q = query.trim();
  if (!q) return [];
  // Preferisce Unsplash se entrambe le chiavi presenti, fallback a Pexels.
  if (UNSPLASH_KEY) return searchUnsplash(q, perPage);
  if (PEXELS_KEY) return searchPexels(q, perPage);
  throw new Error(
    "Nessuna API foto configurata. Imposta VITE_UNSPLASH_ACCESS_KEY o VITE_PEXELS_API_KEY.",
  );
}

async function searchUnsplash(query: string, perPage: number): Promise<PhotoResult[]> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "portrait");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("API key Unsplash non valida.");
    if (res.status === 403) throw new Error("Limite Unsplash raggiunto. Riprova tra un'ora.");
    throw new Error(`Unsplash error ${res.status}`);
  }
  type UnsplashRes = {
    results: {
      id: string;
      urls: { small: string; regular: string; thumb: string; full?: string };
      width: number;
      height: number;
      user: { name: string; links: { html: string } };
      links: { download_location?: string };
    }[];
  };
  const json = (await res.json()) as UnsplashRes;
  return json.results.map((p) => ({
    id: p.id,
    url: p.urls.regular,
    fullUrl: p.urls.full ?? p.urls.regular,
    thumbUrl: p.urls.thumb,
    width: p.width,
    height: p.height,
    author: p.user.name,
    authorUrl: p.user.links.html,
    source: "unsplash" as const,
    downloadTrackingUrl: p.links.download_location,
  }));
}

async function searchPexels(query: string, perPage: number): Promise<PhotoResult[]> {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "portrait");
  const res = await fetch(url.toString(), {
    headers: { Authorization: PEXELS_KEY ?? "" },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("API key Pexels non valida.");
    throw new Error(`Pexels error ${res.status}`);
  }
  type PexelsRes = {
    photos: {
      id: number;
      src: { medium: string; large: string; tiny: string; original: string };
      width: number;
      height: number;
      photographer: string;
      photographer_url: string;
    }[];
  };
  const json = (await res.json()) as PexelsRes;
  return json.photos.map((p) => ({
    id: String(p.id),
    url: p.src.large,
    fullUrl: p.src.original,
    thumbUrl: p.src.tiny,
    width: p.width,
    height: p.height,
    author: p.photographer,
    authorUrl: p.photographer_url,
    source: "pexels" as const,
  }));
}

/**
 * Scarica una foto e la converte a dataURL così è embeddabile direttamente
 * nel JSON del carosello (no CORS issues al render successivo).
 */
export async function photoToDataUrl(photo: PhotoResult): Promise<string> {
  // Trigger download tracking per Unsplash (policy API).
  if (photo.source === "unsplash" && photo.downloadTrackingUrl && UNSPLASH_KEY) {
    void fetch(photo.downloadTrackingUrl, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    }).catch(() => {
      /* noop */
    });
  }
  const res = await fetch(photo.url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
