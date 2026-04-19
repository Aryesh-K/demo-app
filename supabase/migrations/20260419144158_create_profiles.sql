-- Create profiles table to store per-user data linked to auth.users

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  last_name text,
  phone text,
  is_premium boolean default false,
  age text,
  conditions text,
  medications text,
  allergies text,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create index if not exists profiles_id_idx on public.profiles (id);

create policy "Users can select own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);
