-- Módulo Grupos VIP: venda de acesso a grupos pagos no Telegram e no WhatsApp.
--
-- Membro = cliente do Cliente Plus; plano = plano do Cliente Plus; assinatura
-- e mensalidades = assinaturas e pagamentos do Cliente Plus (origem
-- 'grupo-vip'). As tabelas abaixo guardam só o que é do módulo. As ligações
-- (FKs) com as tabelas do Cliente Plus ficam em
-- db/cliente-plus-simulado/V19__grupo_vip.sql (no Supabase, apontar para as
-- tabelas reais).
--
-- RLS (Supabase), igual em todas as tabelas abaixo:
--   alter table <tabela> enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on <tabela>
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));
-- Exceções anotadas em cada tabela (página de vendas pública e área do membro
-- passam por Edge Functions com service role, nunca direto pelo navegador).

-- Dados do negócio, página de vendas, Pix e robô do Telegram (1 linha por loja).
-- telegram_bot_token é SEGREDO: no Supabase, guardar em uma tabela/coluna que
-- só a Edge Function (service role) lê; o painel só vê se está configurado.
create table grupo_vip_config (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null unique,
  nome_negocio text not null,
  slug text not null unique,               -- página de vendas: /g/<slug> (pública)
  descricao_pagina text not null default '',
  beneficios text not null default '',     -- um benefício por linha (página de vendas)
  foto_capa text,
  gestor_nome text not null,
  gestor_sobrenome text not null default '',
  gestor_cargo text not null default 'Administrador',
  frase text not null default '',
  frase_destaque text not null default '',
  tolerancia_dias integer not null default 3 check (tolerancia_dias between 0 and 60),
  chave_pix text,
  nome_recebedor text,                     -- nome que aparece no Pix (até 25 letras)
  cidade_recebedor text,                   -- cidade do Pix (até 15 letras)
  whatsapp_suporte text,                   -- só números, com DDD
  telegram_bot_token text,
  telegram_bot_usuario text,               -- @ do robô, preenchido ao conectar
  telegram_ultimo_update bigint not null default 0,
  telegram_dono_id bigint,                 -- Telegram do dono (recebe as mensagens de apoio da cópia entre grupos)
  telegram_dono_codigo text,               -- código do link que liga o Telegram do dono (/start dono_<codigo>)
  google_api_key text,                     -- SEGREDO: chave do Google para ler pastas públicas do Drive (Biblioteca)
  google_conta_servico text,               -- SEGREDO: arquivo JSON da conta de serviço do Google (lê pastas PRIVADAS do Drive)
  completar_livros boolean not null default true, -- busca autor, gênero, capa e resumo dos livros no Google Books
  biblioteca_tipo text not null default 'livros' check (biblioteca_tipo in ('livros', 'materiais')), -- livros (autor, gênero, Google Books) ou materiais (apostilas, vídeos, áudios, planilhas...)
  atrasado_somente_leitura boolean not null default false, -- Telegram: quem está atrasado (dentro da tolerância) só lê os grupos
  created_at timestamp with time zone not null default now()
);

-- Grupos vendidos. Modo automático (Telegram): o robô é administrador do grupo
-- e telegram_chat_id está preenchido. Modo assistido (WhatsApp, ou Telegram
-- sem robô): o dono coloca/tira as pessoas e o sistema mostra a lista.
create table grupo_vip_grupos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  descricao text not null default '',
  plataforma text not null check (plataforma in ('telegram', 'whatsapp')),
  cor text not null default 'blue' check (cor in ('blue', 'sky', 'violet', 'indigo', 'amber')),
  link_convite text,                       -- link fixo do grupo (modo assistido)
  telegram_chat_id text,                   -- ex.: -1001234567890 (modo automático)
  ativo boolean not null default true,
  -- Controle do grupo pelo robô (só Telegram automático; ver GestaoTelegram.java)
  proteger_conteudo boolean not null default true, -- posts do robô não podem ser encaminhados/salvos
  moderar_links boolean not null default false,    -- apaga links enviados por quem não é admin
  palavras_proibidas text not null default '',     -- uma por linha: mensagem com elas é apagada
  silenciar_minutos integer not null default 0 check (silenciar_minutos between 0 and 10080), -- 0 = só apaga
  boas_vindas_grupo text,                  -- mensagem no grupo quando alguém entra ({nome}); vazio = não manda
  apagar_avisos_entrada boolean not null default false, -- apaga "fulano entrou/saiu"
  travado boolean not null default false,  -- só administradores podem escrever
  trava_inicio time,                       -- trava automática por horário (ex.: 22:00 até 07:00)
  trava_fim time,
  trava_horario_estado boolean,            -- último estado aplicado pelo horário (evita repetir)
  created_at timestamp with time zone not null default now()
);

-- Tópicos de grupos do Telegram no modo "fórum". Criados pelo painel ou
-- encontrados pelo robô quando alguém cria um tópico no próprio Telegram.
create table grupo_vip_telegram_topicos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  nome text not null,
  thread_id bigint not null,               -- message_thread_id no Telegram
  created_at timestamp with time zone not null default now(),
  unique (grupo_id, thread_id)
);

-- Quais grupos cada plano do Cliente Plus libera (um plano pode liberar vários).
-- permissao: o que quem assina o plano pode fazer no grupo (só Telegram com o
-- robô): completo | sem_midia (só texto) | leitura (só lê)
create table grupo_vip_plano_grupos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  plano_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  permissao text not null default 'completo' check (permissao in ('completo', 'sem_midia', 'leitura')),
  unique (plano_id, grupo_id)
);

-- Dados do cliente que são só deste módulo.
-- codigo: link de indicação (/g/<slug>?ref=<codigo>) e acesso à área do membro.
create table grupo_vip_membros (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null unique,
  codigo text not null unique,
  telegram_usuario text,                   -- @usuario, sem o @
  telegram_id bigint,                      -- preenchido quando a pessoa fala com o robô
  bloqueado boolean not null default false, -- bloqueio manual (perde o acesso mesmo pagando)
  observacoes text not null default '',
  origem text not null default 'manual' check (origem in ('manual', 'pagina')),
  created_at timestamp with time zone not null default now()
);

-- Situação de cada membro em cada grupo.
--   convidado = link de entrada enviado, ainda não entrou
--   no_grupo  = está no grupo
--   removido  = foi tirado (ou saiu)
-- "Precisa entrar" e "precisa sair" são calculados comparando isto com o
-- pagamento (ver ControleAcesso.java).
create table grupo_vip_acessos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  cliente_id uuid not null,
  status text not null check (status in ('convidado', 'no_grupo', 'removido')),
  convite_link text,
  convite_criado_em timestamp with time zone,
  entrou_em timestamp with time zone,
  removido_em timestamp with time zone,
  atualizado_em timestamp with time zone not null default now(),
  unique (grupo_id, cliente_id)
);

-- Histórico de entradas e saídas (ficha do membro e relatórios).
create table grupo_vip_acesso_eventos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  cliente_id uuid not null,
  acao text not null check (acao in ('convite', 'entrou', 'removido', 'recusado')),
  automatico boolean not null default false,
  detalhe text not null default '',
  momento timestamp with time zone not null default now()
);

create index grupo_vip_acesso_eventos_store_idx on grupo_vip_acesso_eventos (store_id, momento);

-- Mensagens automáticas (textos editáveis). dias = quando enviar:
--   lembrete: dias ANTES do vencimento; vencido/remocao: dias DEPOIS;
--   reconquista: dias depois de perder o acesso; live: minutos antes (ver
--   grupo_vip_eventos.aviso_minutos); boas_vindas/aniversario: não usam.
create table grupo_vip_automacoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  tipo text not null
    check (tipo in ('boas_vindas', 'lembrete', 'vencido', 'remocao', 'reconquista', 'aniversario', 'live')),
  ativa boolean not null default true,
  dias integer not null default 0,
  texto text not null,
  unique (store_id, tipo)
);

-- Caixa de saída: toda mensagem para um membro passa por aqui.
-- Telegram: o robô envia sozinho (se a pessoa já falou com o robô).
-- WhatsApp: fica "pendente" e o dono envia com 1 toque (abre o WhatsApp).
-- chave evita mandar a mesma mensagem automática duas vezes.
create table grupo_vip_mensagens (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  tipo text not null,                      -- tipo da automação, 'anuncio', 'convite' ou 'manual'
  canal text not null check (canal in ('telegram', 'whatsapp')),
  texto text not null,
  status text not null default 'pendente' check (status in ('pendente', 'enviada', 'falhou', 'descartada')),
  erro text,
  chave text,
  criada_em timestamp with time zone not null default now(),
  enviada_em timestamp with time zone,
  unique (store_id, chave)
);

create index grupo_vip_mensagens_store_status_idx on grupo_vip_mensagens (store_id, status);

create table grupo_vip_categorias (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  nome text not null,
  cor text not null default 'orange' check (cor in ('orange', 'sky', 'violet', 'emerald', 'rose', 'amber')),
  created_at timestamp with time zone not null default now()
);

-- Conteúdos: publicados nos grupos (robô no Telegram; no WhatsApp o dono
-- publica e marca) e/ou guardados na biblioteca da área do membro.
create table grupo_vip_conteudos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  categoria_id uuid references grupo_vip_categorias (id) on delete set null,
  titulo text not null,
  texto text not null default '',
  midia_url text,
  midia_tipo text check (midia_tipo in ('imagem', 'video')),
  link text,
  botao_texto text,                        -- com link: vira botão no post do Telegram (ex.: "Assistir aula")
  fixar boolean not null default false,    -- fixa o post no topo dos grupos do Telegram
  status text not null default 'rascunho' check (status in ('rascunho', 'agendado', 'publicado')),
  agendado_para timestamp with time zone,
  publicado_em timestamp with time zone,
  na_area_membro boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- Em quais grupos cada conteúdo é publicado e como foi.
--   manual = WhatsApp (ou Telegram sem robô): o dono publica e marca como enviado
--   apagado = o post foi apagado do grupo pelo painel
create table grupo_vip_conteudo_grupos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  conteudo_id uuid not null references grupo_vip_conteudos (id) on delete cascade,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  topico_id uuid references grupo_vip_telegram_topicos (id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'manual', 'falhou', 'apagado')),
  erro text,
  telegram_message_id bigint,              -- para editar, fixar e apagar o post depois
  fixado boolean not null default false,
  enviado_em timestamp with time zone,
  unique (conteudo_id, grupo_id)
);

-- Cada vez que um membro abre um conteúdo na área do membro.
-- RLS: o membro insere só as próprias visualizações (via Edge Function).
create table grupo_vip_conteudo_views (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  conteudo_id uuid not null references grupo_vip_conteudos (id) on delete cascade,
  cliente_id uuid not null,
  visto_em timestamp with time zone not null default now()
);

create index grupo_vip_conteudo_views_store_idx on grupo_vip_conteudo_views (store_id, visto_em);

-- Lives e eventos. grupo_id vazio = para todos os grupos.
create table grupo_vip_eventos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid references grupo_vip_grupos (id) on delete set null,
  titulo text not null,
  descricao text not null default '',
  foto text,
  link text,
  comeca_em timestamp with time zone not null,
  duracao_minutos integer not null default 60 check (duracao_minutos > 0),
  aviso_minutos integer not null default 60 check (aviso_minutos >= 0),
  avisado_em timestamp with time zone,
  cancelado boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Anúncios: mensagem para um público de membros (vai pela caixa de saída).
--   publico: todos | em_dia | atrasados | sem_acesso | plano | grupo | novos
--   publico_ref: id do plano ou do grupo, quando for o caso
create table grupo_vip_anuncios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  titulo text not null,
  texto text not null,
  tipo text not null default 'conteudo' check (tipo in ('conteudo', 'manutencao', 'live', 'material', 'promocao')),
  publico text not null,
  publico_ref uuid,
  destinatarios integer not null default 0,
  postado_nos_grupos boolean not null default false,
  enviado_em timestamp with time zone not null default now()
);

create table grupo_vip_cupons (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  codigo text not null,
  tipo text not null check (tipo in ('percentual', 'valor')),
  valor numeric(10, 2) not null check (valor > 0),
  validade date,
  limite_usos integer,
  usos integer not null default 0,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  unique (store_id, codigo)
);

-- Compras feitas pela página de vendas (de onde veio cada membro).
create table grupo_vip_checkouts (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  plano_id uuid not null,
  pagamento_id uuid not null,
  cupom_id uuid references grupo_vip_cupons (id),
  preco numeric(10, 2) not null,
  desconto numeric(10, 2) not null default 0,
  indicado_por_codigo text,
  created_at timestamp with time zone not null default now()
);

-- Suporte: conversas entre membro e equipe.
create table grupo_vip_chamados (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  assunto text not null,
  status text not null default 'aberto' check (status in ('aberto', 'respondido', 'resolvido')),
  origem text not null default 'area' check (origem in ('area', 'telegram')), -- área do membro ou conversa com o robô
  created_at timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now()
);

create table grupo_vip_chamado_mensagens (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  chamado_id uuid not null references grupo_vip_chamados (id) on delete cascade,
  autor text not null check (autor in ('membro', 'equipe')),
  texto text not null,
  created_at timestamp with time zone not null default now()
);

-- Enquetes e quiz enviados pelo robô nos grupos do Telegram.
--   opcoes: uma por linha (2 a 10)
--   correta: posição (0, 1, 2...) da resposta certa no quiz
create table grupo_vip_enquetes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  pergunta text not null,
  opcoes text not null,
  tipo text not null default 'enquete' check (tipo in ('enquete', 'quiz')),
  correta integer,
  explicacao text,
  anonima boolean not null default true,
  multipla boolean not null default false,
  encerrada boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Cada envio de uma enquete a um grupo. votos: quantidade por opção, na
-- ordem das opções, separadas por ";" (o robô atualiza a cada voto).
create table grupo_vip_enquete_envios (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  enquete_id uuid not null references grupo_vip_enquetes (id) on delete cascade,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  topico_id uuid references grupo_vip_telegram_topicos (id) on delete set null,
  status text not null check (status in ('enviada', 'falhou', 'encerrada')),
  erro text,
  telegram_message_id bigint,
  telegram_poll_id text,
  votos text not null default '',
  total_votos integer not null default 0,
  enviada_em timestamp with time zone not null default now()
);

-- Histórico da moderação automática (mensagens apagadas pelo robô).
create table grupo_vip_moderacao (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  telegram_usuario_id bigint not null,
  nome text not null,
  motivo text not null check (motivo in ('link', 'palavra')),
  detalhe text not null default '',
  texto text not null default '',
  silenciado_ate timestamp with time zone,
  momento timestamp with time zone not null default now()
);

create index grupo_vip_moderacao_store_idx on grupo_vip_moderacao (store_id, momento);

-- Biblioteca: livros (arquivos) de um grupo. Os membros com acesso ao grupo
-- pedem ao robô no privado (/livro <nome>) e recebem o arquivo; os envios em
-- massa também postam os livros no próprio grupo.
--   origem drive: arquivo lido de uma pasta pública do Google Drive (drive_id)
--   origem telegram: copiado de outro grupo (md5 = "tg:<file_unique_id>")
--   origem computador: arquivo enviado pelo painel (arquivo_url = nome do arquivo
--     guardado em data/livros, fora da pasta pública; no Supabase: Storage privado)
--   md5: evita o mesmo livro duas vezes no mesmo grupo
--   telegram_file_id: guardado no 1º envio; depois o robô reenvia sem subir de novo
create table grupo_vip_livros (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  titulo text not null,
  arquivo_nome text not null,
  tamanho bigint not null default 0,       -- bytes
  origem text not null check (origem in ('drive', 'computador', 'telegram')),
  drive_id text,
  arquivo_url text,
  md5 text,
  telegram_file_id text,
  pedidos integer not null default 0,
  -- Dados do livro (busca por autor, categoria e gênero no robô). categoria =
  -- subpasta do Drive; autor/título também saem do nome do arquivo ("Autor -
  -- Título"); o resto vem do Google Books (Catalogador.java).
  --   dados_status: pendente (ainda não buscou) | ok | nao_encontrado | manual (o dono editou)
  autor text,
  categoria text,
  genero text,
  sinopse text,
  capa_url text,
  ano integer,
  dados_status text not null default 'pendente' check (dados_status in ('pendente', 'ok', 'nao_encontrado', 'manual')),
  created_at timestamp with time zone not null default now(),
  unique (grupo_id, md5)
);

create index grupo_vip_livros_grupo_idx on grupo_vip_livros (grupo_id, titulo);

-- Envio em massa: uma pasta do Drive, arquivos do computador ou o acervo de
-- outro grupo do Telegram (origem telegram: o robô lê as mensagens do grupo
-- de origem da varredura_de até a varredura_ate e copia arquivos e mídias).
--   postar_no_grupo = false: só entra na biblioteca do robô
--   status: recebendo (arquivos do computador chegando) | listando | enviando |
--           pausada | concluida | falhou
--   proximo_em: o robô respeita o limite do Telegram (~20 arquivos por minuto)
create table grupo_vip_importacoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  topico_id uuid references grupo_vip_telegram_topicos (id) on delete set null,
  origem text not null check (origem in ('drive', 'computador', 'telegram')),
  origem_grupo_id uuid references grupo_vip_grupos (id) on delete cascade,
  copiar_midias boolean not null default false, -- telegram: também fotos, vídeos e áudios
  varredura_de bigint,
  varredura_ate bigint,
  varredura_atual bigint,
  protegidas integer not null default 0,   -- mensagens que o Telegram não deixou copiar
  pasta_url text,
  pasta_nome text,
  postar_no_grupo boolean not null default true,
  status text not null check (status in ('recebendo', 'listando', 'enviando', 'pausada', 'concluida', 'falhou')),
  erro text,
  proximo_em timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  concluida_em timestamp with time zone
);

-- Cada arquivo de um envio em massa.
--   pulado = já estava no grupo; grande_demais = acima de 50 MB (limite do robô)
create table grupo_vip_importacao_itens (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  importacao_id uuid not null references grupo_vip_importacoes (id) on delete cascade,
  livro_id uuid references grupo_vip_livros (id) on delete set null,
  origem_mensagem_id bigint,               -- telegram: mensagem no grupo de origem (copiada com copyMessage)
  arquivo_nome text not null,
  tamanho bigint not null default 0,
  ordem integer not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'enviado', 'pulado', 'grande_demais', 'falhou')),
  erro text,
  telegram_message_id bigint,              -- post no grupo (para apagar junto com o livro)
  enviado_em timestamp with time zone
);

create index grupo_vip_importacao_itens_idx on grupo_vip_importacao_itens (importacao_id, status, ordem);

-- Livros pedidos ao robô (mais pedidos e limite por dia).
create table grupo_vip_livro_pedidos (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  livro_id uuid not null references grupo_vip_livros (id) on delete cascade,
  cliente_id uuid not null,
  momento timestamp with time zone not null default now()
);

create index grupo_vip_livro_pedidos_idx on grupo_vip_livro_pedidos (store_id, cliente_id, momento);

-- Links temporários para ler ou baixar um livro (os que não vão como arquivo
-- pelo Telegram, ex.: acima de 50 MB). Cada link é de UMA pessoa e expira;
-- na hora do clique o sistema confere se ela ainda tem acesso ao livro (quem
-- cancelou ou passou da tolerância não abre mais). O endereço do Drive nunca
-- aparece: o sistema busca o arquivo e entrega.
-- RLS: só a Edge Function (service role) usa.
create table grupo_vip_livro_links (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  token text not null unique,
  livro_id uuid not null references grupo_vip_livros (id) on delete cascade,
  cliente_id uuid not null,
  expira_em timestamp with time zone not null,
  aberturas integer not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Livros que os membros pediram para adicionar (menu do robô › Sugerir um
-- livro). Quando o livro entra na biblioteca, o robô avisa quem pediu.
--   status: pendente | adicionado | recusado
create table grupo_vip_livro_sugestoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  titulo text not null,
  autor text,
  status text not null default 'pendente' check (status in ('pendente', 'adicionado', 'recusado')),
  livro_id uuid references grupo_vip_livros (id) on delete set null,
  created_at timestamp with time zone not null default now(),
  respondida_em timestamp with time zone
);

create index grupo_vip_livro_sugestoes_idx on grupo_vip_livro_sugestoes (store_id, status);

-- Em que passo do menu cada pessoa está na conversa com o robô (privado).
--   etapa: o que o robô espera a pessoa escrever (busca_nome | busca_autor |
--          sugestao | suporte); vale por alguns minutos
--   lista: última lista de livros mostrada, para as páginas (ex.: "autor|machado")
-- RLS: só a Edge Function do robô (service role) usa.
create table grupo_vip_robo_conversas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  telegram_id bigint not null,
  etapa text,
  lista text,
  atualizado_em timestamp with time zone not null default now(),
  unique (store_id, telegram_id)
);

-- Permissões de cada membro em cada grupo do Telegram com o robô.
-- Sem linha (ou nivel null) = segue o plano (grupo_vip_plano_grupos.permissao).
--   nivel: completo | sem_midia | leitura (escolhido pelo dono); nivel_ate = até quando
--   administrador + direitos (lista separada por vírgula, nomes da API do
--   Telegram, ex.: can_delete_messages) + titulo (aparece ao lado do nome)
--   aplicado: o que o robô já aplicou no Telegram (evita repetir); tentado_em
--   e erro: última tentativa
create table grupo_vip_permissoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  grupo_id uuid not null references grupo_vip_grupos (id) on delete cascade,
  cliente_id uuid not null,
  nivel text check (nivel in ('completo', 'sem_midia', 'leitura')),
  nivel_ate timestamp with time zone,
  administrador boolean not null default false,
  direitos text not null default '',
  titulo text,
  aplicado text,
  tentado_em timestamp with time zone,
  erro text,
  unique (grupo_id, cliente_id)
);
