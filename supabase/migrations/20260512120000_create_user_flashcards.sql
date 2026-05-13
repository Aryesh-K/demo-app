-- Create user_flashcards table for storing flashcards added from analyses

create table if not exists public.user_flashcards (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  term text not null,
  definition text not null,
  category text,
  source text not null default 'analysis',
  created_at timestamp with time zone default now()
);

alter table public.user_flashcards enable row level security;

create index if not exists user_flashcards_user_id_idx on public.user_flashcards (user_id);

create policy "Users can select own flashcards"
  on public.user_flashcards for select
  using (auth.uid() = user_id);

create policy "Users can insert own flashcards"
  on public.user_flashcards for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own flashcards"
  on public.user_flashcards for delete
  using (auth.uid() = user_id);
