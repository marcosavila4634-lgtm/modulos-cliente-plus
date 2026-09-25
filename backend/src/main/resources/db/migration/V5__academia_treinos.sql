-- Módulo Academia: profissionais, biblioteca de exercícios e fichas de treino.
--
-- cliente_id aponta para o cliente (aluno) do Cliente Plus. A chave
-- estrangeira para a tabela real de clientes é criada na migração para o
-- projeto principal (no laboratório: db/cliente-plus-simulado/V6).
--
-- Arquivos (imagens e vídeos dos exercícios) ficam fora do banco; aqui só a
-- URL. No Supabase: bucket de storage (ex.: "academia-exercicios").
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));
-- O aluno (área do cliente) só LÊ a própria ficha ativa e os exercícios dela.

-- Professores e demais profissionais da academia.
create table academia_profissionais (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  especialidade text not null default '',
  telefone text,
  email text,
  registro text,  -- ex.: CREF
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- Biblioteca de exercícios da academia.
create table academia_exercicios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  grupo_muscular text not null
    check (grupo_muscular in ('peito', 'costas', 'ombros', 'biceps', 'triceps', 'pernas', 'gluteos',
                              'panturrilha', 'abdomen', 'cardio', 'corpo_todo', 'alongamento')),
  equipamento text not null default '',
  instrucoes text not null default '',
  imagem_url text,  -- imagem enviada pela academia
  video_url text,   -- vídeo enviado pela academia
  video_link text,  -- link externo (YouTube, Vimeo...)
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create index academia_exercicios_store_idx on academia_exercicios (store_id, grupo_muscular);

-- Ficha de treino. Sem cliente_id = MODELO (reaproveitável); com cliente_id =
-- ficha de um aluno. Cada aluno tem no máximo uma ficha 'ativa'; ao montar uma
-- nova, a anterior vira 'encerrada' (fica no histórico).
create table academia_fichas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid,
  modelo_origem_id uuid references academia_fichas (id) on delete set null,
  nome text not null,
  objetivo text not null default '',
  observacoes text not null default '',
  professor_id uuid references academia_profissionais (id),
  inicio date,
  validade date,
  status text not null default 'ativa' check (status in ('ativa', 'encerrada')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index academia_fichas_cliente_idx on academia_fichas (store_id, cliente_id, status);

-- Divisões da ficha: Treino A, B, C...
create table academia_ficha_treinos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  ficha_id uuid not null references academia_fichas (id) on delete cascade,
  letra text not null,          -- "A", "B", "C"...
  nome text not null default '', -- ex.: "Peito e tríceps"
  ordem integer not null default 0
);

-- Exercícios de cada divisão, na ordem de execução.
create table academia_ficha_exercicios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  treino_id uuid not null references academia_ficha_treinos (id) on delete cascade,
  exercicio_id uuid not null references academia_exercicios (id),
  ordem integer not null default 0,
  series integer,
  repeticoes text not null default '',  -- "10 a 12", "até a falha", "30 s"
  carga text not null default '',       -- "20 kg", "moderada"
  descanso_segundos integer,
  observacao text not null default ''
);
