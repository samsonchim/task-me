
create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  duration text,
  importance text not null,
  category text not null,
  start_time text,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;


do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and policyname = 'anon can insert tasks'
  ) then
    execute 'create policy "anon can insert tasks" on public.tasks for insert to anon with check (true)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and policyname = 'anon can read tasks'
  ) then
    execute 'create policy "anon can read tasks" on public.tasks for select to anon using (true)';
  end if;
end $$;
-- Supabase removed: app now uses local SQLite storage.
    execute 'create policy "anon can read tasks" on public.tasks for select to anon using (true)';
