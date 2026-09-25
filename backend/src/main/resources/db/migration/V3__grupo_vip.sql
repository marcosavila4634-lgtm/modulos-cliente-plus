-- Módulo Grupos VIP: grupos pagos no Telegram e no WhatsApp.
-- Tabelas que alimentam o Dashboard (GET /api/grupo-vip/dashboard).
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));

-- Cabeçalho do painel: grupo em destaque, gestor, frases e notificações.
create table grupo_vip_painel (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null unique,
  nome_grupo_atual text not null,
  gestor_nome text not null,
  gestor_sobrenome text not null default '',
  gestor_cargo text not null,
  frase text not null default '',
  frase_destaque text not null default '',
  notificacoes integer not null default 0
);

-- Indicadores do topo. novos_este_mes e ticket_medio só usam "valor".
create table grupo_vip_indicadores (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  chave text not null
    check (chave in ('membros_ativos', 'conteudos_publicados', 'visualizacoes', 'receita_mes',
                     'novos_este_mes', 'ticket_medio')),
  valor numeric(12, 2) not null,
  variacao numeric(6, 2),
  mes_anterior numeric(12, 2),
  unique (store_id, chave)
);

-- Grupos vendidos, cada um no Telegram ou no WhatsApp.
create table grupo_vip_grupos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  plataforma text not null check (plataforma in ('telegram', 'whatsapp')),
  membros integer not null default 0,
  cor text not null default 'blue' check (cor in ('blue', 'sky', 'violet', 'indigo', 'amber')),
  created_at timestamp with time zone not null default now()
);

-- Membros que assinaram um plano para entrar em um grupo.
create table grupo_vip_membros (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id),
  nome text not null,
  foto text,
  plano text not null check (plano in ('Básico', 'VIP', 'Premium', 'Cortesia')),
  status text not null default 'pendente' check (status in ('ativo', 'pendente')),
  entrou_em timestamp with time zone not null default now()
);

create index grupo_vip_membros_store_entrou_idx on grupo_vip_membros (store_id, entrou_em);

-- Gráfico "Crescimento de membros": total de membros por mês.
-- mes = primeiro dia do mês; data_referencia = dia da medição, quando o mês
-- ainda está em andamento.
create table grupo_vip_crescimento_mensal (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  mes date not null,
  membros integer not null default 0,
  data_referencia date,
  unique (store_id, mes)
);

-- Conteúdos publicados nos grupos e quantas vezes foram acessados.
create table grupo_vip_conteudos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  titulo text not null,
  acessos integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Gráfico "Planos dos membros": percentual de membros em cada plano.
create table grupo_vip_planos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  percentual_membros integer not null check (percentual_membros between 0 and 100),
  ordem integer not null default 0
);

-- Avisos enviados aos membros.
create table grupo_vip_avisos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  tipo text not null check (tipo in ('conteudo', 'manutencao', 'live', 'material')),
  titulo text not null,
  status text not null default 'enviado' check (status in ('enviado')),
  enviado_em timestamp with time zone not null default now()
);

-- Lives e eventos agendados.
create table grupo_vip_eventos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  titulo text not null,
  foto text,
  status text not null default 'em_breve' check (status in ('ao_vivo', 'em_breve')),
  comeca_em timestamp with time zone not null
);
