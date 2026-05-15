/**
 * Cloudflare Pages Function: polling status di un job video Fal.ai.
 * Chiamato dal client ogni 2-3 secondi finché lo stato non è COMPLETED.
 */

interface Env {
  FAL_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const endpoint = url.searchParams.get("endpoint");
  if (!id || !endpoint) {
    return jsonError(400, "Manca id o endpoint");
  }
  if (!env.FAL_KEY) {
    return jsonError(501, "FAL_KEY non configurata");
  }

  // Status URL su Fal queue
  const statusUrl = `https://queue.fal.run/${endpoint}/requests/${id}/status`;
  const statusRes = await fetch(statusUrl, {
    headers: { Authorization: `Key ${env.FAL_KEY}` },
  });
  if (!statusRes.ok) {
    const txt = await statusRes.text();
    return jsonError(statusRes.status, `Fal status error: ${txt.slice(0, 200)}`);
  }
  const status = (await statusRes.json()) as { status: string; logs?: { message: string }[] };

  if (status.status === "COMPLETED") {
    // Recupera il risultato finale
    const resultRes = await fetch(`https://queue.fal.run/${endpoint}/requests/${id}`, {
      headers: { Authorization: `Key ${env.FAL_KEY}` },
    });
    const result = (await resultRes.json()) as {
      video?: { url: string };
      output?: { url: string };
    };
    const videoUrl = result.video?.url ?? result.output?.url;
    return new Response(JSON.stringify({ status: "COMPLETED", videoUrl, raw: result }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      status: status.status,
      progress: status.logs?.[status.logs.length - 1]?.message,
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
