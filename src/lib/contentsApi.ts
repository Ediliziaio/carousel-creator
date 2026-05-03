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

/** Data di pubblicazione programmata ISO (es. "2026-12-25T10:00:00.000Z"), se presente. */
export function getContentScheduledAt(row: ContentRow): string | null {
  const raw = (row.data as { scheduledAt?: string })?.scheduledAt;
  return typeof raw === "string" && raw ? raw : null;
}

/** Data di pubblicazione effettiva (settata quando lo status passa a 'published'). */
export function getContentPublishedAt(row: ContentRow): string | null {
  const raw = (row.data as { publishedAt?: string })?.publishedAt;
  return typeof raw === "string" && raw ? raw : null;
}

/**
 * Aggiorna la data di pubblicazione programmata di un contenuto. Setta anche
 * automaticamente lo status a 'scheduled' se non già 'published', così la
 * card si sposta nella colonna giusta.
 */
export async function updateContentSchedule(
  id: string,
  scheduledAt: string | null,
): Promise<ContentRow> {
  const src = await getContent(id);
  if (!src) throw new Error("Contenuto non trovato");
  const data = (src.data && typeof src.data === "object" ? { ...src.data } : {}) as Record<
    string,
    unknown
  >;
  if (scheduledAt) {
    data.scheduledAt = scheduledAt;
    // Se non era già pubblicato, allinea lo status a 'scheduled'.
    if (data.status !== "published") data.status = "scheduled";
  } else {
    delete data.scheduledAt;
    // Se era 'scheduled' e ora non c'è più data, riportalo a 'review'.
    if (data.status === "scheduled") data.status = "review";
  }
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
 * Formatta una data ISO in italiano breve. Aggiunge "oggi"/"domani"/"ieri"
 * per le 3 date più vicine (UX Trello-style).
 */
export function formatScheduleLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  if (diffDays === -1) return "Ieri";
  if (diffDays > 1 && diffDays <= 6) {
    return d.toLocaleDateString("it-IT", { weekday: "long" });
  }
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
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
  return bulkCreateFromBriefs(
    projectId,
    type,
    names.map((n) => ({ name: n, brief: "" })),
  );
}

/**
 * Crea N contenuti in 'backlog' partendo da brief importati (file md/csv/
 * xlsx/docx/pdf). Salva il brief in data.brief così l'utente quando apre
 * la card può cliccare "Genera slide" per passarlo al parser markdown.
 */
export async function bulkCreateFromBriefs(
  projectId: string,
  type: ContentType,
  briefs: { name: string; brief: string }[],
): Promise<ContentRow[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Devi essere loggato.");
  const rows = briefs
    .filter((b) => (b.name || b.brief).trim())
    .map((b) => ({
      project_id: projectId,
      user_id: userId,
      type,
      name: (b.name || "Senza titolo").slice(0, 200),
      data: {
        brand: null,
        slides: [],
        activeLang: "it",
        status: "backlog",
        brief: b.brief || undefined,
      },
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
