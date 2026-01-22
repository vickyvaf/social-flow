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
