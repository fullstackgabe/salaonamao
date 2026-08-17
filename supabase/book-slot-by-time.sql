-- Corrige o agendamento: hoje "Livre" é só visual (não existe linha em
-- availability_slots pra maioria dos horários), então book_slot(slot_id) falhava
-- silenciosamente pra esses casos. Essa função cria o slot na hora se precisar.
-- Aplicar no SQL Editor do projeto rlgfqagvjmaridpvfeai.

create or replace function book_slot_by_time(
  p_professional_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
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
  v_slot uuid;
  v_booking uuid;
begin
  insert into availability_slots (professional_id, start_time, end_time, status)
  values (p_professional_id, p_start_time, p_end_time, 'available')
  on conflict (professional_id, start_time) do nothing;

  select id into v_slot
  from availability_slots
  where professional_id = p_professional_id and start_time = p_start_time and status = 'available'
  for update;

  if v_slot is null then
    raise exception 'Horário indisponível';
  end if;

  update availability_slots set status = 'reserved' where id = v_slot;

  insert into bookings (customer_id, professional_id, service_id, slot_id, status,
                        customer_name, customer_email, customer_phone)
  values (null, p_professional_id, p_service_id, v_slot, 'confirmed', p_name, p_email, p_phone)
  returning id into v_booking;

  return v_booking;
end;
$$;

grant execute on function book_slot_by_time(uuid, timestamptz, timestamptz, uuid, text, text, text) to anon, authenticated;
