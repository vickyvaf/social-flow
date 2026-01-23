-- Create pgcrypto extension
create extension if not exists "pgcrypto";
-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  email text,
  created_at timestamptz default now()
);
-- User credits table (1:1 with profiles)
create table public.user_credits (
  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  credits_remaining integer not null default 0,
  updated_at timestamptz default now()
);
-- Wallets table
create table public.wallets (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  address text not null,
  chain text not null,
  verified boolean default false,
  created_at timestamptz default now(),

  unique (address)
);
-- Transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),

  -- relasi user
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  -- wallet & chain
  wallet_address text not null,
  chain text not null,

  -- blockchain transaction
  tx_hash text not null,

  -- token info
  token_symbol text not null,        -- USDC, ETH, MATIC
  token_address text,                -- null untuk native token
  token_decimals integer not null,   -- 6, 18, dll

  -- payment value
  amount numeric not null,           -- raw amount (sudah disesuaikan decimals)
  credits_granted integer not null,  -- credit yg diberikan

  created_at timestamptz default now(),

  -- constraints
  unique (tx_hash)
);
-- Posts table (Renamed to getlate_posts)
create table public.getlate_posts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  -- Updated schema matching recent changes
  external_id text,
  external_user_id text,
  title text default '',
  content text not null,
  media_items jsonb default '[]'::jsonb,
  platforms jsonb default '[]'::jsonb,
  scheduled_for timestamptz,
  timezone text default 'UTC',
  status text not null default 'draft',
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
-- Post distributions migration
create type post_status as enum (
  'draft',
  'scheduled',
  'published',
  'failed'
);

create table public.post_distributions (
  id uuid primary key default gen_random_uuid(),

  post_id uuid not null
    references public.getlate_posts(id)
    on delete cascade,

  platform oauth_provider not null,

  oauth_account_id uuid
    references public.oauth_accounts(id)
    on delete set null,

  external_post_id text,
  status post_status not null default 'draft',
  error_message text,

  created_at timestamptz default now(),

  unique (post_id, platform, oauth_account_id)
);
-- Credit usage logs table
create table public.credit_usage_logs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  action text not null,
  credits_used integer not null,

  created_at timestamptz default now()
);
