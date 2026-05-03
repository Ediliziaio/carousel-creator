-- Progetti: contenitore per brand, descrizione, e tutti i contenuti.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  brand jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_updated_at_idx
  on public.projects (user_id, updated_at desc);

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Tipo di contenuto.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'content_type') then
    create type public.content_type as enum ('post', 'carousel', 'story');
  end if;
end $$;

-- Contenuti generici (post singolo, carosello multi-slide, story 9:16).
create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.content_type not null,
  name text not null,
  data jsonb not null,
  thumbnail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contents_project_type_updated_idx
  on public.contents (project_id, type, updated_at desc);

create index if not exists contents_user_id_idx
  on public.contents (user_id);

alter table public.contents enable row level security;

drop policy if exists "contents_select_own" on public.contents;
create policy "contents_select_own" on public.contents
  for select using (auth.uid() = user_id);

drop policy if exists "contents_insert_own" on public.contents;
create policy "contents_insert_own" on public.contents
  for insert with check (auth.uid() = user_id);

drop policy if exists "contents_update_own" on public.contents;
create policy "contents_update_own" on public.contents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "contents_delete_own" on public.contents;
create policy "contents_delete_own" on public.contents
  for delete using (auth.uid() = user_id);

drop trigger if exists contents_set_updated_at on public.contents;
create trigger contents_set_updated_at
  before update on public.contents
  for each row execute function public.set_updated_at();

-- Migrazione dati: i caroselli esistenti diventano contenuti del progetto "Default".
do $$
declare
  u record;
  default_project_id uuid;
begin
  for u in select distinct user_id from public.carousels loop
    insert into public.projects (user_id, name, description)
    values (u.user_id, 'Progetto principale', 'Progetto creato automaticamente dalla migrazione iniziale.')
    returning id into default_project_id;

    insert into public.contents (project_id, user_id, type, name, data, thumbnail, created_at, updated_at)
    select default_project_id, c.user_id, 'carousel'::public.content_type, c.name, c.data, c.thumbnail, c.created_at, c.updated_at
    from public.carousels c
    where c.user_id = u.user_id;
  end loop;
end $$;
