-- Dados de exemplo (DEMO) do módulo Grupos VIP. Só do laboratório: usa
-- funções do H2 (dateadd, system_range) e não vai para o Supabase.
-- store_id da loja de exemplo: 22222222-2222-4222-8222-222222222222
-- (o mesmo valor está em grupo-vip.store-id no application.properties).
--
-- Fica depois dos dados da academia (V104 a V110) porque aqueles arquivos
-- procuram clientes pelo nome sem olhar a loja.

insert into grupo_vip_config (store_id, nome_negocio, slug, descricao_pagina, beneficios, foto_capa,
                              gestor_nome, gestor_sobrenome, gestor_cargo, frase, frase_destaque, tolerancia_dias,
                              chave_pix, nome_recebedor, cidade_recebedor, whatsapp_suporte) values
  ('22222222-2222-4222-8222-222222222222', 'Meu Grupo VIP', 'meu-grupo-vip',
   'Análises diárias, conteúdos exclusivos e uma comunidade que cresce junto. Escolha seu plano e entre hoje mesmo nos grupos do Telegram e do WhatsApp.',
   'Sinais e análises todos os dias
Aulas e materiais exclusivos
Lives semanais com perguntas e respostas
Suporte direto com a equipe
Ganhe comissão indicando amigos',
   '/grupo-vip/comunidade.jpg',
   'Fernando', 'Sombra', 'Administrador',
   'Grandes ideias ganham força quando são compartilhadas.',
   'Conhecimento de qualidade cria pessoas extraordinárias.', 3,
   'financeiro@exemplo.com', 'Fernando Sombra', 'Sao Paulo', '11999990000');

insert into cp_programa_indicacao (store_id, nivel1_pct, nivel2_pct, nivel3_pct) values
  ('22222222-2222-4222-8222-222222222222', 10, 5, 2);

-- Grupos. Os do Telegram ficam no modo assistido até o robô ser conectado
-- (Configurações) e o ID de cada grupo ser informado.
insert into grupo_vip_grupos (store_id, nome, descricao, plataforma, cor, link_convite, created_at) values
  ('22222222-2222-4222-8222-222222222222', 'Sinais e Análises', 'Análises e alertas do dia, antes do mercado abrir.', 'telegram', 'blue', null, dateadd('MONTH', -8, now())),
  ('22222222-2222-4222-8222-222222222222', 'Conteúdos Exclusivos', 'Aulas, planilhas e materiais só para membros.', 'telegram', 'sky', null, dateadd('MONTH', -8, now())),
  ('22222222-2222-4222-8222-222222222222', 'Marketing Digital', 'Estratégias de divulgação e vendas.', 'whatsapp', 'violet', 'https://chat.whatsapp.com/ExemploMarketingDigital', dateadd('MONTH', -7, now())),
  ('22222222-2222-4222-8222-222222222222', 'Suporte e Dúvidas', 'Tire suas dúvidas com a equipe.', 'whatsapp', 'indigo', null, dateadd('MONTH', -8, now())),
  ('22222222-2222-4222-8222-222222222222', 'Networking', 'Conexões entre os membros Premium.', 'telegram', 'amber', null, dateadd('MONTH', -6, now())),
  ('22222222-2222-4222-8222-222222222222', 'Mentorias', 'Encontros em grupo com o mentor.', 'whatsapp', 'violet', null, dateadd('MONTH', -5, now()));

insert into cp_planos (store_id, nome, descricao, preco, duracao_meses, participa_indicacoes, created_at) values
  ('22222222-2222-4222-8222-222222222222', 'Básico', 'Sinais diários e suporte', 29.90, 1, true, dateadd('MONTH', -8, now())),
  ('22222222-2222-4222-8222-222222222222', 'VIP', 'Sinais, conteúdos exclusivos, marketing e suporte', 49.90, 1, true, dateadd('MONTH', -8, now())),
  ('22222222-2222-4222-8222-222222222222', 'Premium', 'Todos os grupos, networking e mentorias', 99.90, 1, true, dateadd('MONTH', -8, now())),
  ('22222222-2222-4222-8222-222222222222', 'VIP Trimestral', 'Plano VIP pagando a cada 3 meses (economize 13%)', 129.90, 3, true, dateadd('MONTH', -6, now())),
  ('22222222-2222-4222-8222-222222222222', 'Cortesia', 'Acesso de cortesia (parceiros e convidados)', 0, 1, false, dateadd('MONTH', -8, now()));

create table demo_gv_plano_grupo (plano text, grupo text);
insert into demo_gv_plano_grupo values
  ('Básico', 'Sinais e Análises'), ('Básico', 'Suporte e Dúvidas'),
  ('VIP', 'Sinais e Análises'), ('VIP', 'Conteúdos Exclusivos'), ('VIP', 'Marketing Digital'), ('VIP', 'Suporte e Dúvidas'),
  ('VIP Trimestral', 'Sinais e Análises'), ('VIP Trimestral', 'Conteúdos Exclusivos'),
  ('VIP Trimestral', 'Marketing Digital'), ('VIP Trimestral', 'Suporte e Dúvidas'),
  ('Premium', 'Sinais e Análises'), ('Premium', 'Conteúdos Exclusivos'), ('Premium', 'Marketing Digital'),
  ('Premium', 'Suporte e Dúvidas'), ('Premium', 'Networking'), ('Premium', 'Mentorias'),
  ('Cortesia', 'Conteúdos Exclusivos');

insert into grupo_vip_plano_grupos (store_id, plano_id, grupo_id)
select '22222222-2222-4222-8222-222222222222', p.id, g.id
from demo_gv_plano_grupo d
join cp_planos p on p.nome = d.plano and p.store_id = '22222222-2222-4222-8222-222222222222'
join grupo_vip_grupos g on g.nome = d.grupo and g.store_id = '22222222-2222-4222-8222-222222222222';

drop table demo_gv_plano_grupo;

-- ---------------------------------------------------------------------------
-- Membros com história (usados nos exemplos):
--   pagas       = mensalidades já pagas
--   ajuste_dias = em quantos dias vence a próxima (negativo = atrasada)
-- ---------------------------------------------------------------------------
create table demo_gv_nomeados (nome text, codigo text, telefone text, email text, telegram text, plano text,
                               pagas integer, ajuste_dias integer, forma text, origem text);
insert into demo_gv_nomeados values
  ('Carla Mendes', 'CARLA7K2', '11981112233', 'carla.mendes@email.com', 'carlamendes', 'Premium', 7, 12, 'pix', 'manual'),
  ('Rafael Lima', 'RAFAE3M8', '11982223344', 'rafael.lima@email.com', 'rafalima', 'VIP', 4, 2, 'cartao_credito', 'pagina'),
  ('Juliana Costa', 'JULIA9P4', '11983334455', 'juliana.costa@email.com', null, 'VIP', 3, -2, 'pix', 'pagina'),
  ('Fernanda Alves', 'FERNA5T6', '11984445566', 'fernanda.alves@email.com', 'nandaalves', 'Premium', 5, 20, 'pix', 'manual'),
  ('Bianca Rocha', 'BIANC2W7', '11985556677', 'bianca.rocha@email.com', 'biancarocha', 'VIP', 1, 29, 'pix', 'pagina'),
  ('Thiago Prado', 'THIAG8R3', '11986667788', 'thiago.prado@email.com', null, 'Premium', 1, 30, 'cartao_credito', 'pagina'),
  ('Mateus Oliveira', 'MATEU4H9', '11987778899', 'mateus.oliveira@email.com', null, 'Básico', 0, 0, null, 'pagina'),
  ('Paula Nogueira', 'PAULA6N2', '11988889900', 'paula.nogueira@email.com', null, 'Cortesia', 3, 5, null, 'manual');

insert into cp_clientes (store_id, nome, email, telefone, data_nascimento, created_at)
select '22222222-2222-4222-8222-222222222222', n.nome, n.email, n.telefone,
       case n.nome when 'Rafael Lima' then dateadd('YEAR', -29, current_date) else date '1992-06-15' end,
       now()
from demo_gv_nomeados n;

insert into cp_assinaturas (store_id, cliente_id, plano_id, valor, inicio, created_at)
select c.store_id, c.id, p.id, p.preco,
       dateadd('DAY', n.ajuste_dias, dateadd('MONTH', -n.pagas * p.duracao_meses, current_date)),
       cast(dateadd('DAY', n.ajuste_dias, dateadd('MONTH', -n.pagas * p.duracao_meses, current_date)) as timestamp)
         + interval '9' hour
from demo_gv_nomeados n
join cp_clientes c on c.nome = n.nome and c.store_id = '22222222-2222-4222-8222-222222222222'
join cp_planos p on p.nome = n.plano and p.store_id = '22222222-2222-4222-8222-222222222222';

insert into cp_pagamentos (store_id, assinatura_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento, origem)
select a.store_id, a.id, a.cliente_id, a.valor,
       dateadd('MONTH', r.x * p.duracao_meses, a.inicio), 'pago',
       least(cast(dateadd('MONTH', r.x * p.duracao_meses, a.inicio) as timestamp) + interval '11' hour,
             dateadd('HOUR', -3, localtimestamp)),
       n.forma, 'grupo-vip'
from demo_gv_nomeados n
join cp_clientes c on c.nome = n.nome and c.store_id = '22222222-2222-4222-8222-222222222222'
join cp_assinaturas a on a.cliente_id = c.id
join cp_planos p on p.id = a.plano_id
join system_range(0, 11) as r (x) on r.x < n.pagas;

insert into cp_pagamentos (store_id, assinatura_id, cliente_id, valor, vencimento, status, origem)
select a.store_id, a.id, a.cliente_id, a.valor,
       dateadd('MONTH', n.pagas * p.duracao_meses, a.inicio), 'pendente', 'grupo-vip'
from demo_gv_nomeados n
join cp_clientes c on c.nome = n.nome and c.store_id = '22222222-2222-4222-8222-222222222222'
join cp_assinaturas a on a.cliente_id = c.id
join cp_planos p on p.id = a.plano_id;

insert into grupo_vip_membros (store_id, cliente_id, codigo, telegram_usuario, origem, created_at)
select c.store_id, c.id, n.codigo, n.telegram, n.origem, c.created_at
from demo_gv_nomeados n
join cp_clientes c on c.nome = n.nome and c.store_id = '22222222-2222-4222-8222-222222222222';

-- ---------------------------------------------------------------------------
-- Mais 96 membros gerados, com assinaturas espalhadas pelos últimos 7 meses.
-- ---------------------------------------------------------------------------
create table demo_gv_nomes (i integer, nome text, slug text);
insert into demo_gv_nomes values
  (0, 'Alice', 'alice'), (1, 'Arthur', 'arthur'), (2, 'Beatriz', 'beatriz'), (3, 'Benício', 'benicio'),
  (4, 'Cecília', 'cecilia'), (5, 'Davi', 'davi'), (6, 'Emanuelly', 'emanuelly'), (7, 'Enzo', 'enzo'),
  (8, 'Helena', 'helena'), (9, 'Gael', 'gael'), (10, 'Laura', 'laura'), (11, 'Gustavo', 'gustavo'),
  (12, 'Lívia', 'livia'), (13, 'Joaquim', 'joaquim'), (14, 'Lorena', 'lorena'), (15, 'Lorenzo', 'lorenzo'),
  (16, 'Manuela', 'manuela'), (17, 'Miguel', 'miguel'), (18, 'Olívia', 'olivia'), (19, 'Nicolas', 'nicolas'),
  (20, 'Rebeca', 'rebeca'), (21, 'Pedro', 'pedro'), (22, 'Sophia', 'sophia'), (23, 'Ravi', 'ravi'),
  (24, 'Valentina', 'valentina'), (25, 'Theo', 'theo'), (26, 'Vitória', 'vitoria'), (27, 'Murilo', 'murilo'),
  (28, 'Antonella', 'antonella'), (29, 'Anthony', 'anthony');

create table demo_gv_sobrenomes (i integer, sobrenome text);
insert into demo_gv_sobrenomes values
  (0, 'Almeida'), (1, 'Brito'), (2, 'Coelho'), (3, 'Dantas'), (4, 'Esteves'), (5, 'Fonseca'), (6, 'Galvão'),
  (7, 'Guimarães'), (8, 'Leal'), (9, 'Macedo'), (10, 'Magalhães'), (11, 'Medeiros'), (12, 'Neves'),
  (13, 'Pacheco'), (14, 'Paiva'), (15, 'Queiroz'), (16, 'Rezende'), (17, 'Sampaio'), (18, 'Seixas'),
  (19, 'Toledo'), (20, 'Valente'), (21, 'Viana'), (22, 'Aguiar'), (23, 'Bastos'), (24, 'Castilho'),
  (25, 'Fontes'), (26, 'Lacerda'), (27, 'Prates'), (28, 'Siqueira');

-- x = número do membro gerado (1 a 96).
create table demo_gv (x integer, cliente text, slug text, plano text, inicio date, cancelada date, atrasado boolean);

insert into demo_gv
select r.x, n.nome || ' ' || s.sobrenome, n.slug,
       case mod(r.x, 10) when 4 then 'VIP' when 5 then 'VIP' when 6 then 'VIP' when 7 then 'Premium'
                         when 8 then 'Premium' when 9 then 'VIP Trimestral' else 'Básico' end,
       dateadd('DAY', -(mod(r.x * 37, 205) + 3), current_date),
       -- 1 em cada 8 cancelou (se já estava há mais de 40 dias)
       case when mod(r.x, 8) = 0 and mod(r.x * 37, 205) + 3 > 40
            then dateadd('DAY', -((mod(r.x * 37, 205) + 3) * 2 / 5), current_date) end,
       -- 1 em cada 9 está com a mensalidade atrasada
       mod(r.x, 9) = 0
from system_range(1, 96) as r (x)
join demo_gv_nomes n on n.i = mod(r.x, 30)
join demo_gv_sobrenomes s on s.i = mod(r.x * 7, 29);

insert into cp_clientes (store_id, nome, email, telefone, data_nascimento, created_at)
select '22222222-2222-4222-8222-222222222222', g.cliente,
       g.slug || g.x || '@email.com',
       '219' || lpad(cast(mod(g.x * 6007 + 3456789, 100000000) as varchar), 8, '0'),
       dateadd('DAY', -(6570 + mod(g.x * 263, 9000)), current_date),
       dateadd('DAY', -mod(g.x, 20), now())
from demo_gv g;

insert into grupo_vip_membros (store_id, cliente_id, codigo, telegram_usuario, origem, created_at)
select c.store_id, c.id, upper(left(g.slug, 5)) || g.x,
       case when mod(g.x, 3) = 0 then g.slug || '_' || g.x end,
       case when mod(g.x, 4) = 0 then 'pagina' else 'manual' end,
       c.created_at
from demo_gv g
join cp_clientes c on c.nome = g.cliente and c.store_id = '22222222-2222-4222-8222-222222222222';

-- Os de número múltiplo de 23 só se cadastraram (sem assinatura).
delete from demo_gv where mod(x, 23) = 0;

insert into cp_assinaturas (store_id, cliente_id, plano_id, valor, status, inicio, cancelada_em, created_at)
select c.store_id, c.id, p.id, p.preco,
       case when g.cancelada is null then 'ativa' else 'cancelada' end,
       g.inicio,
       cast(g.cancelada as timestamp) + interval '16' hour,
       dateadd('HOUR', 8 + mod(g.x, 12), cast(g.inicio as timestamp))
from demo_gv g
join cp_clientes c on c.nome = g.cliente and c.store_id = '22222222-2222-4222-8222-222222222222'
join cp_planos p on p.nome = g.plano and p.store_id = '22222222-2222-4222-8222-222222222222';

-- Mensalidades (mesma regra dos alunos da academia):
--   ativa em dia -> pagas até hoje + a próxima pendente
--   atrasada     -> pagas, e a última que venceu fica pendente
--   cancelada    -> pagas até o cancelamento + a seguinte cancelada
insert into cp_pagamentos (store_id, assinatura_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento, origem)
select store_id, assinatura_id, cliente_id, valor, venc,
       case
         when cancelada is not null then case when venc <= cancelada then 'pago' else 'cancelado' end
         when atrasado then case when prox <= current_date then 'pago' else 'pendente' end
         else case when venc <= current_date then 'pago' else 'pendente' end
       end,
       least(dateadd('DAY', mod(gx, 3), cast(venc as timestamp)) + interval '9' hour,
             dateadd('MINUTE', -(30 + mod(gx * 17, 300)), localtimestamp)),
       case mod(gx + ciclo, 4) when 0 then 'pix' when 1 then 'cartao_credito' when 2 then 'pix' else 'boleto' end,
       'grupo-vip'
from (
  select a.store_id, a.id as assinatura_id, a.cliente_id, a.valor, g.cancelada, g.atrasado, g.x as gx, r.x as ciclo,
         dateadd('MONTH', r.x * p.duracao_meses, g.inicio) as venc,
         dateadd('MONTH', (r.x + 1) * p.duracao_meses, g.inicio) as prox,
         dateadd('MONTH', (r.x - 1) * p.duracao_meses, g.inicio) as ant
  from demo_gv g
  join cp_clientes c on c.nome = g.cliente and c.store_id = '22222222-2222-4222-8222-222222222222'
  join cp_assinaturas a on a.cliente_id = c.id
  join cp_planos p on p.id = a.plano_id
  cross join system_range(0, 8) as r (x)
) v
where case
        when cancelada is not null then venc <= cancelada or ant <= cancelada
        when atrasado then venc <= current_date
        else venc <= current_date or ant <= current_date
      end;

update cp_pagamentos set pago_em = null, forma_pagamento = null
where status <> 'pago' and store_id = '22222222-2222-4222-8222-222222222222';

-- Membro desde o dia da assinatura.
update cp_clientes c set created_at = (select min(a.created_at) from cp_assinaturas a where a.cliente_id = c.id)
where c.store_id = '22222222-2222-4222-8222-222222222222'
  and exists (select 1 from cp_assinaturas a where a.cliente_id = c.id);
update grupo_vip_membros m set created_at = (select c.created_at from cp_clientes c where c.id = m.cliente_id)
where m.store_id = '22222222-2222-4222-8222-222222222222';

-- Indicações: cada membro de número 3k+1 foi indicado pelo de 7 números antes;
-- 1 em cada 11 (e alguns nomeados) foi indicado pela Carla Mendes.
update cp_clientes c set indicado_por_id = (
  select c2.id from demo_gv g1
  join demo_gv g2 on g2.x = g1.x - 7
  join cp_clientes c2 on c2.nome = g2.cliente and c2.store_id = '22222222-2222-4222-8222-222222222222'
  where g1.cliente = c.nome)
where c.store_id = '22222222-2222-4222-8222-222222222222'
  and c.nome in (select cliente from demo_gv where mod(x, 3) = 1 and x > 7);

update cp_clientes c set indicado_por_id = (
  select id from cp_clientes where nome = 'Carla Mendes' and store_id = '22222222-2222-4222-8222-222222222222')
where c.store_id = '22222222-2222-4222-8222-222222222222'
  and (c.nome in (select cliente from demo_gv where mod(x, 11) = 2)
       or c.nome in ('Rafael Lima', 'Bianca Rocha', 'Thiago Prado'));

update cp_clientes c set indicado_por_id = (
  select id from cp_clientes where nome = 'Rafael Lima' and store_id = '22222222-2222-4222-8222-222222222222')
where c.store_id = '22222222-2222-4222-8222-222222222222' and c.nome in ('Juliana Costa', 'Mateus Oliveira');

-- ---------------------------------------------------------------------------
-- Quem está em cada grupo. Regra:
--   assinatura ativa: está no grupo; se o atraso passou de 10 dias, já foi tirado
--   assinatura cancelada: está no grupo até o fim do período pago
-- Quem está atrasado há 4 a 10 dias continua no grupo: aparece em
-- "Tirar dos grupos" no Controle de acesso.
-- ---------------------------------------------------------------------------
create table demo_gv_acesso (assinatura_id uuid, cliente_id uuid, plano_id uuid, status text, entrou timestamp,
                             saiu timestamp);

insert into demo_gv_acesso
select a.id, a.cliente_id, a.plano_id,
       case
         when a.status = 'ativa' then
           case when exists (select 1 from cp_pagamentos p where p.assinatura_id = a.id and p.status = 'pendente'
                               and p.vencimento < dateadd('DAY', -10, current_date))
                then 'removido' else 'no_grupo' end
         else
           case when (select dateadd('MONTH', max(pl.duracao_meses), max(p.vencimento))
                        from cp_pagamentos p join cp_planos pl on pl.id = a.plano_id
                       where p.assinatura_id = a.id and p.status = 'pago') > current_date
                then 'no_grupo' else 'removido' end
       end,
       (select min(p.pago_em) from cp_pagamentos p where p.assinatura_id = a.id and p.status = 'pago'),
       case
         when a.status = 'ativa' then
           (select cast(dateadd('DAY', 4, min(p.vencimento)) as timestamp) + interval '10' hour
              from cp_pagamentos p where p.assinatura_id = a.id and p.status = 'pendente')
         else
           (select cast(dateadd('MONTH', max(pl.duracao_meses), max(p.vencimento)) as timestamp) + interval '10' hour
              from cp_pagamentos p join cp_planos pl on pl.id = a.plano_id
             where p.assinatura_id = a.id and p.status = 'pago')
       end
from cp_assinaturas a
where a.store_id = '22222222-2222-4222-8222-222222222222'
  and exists (select 1 from cp_pagamentos p where p.assinatura_id = a.id and p.status = 'pago');

update demo_gv_acesso set saiu = null where status = 'no_grupo';

insert into grupo_vip_acessos (store_id, grupo_id, cliente_id, status, entrou_em, removido_em, atualizado_em)
select '22222222-2222-4222-8222-222222222222', pg.grupo_id, d.cliente_id, d.status, d.entrou, d.saiu,
       coalesce(d.saiu, d.entrou)
from demo_gv_acesso d
join grupo_vip_plano_grupos pg on pg.plano_id = d.plano_id;

-- Quem pagou nos últimos 2 dias ainda não foi colocado nos grupos
-- (aparece em "Colocar nos grupos").
delete from grupo_vip_acessos a
where a.store_id = '22222222-2222-4222-8222-222222222222'
  and a.cliente_id in (select d.cliente_id from demo_gv_acesso d where d.entrou >= dateadd('DAY', -2, localtimestamp));

-- A Bianca já recebeu o link do grupo do WhatsApp e ainda não entrou.
-- (Conforme a hora do dia ela já pode ter vindo acima: tira antes para não repetir.)
delete from grupo_vip_acessos a
where a.cliente_id in (select c.id from cp_clientes c
                       where c.nome = 'Bianca Rocha' and c.store_id = '22222222-2222-4222-8222-222222222222')
  and a.grupo_id in (select g.id from grupo_vip_grupos g
                     where g.nome = 'Marketing Digital' and g.store_id = '22222222-2222-4222-8222-222222222222');

insert into grupo_vip_acessos (store_id, grupo_id, cliente_id, status, convite_link, convite_criado_em, atualizado_em)
select '22222222-2222-4222-8222-222222222222', g.id, c.id, 'convidado', g.link_convite,
       dateadd('HOUR', -20, now()), dateadd('HOUR', -20, now())
from cp_clientes c
join grupo_vip_grupos g on g.nome = 'Marketing Digital' and g.store_id = c.store_id
where c.nome = 'Bianca Rocha' and c.store_id = '22222222-2222-4222-8222-222222222222';

-- Histórico de entradas e saídas.
insert into grupo_vip_acesso_eventos (store_id, grupo_id, cliente_id, acao, automatico, detalhe, momento)
select a.store_id, a.grupo_id, a.cliente_id, 'entrou', false, 'Adicionado pela equipe', a.entrou_em
from grupo_vip_acessos a
where a.store_id = '22222222-2222-4222-8222-222222222222' and a.entrou_em is not null;

insert into grupo_vip_acesso_eventos (store_id, grupo_id, cliente_id, acao, automatico, detalhe, momento)
select a.store_id, a.grupo_id, a.cliente_id, 'removido', false, 'Removido pela equipe (sem pagamento)', a.removido_em
from grupo_vip_acessos a
where a.store_id = '22222222-2222-4222-8222-222222222222' and a.status = 'removido' and a.removido_em is not null;

insert into grupo_vip_acesso_eventos (store_id, grupo_id, cliente_id, acao, automatico, detalhe, momento)
select a.store_id, a.grupo_id, a.cliente_id, 'convite', false, 'Link do grupo enviado', a.convite_criado_em
from grupo_vip_acessos a
where a.store_id = '22222222-2222-4222-8222-222222222222' and a.status = 'convidado';

drop table demo_gv_acesso;

-- A Fernanda foi bloqueada pela equipe (quebrou as regras do grupo): ainda
-- está nos grupos e aparece em "Tirar dos grupos".
update grupo_vip_membros set bloqueado = true, observacoes = 'Bloqueada por divulgar links de outros grupos.'
where codigo = 'FERNA5T6';

-- Compras feitas pela página de vendas (1º pagamento de quem veio de lá).
insert into grupo_vip_checkouts (store_id, cliente_id, plano_id, pagamento_id, preco, desconto, created_at)
select a.store_id, a.cliente_id, a.plano_id,
       (select p.id from cp_pagamentos p where p.assinatura_id = a.id order by p.vencimento limit 1),
       a.valor, 0, a.created_at
from cp_assinaturas a
join grupo_vip_membros m on m.cliente_id = a.cliente_id
where a.store_id = '22222222-2222-4222-8222-222222222222' and m.origem = 'pagina';

drop table demo_gv;
drop table demo_gv_nomes;
drop table demo_gv_sobrenomes;
drop table demo_gv_nomeados;

-- ---------------------------------------------------------------------------
-- Conteúdos, categorias e visualizações
-- ---------------------------------------------------------------------------
insert into grupo_vip_categorias (store_id, nome, cor) values
  ('22222222-2222-4222-8222-222222222222', 'Análises', 'sky'),
  ('22222222-2222-4222-8222-222222222222', 'Aulas', 'violet'),
  ('22222222-2222-4222-8222-222222222222', 'Materiais', 'emerald'),
  ('22222222-2222-4222-8222-222222222222', 'Avisos', 'amber');

create table demo_gv_conteudo (titulo text, categoria text, texto text, link text, dias integer, status text);
insert into demo_gv_conteudo values
  ('Guia Completo do Iniciante', 'Aulas', 'Tudo o que você precisa saber para começar do jeito certo, em 12 passos.', 'https://exemplo.com/guia-iniciante', 58, 'publicado'),
  ('Estratégias Avançadas', 'Aulas', 'As estratégias que usamos no dia a dia, explicadas com exemplos reais.', null, 44, 'publicado'),
  ('Planilha Exclusiva de Controle', 'Materiais', 'Baixe a planilha e acompanhe seus resultados mês a mês.', 'https://exemplo.com/planilha', 37, 'publicado'),
  ('Mentoria Gravada: Mentalidade', 'Aulas', 'Gravação completa da mentoria de agosto.', 'https://exemplo.com/mentoria-agosto', 30, 'publicado'),
  ('Checklist de Resultados', 'Materiais', 'Use antes de cada operação para não esquecer nada.', null, 23, 'publicado'),
  ('Análise da Semana', 'Análises', 'Resumo do que aconteceu e o que esperar para os próximos dias.', null, 9, 'publicado'),
  ('Novo módulo de aulas liberado', 'Avisos', 'O módulo 4 já está disponível na área do membro.', null, 5, 'publicado'),
  ('Análise de Hoje', 'Análises', 'Principais pontos de atenção para hoje.', null, 1, 'publicado'),
  ('Análise de Amanhã', 'Análises', 'Publicação agendada para amanhã cedo.', null, -1, 'agendado'),
  ('Rascunho: lista de ferramentas', 'Materiais', 'Ferramentas que recomendamos (ainda em revisão).', null, 0, 'rascunho');

insert into grupo_vip_conteudos (store_id, categoria_id, titulo, texto, link, status, agendado_para, publicado_em,
                                 na_area_membro, created_at)
select '22222222-2222-4222-8222-222222222222', cat.id, d.titulo, d.texto, d.link, d.status,
       case when d.status = 'agendado' then cast(dateadd('DAY', 1, current_date) as timestamp) + interval '8' hour end,
       case when d.status = 'publicado' then cast(dateadd('DAY', -d.dias, current_date) as timestamp) + interval '9' hour end,
       true,
       case when d.status = 'publicado' then cast(dateadd('DAY', -d.dias, current_date) as timestamp) + interval '8' hour
            else dateadd('HOUR', -5, now()) end
from demo_gv_conteudo d
join grupo_vip_categorias cat on cat.nome = d.categoria and cat.store_id = '22222222-2222-4222-8222-222222222222';

drop table demo_gv_conteudo;

-- Publicações: cada conteúdo vai para os grupos de conteúdo/análise.
-- Os do WhatsApp foram postados pela equipe (o de hoje ainda falta postar).
insert into grupo_vip_conteudo_grupos (store_id, conteudo_id, grupo_id, status, enviado_em)
select c.store_id, c.id, g.id,
       case when c.status <> 'publicado' then 'pendente'
            when g.plataforma = 'whatsapp' and c.titulo = 'Análise de Hoje' then 'manual'
            else 'enviado' end,
       case when c.status = 'publicado' and not (g.plataforma = 'whatsapp' and c.titulo = 'Análise de Hoje')
            then c.publicado_em end
from grupo_vip_conteudos c
join grupo_vip_grupos g on g.store_id = c.store_id
where c.store_id = '22222222-2222-4222-8222-222222222222'
  and (
    (c.titulo like 'Análise%' and g.nome in ('Sinais e Análises', 'Marketing Digital'))
    or (c.titulo not like 'Análise%' and g.nome = 'Conteúdos Exclusivos')
  );

-- Visualizações na área do membro (cada conteúdo foi aberto por parte dos membros).
insert into grupo_vip_conteudo_views (store_id, conteudo_id, cliente_id, visto_em)
select c.store_id, c.id, cl.id,
       least(dateadd('HOUR', mod(length(cl.nome) * 7 + r.x * 13, 96), c.publicado_em), dateadd('MINUTE', -10, localtimestamp))
from grupo_vip_conteudos c
join cp_clientes cl on cl.store_id = c.store_id
cross join system_range(1, 3) as r (x)
where c.store_id = '22222222-2222-4222-8222-222222222222'
  and c.status = 'publicado'
  and mod(length(cl.nome) + length(c.titulo) + r.x * 3, 5) < 5 - r.x;

-- ---------------------------------------------------------------------------
-- Lives, anúncios, cupons, suporte e saques
-- ---------------------------------------------------------------------------
insert into grupo_vip_eventos (store_id, titulo, descricao, foto, link, comeca_em, duracao_minutos, aviso_minutos, avisado_em) values
  ('22222222-2222-4222-8222-222222222222', 'Análise de Mercado', 'Análise ao vivo dos principais movimentos da semana.',
   '/grupo-vip/live-mercado.jpg', 'https://youtube.com/@exemplo', cast(current_date as timestamp) + interval '20' hour, 90, 60, null),
  ('22222222-2222-4222-8222-222222222222', 'Perguntas e Respostas', 'Traga suas dúvidas: respondemos todas ao vivo.',
   '/grupo-vip/live-perguntas.jpg', 'https://meet.google.com/exemplo', cast(current_date as timestamp) + interval '2' day + interval '19' hour, 60, 60, null),
  ('22222222-2222-4222-8222-222222222222', 'Estratégias para 2027', 'Planejamento do próximo ano com os membros Premium.',
   '/grupo-vip/live-estrategias.jpg', null, cast(current_date as timestamp) + interval '6' day + interval '20' hour, 120, 1440, null),
  ('22222222-2222-4222-8222-222222222222', 'Bate-papo com convidado', 'Conversa sobre carreira e resultados.',
   '/grupo-vip/live-perguntas.jpg', 'https://youtube.com/@exemplo', cast(current_date as timestamp) - interval '5' day + interval '20' hour, 60, 60,
   cast(current_date as timestamp) - interval '5' day + interval '19' hour);

update grupo_vip_eventos set grupo_id = (select id from grupo_vip_grupos where nome = 'Networking'
                                         and store_id = '22222222-2222-4222-8222-222222222222')
where titulo = 'Estratégias para 2027';

insert into grupo_vip_anuncios (store_id, titulo, texto, tipo, publico, destinatarios, postado_nos_grupos, enviado_em) values
  ('22222222-2222-4222-8222-222222222222', 'Novo conteúdo liberado!', 'O módulo 4 de aulas já está na sua área de membro.', 'conteudo', 'em_dia', 74, true,
   cast(current_date as timestamp) + interval '9' hour + interval '30' minute),
  ('22222222-2222-4222-8222-222222222222', 'Manutenção programada', 'A área do membro ficará fora do ar domingo, das 2h às 4h.', 'manutencao', 'todos', 97, false,
   cast(current_date as timestamp) - interval '1' day + interval '10' hour + interval '15' minute),
  ('22222222-2222-4222-8222-222222222222', 'Live amanhã às 20h', 'Não perca a live de análise de mercado amanhã às 20h.', 'live', 'em_dia', 72, true,
   cast(current_date as timestamp) - interval '2' day + interval '18' hour + interval '40' minute),
  ('22222222-2222-4222-8222-222222222222', 'Material exclusivo no grupo', 'A planilha de controle foi atualizada. Baixe a nova versão.', 'material', 'todos', 95, false,
   cast(current_date as timestamp) - interval '3' day + interval '12' hour + interval '20' minute);

insert into grupo_vip_cupons (store_id, codigo, tipo, valor, validade, limite_usos, usos, ativo) values
  ('22222222-2222-4222-8222-222222222222', 'BEMVINDO10', 'percentual', 10, null, null, 18, true),
  ('22222222-2222-4222-8222-222222222222', 'VIP20', 'valor', 20, dateadd('DAY', 30, current_date), 50, 12, true),
  ('22222222-2222-4222-8222-222222222222', 'BLACK50', 'percentual', 50, dateadd('DAY', -300, current_date), 100, 41, false);

insert into grupo_vip_chamados (store_id, cliente_id, assunto, status, created_at, atualizado_em)
select c.store_id, c.id, x.assunto, x.status, dateadd('HOUR', -x.horas, now()), dateadd('HOUR', -x.atualizado, now())
from (values
  ('Juliana Costa', 'Não consigo entrar no grupo de Marketing', 'aberto', 5, 5),
  ('Rafael Lima', 'Como faço para trocar para o plano Premium?', 'respondido', 30, 26),
  ('Carla Mendes', 'Recibo do pagamento', 'resolvido', 120, 110)
) as x (nome, assunto, status, horas, atualizado)
join cp_clientes c on c.nome = x.nome and c.store_id = '22222222-2222-4222-8222-222222222222';

insert into grupo_vip_chamado_mensagens (store_id, chamado_id, autor, texto, created_at)
select ch.store_id, ch.id, x.autor, x.texto, dateadd('HOUR', -x.horas, now())
from (values
  ('Não consigo entrar no grupo de Marketing', 'membro', 'Oi! Tentei entrar pelo link do grupo de Marketing e diz que o link é inválido. Podem me ajudar?', 5),
  ('Como faço para trocar para o plano Premium?', 'membro', 'Quero passar para o Premium para entrar nas mentorias. Como faço?', 30),
  ('Como faço para trocar para o plano Premium?', 'equipe', 'Oi, Rafael! Na sua área de membro, cancele o VIP e assine o Premium. Você continua com acesso até o fim do período já pago.', 26),
  ('Recibo do pagamento', 'membro', 'Preciso do comprovante do último pagamento.', 120),
  ('Recibo do pagamento', 'equipe', 'Enviamos no seu e-mail. Qualquer coisa, estamos aqui!', 110)
) as x (assunto, autor, texto, horas)
join grupo_vip_chamados ch on ch.assunto = x.assunto and ch.store_id = '22222222-2222-4222-8222-222222222222';

-- Saques de comissão da Carla (quem mais indica).
insert into cp_saques (store_id, cliente_id, valor, chave_pix, status, motivo, created_at, pago_em)
select c.store_id, c.id, x.valor, 'carla.mendes@email.com', x.status, x.motivo,
       dateadd('DAY', -x.dias, now()), case when x.status = 'pago' then dateadd('DAY', -x.dias + 1, now()) end
from (values
  (40.00, 'pago', null, 60),
  (35.00, 'pago', null, 25),
  (500.00, 'recusado', 'Valor maior que o saldo disponível na data do pedido.', 12),
  (20.00, 'solicitado', null, 1)
) as x (valor, status, motivo, dias)
join cp_clientes c on c.nome = 'Carla Mendes' and c.store_id = '22222222-2222-4222-8222-222222222222';

-- Algumas mensagens já enviadas (histórico da caixa de saída).
insert into grupo_vip_mensagens (store_id, cliente_id, tipo, canal, texto, status, chave, criada_em, enviada_em)
select c.store_id, c.id, x.tipo, 'whatsapp', x.texto, 'enviada', x.chave, dateadd('HOUR', -x.horas, now()),
       dateadd('HOUR', -x.horas, now())
from (values
  ('Carla Mendes', 'aniversario', 'Feliz aniversário, Carla! 🎂 Toda a equipe do Meu Grupo VIP te deseja um dia incrível.', 'demo:1', 200),
  ('Rafael Lima', 'manual', 'Oi, Rafael! Respondemos sua dúvida sobre o plano Premium no suporte.', 'demo:2', 26),
  ('Juliana Costa', 'lembrete', 'Oi, Juliana! Sua assinatura do plano VIP (R$ 49,90) vence em breve. Para continuar nos grupos, pague pela sua área de membro.', 'demo:3', 120)
) as x (nome, tipo, texto, chave, horas)
join cp_clientes c on c.nome = x.nome and c.store_id = '22222222-2222-4222-8222-222222222222';

