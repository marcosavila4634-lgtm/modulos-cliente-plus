-- SIMULAÇÃO. NÃO copiar para o Supabase.
-- Liga os registros de treino ao cliente simulado do Cliente Plus.
alter table academia_treino_registros
  add constraint academia_treino_registros_cliente_fk foreign key (cliente_id) references cp_clientes (id);
