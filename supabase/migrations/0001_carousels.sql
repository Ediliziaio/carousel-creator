-- Carousels table: ogni utente vede solo i suoi caroselli.
create table if not exists public.carousels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  thumbnail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carousels_user_id_updated_at_idx
  on public.carousels (user_id, updated_at desc);

alter table public.carousels enable row level security;

drop policy if exists "carousels_select_own" on public.carousels;
create policy "carousels_select_own" on public.carousels
  for select using (auth.uid() = user_id);

drop policy if exists "carousels_insert_own" on public.carousels;
create policy "carousels_insert_own" on public.carousels
  for insert with check (auth.uid() = user_id);

drop policy if exists "carousels_update_own" on public.carousels;
create policy "carousels_update_own" on public.carousels
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "carousels_delete_own" on public.carousels;
create policy "carousels_delete_own" on public.carousels
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists carousels_set_updated_at on public.carousels;
create trigger carousels_set_updated_at
  before update on public.carousels
  for each row execute function public.set_updated_at();
