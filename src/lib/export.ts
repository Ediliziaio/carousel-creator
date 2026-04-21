import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

async function ensureFonts() {
  if (typeof document === "undefined") return;
  // Inject Google Fonts link if missing
  const id = "carousel-google-fonts";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }
  try {
    await (document as Document & { fonts?: { ready: Promise<void> } }).fonts?.ready;
  } catch {
    // ignore
  }
}

export async function captureNode(node: HTMLElement): Promise<string> {
  await ensureFonts();
  // Render twice — first render warms up images/fonts, second is the real one
  await toPng(node, {
    width: 1080,
    height: 1350,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: "#0A0A0A",
  });
  const dataUrl = await toPng(node, {
    width: 1080,
    height: 1350,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: "#0A0A0A",
  });
  return dataUrl;
}

export async function downloadSinglePng(node: HTMLElement, filename: string) {
  const dataUrl = await captureNode(node);
  const blob = await (await fetch(dataUrl)).blob();
  saveAs(blob, filename);
}

export async function downloadZipFromNodes(nodes: HTMLElement[], baseName: string) {
  const zip = new JSZip();
  for (let i = 0; i < nodes.length; i++) {
    const dataUrl = await captureNode(nodes[i]);
    const base64 = dataUrl.split(",")[1];
    const num = (i + 1).toString().padStart(2, "0");
    zip.file(`slide-${num}.png`, base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${baseName}.zip`);
}
