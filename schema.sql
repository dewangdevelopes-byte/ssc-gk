-- Supabase Database Schema for SSC-GK Current Affairs
-- Run this in your Supabase SQL Editor

-- 1. Create table
create table if not exists public.news_articles (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    url text not null unique,
    source text not null,
    category text not null default 'national-schemes',
    summary text,
    published_at timestamptz not null,
    created_at timestamptz not null default timezone('utc'::text, now())
);

-- In case table already exists without category column:
alter table public.news_articles add column if not exists category text not null default 'national-schemes';
alter table public.news_articles add column if not exists summary text;

-- 2. Create indexes for fast queries
create index if not exists idx_news_articles_published_at_desc 
on public.news_articles (published_at desc);

create index if not exists idx_news_articles_category 
on public.news_articles (category, published_at desc);

-- 3. Enable RLS and setup public read policy
alter table public.news_articles enable row level security;

create policy "Public read access" 
on public.news_articles 
for select 
using (true);

-- ====================================================
-- 4. Typing Analytics Schema (SSC CGL DEST Module)
-- ====================================================

create table if not exists public.typing_sessions (
    id uuid primary key default gen_random_uuid(),
    net_wpm integer not null,
    accuracy numeric(5,2) not null,
    key_depressions integer not null,
    created_at timestamptz not null default timezone('utc'::text, now())
);

-- Index for querying recent sessions ordered by timestamp
create index if not exists idx_typing_sessions_created_at_desc 
on public.typing_sessions (created_at desc);

-- Enable Row Level Security
alter table public.typing_sessions enable row level security;

-- Allow reading sessions
create policy "Public read typing sessions" 
on public.typing_sessions 
for select 
using (true);

-- Allow creating new typing session records
create policy "Public insert typing sessions" 
on public.typing_sessions 
for insert 
with check (true);
