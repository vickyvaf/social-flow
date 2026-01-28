-- Migration: Remove credit system, setup transactions for IDRX payments
-- Date: 2026-01-27

-- Drop credit-related RPC functions if they exist
drop function if exists public.deduct_credit(uuid);
drop function if exists public.refund_credit(uuid, integer);
drop function if exists public.topup_credit(uuid, integer);

-- Create transactions table if it doesn't exist
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  wallet_address text,
  chain text,
  tx_hash text unique,
  token_symbol text,
  token_decimals integer,
  amount numeric,
  description text,
  created_at timestamptz default now()
);

-- Remove credits_granted column if it exists (from old schema)
do $$ 
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'transactions' 
    and column_name = 'credits_granted'
  ) then
    alter table public.transactions drop column credits_granted;
  end if;
end $$;

-- Create index for faster queries
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_wallet_address on public.transactions(wallet_address);
create index if not exists idx_transactions_tx_hash on public.transactions(tx_hash);

-- Enable RLS
alter table public.transactions enable row level security;

-- RLS Policies
drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id or wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address');

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id or wallet_address is not null);

-- Update transactions table comment
comment on table public.transactions is 'Records all IDRX token payment transactions';

-- Mark old credit tables as deprecated if they exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_credits') then
    comment on table public.user_credits is 'DEPRECATED: Credit system replaced by IDRX token payments';
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'credit_usage_logs') then
    comment on table public.credit_usage_logs is 'DEPRECATED: Credit system replaced by IDRX token payments';
  end if;
end $$;

-- Remove the auth trigger that creates credits on user signup if exists
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
