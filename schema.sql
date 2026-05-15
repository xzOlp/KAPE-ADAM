-- Ember & Oak — Supabase Schema
-- Run this in Supabase SQL Editor

-- 1. PROFILES TABLE
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text default '',
  created_at timestamptz default now()
);

alter table profiles disable row level security;

-- 2. ORDERS TABLE (items stored as JSONB inline)
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  items jsonb not null,
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table orders enable row level security;

create policy "Users read own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Users create orders"
  on orders for insert with check (auth.uid() = user_id);

-- 3. AUTO-PROFILE ON SIGNUP
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 4. ADMIN DELETE USER (deletes orders, profile, and auth user)
create or replace function admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.orders where user_id = target_id;
  delete from public.profiles where id = target_id;
  delete from auth.users where id = target_id;
end;
$$;
