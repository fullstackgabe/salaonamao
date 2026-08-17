-- Avaliações públicas (cliente anônimo). Complementa schema.sql.
-- Aplicar no projeto rlgfqagvjmaridpvfeai (SQL Editor do Supabase).

-- customer_id passa a ser opcional (cliente reserva/avalia sem login)
alter table reviews alter column customer_id drop not null;

-- Insert público (qualquer visitante pode avaliar); leitura já é liberada em schema.sql
drop policy if exists reviews_insert_owned on reviews;
drop policy if exists reviews_insert_public on reviews;
create policy reviews_insert_public on reviews for insert with check (true);
