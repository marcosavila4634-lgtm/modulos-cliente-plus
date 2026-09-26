-- Módulo Academia: despesas da academia e pagamentos de comissão aos
-- profissionais.
--
-- Receitas NÃO ficam aqui: são os pagamentos do Cliente Plus (mensalidades e
-- vendas de serviços). O resultado do mês = pagamentos recebidos − despesas
-- pagas (regime de caixa, pela data do pagamento).
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));

create table academia_despesas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  descricao text not null,
  categoria text not null
    check (categoria in ('aluguel', 'salarios', 'comissoes', 'energia', 'agua', 'internet', 'equipamentos',
                         'manutencao', 'limpeza', 'marketing', 'impostos', 'sistemas', 'outros')),
  fornecedor text not null default '',
  valor numeric(10, 2) not null check (valor > 0),
  vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'paga', 'cancelada')),
  pago_em timestamp with time zone,
  forma_pagamento text
    check (forma_pagamento in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia')),
  -- mensal: ao pagar, já cria a do mês seguinte
  recorrente boolean not null default false,
  observacao text not null default '',
  created_at timestamp with time zone not null default now()
);

create index academia_despesas_store_idx on academia_despesas (store_id, vencimento);

-- Comissão de um profissional paga num mês (competência = dia 1 do mês).
-- Vira uma despesa da categoria "comissoes".
create table academia_comissoes_pagas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  profissional_id uuid not null references academia_profissionais (id),
  competencia date not null,
  valor numeric(10, 2) not null,
  despesa_id uuid references academia_despesas (id),
  created_at timestamp with time zone not null default now(),
  unique (profissional_id, competencia)
);
