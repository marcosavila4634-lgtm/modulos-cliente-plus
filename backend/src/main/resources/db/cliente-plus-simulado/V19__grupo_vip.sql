-- SIMULAÇÃO. NÃO copiar para o Supabase como está.
--
-- 1) Ligações das tabelas do módulo Grupos VIP com as tabelas do Cliente Plus
--    (no Supabase: apontar para as tabelas reais de clientes, planos e
--    pagamentos).
alter table grupo_vip_plano_grupos
  add constraint grupo_vip_plano_grupos_plano_fk foreign key (plano_id) references cp_planos (id) on delete cascade;
alter table grupo_vip_membros
  add constraint grupo_vip_membros_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_acessos
  add constraint grupo_vip_acessos_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_acesso_eventos
  add constraint grupo_vip_acesso_eventos_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_mensagens
  add constraint grupo_vip_mensagens_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_conteudo_views
  add constraint grupo_vip_conteudo_views_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_checkouts
  add constraint grupo_vip_checkouts_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_checkouts
  add constraint grupo_vip_checkouts_plano_fk foreign key (plano_id) references cp_planos (id);
alter table grupo_vip_checkouts
  add constraint grupo_vip_checkouts_pagamento_fk foreign key (pagamento_id) references cp_pagamentos (id);
alter table grupo_vip_chamados
  add constraint grupo_vip_chamados_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_livro_pedidos
  add constraint grupo_vip_livro_pedidos_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_livro_links
  add constraint grupo_vip_livro_links_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_livro_sugestoes
  add constraint grupo_vip_livro_sugestoes_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table grupo_vip_permissoes
  add constraint grupo_vip_permissoes_cliente_fk foreign key (cliente_id) references cp_clientes (id);

-- 2) Saques de comissão pedidos pelos clientes. No Cliente Plus real isso já
--    existe (menu "Saques"); aqui é só uma imitação para a tela funcionar.
create table cp_saques (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null references cp_clientes (id),
  valor numeric(10, 2) not null check (valor > 0),
  chave_pix text not null,
  status text not null default 'solicitado' check (status in ('solicitado', 'pago', 'recusado')),
  motivo text,
  created_at timestamp with time zone not null default now(),
  pago_em timestamp with time zone
);

create index cp_saques_store_idx on cp_saques (store_id, status);
