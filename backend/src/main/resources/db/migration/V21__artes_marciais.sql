-- Módulo Artes Marciais ("Gestão Plus Artes Marciais").
--
-- O módulo usa TUDO do módulo Academia (alunos, matrículas, check-in, aulas,
-- agenda, avaliação física, financeiro, benefícios, relatórios, página) e
-- acrescenta aqui só o que é de luta: modalidades, faixas e graduações,
-- exames de faixa, currículo, eventos e campeonatos, filiações, loja de
-- uniformes, equipamentos, responsáveis dos alunos kids e comunicação.
--
-- cliente_id / pagamento_id apontam para o Cliente Plus (FKs em
-- cliente-plus-simulado/V22 no laboratório). Taxas de exame, inscrições e
-- vendas da loja viram pagamentos avulsos (origem 'artes-marciais') e, depois
-- de pagos, entram no motor de comissões do Cliente Plus.
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));
-- Área do aluno e do responsável: policies extras de leitura com
-- cliente_id = aluno logado (ou dependente do responsável logado); o aluno
-- cria/cancela só as PRÓPRIAS inscrições em eventos.
-- Presença pelo QR Code (sem login): Edge Function com service role.

-- Ajustes do módulo (uma linha por loja).
create table artes_marciais_config (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null unique,
  -- o que conta como "aula" para os requisitos de faixa:
  --   'aulas'    = presença marcada nas aulas da modalidade (chamada ou QR)
  --   'checkins' = dias com entrada na academia (check-in)
  contar_aulas_por text not null default 'aulas' check (contar_aulas_por in ('aulas', 'checkins')),
  -- até que idade o aluno usa as faixas infantis (kids)
  idade_adulto integer not null default 16 check (idade_adulto between 4 and 21),
  -- frase do rodapé do painel
  lema text not null default 'Respeito · Disciplina · Evolução · Pessoas mais fortes',
  -- código do QR Code de presença (a página /presenca/<codigo>)
  codigo_presenca text not null unique,
  updated_at timestamp with time zone not null default now()
);

create table artes_marciais_modalidades (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  cor text not null default '#ef4444',  -- cor da modalidade nos gráficos (hex)
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- Faixas (ou níveis/graduações) de cada modalidade, em ordem.
-- Os requisitos valem para SAIR desta faixa (ir para a próxima);
-- idade_minima vale para RECEBER esta faixa.
create table artes_marciais_faixas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  modalidade_id uuid not null references artes_marciais_modalidades (id) on delete cascade,
  nome text not null,
  cor text not null,                   -- cor principal (hex)
  cor_ponta text,                      -- listra do meio (faixas kids) / ponta (hex)
  publico text not null default 'todos' check (publico in ('adulto', 'infantil', 'todos')),
  ordem integer not null,
  graus_maximos integer not null default 4 check (graus_maximos between 0 and 10),
  meses_minimos integer not null default 0 check (meses_minimos >= 0),
  aulas_minimas integer not null default 0 check (aulas_minimas >= 0),
  aulas_por_grau integer not null default 0 check (aulas_por_grau >= 0), -- 0 = graus sem controle de aulas
  idade_minima integer check (idade_minima between 0 and 99),
  taxa_exame numeric(10, 2) not null default 0 check (taxa_exame >= 0),
  ativo boolean not null default true
);

create index artes_marciais_faixas_modalidade_idx on artes_marciais_faixas (modalidade_id, ordem);

-- Aula (do módulo Academia) de cada modalidade. Presenças nessas aulas contam
-- para a faixa do aluno naquela modalidade.
create table artes_marciais_aula_modalidades (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  aula_id uuid not null unique references academia_aulas (id) on delete cascade,
  modalidade_id uuid not null references artes_marciais_modalidades (id) on delete cascade,
  publico text not null default 'todos' check (publico in ('adulto', 'infantil', 'todos'))
);

-- Aluno em uma modalidade: faixa e grau atuais.
-- faixa_desde = dia em que recebeu a faixa atual; grau_desde = último grau
-- (ou a faixa, se ainda não tem grau). As aulas contam a partir dessas datas.
create table artes_marciais_alunos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  modalidade_id uuid not null references artes_marciais_modalidades (id) on delete cascade,
  faixa_id uuid not null references artes_marciais_faixas (id),
  grau integer not null default 0 check (grau >= 0),
  inicio date not null,
  faixa_desde date not null,
  grau_desde date not null,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  unique (cliente_id, modalidade_id)
);

create index artes_marciais_alunos_store_idx on artes_marciais_alunos (store_id, modalidade_id);

create table artes_marciais_exames (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  modalidade_id uuid not null references artes_marciais_modalidades (id),
  titulo text not null,
  data date not null,
  hora time,
  local text not null default '',
  banca text not null default '',      -- professores que avaliam
  status text not null default 'agendado' check (status in ('agendado', 'realizado', 'cancelado')),
  observacao text not null default '',
  created_at timestamp with time zone not null default now()
);

-- Histórico de graduações (cada linha = um certificado).
create table artes_marciais_graduacoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  modalidade_id uuid not null references artes_marciais_modalidades (id),
  tipo text not null check (tipo in ('inicial', 'faixa', 'grau')),
  faixa_id uuid not null references artes_marciais_faixas (id),
  grau integer not null default 0,
  faixa_anterior_id uuid references artes_marciais_faixas (id),
  grau_anterior integer,
  data date not null,
  professor_id uuid references academia_profissionais (id),
  exame_id uuid references artes_marciais_exames (id),
  observacao text not null default '',
  codigo text not null unique,          -- confere o certificado em /certificado/<codigo>
  created_at timestamp with time zone not null default now()
);

create index artes_marciais_graduacoes_cliente_idx on artes_marciais_graduacoes (store_id, cliente_id, data);

-- Candidatos de um exame. A taxa vira um pagamento avulso do Cliente Plus.
create table artes_marciais_exame_candidatos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  exame_id uuid not null references artes_marciais_exames (id) on delete cascade,
  cliente_id uuid not null,
  faixa_id uuid not null references artes_marciais_faixas (id), -- faixa pretendida
  grau integer not null default 0,
  pagamento_id uuid,
  resultado text not null default 'pendente' check (resultado in ('pendente', 'aprovado', 'reprovado')),
  observacao text not null default '',
  graduacao_id uuid references artes_marciais_graduacoes (id),
  unique (exame_id, cliente_id)
);

-- Currículo: o que se aprende em cada faixa (aparece para o aluno).
create table artes_marciais_tecnicas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  modalidade_id uuid not null references artes_marciais_modalidades (id) on delete cascade,
  faixa_id uuid not null references artes_marciais_faixas (id) on delete cascade,
  categoria text not null default '',
  nome text not null,
  descricao text not null default '',
  video_url text not null default '',
  ordem integer not null default 0
);

-- Eventos: campeonatos (da academia ou de fora), seminários, aulões...
-- As categorias ficam em texto (idade/faixa/peso) para o futuro organizador
-- de torneios aproveitar.
create table artes_marciais_eventos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  tipo text not null check (tipo in ('campeonato', 'seminario', 'aulao', 'confraternizacao', 'outro')),
  nome text not null,
  descricao text not null default '',
  modalidade_id uuid references artes_marciais_modalidades (id),
  data date not null,
  hora time,
  local text not null default '',
  organizador text not null default '',     -- vazio = a própria academia
  valor_inscricao numeric(10, 2) not null default 0 check (valor_inscricao >= 0),
  vagas integer check (vagas > 0),
  inscricoes_ate date,
  participa_indicacoes boolean not null default false, -- inscrição gera comissão de indicação?
  aberto_no_app boolean not null default true,         -- aluno se inscreve pela área do aluno
  status text not null default 'ativo' check (status in ('ativo', 'cancelado')),
  created_at timestamp with time zone not null default now()
);

create table artes_marciais_inscricoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  evento_id uuid not null references artes_marciais_eventos (id) on delete cascade,
  cliente_id uuid not null,
  categoria text not null default '',
  faixa text not null default '',        -- faixa no dia da inscrição
  peso numeric(5, 2),
  pagamento_id uuid,
  resultado text check (resultado in ('ouro', 'prata', 'bronze', 'participou')),
  origem text not null default 'recepcao' check (origem in ('recepcao', 'area_aluno')),
  status text not null default 'inscrito' check (status in ('inscrito', 'cancelado')),
  created_at timestamp with time zone not null default now(),
  unique (evento_id, cliente_id)
);

-- Filiação do aluno a federação/confederação (CBJJ, FPJJ, CBJ...).
create table artes_marciais_filiacoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  entidade text not null,
  numero text not null default '',
  validade date not null,
  observacao text not null default '',
  created_at timestamp with time zone not null default now()
);

-- Loja: uniformes e equipamentos vendidos aos alunos.
create table artes_marciais_produtos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  categoria text not null default 'outro'
    check (categoria in ('kimono', 'faixa', 'rashguard', 'bermuda', 'luvas', 'protecao', 'camiseta', 'acessorio', 'outro')),
  descricao text not null default '',
  preco numeric(10, 2) not null check (preco >= 0),
  custo numeric(10, 2) not null default 0 check (custo >= 0),
  foto text not null default '',
  participa_indicacoes boolean not null default false,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table artes_marciais_produto_tamanhos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  produto_id uuid not null references artes_marciais_produtos (id) on delete cascade,
  tamanho text not null,
  estoque integer not null default 0,
  estoque_minimo integer not null default 1 check (estoque_minimo >= 0),
  ordem integer not null default 0,
  unique (produto_id, tamanho)
);

-- Venda da loja a um aluno. Gera um pagamento avulso no Cliente Plus.
create table artes_marciais_vendas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  pagamento_id uuid not null,
  total numeric(10, 2) not null,
  status text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  entregue boolean not null default true,
  observacao text not null default '',
  created_at timestamp with time zone not null default now()
);

create table artes_marciais_venda_itens (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  venda_id uuid not null references artes_marciais_vendas (id) on delete cascade,
  produto_id uuid not null references artes_marciais_produtos (id),
  tamanho_id uuid references artes_marciais_produto_tamanhos (id),
  nome text not null,
  tamanho text not null default '',
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10, 2) not null
);

-- Entradas e saídas do estoque (histórico).
create table artes_marciais_estoque_movimentos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  tamanho_id uuid not null references artes_marciais_produto_tamanhos (id) on delete cascade,
  quantidade integer not null,          -- positivo = entrou, negativo = saiu
  motivo text not null check (motivo in ('entrada', 'venda', 'cancelamento', 'ajuste')),
  observacao text not null default '',
  created_at timestamp with time zone not null default now()
);

-- Equipamentos da academia (tatames, sacos, luvas coletivas...).
create table artes_marciais_equipamentos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  categoria text not null default 'outro'
    check (categoria in ('tatame', 'saco', 'luvas', 'protecao', 'aparador', 'manequim', 'som_video', 'outro')),
  quantidade integer not null default 1 check (quantidade >= 0),
  local text not null default '',
  estado text not null default 'bom' check (estado in ('bom', 'atencao', 'manutencao', 'inativo')),
  -- de quantos em quantos dias precisa de revisão (vazio = não controla)
  intervalo_manutencao_dias integer check (intervalo_manutencao_dias > 0),
  ultima_manutencao date,
  aquisicao date,
  valor numeric(10, 2),
  observacao text not null default '',
  created_at timestamp with time zone not null default now()
);

-- Manutenção feita. Com custo, vira uma despesa (categoria "manutencao").
create table artes_marciais_manutencoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  equipamento_id uuid not null references artes_marciais_equipamentos (id) on delete cascade,
  data date not null,
  descricao text not null,
  custo numeric(10, 2),
  despesa_id uuid references academia_despesas (id),
  created_at timestamp with time zone not null default now()
);

-- Responsáveis pelos alunos menores (kids). O código abre a área do
-- responsável (/responsavel/<codigo>), com todos os filhos.
create table artes_marciais_responsaveis (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  telefone text,
  email text,
  cpf text,
  codigo text not null unique,
  created_at timestamp with time zone not null default now()
);

create table artes_marciais_dependentes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  responsavel_id uuid not null references artes_marciais_responsaveis (id) on delete cascade,
  cliente_id uuid not null,
  parentesco text not null default 'responsável',
  unique (responsavel_id, cliente_id)
);

-- Comunicados: avisos por WhatsApp (a recepção toca "Enviar" em cada um) e/ou
-- no mural da área do aluno.
create table artes_marciais_comunicados (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  titulo text not null,
  texto text not null,
  publico text not null
    check (publico in ('todos', 'modalidade', 'faixa', 'aula', 'inadimplentes', 'aniversariantes', 'kids', 'sem_frequencia')),
  filtro_id uuid,                       -- modalidade, faixa ou aula escolhida
  whatsapp boolean not null default true,
  mural boolean not null default true,
  mural_ate date,                       -- some do mural depois deste dia
  created_at timestamp with time zone not null default now()
);

create table artes_marciais_comunicado_envios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  comunicado_id uuid not null references artes_marciais_comunicados (id) on delete cascade,
  cliente_id uuid not null,
  nome text not null,                   -- para quem vai (o responsável, no caso dos kids)
  telefone text,
  texto text not null,                  -- já com {nome}, {faixa}... trocados
  enviado_em timestamp with time zone
);
