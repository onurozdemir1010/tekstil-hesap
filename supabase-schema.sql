create extension if not exists "pgcrypto";

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('metre', 'cm', 'adet')),
  value numeric not null check (value >= 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  quantity numeric not null check (quantity > 0),
  operator text not null default 'Belirtilmedi'
);

create table if not exists public.order_materials (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('metre', 'cm', 'adet')),
  unit_value numeric not null check (unit_value >= 0),
  total numeric not null check (total >= 0)
);

alter table public.customers enable row level security;
alter table public.materials enable row level security;
alter table public.orders enable row level security;
alter table public.order_materials enable row level security;

drop policy if exists "team can read customers" on public.customers;
drop policy if exists "team can write customers" on public.customers;
drop policy if exists "team can read materials" on public.materials;
drop policy if exists "team can write materials" on public.materials;
drop policy if exists "team can read orders" on public.orders;
drop policy if exists "team can write orders" on public.orders;
drop policy if exists "team can read order materials" on public.order_materials;
drop policy if exists "team can write order materials" on public.order_materials;

create policy "team can read customers" on public.customers for select using (true);
create policy "team can write customers" on public.customers for all using (true) with check (true);
create policy "team can read materials" on public.materials for select using (true);
create policy "team can write materials" on public.materials for all using (true) with check (true);
create policy "team can read orders" on public.orders for select using (true);
create policy "team can write orders" on public.orders for all using (true) with check (true);
create policy "team can read order materials" on public.order_materials for select using (true);
create policy "team can write order materials" on public.order_materials for all using (true) with check (true);

create index if not exists materials_customer_id_idx on public.materials(customer_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_materials_order_id_idx on public.order_materials(order_id);
