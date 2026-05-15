import { supabase } from "./supabase";
import type { BrandSettings } from "./templates";

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  brand: BrandSettings | null;
  created_at: string;
  updated_at: string;
}

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProject(input: {
  name: string;
  description?: string | null;
  brand?: BrandSettings | null;
}): Promise<ProjectRow> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Utente non autenticato");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      brand: input.brand ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<ProjectRow, "name" | "description" | "brand">>,
): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export interface ProjectStats {
  total: number;
  byStatus: Record<string, number>;
  scheduledToday: number;
  scheduledThisWeek: number;
  recent: { id: string; name: string; type: string; updatedAt: string }[];
}

/**
 * Stats aggregate per tutti i progetti dell'utente loggato. Una sola query
 * a contents → raggruppamento lato client. Per N progetti ~= 1 round-trip.
 */
export async function getAllProjectsStats(): Promise<Map<string, ProjectStats>> {
  const { data, error } = await supabase
    .from("contents")
    .select("id, name, type, project_id, data, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    type: string;
    project_id: string;
    data: { status?: string; scheduledAt?: string };
    updated_at: string;
  }>;
  const today = new Date().toISOString().slice(0, 10);
  // 7 giorni da oggi inclusi
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndIso = weekEnd.toISOString().slice(0, 10);
  const out = new Map<string, ProjectStats>();
  for (const r of rows) {
    let stats = out.get(r.project_id);
    if (!stats) {
      stats = {
        total: 0,
        byStatus: {},
        scheduledToday: 0,
        scheduledThisWeek: 0,
        recent: [],
      };
      out.set(r.project_id, stats);
    }
    stats.total++;
    const status = r.data?.status ?? "in_progress";
    stats.byStatus[status] = (stats.byStatus[status] ?? 0) + 1;
    if (r.data?.scheduledAt) {
      const sched = r.data.scheduledAt.slice(0, 10);
      if (sched === today) stats.scheduledToday++;
      if (sched >= today && sched <= weekEndIso) stats.scheduledThisWeek++;
    }
    if (stats.recent.length < 3) {
      stats.recent.push({
        id: r.id,
        name: r.name,
        type: r.type,
        updatedAt: r.updated_at,
      });
    }
  }
  return out;
}
