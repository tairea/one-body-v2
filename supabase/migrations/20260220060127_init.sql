-- Enable pgvector extension
create extension if not exists vector;

-- People table
create table public.people (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade not null unique,
  name                   text not null,
  location_name          text,
  location_latitude      float8,
  location_longitude     float8,
  layer1_list            jsonb not null default '[]',
  layer2_list            jsonb not null default '[]',
  layer3_list            jsonb not null default '[]',
  persons_graph_snapshot jsonb,
  embedding              vector(1536),
  created_at             timestamptz default now()
);

-- Recommendations table
create table public.recommendations (
  person1_id  uuid references public.people(id) on delete cascade,
  person2_id  uuid references public.people(id) on delete cascade,
  ranking     float8,
  reason      text,
  potential   jsonb,
  primary key (person1_id, person2_id)
);

-- RLS: people
alter table public.people enable row level security;

create policy "public can read people"
  on public.people for select using (true);

create policy "owner can insert their profile"
  on public.people for insert
  with check (auth.uid() = user_id);

create policy "owner can update their profile"
  on public.people for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner can delete their profile"
  on public.people for delete
  using (auth.uid() = user_id);

-- RLS: recommendations (public read, service role writes)
alter table public.recommendations enable row level security;

create policy "public can read recommendations"
  on public.recommendations for select using (true);

-- Storage: community-assets bucket (public read, set up by setup script)
insert into storage.buckets (id, name, public)
  values ('community-assets', 'community-assets', true);

create policy "public can view community assets"
  on storage.objects for select
  using (bucket_id = 'community-assets');

-- Storage: profile-photos bucket (public read)
-- Convention: photos stored at {user_id}/avatar (no extension; mime type set via contentType)
insert into storage.buckets (id, name, public)
  values ('profile-photos', 'profile-photos', true);

create policy "public can view profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

create policy "owner can upload their photo"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner can update their photo"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner can delete their photo"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable Realtime for people table
alter publication supabase_realtime add table public.people;
