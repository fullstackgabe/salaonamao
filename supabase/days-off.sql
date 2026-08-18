-- Dias que a profissional marca como indisponível (folga/férias).
-- Fins de semana já são bloqueados no app (regra fixa, não precisa de linha aqui).
-- Aplicar no SQL Editor do projeto rlgfqagvjmaridpvfeai.

create table if not exists professional_days_off (
  id uuid default gen_random_uuid() primary key,
  professional_id uuid not null references professionals(id) on delete cascade,
  day date not null,
  unique (professional_id, day)
);

alter table professional_days_off enable row level security;

drop policy if exists days_off_select_all on professional_days_off;
create policy days_off_select_all on professional_days_off for select using (true);

drop policy if exists days_off_insert_own on professional_days_off;
create policy days_off_insert_own on professional_days_off
  for insert
  with check (professional_id = (auth.jwt() -> 'app_metadata' ->> 'professional_id')::uuid);

drop policy if exists days_off_delete_own on professional_days_off;
create policy days_off_delete_own on professional_days_off
  for delete
  using (professional_id = (auth.jwt() -> 'app_metadata' ->> 'professional_id')::uuid);
