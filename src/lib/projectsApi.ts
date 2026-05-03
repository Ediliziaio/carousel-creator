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
