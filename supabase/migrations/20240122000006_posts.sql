-- Posts table
create table public.posts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title text not null default '',
  content text not null,
  image_url text,
  
  status post_status not null default 'draft',
  scheduled_for timestamptz,
  timezone text not null default 'UTC',
  visibility text not null default 'public',
  crossposting_enabled boolean not null default true,
  metadata jsonb not null default '{}',
  publish_attempts integer not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
