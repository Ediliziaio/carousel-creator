import { supabase } from "./supabase";

export type VideoAssetType = "video" | "avatar" | "audio";

export interface VideoAssetMeta {
  duration?: number;
  prompt?: string;
  model?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  source?: "ai" | "upload";
  [key: string]: unknown;
}

export interface VideoAsset {
  id: string;
  user_id: string;
  project_id: string | null;
  type: VideoAssetType;
  name: string;
  url: string;
  thumbnail_url: string | null;
  meta: VideoAssetMeta;
  created_at: string;
}

export async function listVideoAssets(
  projectId: string | null,
  type?: VideoAssetType,
): Promise<VideoAsset[]> {
  let q = supabase
    .from("video_assets")
    .select("*")
    .order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as VideoAsset[];
}

export async function createVideoAsset(input: {
  projectId: string | null;
  type: VideoAssetType;
  name: string;
  url: string;
  thumbnailUrl?: string | null;
  meta?: VideoAssetMeta;
}): Promise<VideoAsset> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Devi essere loggato.");
  const { data, error } = await supabase
    .from("video_assets")
    .insert({
      user_id: userId,
      project_id: input.projectId,
      type: input.type,
      name: input.name,
      url: input.url,
      thumbnail_url: input.thumbnailUrl ?? null,
      meta: input.meta ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data as VideoAsset;
}

export async function deleteVideoAsset(id: string): Promise<void> {
  const { error } = await supabase.from("video_assets").delete().eq("id", id);
  if (error) throw error;
}

export async function renameVideoAsset(id: string, name: string): Promise<VideoAsset> {
  const { data, error } = await supabase
    .from("video_assets")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as VideoAsset;
}
