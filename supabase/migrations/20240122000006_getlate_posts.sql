-- GetLate Posts table (renamed from posts)
-- Updates schema to match GetLate API response

create table public.getlate_posts (
  id uuid primary key default gen_random_uuid(),

  -- Internal User ID (linked to Supabase Auth)
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  -- External IDs from GetLate
  external_id text, -- _id from response
  external_user_id text, -- userId from response

  title text default '',
  content text not null,

  -- Media and Platforms as JSONB to match response structure
  media_items jsonb default '[]'::jsonb,
  platforms jsonb default '[]'::jsonb,

  scheduled_for timestamptz,
  timezone text default 'UTC',
  status text not null default 'draft', -- 'scheduled', 'pending', 'published', 'failed'

  -- Arrays/JSONB for tags, etc
  tags jsonb default '[]'::jsonb,
  hashtags jsonb default '[]'::jsonb,
  mentions jsonb default '[]'::jsonb,

  visibility text default 'public',
  crossposting_enabled boolean default true,

  metadata jsonb default '{}'::jsonb,
  publish_attempts integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for performance
create index idx_getlate_posts_user_id on public.getlate_posts(user_id);
create index idx_getlate_posts_external_id on public.getlate_posts(external_id);
