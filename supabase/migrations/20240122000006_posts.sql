-- Posts table
create table public.posts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  content_text text not null,
  image_url text,

  created_at timestamptz default now()
);
