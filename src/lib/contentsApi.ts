import { supabase } from "./supabase";

export type ContentType = "post" | "carousel" | "story";

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

export async function deleteContent(id: string): Promise<void> {
  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) throw error;
}
