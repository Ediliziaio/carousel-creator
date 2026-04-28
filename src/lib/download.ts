/**
 * Save a Blob to disk with a multi-tier fallback chain so the download
 * keeps working even if `file-saver` fails to load or the browser blocks it.
 *
 * Order:
 *  1. Try `file-saver` via dynamic import (won't crash module graph if broken)
 *  2. Native <a download> click + objectURL revoke
 *  3. Open blob in a new tab (last resort) — caller should toast a hint
 *
 * Returns the method actually used so the UI can show a hint when needed.
 */
export type SaveMethod = "file-saver" | "anchor" | "new-tab";

export async function saveBlob(blob: Blob, filename: string): Promise<SaveMethod> {
  // 1. file-saver via dynamic import
  try {
    const mod = await import("file-saver");
    const saveAs = mod.saveAs ?? mod.default?.saveAs ?? mod.default;
    if (typeof saveAs === "function") {
      saveAs(blob, filename);
      return "file-saver";
    }
  } catch {
    // fall through
  }

  // 2. Native anchor download
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "anchor";
  } catch {
    // fall through
  }

  // 3. Open in new tab as last resort
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    throw new Error(
      "Impossibile salvare il file: il browser ha bloccato il download. Consenti i popup e riprova.",
    );
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "new-tab";
}
