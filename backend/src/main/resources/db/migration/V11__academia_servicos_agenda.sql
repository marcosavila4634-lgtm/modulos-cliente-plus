-- Módulo Academia: serviços avulsos (personal, nutricionista, day use...),
-- vendas desses serviços e agenda dos profissionais.
--
-- Uma venda gera um pagamento no Cliente Plus (sem assinatura, com descrição),
-- que aparece no Faturamento e, depois de pago, entra no motor de comissões
-- (se o serviço participar das indicações) e na comissão do profissional.
-- cliente_id / pagamento_id apontam para tabelas do Cliente Plus (FKs em
-- cliente-plus-simulado/V13 no laboratório).
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));

create table academia_servicos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  descricao text not null default '',
  categoria text not null default 'outro'
    check (categoria in ('personal', 'avaliacao', 'nutricao', 'fisioterapia', 'massagem', 'aula_avulsa', 'day_use', 'outro')),
  preco numeric(10, 2) not null check (preco >= 0),
  duracao_minutos integer check (duracao_minutos > 0), -- vazio = não é agendado
  profissional_id uuid references academia_profissionais (id), -- quem costuma atender
  comissao_pct numeric(5, 2) not null default 0 check (comissao_pct between 0 and 100),
  participa_indicacoes boolean not null default false, -- gera comissão de indicação no Cliente Plus?
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- Venda de um serviço a um aluno. A situação (a receber, paga, cancelada) é a
-- do pagamento ligado a ela. comissao_pct é copiada do serviço na venda.
create table academia_vendas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  servico_id uuid not null references academia_servicos (id),
  profissional_id uuid references academia_profissionais (id),
  quantidade integer not null default 1 check (quantidade > 0),
  valor numeric(10, 2) not null check (valor >= 0),
  comissao_pct numeric(5, 2) not null default 0,
  pagamento_id uuid not null,
  created_at timestamp with time zone not null default now()
);

create index academia_vendas_store_idx on academia_vendas (store_id, created_at);

-- Agenda dos profissionais: personal, avaliações, consultas...
-- cliente_id vazio = compromisso interno (ex.: reunião).
create table academia_agendamentos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid,
  profissional_id uuid not null references academia_profissionais (id),
  servico_id uuid references academia_servicos (id),
  tipo text not null default 'servico' check (tipo in ('servico', 'avaliacao', 'outro')),
  titulo text not null default '',
  inicio timestamp with time zone not null,
  fim timestamp with time zone not null,
  status text not null default 'agendado'
    check (status in ('agendado', 'confirmado', 'concluido', 'faltou', 'cancelado')),
  observacao text not null default '',
  venda_id uuid references academia_vendas (id), -- cobrança gerada ao concluir
  created_at timestamp with time zone not null default now(),
  check (fim > inicio)
);

create index academia_agendamentos_inicio_idx on academia_agendamentos (store_id, inicio);
