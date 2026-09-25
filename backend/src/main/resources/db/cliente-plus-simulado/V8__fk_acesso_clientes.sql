-- SIMULAÇÃO. NÃO copiar para o Supabase.
-- Liga o controle de acesso ao cliente simulado do Cliente Plus. No projeto
-- principal, as chaves estrangeiras apontam para a tabela real de clientes.
alter table academia_acessos
  add constraint academia_acessos_cliente_fk foreign key (cliente_id) references cp_clientes (id);
alter table academia_bloqueios
  add constraint academia_bloqueios_cliente_fk foreign key (cliente_id) references cp_clientes (id);
