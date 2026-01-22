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
