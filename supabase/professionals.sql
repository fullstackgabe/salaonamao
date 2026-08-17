-- Permite a profissional logada editar o PRÓPRIO cadastro.
-- Vínculo seguro: o professional_id fica no app_metadata da conta
-- (só a service_role escreve app_metadata, então o usuário não pode forjar).
-- Aplicar no SQL Editor do projeto rlgfqagvjmaridpvfeai.

drop policy if exists professionals_update_own on professionals;
create policy professionals_update_own on professionals
  for update
  using  (id = (auth.jwt() -> 'app_metadata' ->> 'professional_id')::uuid)
  with check (id = (auth.jwt() -> 'app_metadata' ->> 'professional_id')::uuid);
