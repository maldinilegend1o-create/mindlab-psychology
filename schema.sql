-- MindLab starter schema for Supabase.
-- Run this in Supabase SQL Editor after creating a project.
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_progress enable row level security;
create policy "Users can read their own progress" on public.user_progress
  for select using (auth.uid() = user_id);
create policy "Users can insert their own progress" on public.user_progress
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own progress" on public.user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.user_notes enable row level security;
create policy "Users can read their own notes" on public.user_notes
  for select using (auth.uid() = user_id);
create policy "Users can insert their own notes" on public.user_notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on public.user_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own notes" on public.user_notes
  for delete using (auth.uid() = user_id);
