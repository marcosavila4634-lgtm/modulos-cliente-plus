-- Dados de exemplo (DEMO) de Grupos VIP. Não copiar para o projeto principal.
-- store_id da loja de exemplo: 22222222-2222-4222-8222-222222222222
-- (o mesmo valor está em grupo-vip.store-id no application.properties).

insert into grupo_vip_painel (store_id, nome_grupo_atual, gestor_nome, gestor_sobrenome, gestor_cargo,
                              frase, frase_destaque, notificacoes) values
  ('22222222-2222-4222-8222-222222222222', 'Meu Grupo VIP', 'Fernando', 'Sombra', 'Administrador',
   'Grandes ideias ganham força quando são compartilhadas.',
   'Conhecimento de qualidade cria pessoas extraordinárias.', 3);

insert into grupo_vip_indicadores (store_id, chave, valor, variacao, mes_anterior) values
  ('22222222-2222-4222-8222-222222222222', 'membros_ativos', 1482, 12, 1322),
  ('22222222-2222-4222-8222-222222222222', 'conteudos_publicados', 56, 28, 44),
  ('22222222-2222-4222-8222-222222222222', 'visualizacoes', 24850, 35, 18420),
  ('22222222-2222-4222-8222-222222222222', 'receita_mes', 7480, 18, 6320),
  ('22222222-2222-4222-8222-222222222222', 'novos_este_mes', 312, null, null),
  ('22222222-2222-4222-8222-222222222222', 'ticket_medio', 4.98, null, null);

-- O painel mostra os 5 grupos com mais membros.
insert into grupo_vip_grupos (store_id, nome, plataforma, membros, cor) values
  ('22222222-2222-4222-8222-222222222222', 'Sinais e Análises', 'telegram', 428, 'blue'),
  ('22222222-2222-4222-8222-222222222222', 'Conteúdos Exclusivos', 'telegram', 356, 'sky'),
  ('22222222-2222-4222-8222-222222222222', 'Marketing Digital', 'whatsapp', 292, 'violet'),
  ('22222222-2222-4222-8222-222222222222', 'Suporte e Dúvidas', 'whatsapp', 198, 'indigo'),
  ('22222222-2222-4222-8222-222222222222', 'Networking', 'telegram', 128, 'amber'),
  ('22222222-2222-4222-8222-222222222222', 'Notícias e Alertas', 'telegram', 46, 'sky'),
  ('22222222-2222-4222-8222-222222222222', 'Mentorias', 'whatsapp', 34, 'violet');

insert into grupo_vip_membros (store_id, grupo_id, nome, foto, plano, status, entrou_em)
select '22222222-2222-4222-8222-222222222222', g.id, m.nome, m.foto, m.plano, m.status, m.entrou_em
from (values
  ('Carla Mendes', 'carla', 'Premium', 'ativo', 'Sinais e Análises', timestamp with time zone '2025-09-09 15:20:00-03'),
  ('Rafael Lima', 'rafael', 'VIP', 'ativo', 'Conteúdos Exclusivos', timestamp with time zone '2025-09-09 11:05:00-03'),
  ('Juliana Costa', 'juliana', 'VIP', 'ativo', 'Marketing Digital', timestamp with time zone '2025-09-08 18:40:00-03'),
  ('Mateus Oliveira', 'mateus', 'Básico', 'pendente', 'Notícias e Alertas', timestamp with time zone '2025-09-08 14:10:00-03'),
  ('Fernanda Alves', 'fernanda', 'Premium', 'ativo', 'Mentorias', timestamp with time zone '2025-09-08 09:30:00-03')
) as m (nome, foto, plano, status, grupo, entrou_em)
join grupo_vip_grupos g on g.nome = m.grupo and g.store_id = '22222222-2222-4222-8222-222222222222';

insert into grupo_vip_crescimento_mensal (store_id, mes, membros, data_referencia) values
  ('22222222-2222-4222-8222-222222222222', date '2025-03-01', 260, null),
  ('22222222-2222-4222-8222-222222222222', date '2025-04-01', 560, null),
  ('22222222-2222-4222-8222-222222222222', date '2025-05-01', 700, null),
  ('22222222-2222-4222-8222-222222222222', date '2025-06-01', 930, null),
  ('22222222-2222-4222-8222-222222222222', date '2025-07-01', 1110, null),
  ('22222222-2222-4222-8222-222222222222', date '2025-08-01', 1260, null),
  ('22222222-2222-4222-8222-222222222222', date '2025-09-01', 1482, date '2025-09-09');

insert into grupo_vip_conteudos (store_id, titulo, acessos) values
  ('22222222-2222-4222-8222-222222222222', 'Guia Completo do Iniciante', 2845),
  ('22222222-2222-4222-8222-222222222222', 'Estratégias Avançadas', 1982),
  ('22222222-2222-4222-8222-222222222222', 'Planilha Exclusiva', 1420),
  ('22222222-2222-4222-8222-222222222222', 'Mentoria Gravada', 1108),
  ('22222222-2222-4222-8222-222222222222', 'Checklist de Resultados', 892);

insert into grupo_vip_planos (store_id, nome, percentual_membros, ordem) values
  ('22222222-2222-4222-8222-222222222222', 'Básico', 38, 1),
  ('22222222-2222-4222-8222-222222222222', 'VIP', 34, 2),
  ('22222222-2222-4222-8222-222222222222', 'Premium', 20, 3),
  ('22222222-2222-4222-8222-222222222222', 'Cortesia', 8, 4);

-- Avisos e lives com datas relativas ao dia em que o backend liga
-- ("Hoje, 14:30", ontem, daqui a 2 dias...).
insert into grupo_vip_avisos (store_id, tipo, titulo, enviado_em) values
  ('22222222-2222-4222-8222-222222222222', 'conteudo', 'Novo conteúdo liberado!',
   cast(current_date as timestamp) + interval '14' hour + interval '30' minute),
  ('22222222-2222-4222-8222-222222222222', 'manutencao', 'Manutenção programada',
   cast(current_date as timestamp) - interval '1' day + interval '10' hour + interval '15' minute),
  ('22222222-2222-4222-8222-222222222222', 'live', 'Live amanhã às 20h',
   cast(current_date as timestamp) - interval '2' day + interval '18' hour + interval '40' minute),
  ('22222222-2222-4222-8222-222222222222', 'material', 'Material exclusivo no grupo',
   cast(current_date as timestamp) - interval '3' day + interval '12' hour + interval '20' minute);

insert into grupo_vip_eventos (store_id, titulo, foto, status, comeca_em) values
  ('22222222-2222-4222-8222-222222222222', 'Análise de Mercado', 'live-mercado', 'ao_vivo',
   cast(current_date as timestamp) + interval '20' hour),
  ('22222222-2222-4222-8222-222222222222', 'Perguntas e Respostas', 'live-perguntas', 'em_breve',
   cast(current_date as timestamp) + interval '2' day + interval '19' hour),
  ('22222222-2222-4222-8222-222222222222', 'Estratégias para 2026', 'live-estrategias', 'em_breve',
   cast(current_date as timestamp) + interval '6' day + interval '20' hour);
