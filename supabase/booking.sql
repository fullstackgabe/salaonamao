-- Reservas do cliente (anônimo) + RPC atômico de agendamento.
-- Complementa schema.sql. Aplicado no projeto rlgfqagvjmaridpvfeai.

-- bookings aceita cliente sem login (nome/email/telefone)
alter table bookings add column if not exists customer_name text;
alter table bookings add column if not exists customer_email text;
alter table bookings add column if not exists customer_phone text;
alter table bookings alter column customer_id drop not null;

-- Insert público (cliente reserva sem login); leitura só p/ profissional autenticado
drop policy if exists bookings_select_owned on bookings;
drop policy if exists bookings_insert_owned on bookings;
drop policy if exists bookings_select_demo on bookings;
drop policy if exists bookings_insert_demo on bookings;
drop policy if exists bookings_insert_public on bookings;
drop policy if exists bookings_select_auth on bookings;
create policy bookings_insert_public on bookings for insert with check (true);
create policy bookings_select_auth on bookings for select using (auth.role() = 'authenticated');

-- Reserva atômica: marca o slot como reserved e cria o booking numa transação
create or replace function book_slot(
  p_slot_id uuid,
  p_service_id uuid,
  p_name text,
  p_email text,
  p_phone text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prof uuid;
  v_booking uuid;
begin
  select professional_id into v_prof
  from availability_slots
  where id = p_slot_id and status = 'available'
  for update;

  if v_prof is null then
    raise exception 'Horário indisponível';
  end if;

  update availability_slots set status = 'reserved' where id = p_slot_id;

  insert into bookings (customer_id, professional_id, service_id, slot_id, status,
                        customer_name, customer_email, customer_phone)
  values (null, v_prof, p_service_id, p_slot_id, 'confirmed', p_name, p_email, p_phone)
  returning id into v_booking;

  return v_booking;
end;
$$;

grant execute on function book_slot(uuid, uuid, text, text, text) to anon, authenticated;
