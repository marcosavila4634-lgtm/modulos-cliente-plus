-- SIMULAÇÃO. NÃO copiar para o Supabase.
--
-- Pagamentos avulsos (venda de serviços) não têm assinatura: no laboratório a
-- coluna passa a aceitar vazio e ganha uma descrição. CONFIRMAR NA MIGRAÇÃO
-- como o Cliente Plus real guarda pagamentos avulsos (pode ser outra tabela).
alter table cp_pagamentos alter column assinatura_id set null;
alter table cp_pagamentos add column descricao text;

-- Ligações dos novos dados do módulo com os clientes e pagamentos simulados.
alter table academia_vendas
  add constraint academia_vendas_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table academia_vendas
  add constraint academia_vendas_pagamento_fk foreign key (pagamento_id) references cp_pagamentos (id);
alter table academia_agendamentos
  add constraint academia_agendamentos_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table academia_turma_alunos
  add constraint academia_turma_alunos_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table academia_aula_presencas
  add constraint academia_aula_presencas_cliente_fk foreign key (cliente_id) references cp_clientes (id);
