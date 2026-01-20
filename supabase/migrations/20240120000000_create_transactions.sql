create table public.transactions (
  id uuid primary key default gen_random_uuid(),

  -- ownership
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_content_id uuid not null
    references public.saved_content(id) on delete cascade,

  -- blockchain info
  tx_hash text not null,
  chain_id int not null,                 -- 8453 = Base, 137 = Polygon
  token_symbol text not null,             -- IDRX, ETH
  token_address text,                     -- null if native ETH
  amount numeric(38, 18) not null,

  -- transaction state
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed')),

  block_number bigint,
  error_message text,

  created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);
