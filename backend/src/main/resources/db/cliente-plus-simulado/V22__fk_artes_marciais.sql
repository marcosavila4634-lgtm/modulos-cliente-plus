-- SIMULAÇÃO. NÃO copiar para o Supabase (lá as FKs apontam para as tabelas
-- reais de clientes e pagamentos do Cliente Plus).
alter table artes_marciais_alunos
  add constraint artes_marciais_alunos_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table artes_marciais_graduacoes
  add constraint artes_marciais_graduacoes_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table artes_marciais_exame_candidatos
  add constraint artes_marciais_exame_candidatos_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table artes_marciais_exame_candidatos
  add constraint artes_marciais_exame_candidatos_pagamento_fk foreign key (pagamento_id) references cp_pagamentos (id);
alter table artes_marciais_inscricoes
  add constraint artes_marciais_inscricoes_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table artes_marciais_inscricoes
  add constraint artes_marciais_inscricoes_pagamento_fk foreign key (pagamento_id) references cp_pagamentos (id);
alter table artes_marciais_filiacoes
  add constraint artes_marciais_filiacoes_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table artes_marciais_vendas
  add constraint artes_marciais_vendas_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table artes_marciais_vendas
  add constraint artes_marciais_vendas_pagamento_fk foreign key (pagamento_id) references cp_pagamentos (id);
alter table artes_marciais_dependentes
  add constraint artes_marciais_dependentes_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table artes_marciais_comunicado_envios
  add constraint artes_marciais_comunicado_envios_cliente_fk foreign key (cliente_id) references cp_clientes (id);
