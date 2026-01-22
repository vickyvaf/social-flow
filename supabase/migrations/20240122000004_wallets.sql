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
