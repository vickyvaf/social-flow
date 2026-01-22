-- OAuth accounts migration
create type oauth_provider as enum (
  'twitter',
  'linkedin',
  'threads'
);

create table public.oauth_accounts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  provider oauth_provider not null,
  provider_account_id text not null, -- id dari platform
  username text,
  display_name text,

  access_token text not null,
  refresh_token text,
  expires_at timestamptz,

  is_default boolean default false,
  created_at timestamptz default now(),

  unique (provider, provider_account_id)
);
