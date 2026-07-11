-- Portfólio: a profissional logada gerencia os PRÓPRIOS trabalhos (fotos).
-- Vínculo pelo professional_id gravado no app_metadata (só service_role escreve).
-- Aplicar no SQL Editor do projeto rlgfqagvjmaridpvfeai.

-- 1) Tabela portfolios: insert/delete só do próprio dono (select já é público em schema.sql)
drop policy if exists portfolios_insert_own on portfolios;
create policy portfolios_insert_own on portfolios
  for insert
  with check (professional_id = (auth.jwt() -> 'app_metadata' ->> 'professional_id')::uuid);

drop policy if exists portfolios_delete_own on portfolios;
create policy portfolios_delete_own on portfolios
  for delete
  using (professional_id = (auth.jwt() -> 'app_metadata' ->> 'professional_id')::uuid);

-- 2) Storage (bucket "portfolios", já criado e público): a profissional só mexe
--    na própria pasta, cujo nome é o professional_id -> portfolios/<professional_id>/arquivo
drop policy if exists portfolios_storage_insert_own on storage.objects;
create policy portfolios_storage_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolios'
    and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'professional_id')
  );

drop policy if exists portfolios_storage_delete_own on storage.objects;
create policy portfolios_storage_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'portfolios'
    and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'professional_id')
  );
