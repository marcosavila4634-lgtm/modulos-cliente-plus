-- Módulo Academia: aulas coletivas (spinning, funcional, yoga...), grade
-- semanal, turmas fixas e presenças/reservas.
--
-- - academia_aulas: a aula (professor, sala, capacidade, duração).
-- - academia_aula_horarios: quando ela acontece na semana (dia + hora).
-- - academia_turma_alunos: alunos fixos de um horário (a "turma").
-- - academia_aula_presencas: reserva avulsa de uma data e a chamada
--   (presente / faltou) de fixos e avulsos.
-- Ocupação de uma data = fixos ativos + reservas avulsas não canceladas.
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));
-- O aluno (área do cliente) lê a grade e cria/cancela as PRÓPRIAS reservas
-- (policy extra em academia_aula_presencas com cliente_id = aluno logado).

create table academia_aulas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  descricao text not null default '',
  professor_id uuid references academia_profissionais (id),
  sala text not null default '',
  capacidade integer not null check (capacidade > 0),
  duracao_minutos integer not null default 60 check (duracao_minutos > 0),
  cor text not null default 'violeta',
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table academia_aula_horarios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  aula_id uuid not null references academia_aulas (id) on delete cascade,
  dia_semana integer not null check (dia_semana between 1 and 7),
  hora_inicio time not null,
  ativo boolean not null default true
);

create table academia_turma_alunos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  horario_id uuid not null references academia_aula_horarios (id) on delete cascade,
  cliente_id uuid not null,
  desde date not null,
  ativo boolean not null default true
);

create table academia_aula_presencas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  horario_id uuid not null references academia_aula_horarios (id) on delete cascade,
  cliente_id uuid not null,
  data date not null,
  avulso boolean not null default true, -- false = aluno fixo da turma (só a chamada)
  status text not null default 'reservado' check (status in ('reservado', 'presente', 'faltou', 'cancelado')),
  origem text not null default 'recepcao' check (origem in ('recepcao', 'area_cliente')),
  created_at timestamp with time zone not null default now(),
  unique (horario_id, cliente_id, data)
);

create index academia_aula_presencas_data_idx on academia_aula_presencas (store_id, data);
