import { supabase } from "./supabase";

export type ContentType = "post" | "carousel" | "story";

/**
 * Workflow editoriale a 5 stati (Trello-style).
 * Salvato dentro data.status — no migration DB necessaria.
 */
export type ContentStatus =
  | "backlog" // DA CREARE — solo idea/titolo, niente slide ancora
  | "in_progress" // IN LAVORAZIONE — slide create, da raffinare
  | "review" // DA APPROVARE — pronte, in attesa di OK
  | "scheduled" // DA PUBBLICARE — approvate, schedulate per pubblicazione
  | "published"; // PUBBLICATO — online

export const STATUS_META: Record<
  ContentStatus,
  { label: string; emoji: string; color: string; bg: string; order: number }
> = {
  backlog: {
    label: "Da creare",
    emoji: "💡",
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/30",
    order: 0,
  },
  in_progress: {
    label: "In lavorazione",
    emoji: "🔧",
    color: "text-amber-600",
    bg: "bg-amber-500/10 border-amber-500/30",
    order: 1,
  },
  review: {
    label: "Da approvare",
    emoji: "👀",
    color: "text-purple-600",
    bg: "bg-purple-500/10 border-purple-500/30",
    order: 2,
  },
  scheduled: {
    label: "Da pubblicare",
    emoji: "📅",
    color: "text-blue-600",
    bg: "bg-blue-500/10 border-blue-500/30",
    order: 3,
  },
  published: {
    label: "Pubblicato",
    emoji: "✓",
    color: "text-green-600",
    bg: "bg-green-500/15 border-green-500/30",
    order: 4,
  },
};

export const STATUS_ORDER: ContentStatus[] = [
  "backlog",
  "in_progress",
  "review",
  "scheduled",
  "published",
];

/** Estrae lo status da una contentRow.data; fallback a 'backlog' (era 'draft' prima). */
export function getContentStatus(row: ContentRow): ContentStatus {
  const raw = (row.data as { status?: string })?.status;
  if (raw && raw in STATUS_META) return raw as ContentStatus;
  // Mapping retrocompatibile: 'draft' (vecchio) → 'in_progress'
  if (raw === "draft") return "in_progress";
  return "in_progress";
}

export interface ContentRow {
  id: string;
  project_id: string;
  user_id: string;
  type: ContentType;
  name: string;
  data: unknown;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export async function listContents(
  projectId: string,
  type?: ContentType,
): Promise<ContentRow[]> {
  let q = supabase
    .from("contents")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ContentRow[];
}

export async function getContent(id: string): Promise<ContentRow | null> {
  const { data, error } = await supabase
    .from("contents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ContentRow | null;
}

export async function saveContent(params: {
  id?: string;
  projectId: string;
  type: ContentType;
  name: string;
  data: unknown;
  thumbnail?: string | null;
}): Promise<ContentRow> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Devi essere loggato per salvare.");

  if (params.id) {
    const { data, error } = await supabase
      .from("contents")
      .update({
        name: params.name,
        data: params.data,
        thumbnail: params.thumbnail ?? null,
      })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    return data as ContentRow;
  }

  const { data, error } = await supabase
    .from("contents")
    .insert({
      project_id: params.projectId,
      user_id: userId,
      type: params.type,
      name: params.name,
      data: params.data,
      thumbnail: params.thumbnail ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContentRow;
}

/**
 * Cambia lo status di un contenuto senza dover aprire il builder.
 * Modifica solo il campo data.status preservando tutto il resto.
 */
export async function updateContentStatus(
  id: string,
  status: ContentStatus,
): Promise<ContentRow> {
  const src = await getContent(id);
  if (!src) throw new Error("Contenuto non trovato");
  const data = (src.data && typeof src.data === "object" ? { ...src.data } : {}) as Record<
    string,
    unknown
  >;
  data.status = status;
  if (status === "published") data.publishedAt = new Date().toISOString();
  const { data: row, error } = await supabase
    .from("contents")
    .update({ data })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return row as ContentRow;
}

/**
 * Crea N contenuti in stato 'backlog' in un colpo solo. Usato dal bulk
 * "incolla N titoli, uno per riga". Ogni riga diventa un contenuto vuoto
 * con quel nome, type passato (default carousel).
 */
export async function bulkCreateBacklog(
  projectId: string,
  type: ContentType,
  names: string[],
): Promise<ContentRow[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Devi essere loggato.");
  const rows = names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({
      project_id: projectId,
      user_id: userId,
      type,
      name,
      data: { brand: null, slides: [], activeLang: "it", status: "backlog" },
      thumbnail: null,
    }));
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from("contents").insert(rows).select();
  if (error) throw error;
  return (data ?? []) as ContentRow[];
}

export async function deleteContent(id: string): Promise<void> {
  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) throw error;
}

/** Duplica un contenuto: crea una nuova riga con stesso project_id/type/data. */
export async function duplicateContent(id: string): Promise<ContentRow> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Devi essere loggato.");
  const src = await getContent(id);
  if (!src) throw new Error("Contenuto sorgente non trovato");
  // Reset status a draft sulla copia (se era published).
  const data = (src.data && typeof src.data === "object"
    ? { ...(src.data as Record<string, unknown>), status: "draft" }
    : { status: "draft" }) as unknown;
  const { data: row, error } = await supabase
    .from("contents")
    .insert({
      project_id: src.project_id,
      user_id: userId,
      type: src.type,
      name: `${src.name} (copia)`,
      data,
      thumbnail: src.thumbnail,
    })
    .select()
    .single();
  if (error) throw error;
  return row as ContentRow;
}
