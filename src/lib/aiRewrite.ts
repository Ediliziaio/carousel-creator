/**
 * Client per il proxy /api/ai-rewrite (Cloudflare Pages Function).
 * Lo state della Function è gestito server-side; il browser NON ha mai accesso
 * al token Cloudflare AI (che ha permessi sull'account).
 */

export type RewriteMode = "rewrite" | "shorten" | "punchier" | "expand";

export interface RewriteResponse {
  variants: string[];
}

export async function rewriteText(
  text: string,
  mode: RewriteMode,
  context?: string,
): Promise<string[]> {
  const res = await fetch("/api/ai-rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, context }),
  });
  if (!res.ok) {
    let msg = `Errore ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as RewriteResponse;
  return Array.isArray(data.variants) ? data.variants : [];
}
