import { supabase } from "./supabase";

export interface CarouselRow {
  id: string;
  user_id: string;
  name: string;
  data: unknown;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export async function listCarousels(): Promise<CarouselRow[]> {
  const { data, error } = await supabase
    .from("carousels")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveCarousel(params: {
  id?: string;
  name: string;
  data: unknown;
  thumbnail?: string | null;
}): Promise<CarouselRow> {
  const { data: userData } = await supabase.auth.getUser();
  const user_id = userData.user?.id;
  if (!user_id) throw new Error("Devi essere loggato per salvare.");

  if (params.id) {
    const { data, error } = await supabase
      .from("carousels")
      .update({ name: params.name, data: params.data, thumbnail: params.thumbnail ?? null })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("carousels")
    .insert({ user_id, name: params.name, data: params.data, thumbnail: params.thumbnail ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCarousel(id: string): Promise<void> {
  const { error } = await supabase.from("carousels").delete().eq("id", id);
  if (error) throw error;
}
