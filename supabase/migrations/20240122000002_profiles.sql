-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  email text,
  created_at timestamptz default now()
);
