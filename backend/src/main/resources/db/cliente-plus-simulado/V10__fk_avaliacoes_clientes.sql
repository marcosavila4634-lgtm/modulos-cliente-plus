-- SIMULAÇÃO. NÃO copiar para o Supabase.
-- Liga as avaliações físicas ao cliente simulado do Cliente Plus.
alter table academia_avaliacoes
  add constraint academia_avaliacoes_cliente_fk foreign key (cliente_id) references cp_clientes (id);
