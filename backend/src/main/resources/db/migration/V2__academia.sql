-- Módulo Academia: tabelas próprias do módulo.
--
-- Alunos, planos, matrículas e mensalidades NÃO ficam aqui: são clientes,
-- planos, assinaturas e pagamentos do Cliente Plus. Os números do Dashboard
-- (GET /api/academia/dashboard) são calculados a partir deles.
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));

-- Cabeçalho do painel: nome da academia, gestor e frase motivacional.
create table academia_painel (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null unique,
  nome_academia text not null,
  gestor_nome text not null,
  gestor_cargo text not null,
  frase text not null default ''
);
