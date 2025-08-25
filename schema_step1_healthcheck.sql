-- Krok 1: minimalna inicjalizacja w Supabase (staging)
-- Uruchom w: Project -> SQL editor -> New query

create extension if not exists "pgcrypto";

create table if not exists public.healthcheck (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);
