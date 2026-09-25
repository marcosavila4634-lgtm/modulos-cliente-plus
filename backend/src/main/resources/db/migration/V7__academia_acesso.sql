-- Módulo Academia: configurações, horário de funcionamento, controle de acesso
-- (check-in manual, catracas e leitores) e bloqueios.
--
-- cliente_id aponta para o cliente (aluno) do Cliente Plus (FK criada na
-- migração para o projeto principal; no laboratório: cliente-plus-simulado).
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));
-- Os dispositivos (catracas) NÃO usam login: chamam uma Edge Function com o
-- token do dispositivo, que grava em academia_acessos com a service role.

-- Configurações da academia (uma linha por loja). Nome, gestor e frase do
-- painel continuam em academia_painel.
create table academia_config (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null unique,
  telefone text,
  email text,
  endereco text,
  cnpj text,
  -- quantas pessoas cabem ao mesmo tempo (base da ocupação nos horários de pico)
  capacidade integer not null default 80 check (capacidade > 0),
  -- controle de acesso
  bloquear_inadimplentes boolean not null default true,
  tolerancia_atraso_dias integer not null default 5 check (tolerancia_atraso_dias >= 0),
  bloquear_fora_do_horario boolean not null default true,
  -- entrada repetida dentro deste intervalo não conta como novo check-in
  intervalo_checkin_minutos integer not null default 60 check (intervalo_checkin_minutos >= 0),
  -- treinos e avaliações
  validade_ficha_semanas integer not null default 8 check (validade_ficha_semanas > 0),
  reavaliacao_dias integer not null default 90 check (reavaliacao_dias > 0),
  updated_at timestamp with time zone not null default now()
);

-- Horário de funcionamento: uma linha por dia da semana
-- (1 = segunda-feira ... 7 = domingo, como no padrão ISO).
create table academia_horarios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  dia_semana integer not null check (dia_semana between 1 and 7),
  abre time,
  fecha time,
  fechado boolean not null default false,
  unique (store_id, dia_semana)
);

-- Catracas, leitores faciais/biométricos e totens de QR code.
-- O token identifica o dispositivo quando ele chama a API de acesso.
create table academia_dispositivos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  tipo text not null check (tipo in ('catraca', 'leitor_facial', 'leitor_biometrico', 'totem_qr')),
  fabricante text not null default '',
  identificador text not null default '', -- número de série / IP
  token text not null unique,
  ativo boolean not null default true,
  ultimo_contato timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- Bloqueio manual do acesso de um aluno (ex.: "atestado pendente").
-- Ativo enquanto removido_em for nulo.
create table academia_bloqueios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  motivo text not null,
  created_at timestamp with time zone not null default now(),
  removido_em timestamp with time zone
);

create index academia_bloqueios_cliente_idx on academia_bloqueios (store_id, cliente_id);

-- Entradas na academia. resultado 'liberado' = check-in. Tentativas
-- bloqueadas vindas de dispositivos também ficam registradas.
-- motivo: por que foi bloqueado ('sem_matricula', 'inadimplente',
-- 'fora_do_horario', 'bloqueio_manual'); num liberado_manual, o bloqueio que
-- a recepção liberou mesmo assim.
create table academia_acessos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  momento timestamp with time zone not null default now(),
  meio text not null
    check (meio in ('recepcao', 'catraca', 'leitor_facial', 'leitor_biometrico', 'totem_qr', 'app')),
  dispositivo_id uuid references academia_dispositivos (id) on delete set null,
  resultado text not null check (resultado in ('liberado', 'bloqueado')),
  motivo text check (motivo in ('sem_matricula', 'inadimplente', 'fora_do_horario', 'bloqueio_manual')),
  liberado_manual boolean not null default false,
  observacao text not null default ''
);

create index academia_acessos_momento_idx on academia_acessos (store_id, momento);
create index academia_acessos_cliente_idx on academia_acessos (store_id, cliente_id, momento);
