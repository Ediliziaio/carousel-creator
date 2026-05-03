import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveBlob, type SaveMethod } from "./download";
import type { BrandSettings, FontChoice } from "./templates";

// Whitelist of Google-hosted fonts we know we can fetch safely.
const GOOGLE_FONTS: Record<FontChoice, string> = {
  Figtree: "Figtree",
  Inter: "Inter",
  "Space Grotesk": "Space+Grotesk",
  "Playfair Display": "Playfair+Display",
  "JetBrains Mono": "JetBrains+Mono",
  Poppins: "Poppins",
  "DM Sans": "DM+Sans",
  Manrope: "Manrope",
};

const ALL_WEIGHTS = [400, 500, 600, 700, 800, 900];
let lastFontHref = "";

function buildGoogleFontsHref(brand: BrandSettings): string | null {
  const families: string[] = [];
  const heading = GOOGLE_FONTS[brand.fontHeading as FontChoice];
  const body = GOOGLE_FONTS[brand.fontBody as FontChoice];
  const seen = new Set<string>();
  if (heading && !seen.has(heading)) {
    families.push(`family=${heading}:wght@${ALL_WEIGHTS.join(";")}`);
    seen.add(heading);
  }
  if (body && body !== heading && !seen.has(body)) {
    families.push(`family=${body}:wght@${ALL_WEIGHTS.join(";")}`);
    seen.add(body);
  }
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

export async function ensureFontsFor(brand: BrandSettings): Promise<void> {
  if (typeof document === "undefined") return;
  const href = buildGoogleFontsHref(brand);
  if (!href) return;
  const id = "carousel-google-fonts";
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link || lastFontHref !== href) {
    if (link) link.remove();
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    lastFontHref = href;
  }

  const docFonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!docFonts) return;

  const tryLoad = async (family: string, weight: number) => {
    try {
      await docFonts.load(`${weight} 16px "${family}"`);
    } catch {
      // ignore
    }
  };

  const families = [brand.fontHeading, brand.fontBody].filter(
    (f, i, arr) => GOOGLE_FONTS[f as FontChoice] && arr.indexOf(f) === i,
  );

  await Promise.all(
    families.flatMap((f) =>
      [brand.headingWeight, brand.bodyWeight, 400, 700].map((w) => tryLoad(f, w)),
    ),
  );
}

export function fontsReadyFor(brand: BrandSettings): boolean {
  if (typeof document === "undefined") return true;
  const docFonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!docFonts) return true;
  const families = [brand.fontHeading, brand.fontBody].filter((f) => GOOGLE_FONTS[f as FontChoice]);
  if (families.length === 0) return true;
  return families.every((f) => {
    try {
      return docFonts.check(`${brand.headingWeight} 16px "${f}"`);
    } catch {
      return true;
    }
  });
}

export async function waitForImages(node: HTMLElement): Promise<void> {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }
      try {
        await img.decode();
      } catch {
        // ignore
      }
    }),
  );
}

/**
 * Cattura una thumbnail compatta (JPEG ~320px wide) da un nodo slide.
 * Usato per popolare il campo `thumbnail` dei contenuti — peso tipico 15-30 KB,
 * ok per stoccaggio JSONB su Supabase.
 */
export async function captureThumbnail(
  node: HTMLElement,
  brand: BrandSettings,
  maxWidth = 320,
): Promise<string | null> {
  try {
    await ensureFontsFor(brand);
    await waitForImages(node);
    const w = node.offsetWidth || 1080;
    const h = node.offsetHeight || 1350;
    const dataUrl = await toPng(node, {
      width: w,
      height: h,
      pixelRatio: 0.5,
      cacheBust: false,
      backgroundColor: brand.bgColor || "#0A0A0A",
    });
    // Resize via canvas + JPEG compression
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const tw = Math.round(img.width * scale);
        const th = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D non disponibile"));
        ctx.drawImage(img, 0, 0, tw, th);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("Image decode error"));
      img.src = dataUrl;
    });
  } catch (e) {
    console.warn("[captureThumbnail] failed:", e);
    return null;
  }
}

export async function captureNode(node: HTMLElement, brand: BrandSettings): Promise<string> {
  await ensureFontsFor(brand);
  await waitForImages(node);
  const w = node.offsetWidth || 1080;
  const h = node.offsetHeight || 1350;
  // Render twice — first warms up images/fonts, second is the real one
  await toPng(node, {
    width: w,
    height: h,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: brand.bgColor || "#0A0A0A",
  });
  await waitForImages(node);
  const dataUrl = await toPng(node, {
    width: w,
    height: h,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: brand.bgColor || "#0A0A0A",
  });
  return dataUrl;
}

export async function downloadSinglePng(
  node: HTMLElement,
  filename: string,
  brand: BrandSettings,
): Promise<SaveMethod> {
  const dataUrl = await captureNode(node, brand);
  const blob = await (await fetch(dataUrl)).blob();
  return saveBlob(blob, filename);
}

export interface ZipEntry {
  /** Path inside the ZIP (e.g. "slide-01.png" or "it/slide-01.png"). */
  path: string;
  node: HTMLElement;
}

/** Generic ZIP builder — caller controls naming/folders. */
export async function downloadZipFromEntries(
  entries: ZipEntry[],
  baseName: string,
  brand: BrandSettings,
  onProgress?: (done: number, total: number) => void,
): Promise<SaveMethod> {
  const zip = new JSZip();
  for (let i = 0; i < entries.length; i++) {
    const { path, node } = entries[i];
    const dataUrl = await captureNode(node, brand);
    const base64 = dataUrl.split(",")[1];
    zip.file(path, base64, { base64: true });
    onProgress?.(i + 1, entries.length);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return saveBlob(blob, `${baseName}.zip`);
}

export async function downloadZipFromNodes(
  nodes: HTMLElement[],
  baseName: string,
  brand: BrandSettings,
): Promise<SaveMethod> {
  const entries: ZipEntry[] = nodes.map((node, i) => ({
    path: `slide-${(i + 1).toString().padStart(2, "0")}.png`,
    node,
  }));
  return downloadZipFromEntries(entries, baseName, brand);
}
