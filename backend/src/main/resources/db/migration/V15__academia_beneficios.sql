-- Módulo Academia: benefícios para os alunos e os resgates.
--
-- Tipos de benefício (quem pode resgatar):
--   parceiro    = todo aluno com matrícula ativa (cupom de uma loja parceira)
--   indicacao   = quem tem pelo menos <regra> indicados com matrícula ativa
--   fidelidade  = quem tem pelo menos <regra> meses desde a primeira matrícula
--   aniversario = no mês do aniversário (uma vez por ano)
--   frequencia  = quem fez pelo menos <regra> check-ins no mês (uma vez por mês)
-- referencia do resgate: "" (uma vez só), "2026" (por ano) ou "2026-09" (por mês).
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));
-- O aluno (área do cliente) lê os benefícios ativos e cria os PRÓPRIOS resgates.

create table academia_beneficios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  titulo text not null,
  descricao text not null default '',
  tipo text not null check (tipo in ('parceiro', 'indicacao', 'fidelidade', 'aniversario', 'frequencia')),
  regra integer, -- indicados / meses / check-ins, conforme o tipo
  recompensa text not null, -- ex.: "1 mês grátis", "15% de desconto"
  parceiro text not null default '',
  codigo text not null default '', -- cupom
  validade date, -- vazio = sem prazo
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table academia_beneficio_resgates (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  beneficio_id uuid not null references academia_beneficios (id) on delete cascade,
  cliente_id uuid not null,
  referencia text not null default '',
  origem text not null default 'recepcao' check (origem in ('recepcao', 'area_cliente')),
  entregue_em timestamp with time zone, -- vazio = resgatado, falta entregar
  created_at timestamp with time zone not null default now(),
  unique (beneficio_id, cliente_id, referencia)
);
