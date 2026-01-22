-- User credits table (1:1 with profiles)
create table public.user_credits (
  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  credits_remaining integer not null default 0,
  updated_at timestamptz default now()
);
