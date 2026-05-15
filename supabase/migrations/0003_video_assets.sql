-- Video assets table: ogni utente vede solo le sue risorse video/avatar/audio.
-- Tipologie:
--   'video'    → b-roll generato AI o uploadato dall'utente
--   'avatar'   → PNG con sfondo trasparente (upload) o ritratto AI generato
--   'audio'    → voice-over TTS o audio uploadato
create table if not exists public.video_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  type text not null check (type in ('video', 'avatar', 'audio')),
  name text not null,
  url text not null,
  thumbnail_url text,
  /** Metadata flessibile: duration, source provider, prompt, dimensions… */
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists video_assets_user_project_idx
  on public.video_assets (user_id, project_id, created_at desc);
create index if not exists video_assets_type_idx
  on public.video_assets (user_id, type, created_at desc);

alter table public.video_assets enable row level security;

drop policy if exists "video_assets_select_own" on public.video_assets;
create policy "video_assets_select_own" on public.video_assets
  for select using (auth.uid() = user_id);

drop policy if exists "video_assets_insert_own" on public.video_assets;
create policy "video_assets_insert_own" on public.video_assets
  for insert with check (auth.uid() = user_id);

drop policy if exists "video_assets_update_own" on public.video_assets;
create policy "video_assets_update_own" on public.video_assets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "video_assets_delete_own" on public.video_assets;
create policy "video_assets_delete_own" on public.video_assets
  for delete using (auth.uid() = user_id);
