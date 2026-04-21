import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveBlob, type SaveMethod } from "./download";
import type { BrandSettings, FontChoice } from "./templates";

// Whitelist of Google-hosted fonts we know we can fetch safely.
const GOOGLE_FONTS: Record<FontChoice, string> = {
  "Figtree": "Figtree",
  "Inter": "Inter",
  "Space Grotesk": "Space+Grotesk",
  "Playfair Display": "Playfair+Display",
  "JetBrains Mono": "JetBrains+Mono",
  "Poppins": "Poppins",
  "DM Sans": "DM+Sans",
  "Manrope": "Manrope",
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
  const families = [brand.fontHeading, brand.fontBody].filter(
    (f) => GOOGLE_FONTS[f as FontChoice],
  );
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

export async function captureNode(node: HTMLElement, brand: BrandSettings): Promise<string> {
  await ensureFontsFor(brand);
  await waitForImages(node);
  // Render twice — first warms up images/fonts, second is the real one
  await toPng(node, {
    width: 1080,
    height: 1350,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: brand.bgColor || "#0A0A0A",
  });
  await waitForImages(node);
  const dataUrl = await toPng(node, {
    width: 1080,
    height: 1350,
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

export async function downloadZipFromNodes(
  nodes: HTMLElement[],
  baseName: string,
  brand: BrandSettings,
): Promise<SaveMethod> {
  const zip = new JSZip();
  for (let i = 0; i < nodes.length; i++) {
    const dataUrl = await captureNode(nodes[i], brand);
    const base64 = dataUrl.split(",")[1];
    const num = (i + 1).toString().padStart(2, "0");
    zip.file(`slide-${num}.png`, base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return saveBlob(blob, `${baseName}.zip`);
}
