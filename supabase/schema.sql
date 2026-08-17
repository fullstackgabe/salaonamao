create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  duration_min integer not null check (duration_min > 0),
  price_cents integer not null check (price_cents >= 0)
);

create table if not exists professionals (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  bio text not null,
  specialties text[] not null default '{}',
  avatar_url text,
  rating numeric(3,2) default 0
);

create table if not exists portfolios (
  id uuid default gen_random_uuid() primary key,
  professional_id uuid not null references professionals(id) on delete cascade,
  image_url text not null,
  description text
);

create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  professional_id uuid not null references professionals(id) on delete cascade,
  customer_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone default now()
);

create type slot_status as enum ('available', 'reserved', 'blocked');

create table if not exists availability_slots (
  id uuid default gen_random_uuid() primary key,
  professional_id uuid not null references professionals(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status slot_status not null default 'available',
  unique (professional_id, start_time)
);

create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid not null,
  professional_id uuid not null references professionals(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  slot_id uuid not null references availability_slots(id) on delete restrict,
  status text not null default 'confirmed',
  created_at timestamp with time zone default now()
);

create table if not exists preferences (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid,
  preferred_services uuid[] not null default '{}',
  preferred_professionals uuid[] not null default '{}'
);

alter publication supabase_realtime add table availability_slots;

alter table services enable row level security;
create policy services_select_all on services for select using (true);

alter table professionals enable row level security;
create policy professionals_select_all on professionals for select using (true);

alter table portfolios enable row level security;
create policy portfolios_select_all on portfolios for select using (true);

alter table reviews enable row level security;
create policy reviews_select_all on reviews for select using (true);
create policy reviews_insert_owned on reviews for insert with check (customer_id = auth.uid());

alter table availability_slots enable row level security;
create policy availability_slots_select_all on availability_slots for select using (true);

alter table bookings enable row level security;
create policy bookings_select_owned on bookings for select using (customer_id = auth.uid());
create policy bookings_insert_owned on bookings for insert with check (customer_id = auth.uid());

alter table preferences enable row level security;
create policy preferences_select_owned on preferences for select using (customer_id = auth.uid());
create policy preferences_upsert_owned on preferences for insert with check (customer_id = auth.uid());
create policy preferences_update_owned on preferences for update using (customer_id = auth.uid());