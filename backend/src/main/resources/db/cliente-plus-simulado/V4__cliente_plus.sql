-- SIMULAÇÃO do Cliente Plus (projeto principal). NÃO copiar para o Supabase.
--
-- No projeto principal, clientes, planos, assinaturas e pagamentos já existem.
-- O módulo Academia só usa esses dados:
--   aluno     = cliente do lojista        (cp_clientes)
--   plano     = produto/plano do lojista  (cp_planos)
--   matrícula = assinatura do cliente     (cp_assinaturas)
--   mensalidade/cobrança = pagamento      (cp_pagamentos)
-- Estas tabelas existem aqui só para o módulo funcionar no laboratório. Na
-- migração, o código Java do pacote "clienteplus" passa a apontar para as
-- tabelas reais.

create table cp_clientes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  email text,
  telefone text,          -- só números, com DDD
  cpf text,               -- só números
  data_nascimento date,
  created_at timestamp with time zone not null default now()
);

create index cp_clientes_store_idx on cp_clientes (store_id);

create table cp_planos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  descricao text not null default '',
  preco numeric(10, 2) not null check (preco >= 0),
  duracao_meses integer not null default 1 check (duracao_meses > 0),
  participa_indicacoes boolean not null default true, -- gera comissão de indicação?
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table cp_assinaturas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null references cp_clientes (id),
  plano_id uuid not null references cp_planos (id),
  valor numeric(10, 2) not null,  -- preço do plano no dia da matrícula
  status text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  inicio date not null,
  cancelada_em timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index cp_assinaturas_cliente_idx on cp_assinaturas (cliente_id);

-- Uma linha por mensalidade. Pagamentos com status 'pago' são os "pagamentos
-- confirmados" que o motor de comissões do Cliente Plus consome.
-- "Atrasada" não é um status: é pendente com vencimento antes de hoje.
create table cp_pagamentos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  assinatura_id uuid not null references cp_assinaturas (id),
  cliente_id uuid not null references cp_clientes (id),
  valor numeric(10, 2) not null,
  vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  pago_em timestamp with time zone,
  forma_pagamento text
    check (forma_pagamento in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto')),
  origem text not null default 'academia', -- módulo que registrou o pagamento
  created_at timestamp with time zone not null default now()
);

create index cp_pagamentos_store_status_idx on cp_pagamentos (store_id, status, vencimento);
create index cp_pagamentos_assinatura_idx on cp_pagamentos (assinatura_id);
