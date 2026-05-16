-- Add onboarding questionnaire columns to profiles table

alter table public.profiles
  add column if not exists user_type text,
  add column if not exists user_subtype text,
  add column if not exists use_case text,
  add column if not exists onboarding_complete boolean default false;
