-- SIMULAÇÃO. NÃO copiar para o Supabase.
--
-- Imitação do programa de indicações do Cliente Plus, só para o módulo
-- mostrar as comissões geradas pelos pagamentos da academia:
--   - quem indicou cada cliente (indicado_por_id);
--   - os percentuais por nível definidos pelo lojista (até 3 níveis).
-- No projeto principal, isso já existe e as comissões vêm do motor do
-- Cliente Plus (a tela Comissão > Indicações passa a ler de lá).
alter table cp_clientes add column indicado_por_id uuid references cp_clientes (id);

create table cp_programa_indicacao (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null unique,
  nivel1_pct numeric(5, 2) not null default 10,
  nivel2_pct numeric(5, 2) not null default 5,
  nivel3_pct numeric(5, 2) not null default 2
);

alter table academia_beneficio_resgates
  add constraint academia_beneficio_resgates_cliente_fk foreign key (cliente_id) references cp_clientes (id);
