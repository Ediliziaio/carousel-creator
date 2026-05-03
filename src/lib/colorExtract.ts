/**
 * Estrae i colori dominanti da una dataURL/URL immagine (logo) usando canvas.
 * Algoritmo: campiona pixel a basso step, aggrega in bucket di colore (riducendo
 * la profondità a 4 bit per canale), conta frequenze, filtra grigi e bianchi
 * che dominerebbero per via del background del logo, ritorna i top N hex.
 *
 * Tutto locale al browser. Nessuna API esterna.
 */

interface ExtractOptions {
  /** Numero massimo di colori da ritornare. */
  count?: number;
  /** Quanti pixel saltare ad ogni passo (più alto = più veloce, meno accurato). */
  step?: number;
  /** Se true, esclude bianco/grigio chiaro (utile per logo con bg neutro). */
  excludeNeutrals?: boolean;
}

export interface ExtractedPalette {
  /** Colore dominante (più frequente non-neutro). */
  primary: string;
  /** Secondo dominante (per accent secondario). */
  secondary: string;
  /** Background suggerito: chiaro o scuro in base alla luminanza media. */
  bgSuggested: string;
  /** Colore testo suggerito (contrasto sul bgSuggested). */
  textSuggested: string;
  /** Tutti i colori dominanti ordinati per frequenza. */
  all: string[];
}

export async function extractPaletteFromImage(
  src: string,
  opts: ExtractOptions = {},
): Promise<ExtractedPalette | null> {
  const { count = 6, step = 4, excludeNeutrals = true } = opts;
  try {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    // Limita la dimensione per performance (un logo non serve full-res).
    const maxSize = 200;
    const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
    canvas.width = Math.max(1, Math.floor(img.width * ratio));
    canvas.height = Math.max(1, Math.floor(img.height * ratio));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Aggregazione in bucket: riduco profondità a 5 bit (32 valori per canale)
    // per evitare troppi colori unici causati da anti-aliasing.
    const buckets = new Map<number, number>();
    let lumSum = 0;
    let pixelCount = 0;
    for (let i = 0; i < imgData.length; i += 4 * step) {
      const a = imgData[i + 3];
      if (a < 200) continue; // Salta pixel trasparenti / semi-trasparenti
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      // Filtro bianchi/grigi se richiesto
      if (excludeNeutrals && isNeutral(r, g, b)) {
        // Conta comunque per bg suggestion
        lumSum += relLum(r, g, b);
        pixelCount++;
        continue;
      }
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
      lumSum += relLum(r, g, b);
      pixelCount++;
    }
    if (buckets.size === 0) return null;

    // Ordina per frequenza decrescente
    const top = Array.from(buckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([key]) => bucketToHex(key));

    const primary = top[0] ?? "#000000";
    const secondary = pickSecondary(top, primary);
    const avgLum = pixelCount > 0 ? lumSum / pixelCount : 0.5;
    // Se il logo è prevalentemente chiaro → bg scuro (più contrasto).
    // Se prevalentemente scuro → bg chiaro.
    const bgSuggested = avgLum > 0.5 ? "#0A0A0A" : "#FAFAFA";
    const textSuggested = avgLum > 0.5 ? "#F5F5F5" : "#0F0F0F";

    return {
      primary,
      secondary,
      bgSuggested,
      textSuggested,
      all: top,
    };
  } catch (e) {
    console.warn("[colorExtract] failed:", e);
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function isNeutral(r: number, g: number, b: number): boolean {
  // Bianco o quasi
  if (r > 235 && g > 235 && b > 235) return true;
  // Nero quasi puro (lo manteniamo solo se è proprio nero, perché molti logo
  // hanno il nero come colore principale): qui escludo solo i grigi medi.
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // Saturazione bassa = grigio
  if (max - min < 12 && max > 40 && max < 220) return true;
  return false;
}

function relLum(r: number, g: number, b: number): number {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function bucketToHex(key: number): string {
  const r = ((key >> 10) & 0x1f) << 3;
  const g = ((key >> 5) & 0x1f) << 3;
  const b = (key & 0x1f) << 3;
  return rgbToHex(r, g, b);
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0").toUpperCase())
      .join("")
  );
}

/** Sceglie un colore "diverso abbastanza" dal primary per usarlo come secondary. */
function pickSecondary(palette: string[], primary: string): string {
  const target = palette.find((c) => c !== primary && colorDistance(c, primary) > 60);
  return target ?? palette[1] ?? primary;
}

function colorDistance(a: string, b: string): number {
  const ra = parseInt(a.slice(1, 3), 16);
  const ga = parseInt(a.slice(3, 5), 16);
  const ba = parseInt(a.slice(5, 7), 16);
  const rb = parseInt(b.slice(1, 3), 16);
  const gb = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  return Math.sqrt((ra - rb) ** 2 + (ga - gb) ** 2 + (ba - bb) ** 2);
}
