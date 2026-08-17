-- Gerenciamento de agendamentos pela profissional logada (ver e cancelar os próprios).
-- Aplicar no SQL Editor do projeto rlgfqagvjmaridpvfeai.

-- Antes, qualquer autenticado via tudo; agora só os agendamentos da própria profissional.
drop policy if exists bookings_select_auth on bookings;
create policy bookings_select_own on bookings
  for select
  using (professional_id = (auth.jwt() -> 'app_metadata' ->> 'professional_id')::uuid);

-- Cancela um agendamento: remove o booking e libera o horário de volta.
create or replace function cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prof uuid;
  v_slot uuid;
  v_owner uuid;
begin
  v_owner := (auth.jwt() -> 'app_metadata' ->> 'professional_id')::uuid;

  select professional_id, slot_id into v_prof, v_slot
  from bookings
  where id = p_booking_id;

  if v_prof is null then
    raise exception 'Agendamento não encontrado';
  end if;

  if v_prof <> v_owner then
    raise exception 'Sem permissão para cancelar este agendamento';
  end if;

  delete from bookings where id = p_booking_id;
  update availability_slots set status = 'available' where id = v_slot;
end;
$$;

grant execute on function cancel_booking(uuid) to authenticated;
