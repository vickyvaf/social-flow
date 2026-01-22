-- Post distributions migration
create type post_status as enum (
  'draft',
  'pending',
  'scheduled',
  'published',
  'failed'
);

create table public.post_distributions (
  id uuid primary key default gen_random_uuid(),

  post_id uuid not null
    references public.posts(id)
    on delete cascade,

  platform oauth_provider not null,
  platform_name text, -- platform snapshot
  username text, -- username snapshot

  oauth_account_id uuid
    references public.oauth_accounts(id)
    on delete set null,

  external_post_id text,
  status post_status not null default 'draft',
  scheduled_for timestamptz,
  error_message text,

  created_at timestamptz default now(),

  unique (post_id, platform, oauth_account_id)
);
