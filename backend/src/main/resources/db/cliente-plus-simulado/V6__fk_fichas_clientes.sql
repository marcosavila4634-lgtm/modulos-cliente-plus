-- SIMULAÇÃO. NÃO copiar para o Supabase.
-- Liga as fichas de treino ao cliente simulado do Cliente Plus. No projeto
-- principal, a chave estrangeira aponta para a tabela real de clientes.
alter table academia_fichas
  add constraint academia_fichas_cliente_fk foreign key (cliente_id) references cp_clientes (id);
