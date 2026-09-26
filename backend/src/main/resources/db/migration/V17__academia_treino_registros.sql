-- Módulo Academia: o que o aluno marcou como feito no treino, e a carga usada.
-- O aluno marca pela área do cliente (Meu treino). Serve para a frequência de
-- treino e para a evolução de carga de cada exercício.
--
-- Guardado por exercício (não pelo item da ficha), porque salvar a ficha
-- recria os itens; assim a evolução continua mesmo trocando de ficha.
--
-- RLS (Supabase):
--   alter table academia_treino_registros enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on academia_treino_registros
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));
--   + policy para o aluno criar/alterar só os PRÓPRIOS registros (cliente_id = aluno logado).

create table academia_treino_registros (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  ficha_id uuid references academia_fichas (id) on delete set null,
  exercicio_id uuid not null references academia_exercicios (id),
  treino_letra text not null,
  data date not null,
  feito boolean not null default true,
  carga_kg numeric(6, 2),
  created_at timestamp with time zone not null default now(),
  unique (cliente_id, ficha_id, treino_letra, exercicio_id, data)
);

create index academia_treino_registros_cliente_idx on academia_treino_registros (store_id, cliente_id, exercicio_id, data);
