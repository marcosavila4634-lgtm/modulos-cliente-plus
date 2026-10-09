-- Dados de exemplo (DEMO) do "Dojo Centro", o dojo do módulo Artes Marciais.
-- store_id: 33333333-3333-4333-8333-333333333333 (artes-marciais.store-id).
-- Só do laboratório: usa funções do H2 (dateadd, iso_day_of_week,
-- system_range, random_uuid) e não vai para o Supabase.
--
-- O dojo usa as tabelas da Academia (alunos, matrículas, aulas, presenças,
-- check-ins, despesas...) e as de luta (V21). Todas as buscas por nome aqui
-- olham a loja, porque os nomes podem se repetir com os da academia.

insert into modulos (slug, nome, segmento, descricao, status, created_at) values
  ('artes-marciais', 'Gestão para Artes Marciais', 'Academias de artes marciais',
   'Tudo da Academia (alunos, check-in, aulas, agenda, avaliação, financeiro, relatórios) e mais: modalidades, faixas e graus com requisitos, exames com certificado, presença por QR Code, eventos e campeonatos, filiações, loja de uniformes, equipamentos, responsáveis dos kids, comunicados, ranking, cronômetro de tatame e área do aluno.',
   'pronto_para_migrar', timestamp with time zone '2026-09-29 12:00:00+00');

insert into academia_painel (store_id, nome_academia, gestor_nome, gestor_cargo, frase) values
  ('33333333-3333-4333-8333-333333333333', 'Dojo Centro', 'Fernando', 'Administrador',
   'Artes marciais formam pessoas mais fortes, dentro e fora do tatame.');

insert into academia_config (store_id, telefone, email, endereco, cnpj, capacidade, whatsapp, slug,
  bloquear_inadimplentes, tolerancia_atraso_dias, bloquear_fora_do_horario, intervalo_checkin_minutos) values
  ('33333333-3333-4333-8333-333333333333', '1132221100', 'contato@dojocentro.com.br',
   'Rua Augusta, 1500 - Consolação, São Paulo - SP', '45678912000155', 40, '11988887777', 'dojo-centro',
   true, 10, false, 45);

insert into academia_horarios (store_id, dia_semana, abre, fecha, fechado) values
  ('33333333-3333-4333-8333-333333333333', 1, time '06:30', time '22:30', false),
  ('33333333-3333-4333-8333-333333333333', 2, time '06:30', time '22:30', false),
  ('33333333-3333-4333-8333-333333333333', 3, time '06:30', time '22:30', false),
  ('33333333-3333-4333-8333-333333333333', 4, time '06:30', time '22:30', false),
  ('33333333-3333-4333-8333-333333333333', 5, time '06:30', time '22:30', false),
  ('33333333-3333-4333-8333-333333333333', 6, time '08:00', time '13:00', false),
  ('33333333-3333-4333-8333-333333333333', 7, null, null, true);

insert into artes_marciais_config (store_id, contar_aulas_por, idade_adulto, lema, codigo_presenca) values
  ('33333333-3333-4333-8333-333333333333', 'aulas', 16,
   'Respeito · Disciplina · Evolução · Pessoas mais fortes', 'dojocentro');

insert into cp_programa_indicacao (store_id, nivel1_pct, nivel2_pct, nivel3_pct) values
  ('33333333-3333-4333-8333-333333333333', 10, 5, 2);

insert into cp_planos (store_id, nome, descricao, preco, duracao_meses, participa_indicacoes) values
  ('33333333-3333-4333-8333-333333333333', 'Jiu-Jitsu Mensal', 'Aulas de Jiu-Jitsu (Gi e No-Gi) todos os dias', 180, 1, true),
  ('33333333-3333-4333-8333-333333333333', 'Muay Thai Mensal', 'Aulas de Muay Thai do iniciante ao avançado', 160, 1, true),
  ('33333333-3333-4333-8333-333333333333', 'Lutas Mensal', 'Uma modalidade: Boxe, MMA, Judô, Karatê ou Taekwondo', 150, 1, true),
  ('33333333-3333-4333-8333-333333333333', 'Combo 2 modalidades', 'Duas modalidades à escolha', 260, 1, true),
  ('33333333-3333-4333-8333-333333333333', 'Kids Mensal', 'Turmas infantis (6 a 14 anos)', 140, 1, true),
  ('33333333-3333-4333-8333-333333333333', 'Trimestral Livre', 'Todas as modalidades por 3 meses', 690, 3, true),
  ('33333333-3333-4333-8333-333333333333', 'Anual Livre', 'Todas as modalidades por 12 meses', 2280, 12, true);

insert into academia_profissionais (store_id, nome, especialidade, telefone, email, registro) values
  ('33333333-3333-4333-8333-333333333333', 'Marcos Silva', 'Jiu-Jitsu · faixa preta 3º grau', '11991110001', 'marcos@dojocentro.com.br', 'CBJJ 18.442'),
  ('33333333-3333-4333-8333-333333333333', 'Ana Costa', 'Muay Thai · Kru', '11991110002', 'ana@dojocentro.com.br', 'CBMT 2.915'),
  ('33333333-3333-4333-8333-333333333333', 'Ricardo Alves', 'Boxe', '11991110003', 'ricardo@dojocentro.com.br', null),
  ('33333333-3333-4333-8333-333333333333', 'Lucas Mota', 'Jiu-Jitsu Kids e Judô', '11991110004', 'lucas@dojocentro.com.br', 'CBJ 7.108'),
  ('33333333-3333-4333-8333-333333333333', 'Paula Nogueira', 'Karatê e Taekwondo', '11991110005', 'paula@dojocentro.com.br', null),
  ('33333333-3333-4333-8333-333333333333', 'Rafael Tanaka', 'MMA', '11991110006', 'rafael@dojocentro.com.br', null);

-- ---------------------------------------------------------------------------
-- Modalidades e faixas (os mesmos modelos de ModelosFaixas.java).
-- ---------------------------------------------------------------------------
insert into artes_marciais_modalidades (store_id, nome, cor, ordem) values
  ('33333333-3333-4333-8333-333333333333', 'Jiu-Jitsu', '#ef4444', 1),
  ('33333333-3333-4333-8333-333333333333', 'Muay Thai', '#a855f7', 2),
  ('33333333-3333-4333-8333-333333333333', 'Boxe', '#b8860b', 3),
  ('33333333-3333-4333-8333-333333333333', 'MMA', '#db2777', 4),
  ('33333333-3333-4333-8333-333333333333', 'Judô', '#3b82f6', 5),
  ('33333333-3333-4333-8333-333333333333', 'Karatê', '#0d9488', 6),
  ('33333333-3333-4333-8333-333333333333', 'Taekwondo', '#ea580c', 7);

create table demo_faixas (modalidade text, ordem integer, nome text, cor text, ponta text, publico text,
  graus integer, meses integer, aulas integer, por_grau integer, idade integer, taxa integer);
insert into demo_faixas values
  ('Jiu-Jitsu', 1, 'Branca', '#f4f4f5', null, 'todos', 4, 12, 90, 22, null, 0),
  ('Jiu-Jitsu', 2, 'Cinza e branca', '#9ca3af', '#f4f4f5', 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 3, 'Cinza', '#9ca3af', null, 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 4, 'Cinza e preta', '#9ca3af', '#111111', 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 5, 'Amarela e branca', '#facc15', '#f4f4f5', 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 6, 'Amarela', '#facc15', null, 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 7, 'Amarela e preta', '#facc15', '#111111', 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 8, 'Laranja e branca', '#f97316', '#f4f4f5', 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 9, 'Laranja', '#f97316', null, 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 10, 'Laranja e preta', '#f97316', '#111111', 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 11, 'Verde e branca', '#16a34a', '#f4f4f5', 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 12, 'Verde', '#16a34a', null, 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 13, 'Verde e preta', '#16a34a', '#111111', 'infantil', 4, 4, 50, 16, null, 60),
  ('Jiu-Jitsu', 14, 'Azul', '#2563eb', null, 'adulto', 4, 18, 150, 30, 16, 120),
  ('Jiu-Jitsu', 15, 'Roxa', '#7e22ce', null, 'adulto', 4, 18, 160, 35, 16, 150),
  ('Jiu-Jitsu', 16, 'Marrom', '#78350f', null, 'adulto', 4, 12, 140, 35, 18, 180),
  ('Jiu-Jitsu', 17, 'Preta', '#111111', null, 'adulto', 6, 36, 0, 0, 19, 250),
  ('Muay Thai', 1, 'Branca', '#f4f4f5', null, 'todos', 0, 3, 24, 0, null, 0),
  ('Muay Thai', 2, 'Branca e vermelha', '#f4f4f5', '#dc2626', 'todos', 0, 4, 30, 0, null, 70),
  ('Muay Thai', 3, 'Vermelha', '#dc2626', null, 'todos', 0, 4, 30, 0, null, 70),
  ('Muay Thai', 4, 'Vermelha e azul-clara', '#dc2626', '#38bdf8', 'todos', 0, 5, 40, 0, null, 80),
  ('Muay Thai', 5, 'Azul-clara', '#38bdf8', null, 'todos', 0, 5, 40, 0, null, 80),
  ('Muay Thai', 6, 'Azul-clara e azul-escura', '#38bdf8', '#1e3a8a', 'todos', 0, 6, 48, 0, null, 90),
  ('Muay Thai', 7, 'Azul-escura', '#1e3a8a', null, 'todos', 0, 8, 60, 0, null, 100),
  ('Muay Thai', 8, 'Azul-escura e preta', '#1e3a8a', '#111111', 'todos', 0, 12, 90, 0, null, 120),
  ('Muay Thai', 9, 'Preta', '#111111', null, 'todos', 0, 0, 0, 0, null, 250),
  ('Boxe', 1, 'Iniciante', '#71717a', null, 'todos', 0, 3, 30, 0, null, 0),
  ('Boxe', 2, 'Intermediário', '#2563eb', null, 'todos', 0, 6, 60, 0, null, 0),
  ('Boxe', 3, 'Avançado', '#dc2626', null, 'todos', 0, 12, 100, 0, null, 0),
  ('Boxe', 4, 'Competidor', '#eab308', null, 'todos', 0, 0, 0, 0, null, 0),
  ('MMA', 1, 'Iniciante', '#71717a', null, 'todos', 0, 3, 30, 0, null, 0),
  ('MMA', 2, 'Intermediário', '#2563eb', null, 'todos', 0, 6, 60, 0, null, 0),
  ('MMA', 3, 'Avançado', '#dc2626', null, 'todos', 0, 12, 100, 0, null, 0),
  ('MMA', 4, 'Competidor', '#eab308', null, 'todos', 0, 0, 0, 0, null, 0),
  ('Judô', 1, 'Branca', '#f4f4f5', null, 'todos', 0, 4, 30, 0, null, 0),
  ('Judô', 2, 'Cinza', '#9ca3af', null, 'todos', 0, 6, 40, 0, null, 60),
  ('Judô', 3, 'Azul', '#2563eb', null, 'todos', 0, 6, 40, 0, null, 60),
  ('Judô', 4, 'Amarela', '#facc15', null, 'todos', 0, 6, 40, 0, null, 80),
  ('Judô', 5, 'Laranja', '#f97316', null, 'todos', 0, 8, 50, 0, null, 80),
  ('Judô', 6, 'Verde', '#16a34a', null, 'todos', 0, 10, 60, 0, null, 100),
  ('Judô', 7, 'Roxa', '#7e22ce', null, 'todos', 0, 12, 80, 0, null, 120),
  ('Judô', 8, 'Marrom', '#78350f', null, 'todos', 0, 18, 120, 0, null, 150),
  ('Judô', 9, 'Preta', '#111111', null, 'todos', 0, 0, 0, 0, null, 250),
  ('Karatê', 1, 'Branca', '#f4f4f5', null, 'todos', 0, 4, 30, 0, null, 0),
  ('Karatê', 2, 'Amarela', '#facc15', null, 'todos', 0, 6, 40, 0, null, 70),
  ('Karatê', 3, 'Vermelha', '#dc2626', null, 'todos', 0, 6, 40, 0, null, 70),
  ('Karatê', 4, 'Laranja', '#f97316', null, 'todos', 0, 6, 40, 0, null, 80),
  ('Karatê', 5, 'Verde', '#16a34a', null, 'todos', 0, 8, 50, 0, null, 90),
  ('Karatê', 6, 'Roxa', '#7e22ce', null, 'todos', 0, 10, 60, 0, null, 100),
  ('Karatê', 7, 'Marrom', '#78350f', null, 'todos', 0, 18, 100, 0, null, 150),
  ('Karatê', 8, 'Preta', '#111111', null, 'todos', 0, 0, 0, 0, null, 250),
  ('Taekwondo', 1, 'Branca', '#f4f4f5', null, 'todos', 0, 3, 24, 0, null, 0),
  ('Taekwondo', 2, 'Branca ponta amarela', '#f4f4f5', '#facc15', 'todos', 0, 3, 24, 0, null, 60),
  ('Taekwondo', 3, 'Amarela', '#facc15', null, 'todos', 0, 3, 24, 0, null, 60),
  ('Taekwondo', 4, 'Amarela ponta verde', '#facc15', '#16a34a', 'todos', 0, 3, 24, 0, null, 60),
  ('Taekwondo', 5, 'Verde', '#16a34a', null, 'todos', 0, 4, 30, 0, null, 70),
  ('Taekwondo', 6, 'Verde ponta azul', '#16a34a', '#2563eb', 'todos', 0, 4, 30, 0, null, 70),
  ('Taekwondo', 7, 'Azul', '#2563eb', null, 'todos', 0, 5, 36, 0, null, 80),
  ('Taekwondo', 8, 'Azul ponta vermelha', '#2563eb', '#dc2626', 'todos', 0, 5, 36, 0, null, 80),
  ('Taekwondo', 9, 'Vermelha', '#dc2626', null, 'todos', 0, 6, 45, 0, null, 100),
  ('Taekwondo', 10, 'Vermelha ponta preta', '#dc2626', '#111111', 'todos', 0, 8, 54, 0, null, 120),
  ('Taekwondo', 11, 'Preta', '#111111', null, 'todos', 0, 0, 0, 0, null, 250);

insert into artes_marciais_faixas (store_id, modalidade_id, nome, cor, cor_ponta, publico, ordem, graus_maximos,
  meses_minimos, aulas_minimas, aulas_por_grau, idade_minima, taxa_exame)
select m.store_id, m.id, f.nome, f.cor, f.ponta, f.publico, f.ordem, f.graus, f.meses, f.aulas, f.por_grau, f.idade, f.taxa
from demo_faixas f
join artes_marciais_modalidades m on m.nome = f.modalidade and m.store_id = '33333333-3333-4333-8333-333333333333';

drop table demo_faixas;

-- ---------------------------------------------------------------------------
-- Aulas (grade da semana), com a modalidade e o público de cada uma.
-- ---------------------------------------------------------------------------
create table demo_aulas (nome text, modalidade text, publico text, professor text, sala text, capacidade integer,
  duracao integer, cor text, descricao text);
insert into demo_aulas values
  ('Jiu-Jitsu (Adulto)', 'Jiu-Jitsu', 'adulto', 'Marcos Silva', 'Tatame 1', 24, 90, 'violeta', 'Aula de Jiu-Jitsu com kimono, todos os níveis'),
  ('Muay Thai (Iniciante)', 'Muay Thai', 'todos', 'Ana Costa', 'Tatame 2', 20, 60, 'laranja', 'Fundamentos, guarda e combinações básicas'),
  ('Kids (6 a 10 anos)', 'Jiu-Jitsu', 'infantil', 'Lucas Mota', 'Tatame 1', 24, 60, 'verde', 'Jiu-Jitsu infantil com brincadeiras e disciplina'),
  ('Boxe (Adulto)', 'Boxe', 'adulto', 'Ricardo Alves', 'Tatame 2', 20, 60, 'azul', 'Técnica, saco e sparring leve'),
  ('Jiu-Jitsu (Avançado)', 'Jiu-Jitsu', 'adulto', 'Marcos Silva', 'Tatame 1', 30, 90, 'rosa', 'Aula técnica e rola para faixas azul em diante'),
  ('Muay Thai (Intermediário)', 'Muay Thai', 'todos', 'Ana Costa', 'Tatame 2', 28, 60, 'ciano', 'Clinch, joelhadas e sparring'),
  ('Kids (11 a 14 anos)', 'Jiu-Jitsu', 'infantil', 'Lucas Mota', 'Tatame 1', 32, 60, 'verde', 'Jiu-Jitsu juvenil'),
  ('Judô', 'Judô', 'todos', 'Lucas Mota', 'Tatame 1', 18, 60, 'azul', 'Quedas, imobilizações e katas'),
  ('Karatê', 'Karatê', 'todos', 'Paula Nogueira', 'Tatame 2', 16, 60, 'laranja', 'Kihon, kata e kumite'),
  ('Taekwondo', 'Taekwondo', 'todos', 'Paula Nogueira', 'Tatame 2', 16, 60, 'violeta', 'Chutes, poomsae e luta olímpica'),
  ('MMA', 'MMA', 'adulto', 'Rafael Tanaka', 'Tatame 2', 20, 90, 'rosa', 'Integração de trocação, quedas e chão'),
  ('Jiu-Jitsu No-Gi', 'Jiu-Jitsu', 'adulto', 'Marcos Silva', 'Tatame 1', 24, 60, 'ciano', 'Jiu-Jitsu sem kimono'),
  ('Boxe (Noite)', 'Boxe', 'adulto', 'Ricardo Alves', 'Tatame 2', 20, 60, 'azul', 'Boxe para quem sai tarde do trabalho');

insert into academia_aulas (store_id, nome, descricao, professor_id, sala, capacidade, duracao_minutos, cor)
select '33333333-3333-4333-8333-333333333333', a.nome, a.descricao, p.id, a.sala, a.capacidade, a.duracao, a.cor
from demo_aulas a
join academia_profissionais p on p.nome = a.professor and p.store_id = '33333333-3333-4333-8333-333333333333';

insert into artes_marciais_aula_modalidades (store_id, aula_id, modalidade_id, publico)
select '33333333-3333-4333-8333-333333333333', au.id, m.id, a.publico
from demo_aulas a
join academia_aulas au on au.nome = a.nome and au.store_id = '33333333-3333-4333-8333-333333333333'
join artes_marciais_modalidades m on m.nome = a.modalidade and m.store_id = '33333333-3333-4333-8333-333333333333';

create table demo_grade (aula text, dia integer, hora time);
insert into demo_grade
select a.nome, d.x, a.hora
from (values ('Jiu-Jitsu (Adulto)', time '08:00'), ('Muay Thai (Iniciante)', time '09:30'),
             ('Kids (6 a 10 anos)', time '11:00'), ('Boxe (Adulto)', time '13:00'),
             ('Jiu-Jitsu (Avançado)', time '18:00'), ('Muay Thai (Intermediário)', time '19:30')) as a (nome, hora)
cross join system_range(1, 5) as d (x);
insert into demo_grade values
  ('Kids (11 a 14 anos)', 2, time '17:00'), ('Kids (11 a 14 anos)', 4, time '17:00'),
  ('Judô', 1, time '16:00'), ('Judô', 3, time '16:00'),
  ('Karatê', 2, time '16:00'), ('Karatê', 4, time '16:00'),
  ('Taekwondo', 3, time '17:00'), ('Taekwondo', 6, time '09:00'),
  ('MMA', 2, time '21:00'), ('MMA', 4, time '21:00'),
  ('Jiu-Jitsu No-Gi', 6, time '10:00'),
  ('Boxe (Noite)', 1, time '21:00'), ('Boxe (Noite)', 3, time '21:00'), ('Boxe (Noite)', 5, time '21:00');

insert into academia_aula_horarios (store_id, aula_id, dia_semana, hora_inicio)
select '33333333-3333-4333-8333-333333333333', au.id, g.dia, g.hora
from demo_grade g
join academia_aulas au on au.nome = g.aula and au.store_id = '33333333-3333-4333-8333-333333333333';

drop table demo_grade;
drop table demo_aulas;

-- ---------------------------------------------------------------------------
-- 270 alunos. x = número do aluno. Múltiplos de 5 são kids (6 a 14 anos).
-- m1 = modalidade principal; m2 = segunda modalidade (combo).
-- ---------------------------------------------------------------------------
create table demo_nomes (i integer, nome text, slug text, sexo text);
insert into demo_nomes values
  (0, 'Gabriel', 'gabriel', 'M'), (1, 'Júlia', 'julia', 'F'), (2, 'Arthur', 'arthur', 'M'), (3, 'Beatriz', 'beatriz', 'F'),
  (4, 'Davi', 'davi', 'M'), (5, 'Laura', 'laura', 'F'), (6, 'Bernardo', 'bernardo', 'M'), (7, 'Manuela', 'manuela', 'F'),
  (8, 'Heitor', 'heitor', 'M'), (9, 'Sofia', 'sofia', 'F'), (10, 'Theo', 'theo', 'M'), (11, 'Isabela', 'isabela', 'F'),
  (12, 'Lorenzo', 'lorenzo', 'M'), (13, 'Helena', 'helena', 'F'), (14, 'Miguel', 'miguel', 'M'), (15, 'Valentina', 'valentina', 'F'),
  (16, 'Pedro', 'pedro', 'M'), (17, 'Alice', 'alice', 'F'), (18, 'Matheus', 'matheus', 'M'), (19, 'Lívia', 'livia', 'F'),
  (20, 'Rafael', 'rafael', 'M'), (21, 'Camila', 'camila', 'F'), (22, 'Enzo', 'enzo', 'M'), (23, 'Yasmin', 'yasmin', 'F'),
  (24, 'Guilherme', 'guilherme', 'M'), (25, 'Carolina', 'carolina', 'F'), (26, 'Nicolas', 'nicolas', 'M'), (27, 'Letícia', 'leticia', 'F'),
  (28, 'Samuel', 'samuel', 'M'), (29, 'Mariana', 'mariana', 'F'), (30, 'Vitor', 'vitor', 'M'), (31, 'Rebeca', 'rebeca', 'F'),
  (32, 'Caio', 'caio', 'M'), (33, 'Bianca', 'bianca', 'F'), (34, 'Felipe', 'felipe', 'M'), (35, 'Luana', 'luana', 'F'),
  (36, 'Diego', 'diego', 'M'), (37, 'Natália', 'natalia', 'F'), (38, 'Leandro', 'leandro', 'M'), (39, 'Priscila', 'priscila', 'F'),
  (40, 'Thiago', 'thiago', 'M'), (41, 'Débora', 'debora', 'F'), (42, 'Otávio', 'otavio', 'M'), (43, 'Renata', 'renata', 'F'),
  (44, 'João Pedro', 'joaopedro', 'M');

create table demo_sobrenomes (i integer, sobrenome text, slug text);
insert into demo_sobrenomes values
  (0, 'Almeida', 'almeida'), (1, 'Barros', 'barros'), (2, 'Cunha', 'cunha'), (3, 'Diniz', 'diniz'),
  (4, 'Esteves', 'esteves'), (5, 'Fonseca', 'fonseca'), (6, 'Guimarães', 'guimaraes'), (7, 'Honorato', 'honorato'),
  (8, 'Ishikawa', 'ishikawa'), (9, 'Jardim', 'jardim'), (10, 'Leal', 'leal'), (11, 'Macedo', 'macedo'),
  (12, 'Nogueira', 'nogueira'), (13, 'Paiva', 'paiva'), (14, 'Queiroz', 'queiroz'), (15, 'Rezende', 'rezende'),
  (16, 'Sampaio', 'sampaio'), (17, 'Toledo', 'toledo'), (18, 'Uchoa', 'uchoa'), (19, 'Valadares', 'valadares'),
  (20, 'Werneck', 'werneck'), (21, 'Aguiar', 'aguiar'), (22, 'Brandão', 'brandao'), (23, 'Coelho', 'coelho'),
  (24, 'Dantas', 'dantas'), (25, 'Ferraz', 'ferraz'), (26, 'Gusmão', 'gusmao'), (27, 'Lacerda', 'lacerda'),
  (28, 'Magalhães', 'magalhaes'), (29, 'Peixoto', 'peixoto'), (30, 'Ferreira', 'ferreira');

create table demo_alunos (x integer, nome text, email text, kid boolean, nascimento date, m1 text, m2 text,
  plano text, inicio date, cancelada date, atrasado boolean);

insert into demo_alunos
select v.x, v.nome, v.email, v.kid,
       case when v.kid then dateadd('DAY', -(365 * (6 + mod((v.x / 5) * 4, 9)) + mod(v.x * 41, 360)), current_date)
            else dateadd('DAY', -(365 * (17 + mod(v.x * 11, 30)) + mod(v.x * 41, 360)), current_date) end,
       v.m1,
       case when not v.kid and mod(v.x, 6) = 1 then case when v.m1 = 'Jiu-Jitsu' then 'Muay Thai' else 'Jiu-Jitsu' end end,
       case when v.kid then 'Kids Mensal'
            when mod(v.x, 6) = 1 then 'Combo 2 modalidades'
            when mod(v.x, 9) = 4 then 'Trimestral Livre'
            when mod(v.x, 13) = 6 then 'Anual Livre'
            when v.m1 = 'Jiu-Jitsu' then 'Jiu-Jitsu Mensal'
            when v.m1 = 'Muay Thai' then 'Muay Thai Mensal'
            else 'Lutas Mensal' end,
       v.inicio,
       case when mod(v.x, 9) = 0 and datediff('DAY', v.inicio, current_date) > 70
            then dateadd('DAY', -mod(v.x * 7, least(60, datediff('DAY', v.inicio, current_date) - 30)) - 5, current_date) end,
       mod(v.x, 14) = 0
from (
  select r.x,
         n.nome || ' ' || s.sobrenome as nome,
         n.slug || '.' || s.slug || r.x || '@email.com' as email,
         mod(r.x, 5) = 0 as kid,
         case when mod(r.x, 5) = 0 then
                case when mod(r.x * 7, 10) < 6 then 'Jiu-Jitsu' when mod(r.x * 7, 10) < 8 then 'Judô'
                     when mod(r.x * 7, 10) < 9 then 'Karatê' else 'Taekwondo' end
              else
                case when mod(r.x * 7, 100) < 38 then 'Jiu-Jitsu' when mod(r.x * 7, 100) < 64 then 'Muay Thai'
                     when mod(r.x * 7, 100) < 79 then 'Boxe' when mod(r.x * 7, 100) < 88 then 'MMA'
                     when mod(r.x * 7, 100) < 93 then 'Judô' when mod(r.x * 7, 100) < 97 then 'Karatê'
                     else 'Taekwondo' end
         end as m1,
         -- 1 em cada 8 entrou neste mês, 1 em cada 8 no mês passado; os outros nos últimos 30 meses
         case when mod(r.x, 8) = 3 then dateadd('DAY', -mod(r.x, greatest(1, day_of_month(current_date) - 1)), current_date)
              when mod(r.x, 8) = 5 then dateadd('DAY', -(day_of_month(current_date) + mod(r.x, 27)), current_date)
              else dateadd('DAY', -(mod(r.x * 53, 900) + 20), current_date) end as inicio
  from system_range(1, 270) as r (x)
  join demo_nomes n on n.i = mod(r.x, 45)
  join demo_sobrenomes s on s.i = mod(r.x, 31)
) v;

insert into cp_clientes (store_id, nome, email, telefone, cpf, data_nascimento, created_at)
select '33333333-3333-4333-8333-333333333333', a.nome, a.email,
       '119' || lpad(cast(mod(a.x * 7919 + 5550123, 100000000) as varchar), 8, '0'),
       lpad(cast(mod(a.x * 104729 + 31415926, 100000000000) as varchar), 11, '0'),
       a.nascimento,
       cast(a.inicio as timestamp) + interval '9' hour
from demo_alunos a;

create table demo_ids (x integer, cliente_id uuid);
insert into demo_ids
select a.x, c.id from demo_alunos a
join cp_clientes c on c.email = a.email and c.store_id = '33333333-3333-4333-8333-333333333333';

-- CPF fácil para testar a presença pelo QR Code (aluno x = 91, adulto e em dia).
update cp_clientes set cpf = '12345678900', telefone = '11999990091'
where id = (select cliente_id from demo_ids where x = 91);

insert into cp_assinaturas (store_id, cliente_id, plano_id, valor, status, inicio, cancelada_em, created_at)
select '33333333-3333-4333-8333-333333333333', i.cliente_id, p.id, p.preco,
       case when a.cancelada is null then 'ativa' else 'cancelada' end,
       a.inicio,
       cast(a.cancelada as timestamp) + interval '15' hour,
       dateadd('HOUR', 8 + mod(a.x, 11), cast(a.inicio as timestamp))
from demo_alunos a
join demo_ids i on i.x = a.x
join cp_planos p on p.nome = a.plano and p.store_id = '33333333-3333-4333-8333-333333333333';

-- Mensalidades (até 31 ciclos): em dia = pagas até hoje + a próxima pendente;
-- atrasado = a última vencida fica pendente; cancelada = pagas até o
-- cancelamento + a seguinte cancelada.
insert into cp_pagamentos (store_id, assinatura_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento, origem)
select '33333333-3333-4333-8333-333333333333', assinatura_id, cliente_id, valor, venc,
       case
         when cancelada is not null then case when venc <= cancelada then 'pago' else 'cancelado' end
         when atrasado then case when prox <= current_date then 'pago' else 'pendente' end
         else case when venc <= current_date then 'pago' else 'pendente' end
       end,
       least(dateadd('DAY', mod(gx, 3), cast(venc as timestamp)) + interval '10' hour,
             dateadd('MINUTE', -(15 + mod(gx * 17, 400)), localtimestamp)),
       case mod(gx + ciclo, 5) when 0 then 'pix' when 1 then 'cartao_credito' when 2 then 'pix'
                               when 3 then 'dinheiro' else 'cartao_debito' end,
       'artes-marciais'
from (
  select s.id as assinatura_id, s.cliente_id, s.valor, a.cancelada, a.atrasado, a.x as gx, r.x as ciclo,
         dateadd('MONTH', r.x * p.duracao_meses, a.inicio) as venc,
         dateadd('MONTH', (r.x + 1) * p.duracao_meses, a.inicio) as prox,
         dateadd('MONTH', (r.x - 1) * p.duracao_meses, a.inicio) as ant
  from demo_alunos a
  join demo_ids i on i.x = a.x
  join cp_assinaturas s on s.cliente_id = i.cliente_id
  join cp_planos p on p.id = s.plano_id
  cross join system_range(0, 31) as r (x)
) v
where case
        when cancelada is not null then venc <= cancelada or ant <= cancelada
        when atrasado then venc <= current_date
        else venc <= current_date or ant <= current_date
      end;

update cp_pagamentos set pago_em = null, forma_pagamento = null
where store_id = '33333333-3333-4333-8333-333333333333' and status <> 'pago';

-- Indicações: 1 em cada 7 alunos veio indicado por outro (programa de indicações).
update cp_clientes c set indicado_por_id = (
  select i2.cliente_id from demo_ids i1 join demo_ids i2 on i2.x = mod(i1.x * 13, 97) + 1
  where i1.cliente_id = c.id)
where c.store_id = '33333333-3333-4333-8333-333333333333'
  and exists (select 1 from demo_ids i where i.cliente_id = c.id and mod(i.x, 7) = 2 and i.x > 98);

-- ---------------------------------------------------------------------------
-- Aluno em cada modalidade: faixa pelo tempo de treino ("passos" na trilha
-- da idade). Veteranos (x terminado em 7) chegaram com faixa.
-- ---------------------------------------------------------------------------
create table demo_am (x integer, cliente_id uuid, modalidade_id uuid, modalidade text, kid boolean, inicio date,
  fim date, meses integer, passo_meses integer, passo integer, faixa_ordem integer, faixa_desde date,
  graus_max integer, grau integer, grau_desde date);

insert into demo_am (x, cliente_id, modalidade_id, modalidade, kid, inicio, fim, meses, passo_meses)
select a.x, i.cliente_id, m.id, m.nome, a.kid,
       case when mm.segunda then dateadd('DAY', mod(a.x * 11, 40), a.inicio) else a.inicio end,
       coalesce(a.cancelada, current_date),
       0,
       case when m.nome = 'Jiu-Jitsu' and a.kid then 5 when m.nome = 'Jiu-Jitsu' then 16
            when m.nome in ('Boxe', 'MMA') then 7 else 6 end
from demo_alunos a
join demo_ids i on i.x = a.x
join (select false as segunda union all select true) mm on (not mm.segunda) or a.m2 is not null
join artes_marciais_modalidades m on m.store_id = '33333333-3333-4333-8333-333333333333'
  and m.nome = case when mm.segunda then a.m2 else a.m1 end;

update demo_am set inicio = least(inicio, current_date);
update demo_am set meses = datediff('MONTH', inicio, current_date);

-- trilha de faixas por modalidade e idade: posição 0, 1, 2... -> ordem da faixa
create table demo_trilha (modalidade text, kid boolean, passo integer, ordem integer);
insert into demo_trilha
select m.nome, k.kid, row_number() over (partition by m.id, k.kid order by f.ordem) - 1, f.ordem
from artes_marciais_modalidades m
join artes_marciais_faixas f on f.modalidade_id = m.id
cross join (select true as kid union all select false) k
where m.store_id = '33333333-3333-4333-8333-333333333333'
  and (f.publico = 'todos' or f.publico = case when k.kid then 'infantil' else 'adulto' end)
  and f.ordem < (select max(f2.ordem) from artes_marciais_faixas f2 where f2.modalidade_id = m.id);

update demo_am d set passo = least(
  (select max(t.passo) from demo_trilha t where t.modalidade = d.modalidade and t.kid = d.kid),
  meses / passo_meses + case when not kid and mod(x, 10) = 7 then 1 + mod(x, 2) else 0 end);

update demo_am d set faixa_ordem = (select t.ordem from demo_trilha t
  where t.modalidade = d.modalidade and t.kid = d.kid and t.passo = d.passo);

-- dia em que recebeu a faixa atual (veterano sem promoção aqui: desde que chegou)
update demo_am set faixa_desde = case
  when passo = 0 or meses / passo_meses = 0 then inicio
  else least(current_date, dateadd('DAY', -mod(x * 13, 25), dateadd('MONTH', (meses / passo_meses) * passo_meses, inicio)))
end;
update demo_am set faixa_desde = inicio where faixa_desde < inicio;

update demo_am d set graus_max = (select f.graus_maximos from artes_marciais_faixas f
  where f.modalidade_id = d.modalidade_id and f.ordem = d.faixa_ordem);

-- um grau a cada 3 meses (kids: 1 mês) na faixa, até o máximo; o último um
-- pouco antes, para alguns já estarem prontos para o próximo
update demo_am set grau = case when graus_max = 0 then 0
  else least(graus_max - case when mod(x, 4) = 0 then 0 else 1 end,
             greatest(0, datediff('MONTH', faixa_desde, current_date) / case when kid then 1 else 3 end - 1)) end;
update demo_am set grau = 0 where grau < 0;
update demo_am set grau_desde = case when grau = 0 then faixa_desde
  else least(current_date, dateadd('DAY', mod(x * 7, 20), dateadd('MONTH', grau * case when kid then 1 else 3 end, faixa_desde))) end;

-- Nem todo mundo está pronto para graduar: 9 em cada 10 receberam a faixa (e o
-- último grau) há pouco tempo.
update demo_am d set faixa_desde = greatest(d.inicio, dateadd('DAY',
    -((select f.meses_minimos from artes_marciais_faixas f
       where f.modalidade_id = d.modalidade_id and f.ordem = d.faixa_ordem) * 18 + mod(d.x, 20)), current_date))
where mod(d.x, 10) <> 0 and d.passo > 0;
update demo_am set grau = 1 where grau = 0 and graus_max > 0 and mod(x, 10) <> 0
  and faixa_desde < dateadd('DAY', -60, current_date);
update demo_am set grau_desde = greatest(faixa_desde, dateadd('DAY', -(8 + mod(x * 7, 30)), current_date))
where mod(x, 10) <> 0;
update demo_am set grau_desde = faixa_desde where grau = 0 or grau_desde < faixa_desde;

insert into artes_marciais_alunos (store_id, cliente_id, modalidade_id, faixa_id, grau, inicio, faixa_desde, grau_desde,
  ativo, created_at)
select '33333333-3333-4333-8333-333333333333', d.cliente_id, d.modalidade_id, f.id, d.grau, d.inicio, d.faixa_desde,
       d.grau_desde, true, cast(d.inicio as timestamp) + interval '9' hour
from demo_am d
join artes_marciais_faixas f on f.modalidade_id = d.modalidade_id and f.ordem = d.faixa_ordem;

-- ---------------------------------------------------------------------------
-- Turmas fixas: cada aluno numa aula da modalidade (que combina com a idade),
-- em 2 a 4 dias por semana. Presenças do último ano e check-ins de 9 semanas.
-- ---------------------------------------------------------------------------
create table demo_opcoes (modalidade_id uuid, kid boolean, aula_id uuid, rn integer, n integer, horarios integer);
insert into demo_opcoes
select am.modalidade_id, k.kid, am.aula_id,
       row_number() over (partition by am.modalidade_id, k.kid order by au.nome),
       count(*) over (partition by am.modalidade_id, k.kid),
       (select count(*) from academia_aula_horarios h where h.aula_id = am.aula_id)
from artes_marciais_aula_modalidades am
join academia_aulas au on au.id = am.aula_id
cross join (select true as kid union all select false) k
where am.store_id = '33333333-3333-4333-8333-333333333333'
  and (am.publico = 'todos' or am.publico = case when k.kid then 'infantil' else 'adulto' end);

-- kids de 11 a 14 anos vão para a turma "Kids (11 a 14 anos)"
insert into academia_turma_alunos (store_id, horario_id, cliente_id, desde, ativo)
select '33333333-3333-4333-8333-333333333333', h.id, d.cliente_id, d.inicio, d.fim >= current_date
from demo_am d
join demo_opcoes o on o.modalidade_id = d.modalidade_id and o.kid = d.kid
join academia_aula_horarios h on h.aula_id = o.aula_id
join academia_aulas au on au.id = o.aula_id
where o.rn = case
        when d.kid and d.modalidade = 'Jiu-Jitsu' then
          case when datediff('YEAR', (select c.data_nascimento from cp_clientes c where c.id = d.cliente_id), current_date) >= 11
               then 2 else 1 end
        else mod(d.x, o.n) + 1 end
  and (o.horarios <= 2 + mod(d.x, 3) or mod(h.dia_semana + d.x, 5) < 2 + mod(d.x, 3));

-- quem entrou recentemente numa aula "cheia" também aparece em aulas de outro horário
create table demo_presencas (horario_id uuid, cliente_id uuid, data date, hora time, x integer, status text);
insert into demo_presencas
select t.horario_id, t.cliente_id, dateadd('DAY', -r.x, current_date), h.hora_inicio, d.x,
       case when mod(abs(d.x * 7919 + r.x * 104729 + d.x * r.x * 31), 100) < 84 then 'presente' else 'faltou' end
from academia_turma_alunos t
join academia_aula_horarios h on h.id = t.horario_id
join academia_aulas au on au.id = h.aula_id
join demo_am d on d.cliente_id = t.cliente_id
join artes_marciais_aula_modalidades amod on amod.aula_id = au.id and amod.modalidade_id = d.modalidade_id
cross join system_range(0, 364) as r (x)
where t.store_id = '33333333-3333-4333-8333-333333333333'
  and iso_day_of_week(dateadd('DAY', -r.x, current_date)) = h.dia_semana
  and dateadd('DAY', -r.x, current_date) >= t.desde
  and dateadd('DAY', -r.x, current_date) <= d.fim
  and (r.x > 0 or dateadd('MINUTE', au.duracao_minutos, cast(current_date as timestamp) + h.hora_inicio) <= localtimestamp
       or (cast(current_date as timestamp) + h.hora_inicio <= localtimestamp and mod(d.x, 3) <> 0));

-- faltas antigas não viram linha (só a chamada das últimas 3 semanas)
delete from demo_presencas where status = 'faltou' and data < dateadd('DAY', -21, current_date);

-- quem está com a mensalidade atrasada há mais de 10 dias parou de vir
delete from demo_presencas p
where exists (select 1 from demo_alunos a join demo_ids i on i.x = a.x
              where i.cliente_id = p.cliente_id and a.atrasado)
  and p.data >= dateadd('DAY', -8, current_date);

insert into academia_aula_presencas (store_id, horario_id, cliente_id, data, avulso, status, origem, created_at)
select '33333333-3333-4333-8333-333333333333', horario_id, cliente_id, data, false, status,
       case when mod(x, 3) = 0 then 'area_cliente' else 'recepcao' end,
       dateadd('MINUTE', -mod(x, 12), cast(data as timestamp) + hora)
from demo_presencas;

-- Check-ins das últimas 9 semanas (uma entrada por aula com presença).
insert into academia_acessos (store_id, cliente_id, momento, meio, resultado)
select '33333333-3333-4333-8333-333333333333', p.cliente_id,
       dateadd('MINUTE', -(4 + mod(p.x * 7, 15)), cast(p.data as timestamp) + p.hora),
       case when mod(p.x, 3) = 0 then 'totem_qr' when mod(p.x, 3) = 1 then 'recepcao' else 'app' end,
       'liberado'
from demo_presencas p
where p.status = 'presente' and p.data >= dateadd('DAY', -63, current_date);

-- ---------------------------------------------------------------------------
-- Histórico de graduações (certificados): início, faixa atual e último grau.
-- ---------------------------------------------------------------------------
create table demo_prof (modalidade text, professor text);
insert into demo_prof values ('Jiu-Jitsu', 'Marcos Silva'), ('Muay Thai', 'Ana Costa'), ('Boxe', 'Ricardo Alves'),
  ('MMA', 'Rafael Tanaka'), ('Judô', 'Lucas Mota'), ('Karatê', 'Paula Nogueira'), ('Taekwondo', 'Paula Nogueira');

-- faixa de chegada: veteranos chegaram com a faixa da trilha anterior ao passo "pelo tempo"
insert into artes_marciais_graduacoes (store_id, cliente_id, modalidade_id, tipo, faixa_id, grau, data, observacao,
  codigo, created_at)
select '33333333-3333-4333-8333-333333333333', d.cliente_id, d.modalidade_id, 'inicial', f.id, 0, d.inicio,
       'Início na modalidade', upper(left(replace(cast(random_uuid() as varchar), '-', ''), 8)),
       cast(d.inicio as timestamp) + interval '9' hour
from demo_am d
join demo_trilha t on t.modalidade = d.modalidade and t.kid = d.kid
  and t.passo = case when not d.kid and mod(d.x, 10) = 7 then least(d.passo, 1 + mod(d.x, 2)) else 0 end
join artes_marciais_faixas f on f.modalidade_id = d.modalidade_id and f.ordem = t.ordem;

insert into artes_marciais_graduacoes (store_id, cliente_id, modalidade_id, tipo, faixa_id, grau, faixa_anterior_id,
  grau_anterior, data, professor_id, observacao, codigo, created_at)
select '33333333-3333-4333-8333-333333333333', d.cliente_id, d.modalidade_id, 'faixa', f.id, 0, fa.id,
       case when fa.graus_maximos > 0 then fa.graus_maximos else 0 end,
       d.faixa_desde, p.id, '', upper(left(replace(cast(random_uuid() as varchar), '-', ''), 8)),
       cast(d.faixa_desde as timestamp) + interval '19' hour + interval '30' minute
from demo_am d
join artes_marciais_faixas f on f.modalidade_id = d.modalidade_id and f.ordem = d.faixa_ordem
join demo_trilha ta on ta.modalidade = d.modalidade and ta.kid = d.kid and ta.passo = d.passo - 1
join artes_marciais_faixas fa on fa.modalidade_id = d.modalidade_id and fa.ordem = ta.ordem
join demo_prof dp on dp.modalidade = d.modalidade
join academia_profissionais p on p.nome = dp.professor and p.store_id = '33333333-3333-4333-8333-333333333333'
where d.passo > 0 and d.faixa_desde > d.inicio;

insert into artes_marciais_graduacoes (store_id, cliente_id, modalidade_id, tipo, faixa_id, grau, faixa_anterior_id,
  grau_anterior, data, professor_id, observacao, codigo, created_at)
select '33333333-3333-4333-8333-333333333333', d.cliente_id, d.modalidade_id, 'grau', f.id, d.grau, f.id, d.grau - 1,
       d.grau_desde, p.id, '', upper(left(replace(cast(random_uuid() as varchar), '-', ''), 8)),
       least(localtimestamp, cast(d.grau_desde as timestamp) + interval '20' hour)
from demo_am d
join artes_marciais_faixas f on f.modalidade_id = d.modalidade_id and f.ordem = d.faixa_ordem
join demo_prof dp on dp.modalidade = d.modalidade
join academia_profissionais p on p.nome = dp.professor and p.store_id = '33333333-3333-4333-8333-333333333333'
where d.grau > 0;

-- ---------------------------------------------------------------------------
-- Exames: um de Muay Thai já realizado (aprovados com certificado) e um de
-- Jiu-Jitsu marcado para daqui a 12 dias.
-- ---------------------------------------------------------------------------
insert into artes_marciais_exames (store_id, modalidade_id, titulo, data, hora, local, banca, status, observacao, created_at)
select '33333333-3333-4333-8333-333333333333', m.id, 'Exame de prajied - Muay Thai', dateadd('DAY', -40, current_date),
       time '10:00', 'Tatame 2', 'Kru Ana Costa', 'realizado', 'Trazer luvas, caneleiras e bandagem',
       dateadd('DAY', -70, now())
from artes_marciais_modalidades m where m.store_id = '33333333-3333-4333-8333-333333333333' and m.nome = 'Muay Thai';

insert into artes_marciais_exames (store_id, modalidade_id, titulo, data, hora, local, banca, status, observacao, created_at)
select '33333333-3333-4333-8333-333333333333', m.id, 'Exame de faixa - Jiu-Jitsu', dateadd('DAY', 12, current_date),
       time '10:00', 'Tatame 1', 'Prof. Marcos Silva e Prof. Lucas Mota', 'agendado',
       'Kimono limpo e faixa atual. Chegar 20 minutos antes.', dateadd('DAY', -6, now())
from artes_marciais_modalidades m where m.store_id = '33333333-3333-4333-8333-333333333333' and m.nome = 'Jiu-Jitsu';

-- aprovados no exame de Muay Thai: as graduações de faixa com a data do exame
update artes_marciais_graduacoes g set exame_id = (
  select e.id from artes_marciais_exames e where e.store_id = g.store_id and e.status = 'realizado')
where g.store_id = '33333333-3333-4333-8333-333333333333' and g.tipo = 'faixa'
  and g.modalidade_id = (select m.id from artes_marciais_modalidades m
                         where m.store_id = g.store_id and m.nome = 'Muay Thai')
  and g.data between dateadd('DAY', -46, current_date) and dateadd('DAY', -34, current_date);

update artes_marciais_graduacoes set data = dateadd('DAY', -40, current_date), observacao = 'Aprovado no exame'
where exame_id is not null;

update artes_marciais_alunos a set faixa_desde = dateadd('DAY', -40, current_date),
  grau_desde = dateadd('DAY', -40, current_date)
where exists (select 1 from artes_marciais_graduacoes g
              where g.exame_id is not null and g.cliente_id = a.cliente_id and g.modalidade_id = a.modalidade_id);

insert into cp_pagamentos (store_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento, origem, descricao)
select g.store_id, g.cliente_id, f.taxa_exame, dateadd('DAY', -40, current_date), 'pago',
       dateadd('DAY', -44, now()), 'pix', 'artes-marciais', 'Exame de faixa: ' || f.nome || ' (Muay Thai)'
from artes_marciais_graduacoes g
join artes_marciais_faixas f on f.id = g.faixa_id
where g.exame_id is not null and f.taxa_exame > 0;

insert into artes_marciais_exame_candidatos (store_id, exame_id, cliente_id, faixa_id, grau, pagamento_id, resultado,
  graduacao_id)
select g.store_id, g.exame_id, g.cliente_id, g.faixa_id, 0,
       (select max(p.id) from cp_pagamentos p where p.cliente_id = g.cliente_id and p.descricao like 'Exame de faixa:%'),
       'aprovado', g.id
from artes_marciais_graduacoes g where g.exame_id is not null;

-- candidatos do próximo exame de Jiu-Jitsu: os adultos há mais tempo na faixa
create table demo_candidatos (cliente_id uuid, faixa_id uuid, taxa numeric(10, 2), nome text, pago boolean);
insert into demo_candidatos
select v.cliente_id, v.proxima, v.taxa, v.nome, v.rn <= 3
from (
  select a.cliente_id, fn.id as proxima, fn.taxa_exame as taxa, f.nome,
         row_number() over (order by a.faixa_desde, a.cliente_id) as rn
  from artes_marciais_alunos a
  join artes_marciais_faixas f on f.id = a.faixa_id
  join artes_marciais_modalidades m on m.id = a.modalidade_id and m.nome = 'Jiu-Jitsu'
  join artes_marciais_faixas fn on fn.modalidade_id = m.id and fn.nome = case f.nome when 'Branca' then 'Azul'
       when 'Azul' then 'Roxa' when 'Roxa' then 'Marrom' end
  join cp_clientes c on c.id = a.cliente_id
  join cp_assinaturas s on s.cliente_id = c.id and s.status = 'ativa'
  where a.store_id = '33333333-3333-4333-8333-333333333333'
    and datediff('YEAR', c.data_nascimento, current_date) >= 18
    and a.faixa_desde <= dateadd('MONTH', -12, current_date)
) v
where v.rn <= 7;

insert into cp_pagamentos (store_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento, origem, descricao)
select '33333333-3333-4333-8333-333333333333', d.cliente_id, d.taxa, dateadd('DAY', 12, current_date),
       case when d.pago then 'pago' else 'pendente' end,
       case when d.pago then dateadd('DAY', -3, now()) end,
       case when d.pago then 'pix' end,
       'artes-marciais', 'Exame de faixa: ' || f.nome || ' (Jiu-Jitsu)'
from demo_candidatos d
join artes_marciais_faixas f on f.id = d.faixa_id;

insert into artes_marciais_exame_candidatos (store_id, exame_id, cliente_id, faixa_id, grau, pagamento_id, resultado)
select '33333333-3333-4333-8333-333333333333',
       (select e.id from artes_marciais_exames e where e.store_id = '33333333-3333-4333-8333-333333333333'
          and e.status = 'agendado'),
       d.cliente_id, d.faixa_id, 0,
       (select max(p.id) from cp_pagamentos p where p.cliente_id = d.cliente_id and p.descricao like 'Exame de faixa:%'),
       'pendente'
from demo_candidatos d;

drop table demo_candidatos;

-- ---------------------------------------------------------------------------
-- Currículo (o que se aprende em cada faixa).
-- ---------------------------------------------------------------------------
create table demo_tecnicas (modalidade text, faixa text, categoria text, nome text, descricao text, ordem integer);
insert into demo_tecnicas values
  ('Jiu-Jitsu', 'Branca', 'Fundamentos', 'Rolamento para frente e para trás', 'Cair e levantar com segurança', 1),
  ('Jiu-Jitsu', 'Branca', 'Fundamentos', 'Fuga de quadril', 'Base de todas as saídas por baixo', 2),
  ('Jiu-Jitsu', 'Branca', 'Quedas', 'Baiana (double leg)', 'Entrada, pegada nas pernas e finalização da queda', 3),
  ('Jiu-Jitsu', 'Branca', 'Quedas', 'O-soto-gari', 'Queda de judô adaptada ao Jiu-Jitsu', 4),
  ('Jiu-Jitsu', 'Branca', 'Guarda', 'Guarda fechada: postura e quebra', 'Controle de postura do adversário', 5),
  ('Jiu-Jitsu', 'Branca', 'Raspagens', 'Raspagem de tesoura', 'Raspagem clássica da guarda fechada', 6),
  ('Jiu-Jitsu', 'Branca', 'Raspagens', 'Raspagem de gancho (butterfly)', 'Elevar e virar com o gancho', 7),
  ('Jiu-Jitsu', 'Branca', 'Passagens', 'Passagem toreando', 'Controle das calças e giro para o lado', 8),
  ('Jiu-Jitsu', 'Branca', 'Finalizações', 'Armlock da guarda', 'Ângulo, quadril alto e joelhos juntos', 9),
  ('Jiu-Jitsu', 'Branca', 'Finalizações', 'Triângulo', 'Ajuste do ângulo e puxada da cabeça', 10),
  ('Jiu-Jitsu', 'Branca', 'Finalizações', 'Estrangulamento cruzado', 'Pegadas profundas na gola', 11),
  ('Jiu-Jitsu', 'Branca', 'Defesas', 'Saída da montada (upa)', 'Prender braço e perna e rolar', 12),
  ('Jiu-Jitsu', 'Azul', 'Guarda', 'Guarda aranha', 'Pegadas nas mangas e controle com os pés', 1),
  ('Jiu-Jitsu', 'Azul', 'Guarda', 'De La Riva', 'Gancho por fora e controle do tornozelo', 2),
  ('Jiu-Jitsu', 'Azul', 'Passagens', 'Passagem emborcando', 'Pressão e controle do quadril', 3),
  ('Jiu-Jitsu', 'Azul', 'Costas', 'Pegada das costas e ganchos', 'Cinto de segurança e ganchos', 4),
  ('Jiu-Jitsu', 'Azul', 'Finalizações', 'Mata-leão', 'Da pegada das costas', 5),
  ('Jiu-Jitsu', 'Azul', 'Finalizações', 'Kimura', 'Da guarda e do cem-quilos', 6),
  ('Jiu-Jitsu', 'Cinza e branca', 'Fundamentos', 'Rolamentos e quedas', 'Aprender a cair sem se machucar', 1),
  ('Jiu-Jitsu', 'Cinza e branca', 'Fundamentos', 'Posição de base', 'Base forte em pé e de joelhos', 2),
  ('Jiu-Jitsu', 'Cinza e branca', 'Controle', 'Cem-quilos', 'Controle lateral com segurança', 3),
  ('Jiu-Jitsu', 'Cinza e branca', 'Valores', 'Respeito no tatame', 'Cumprimentar, ouvir e ajudar o colega', 4),
  ('Muay Thai', 'Branca', 'Base', 'Guarda e deslocamento', 'Postura, base e movimentação', 1),
  ('Muay Thai', 'Branca', 'Socos', 'Jab, direto, cruzado e upper', 'Combinações 1-2 e 1-2-3', 2),
  ('Muay Thai', 'Branca', 'Chutes', 'Chute baixo (low kick)', 'Giro do quadril e canela', 3),
  ('Muay Thai', 'Branca', 'Chutes', 'Teep (chute frontal)', 'Para parar o adversário', 4),
  ('Muay Thai', 'Branca', 'Defesas', 'Bloqueio de chute', 'Levantar a canela', 5),
  ('Muay Thai', 'Branca e vermelha', 'Joelhadas', 'Joelhada reta', 'Da guarda e do clinch', 1),
  ('Muay Thai', 'Branca e vermelha', 'Cotoveladas', 'Cotovelada horizontal', 'Curta distância', 2);

insert into artes_marciais_tecnicas (store_id, modalidade_id, faixa_id, categoria, nome, descricao, ordem)
select '33333333-3333-4333-8333-333333333333', m.id, f.id, t.categoria, t.nome, t.descricao, t.ordem
from demo_tecnicas t
join artes_marciais_modalidades m on m.nome = t.modalidade and m.store_id = '33333333-3333-4333-8333-333333333333'
join artes_marciais_faixas f on f.modalidade_id = m.id and f.nome = t.faixa;

drop table demo_tecnicas;

-- ---------------------------------------------------------------------------
-- Eventos, inscrições e medalhas.
-- ---------------------------------------------------------------------------
create table demo_eventos (nome text, tipo text, modalidade text, dias integer, hora time, local text,
  organizador text, valor integer, vagas integer, ate integer, descricao text, qtd integer, kids boolean);
insert into demo_eventos values
  ('Copa Dojo Centro de Jiu-Jitsu', 'campeonato', 'Jiu-Jitsu', 20, time '09:00', 'Dojo Centro - Tatames 1 e 2', '', 60, 80, 15,
   'Campeonato interno com chaves por faixa, idade e peso. Medalha para todos os atletas kids.', 16, false),
  ('Copa Kids Dojo Centro', 'campeonato', 'Jiu-Jitsu', 48, time '09:00', 'Dojo Centro - Tatame 1', '', 40, 40, 40,
   'Festival infantil: todas as crianças lutam e ganham medalha.', 8, true),
  ('Seminário de Jiu-Jitsu com Mestre Renato Lima', 'seminario', 'Jiu-Jitsu', 35, time '14:00', 'Dojo Centro - Tatame 1',
   'Mestre Renato Lima (convidado)', 150, 40, 33, 'Passagens de guarda e jogo por cima. Aberto a todas as faixas.', 9, false),
  ('Aulão beneficente de Muay Thai', 'aulao', 'Muay Thai', 9, time '10:00', 'Dojo Centro - Tatame 2', '', 0, 50, 8,
   'Entrada: 2 kg de alimento não perecível. Traga um amigo!', 18, false),
  ('Confraternização de fim de ano', 'confraternizacao', null, 74, time '19:00', 'Salão de festas do Dojo Centro', '', 0, null, 70,
   'Entrega de faixas simbólicas, sorteios e churrasco.', 0, false),
  ('Campeonato Paulista de Jiu-Jitsu', 'campeonato', 'Jiu-Jitsu', -45, time '08:00', 'Ginásio do Ibirapuera - São Paulo',
   'Federação Paulista de Jiu-Jitsu', 120, null, -60, 'Etapa estadual. Filiação em dia obrigatória.', 10, false),
  ('Copa São Paulo de Muay Thai', 'campeonato', 'Muay Thai', -80, time '09:00', 'Ginásio do Tatuapé - São Paulo',
   'Federação Paulista de Muay Thai', 90, null, -95, 'Lutas amadoras com proteção.', 6, false);

insert into artes_marciais_eventos (store_id, tipo, nome, descricao, modalidade_id, data, hora, local, organizador,
  valor_inscricao, vagas, inscricoes_ate, participa_indicacoes, aberto_no_app, created_at)
select '33333333-3333-4333-8333-333333333333', e.tipo, e.nome, e.descricao, m.id, dateadd('DAY', e.dias, current_date),
       e.hora, e.local, e.organizador, e.valor, e.vagas, dateadd('DAY', e.ate, current_date), false, true,
       dateadd('DAY', least(-3, e.dias - 30), now())
from demo_eventos e
left join artes_marciais_modalidades m on m.nome = e.modalidade and m.store_id = '33333333-3333-4333-8333-333333333333';

-- inscritos: alunos ativos da modalidade (kids no evento kids), um "sorteio" pelo x
create table demo_inscritos (evento_id uuid, evento text, cliente_id uuid, x integer, rn integer, valor numeric(10, 2),
  data date, passado boolean, faixa text, categoria text);
insert into demo_inscritos
select v.evento_id, v.evento, v.cliente_id, v.x, v.rn, v.valor, v.data, v.passado, v.faixa, v.categoria
from (
  select ev.id as evento_id, ev.nome as evento, d.cliente_id, d.x, ev.valor_inscricao as valor, ev.data,
         ev.data < current_date as passado,
         f.nome || case when a.grau > 0 then ' · ' || a.grau || case when a.grau = 1 then ' grau' else ' graus' end else '' end as faixa,
         case when d.kid then 'Infantil (' || datediff('YEAR', c.data_nascimento, current_date) || ' anos)'
              when datediff('YEAR', c.data_nascimento, current_date) >= 30 then 'Master ' || least(7, (datediff('YEAR', c.data_nascimento, current_date) - 30) / 5 + 1)
              else 'Adulto' end || ' · ' || f.nome as categoria,
         row_number() over (partition by ev.id order by mod(d.x * 37 + length(ev.nome) * 11, 101)) as rn,
         de.qtd
  from artes_marciais_eventos ev
  join demo_eventos de on de.nome = ev.nome
  join demo_am d on d.modalidade_id = ev.modalidade_id and d.kid = de.kids and d.fim >= least(ev.data, current_date)
  join artes_marciais_alunos a on a.cliente_id = d.cliente_id and a.modalidade_id = d.modalidade_id
  join artes_marciais_faixas f on f.id = a.faixa_id
  join cp_clientes c on c.id = d.cliente_id
  where ev.store_id = '33333333-3333-4333-8333-333333333333' and d.inicio < dateadd('DAY', -30, least(ev.data, current_date))
) v
where v.rn <= v.qtd;

insert into cp_pagamentos (store_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento, origem, descricao)
select '33333333-3333-4333-8333-333333333333', i.cliente_id, i.valor, dateadd('DAY', -5, i.data),
       case when i.passado or mod(i.rn, 3) <> 0 then 'pago' else 'pendente' end,
       case when i.passado or mod(i.rn, 3) <> 0
            then least(dateadd('HOUR', -(i.rn * 7 + 2), now()), cast(dateadd('DAY', -20, i.data) as timestamp) + interval '11' hour) end,
       case when i.passado or mod(i.rn, 3) <> 0 then case when mod(i.rn, 2) = 0 then 'pix' else 'cartao_credito' end end,
       'artes-marciais', 'Inscrição: ' || i.evento
from demo_inscritos i where i.valor > 0;

insert into artes_marciais_inscricoes (store_id, evento_id, cliente_id, categoria, faixa, peso, pagamento_id, resultado,
  origem, created_at)
select '33333333-3333-4333-8333-333333333333', i.evento_id, i.cliente_id, i.categoria, i.faixa,
       55 + mod(i.x * 13, 40) + mod(i.x, 10) / 10.0,
       (select max(p.id) from cp_pagamentos p where p.cliente_id = i.cliente_id and p.descricao = 'Inscrição: ' || i.evento),
       case when i.passado then case when i.rn <= 3 then 'ouro' when i.rn <= 5 then 'prata' when i.rn <= 8 then 'bronze'
                                     else 'participou' end end,
       case when mod(i.x, 2) = 0 then 'area_aluno' else 'recepcao' end,
       least(dateadd('HOUR', -(i.rn * 9 + 1), now()), cast(dateadd('DAY', -25, i.data) as timestamp) + interval '10' hour)
from demo_inscritos i;

update artes_marciais_inscricoes set peso = null
where store_id = '33333333-3333-4333-8333-333333333333'
  and evento_id in (select id from artes_marciais_eventos where tipo <> 'campeonato');

drop table demo_inscritos;
drop table demo_eventos;

-- Filiações: atletas de Jiu-Jitsu (CBJJ) e de Muay Thai (FPMT); algumas vencendo.
insert into artes_marciais_filiacoes (store_id, cliente_id, entidade, numero, validade, created_at)
select '33333333-3333-4333-8333-333333333333', d.cliente_id,
       case when d.modalidade = 'Jiu-Jitsu' then 'CBJJ' else 'FPMT' end,
       lpad(cast(mod(d.x * 7717, 90000) + 10000 as varchar), 6, '0'),
       dateadd('DAY', mod(d.x * 37, 400) - 40, current_date),
       dateadd('DAY', -mod(d.x * 5, 200), now())
from demo_am d
where d.modalidade in ('Jiu-Jitsu', 'Muay Thai') and not d.kid and d.fim >= current_date and mod(d.x, 4) = 1;

-- ---------------------------------------------------------------------------
-- Loja: produtos, tamanhos, estoque e vendas.
-- ---------------------------------------------------------------------------
create table demo_produtos (nome text, categoria text, preco numeric(10, 2), custo numeric(10, 2), foto text,
  descricao text);
insert into demo_produtos values
  ('Kimono trançado branco', 'kimono', 389.90, 210, '/artes-marciais/kimono-branco.jpg', 'Trançado 450 g, com o bordado do Dojo Centro'),
  ('Kimono trançado azul', 'kimono', 399.90, 215, '/artes-marciais/kimono-azul.jpg', 'Trançado 450 g azul-royal'),
  ('Faixa de Jiu-Jitsu', 'faixa', 59.90, 18, '/artes-marciais/faixas.jpg', 'Todas as cores (informe na venda)'),
  ('Rashguard Dojo Centro', 'rashguard', 149.90, 62, '/artes-marciais/rashguard.jpg', 'Manga longa, para No-Gi e MMA'),
  ('Bermuda de Muay Thai', 'bermuda', 129.90, 48, '/artes-marciais/bermuda.jpg', 'Cetim, estilo tailandês'),
  ('Luvas de boxe', 'luvas', 219.90, 105, '/artes-marciais/luvas.jpg', 'Couro sintético com velcro'),
  ('Caneleira', 'protecao', 159.90, 70, '/artes-marciais/caneleira.jpg', 'Proteção de canela e peito do pé'),
  ('Protetor bucal', 'protecao', 29.90, 8, '', 'Moldável com água quente'),
  ('Bandagem elástica', 'acessorio', 34.90, 11, '', 'Par, 3 metros'),
  ('Camiseta Dojo Centro', 'camiseta', 79.90, 28, '', 'Algodão, com o lema do dojo');

create table demo_tamanhos (produto text, tamanho text, ordem integer, estoque integer);
insert into demo_tamanhos values
  ('Kimono trançado branco', 'A0', 0, 3), ('Kimono trançado branco', 'A1', 1, 5), ('Kimono trançado branco', 'A2', 2, 6),
  ('Kimono trançado branco', 'A3', 3, 4), ('Kimono trançado branco', 'A4', 4, 1), ('Kimono trançado branco', 'M0', 5, 3),
  ('Kimono trançado branco', 'M1', 6, 4), ('Kimono trançado branco', 'M2', 7, 2), ('Kimono trançado branco', 'M3', 8, 3),
  ('Kimono trançado azul', 'A1', 0, 2), ('Kimono trançado azul', 'A2', 1, 3), ('Kimono trançado azul', 'A3', 2, 2),
  ('Kimono trançado azul', 'A4', 3, 1),
  ('Faixa de Jiu-Jitsu', 'M1', 0, 8), ('Faixa de Jiu-Jitsu', 'M2', 1, 8), ('Faixa de Jiu-Jitsu', 'M3', 2, 6),
  ('Faixa de Jiu-Jitsu', 'A1', 3, 9), ('Faixa de Jiu-Jitsu', 'A2', 4, 12), ('Faixa de Jiu-Jitsu', 'A3', 5, 10),
  ('Faixa de Jiu-Jitsu', 'A4', 6, 4),
  ('Rashguard Dojo Centro', 'P', 0, 4), ('Rashguard Dojo Centro', 'M', 1, 7), ('Rashguard Dojo Centro', 'G', 2, 5),
  ('Rashguard Dojo Centro', 'GG', 3, 2),
  ('Bermuda de Muay Thai', 'P', 0, 3), ('Bermuda de Muay Thai', 'M', 1, 6), ('Bermuda de Muay Thai', 'G', 2, 4),
  ('Bermuda de Muay Thai', 'GG', 3, 2),
  ('Luvas de boxe', '10oz', 0, 3), ('Luvas de boxe', '12oz', 1, 6), ('Luvas de boxe', '14oz', 2, 5),
  ('Luvas de boxe', '16oz', 3, 2),
  ('Caneleira', 'P', 0, 3), ('Caneleira', 'M', 1, 5), ('Caneleira', 'G', 2, 4),
  ('Protetor bucal', 'Único', 0, 25), ('Bandagem elástica', 'Único', 0, 18),
  ('Camiseta Dojo Centro', 'P', 0, 6), ('Camiseta Dojo Centro', 'M', 1, 10), ('Camiseta Dojo Centro', 'G', 2, 8),
  ('Camiseta Dojo Centro', 'GG', 3, 4);

insert into artes_marciais_produtos (store_id, nome, categoria, descricao, preco, custo, foto, participa_indicacoes, created_at)
select '33333333-3333-4333-8333-333333333333', nome, categoria, descricao, preco, custo, foto,
       categoria in ('kimono', 'rashguard'), dateadd('DAY', -120, now())
from demo_produtos;

insert into artes_marciais_produto_tamanhos (store_id, produto_id, tamanho, estoque, estoque_minimo, ordem)
select '33333333-3333-4333-8333-333333333333', p.id, t.tamanho, t.estoque,
       case when p.categoria = 'kimono' then 2 when p.categoria in ('protecao', 'acessorio') then 5 else 1 end, t.ordem
from demo_tamanhos t
join artes_marciais_produtos p on p.nome = t.produto and p.store_id = '33333333-3333-4333-8333-333333333333';

-- estoque inicial (histórico)
insert into artes_marciais_estoque_movimentos (store_id, tamanho_id, quantidade, motivo, observacao, created_at)
select store_id, id, estoque + 2, 'entrada', 'Estoque inicial', dateadd('DAY', -120, now())
from artes_marciais_produto_tamanhos where store_id = '33333333-3333-4333-8333-333333333333';

-- 24 vendas nos últimos 75 dias (a maioria paga)
create table demo_vendas (n integer, cliente_id uuid, produto text, tamanho text, qtd integer, dias integer, pago boolean);
insert into demo_vendas
select r.x, (select i.cliente_id from demo_ids i where i.x = mod(r.x * 29, 250) + 3),
       case mod(r.x, 8) when 0 then 'Kimono trançado branco' when 1 then 'Faixa de Jiu-Jitsu' when 2 then 'Luvas de boxe'
            when 3 then 'Rashguard Dojo Centro' when 4 then 'Bermuda de Muay Thai' when 5 then 'Camiseta Dojo Centro'
            when 6 then 'Caneleira' else 'Protetor bucal' end,
       null, 1 + case when mod(r.x, 8) = 7 then 1 else 0 end, mod(r.x * 17, 75), mod(r.x, 6) <> 0
from system_range(1, 24) as r (x);

update demo_vendas v set tamanho = (
  select t.tamanho from demo_tamanhos t where t.produto = v.produto
  order by mod(t.ordem * 7 + v.n, 5), t.ordem limit 1);

insert into cp_pagamentos (store_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento, origem, descricao, created_at)
select '33333333-3333-4333-8333-333333333333', v.cliente_id, p.preco * v.qtd, dateadd('DAY', -v.dias + 7, current_date),
       case when v.pago then 'pago' else 'pendente' end,
       case when v.pago then dateadd('HOUR', -(v.dias * 24 + 3), now()) end,
       case when v.pago then case when mod(v.n, 2) = 0 then 'pix' else 'cartao_debito' end end,
       'artes-marciais', 'Loja: ' || v.produto || case when v.qtd > 1 then ' (' || v.qtd || 'x)' else '' end || ' #' || v.n,
       dateadd('HOUR', -(v.dias * 24 + 3), now())
from demo_vendas v
join artes_marciais_produtos p on p.nome = v.produto and p.store_id = '33333333-3333-4333-8333-333333333333';

insert into artes_marciais_vendas (store_id, cliente_id, pagamento_id, total, status, entregue, observacao, created_at)
select '33333333-3333-4333-8333-333333333333', v.cliente_id, pg.id, pg.valor, 'ativa', mod(v.n, 7) <> 0, '',
       dateadd('HOUR', -(v.dias * 24 + 3), now())
from demo_vendas v
join cp_pagamentos pg on pg.descricao like 'Loja: %#' || v.n and pg.store_id = '33333333-3333-4333-8333-333333333333';

insert into artes_marciais_venda_itens (store_id, venda_id, produto_id, tamanho_id, nome, tamanho, quantidade, preco_unitario)
select '33333333-3333-4333-8333-333333333333', vd.id, p.id, t.id, p.nome, t.tamanho, v.qtd, p.preco
from demo_vendas v
join cp_pagamentos pg on pg.descricao like 'Loja: %#' || v.n and pg.store_id = '33333333-3333-4333-8333-333333333333'
join artes_marciais_vendas vd on vd.pagamento_id = pg.id
join artes_marciais_produtos p on p.nome = v.produto and p.store_id = '33333333-3333-4333-8333-333333333333'
join artes_marciais_produto_tamanhos t on t.produto_id = p.id and t.tamanho = v.tamanho;

insert into artes_marciais_estoque_movimentos (store_id, tamanho_id, quantidade, motivo, observacao, created_at)
select i.store_id, i.tamanho_id, -i.quantidade, 'venda', '', vd.created_at
from artes_marciais_venda_itens i join artes_marciais_vendas vd on vd.id = i.venda_id
where i.store_id = '33333333-3333-4333-8333-333333333333';

-- tira o "#n" usado só para ligar as linhas
update cp_pagamentos set descricao = left(descricao, locate(' #', descricao) - 1)
where store_id = '33333333-3333-4333-8333-333333333333' and descricao like 'Loja: %#%';

drop table demo_vendas;
drop table demo_tamanhos;
drop table demo_produtos;

-- ---------------------------------------------------------------------------
-- Equipamentos e manutenções (as com custo viraram despesas).
-- ---------------------------------------------------------------------------
insert into artes_marciais_equipamentos (store_id, nome, categoria, quantidade, local, estado, intervalo_manutencao_dias,
  ultima_manutencao, aquisicao, valor, observacao, created_at) values
  ('33333333-3333-4333-8333-333333333333', 'Tatame EVA 40 mm', 'tatame', 120, 'Tatame 1', 'bom', 180,
   dateadd('DAY', -60, current_date), dateadd('DAY', -700, current_date), 14400, 'Placas 1 x 1 m', dateadd('DAY', -700, now())),
  ('33333333-3333-4333-8333-333333333333', 'Tatame EVA 40 mm', 'tatame', 80, 'Tatame 2', 'atencao', 180,
   dateadd('DAY', -170, current_date), dateadd('DAY', -900, current_date), 9600, '6 placas com a borda soltando', dateadd('DAY', -900, now())),
  ('33333333-3333-4333-8333-333333333333', 'Saco de pancada 1,5 m', 'saco', 8, 'Tatame 2', 'bom', 120,
   dateadd('DAY', -150, current_date), dateadd('DAY', -500, current_date), 3200, 'Verificar correntes e costuras', dateadd('DAY', -500, now())),
  ('33333333-3333-4333-8333-333333333333', 'Luvas coletivas (pares)', 'luvas', 20, 'Armário', 'atencao', 90,
   dateadd('DAY', -40, current_date), dateadd('DAY', -300, current_date), 2400, '4 pares com o velcro gasto', dateadd('DAY', -300, now())),
  ('33333333-3333-4333-8333-333333333333', 'Aparadores de soco (manoplas)', 'aparador', 12, 'Armário', 'bom', null,
   null, dateadd('DAY', -250, current_date), 960, '', dateadd('DAY', -250, now())),
  ('33333333-3333-4333-8333-333333333333', 'Escudos de chute (Thai pads)', 'aparador', 8, 'Tatame 2', 'bom', null,
   null, dateadd('DAY', -400, current_date), 1760, '', dateadd('DAY', -400, now())),
  ('33333333-3333-4333-8333-333333333333', 'Boneco de grappling', 'manequim', 2, 'Tatame 1', 'bom', null,
   null, dateadd('DAY', -200, current_date), 1300, '', dateadd('DAY', -200, now())),
  ('33333333-3333-4333-8333-333333333333', 'Capacetes e protetores de sparring', 'protecao', 10, 'Armário', 'bom', 180,
   dateadd('DAY', -30, current_date), dateadd('DAY', -350, current_date), 2100, '', dateadd('DAY', -350, now())),
  ('33333333-3333-4333-8333-333333333333', 'Caixa de som e cronômetro de parede', 'som_video', 1, 'Tatame 2', 'manutencao', 365,
   dateadd('DAY', -380, current_date), dateadd('DAY', -800, current_date), 1450, 'Som chiando no volume alto', dateadd('DAY', -800, now()));

insert into academia_despesas (store_id, descricao, categoria, fornecedor, valor, vencimento, status, pago_em,
  forma_pagamento, recorrente, observacao, created_at) values
  ('33333333-3333-4333-8333-333333333333', 'Manutenção: Tatame EVA 40 mm', 'manutencao', 'Tatames SP', 380,
   dateadd('DAY', -60, current_date), 'paga', dateadd('DAY', -60, now()), 'pix', false, 'Troca de 4 placas', dateadd('DAY', -60, now())),
  ('33333333-3333-4333-8333-333333333333', 'Manutenção: Saco de pancada 1,5 m', 'manutencao', 'Casa das Lutas', 240,
   dateadd('DAY', -150, current_date), 'paga', dateadd('DAY', -150, now()), 'dinheiro', false, 'Costura e correntes novas', dateadd('DAY', -150, now())),
  ('33333333-3333-4333-8333-333333333333', 'Manutenção: Luvas coletivas (pares)', 'manutencao', 'Casa das Lutas', 90,
   dateadd('DAY', -40, current_date), 'paga', dateadd('DAY', -40, now()), 'pix', false, 'Higienização', dateadd('DAY', -40, now()));

insert into artes_marciais_manutencoes (store_id, equipamento_id, data, descricao, custo, despesa_id, created_at)
select e.store_id, e.id, e.ultima_manutencao,
       case e.categoria when 'tatame' then 'Troca de placas e limpeza' when 'saco' then 'Costura e correntes novas'
            when 'luvas' then 'Higienização' else 'Revisão geral' end,
       d.valor, d.id, cast(e.ultima_manutencao as timestamp) + interval '15' hour
from artes_marciais_equipamentos e
left join academia_despesas d on d.store_id = e.store_id and d.descricao = 'Manutenção: ' || e.nome
  and d.vencimento = e.ultima_manutencao
where e.store_id = '33333333-3333-4333-8333-333333333333' and e.ultima_manutencao is not null;

-- ---------------------------------------------------------------------------
-- Responsáveis dos kids (3 kids ficam sem, para aparecer o aviso). Os irmãos
-- Ferreira têm o mesmo responsável.
-- ---------------------------------------------------------------------------
create table demo_resp (x integer, cliente_id uuid, nome text, parentesco text, telefone text);
insert into demo_resp
select a.x, i.cliente_id,
       case when mod(a.x, 2) = 0 then 'Cláudia ' else 'Roberto ' end || s.sobrenome,
       case when mod(a.x, 2) = 0 then 'mãe' else 'pai' end,
       '119' || lpad(cast(mod(a.x * 6007 + 7770000, 100000000) as varchar), 8, '0')
from demo_alunos a
join demo_ids i on i.x = a.x
join demo_sobrenomes s on s.i = mod(a.x, 31)
where a.kid and a.cancelada is null and mod(a.x, 75) <> 0;

insert into artes_marciais_responsaveis (store_id, nome, telefone, email, codigo, created_at)
select distinct '33333333-3333-4333-8333-333333333333', r.nome, r.telefone,
       lower(replace(replace(replace(r.nome, ' ', '.'), 'á', 'a'), 'ã', 'a')) || r.x || '@email.com',
       case when r.x = 30 then 'familia-demo' else lower(left(replace(cast(random_uuid() as varchar), '-', ''), 10)) end,
       dateadd('DAY', -mod(r.x, 90), now())
from demo_resp r;

insert into artes_marciais_dependentes (store_id, responsavel_id, cliente_id, parentesco)
select '33333333-3333-4333-8333-333333333333', rs.id, r.cliente_id, r.parentesco
from demo_resp r
join artes_marciais_responsaveis rs on rs.telefone = r.telefone and rs.store_id = '33333333-3333-4333-8333-333333333333';

-- irmão: o kid x = 185 também fica com o responsável do x = 30 (área "familia-demo")
insert into artes_marciais_dependentes (store_id, responsavel_id, cliente_id, parentesco)
select '33333333-3333-4333-8333-333333333333', rs.id, i.cliente_id, 'mãe'
from artes_marciais_responsaveis rs, demo_ids i
where rs.codigo = 'familia-demo' and i.x = 185
  and not exists (select 1 from artes_marciais_dependentes d where d.responsavel_id = rs.id and d.cliente_id = i.cliente_id);

drop table demo_resp;

-- ---------------------------------------------------------------------------
-- Comunicados (mural e WhatsApp).
-- ---------------------------------------------------------------------------
insert into artes_marciais_comunicados (store_id, titulo, texto, publico, filtro_id, whatsapp, mural, mural_ate, created_at)
select '33333333-3333-4333-8333-333333333333', 'Exame de faixa de Jiu-Jitsu',
       'Olá, {nome}! Nosso exame de faixa de Jiu-Jitsu será no dia ' ||
       formatdatetime(dateadd('DAY', 12, current_date), 'dd/MM') ||
       ', às 10h. Quem foi indicado pelo professor já recebeu a confirmação. Oss!',
       'modalidade', m.id, false, true, dateadd('DAY', 12, current_date), dateadd('DAY', -5, now())
from artes_marciais_modalidades m where m.store_id = '33333333-3333-4333-8333-333333333333' and m.nome = 'Jiu-Jitsu';

insert into artes_marciais_comunicados (store_id, titulo, texto, publico, filtro_id, whatsapp, mural, mural_ate, created_at) values
  ('33333333-3333-4333-8333-333333333333', 'Feriado: sem aulas no dia 12/10',
   'Olá, {nome}! No feriado de 12 de outubro o {academia} estará fechado. Voltamos no dia 13 com a grade normal. Bom descanso!',
   'todos', null, true, true, date '2026-10-12', dateadd('DAY', -2, now()));

insert into artes_marciais_comunicado_envios (store_id, comunicado_id, cliente_id, nome, telefone, texto, enviado_em)
select '33333333-3333-4333-8333-333333333333', co.id, c.id, c.nome, c.telefone,
       replace(replace(co.texto, '{nome}', left(c.nome, locate(' ', c.nome) - 1)), '{academia}', 'Dojo Centro'),
       case when mod(i.x, 5) < 3 then dateadd('MINUTE', -(i.x * 3), now()) end
from artes_marciais_comunicados co
join cp_assinaturas s on s.store_id = co.store_id and s.status = 'ativa'
join cp_clientes c on c.id = s.cliente_id
join demo_ids i on i.cliente_id = c.id
where co.store_id = '33333333-3333-4333-8333-333333333333' and co.whatsapp;

-- ---------------------------------------------------------------------------
-- Despesas fixas dos últimos 6 meses, serviços e avaliações físicas.
-- ---------------------------------------------------------------------------
create table demo_despesas (descricao text, categoria text, fornecedor text, valor numeric(10, 2), dia integer);
insert into demo_despesas values
  ('Aluguel do salão', 'aluguel', 'Imobiliária Centro', 6500, 5),
  ('Professores', 'salarios', '', 11800, 5),
  ('Energia elétrica', 'energia', 'Enel', 780, 12),
  ('Água', 'agua', 'Sabesp', 210, 15),
  ('Internet', 'internet', 'Vivo Fibra', 149.90, 10),
  ('Limpeza', 'limpeza', 'Limpa Tudo', 900, 20),
  ('Anúncios Instagram', 'marketing', 'Meta', 600, 25),
  ('Cliente Plus e módulo', 'sistemas', 'Cliente Plus', 260, 8);

insert into academia_despesas (store_id, descricao, categoria, fornecedor, valor, vencimento, status, pago_em,
  forma_pagamento, recorrente, observacao, created_at)
select '33333333-3333-4333-8333-333333333333', d.descricao, d.categoria, d.fornecedor,
       d.valor + case when d.categoria = 'energia' then mod(r.x * 37, 120) else 0 end,
       dateadd('MONTH', -r.x, dateadd('DAY', d.dia - day_of_month(current_date), current_date)),
       case when dateadd('MONTH', -r.x, dateadd('DAY', d.dia - day_of_month(current_date), current_date)) <= current_date
            then 'paga' else 'pendente' end,
       case when dateadd('MONTH', -r.x, dateadd('DAY', d.dia - day_of_month(current_date), current_date)) <= current_date
            then cast(dateadd('MONTH', -r.x, dateadd('DAY', d.dia - day_of_month(current_date), current_date)) as timestamp)
                 + interval '11' hour end,
       case when dateadd('MONTH', -r.x, dateadd('DAY', d.dia - day_of_month(current_date), current_date)) <= current_date
            then 'pix' end,
       r.x = 0, '', dateadd('MONTH', -r.x - 1, now())
from demo_despesas d cross join system_range(0, 5) as r (x);

drop table demo_despesas;

insert into academia_servicos (store_id, nome, descricao, categoria, preco, duracao_minutos, profissional_id,
  comissao_pct, participa_indicacoes)
select '33333333-3333-4333-8333-333333333333', s.nome, s.descricao, s.categoria, s.preco, s.duracao, p.id, s.comissao, s.indicacao
from (values
  ('Aula particular de Jiu-Jitsu', 'Uma hora com o professor, no tatame 1', 'personal', 150, 60, 'Marcos Silva', 50, true),
  ('Aula particular de Muay Thai', 'Uma hora com a Kru Ana', 'personal', 130, 60, 'Ana Costa', 50, true),
  ('Aula experimental', 'Primeira aula de qualquer modalidade', 'aula_avulsa', 0, 60, null, 0, false),
  ('Diária (drop-in)', 'Treino avulso para visitantes de outras academias', 'aula_avulsa', 50, 90, null, 0, false),
  ('Avaliação física', 'Peso, medidas e % de gordura', 'avaliacao', 60, 30, 'Rafael Tanaka', 30, false)
) as s (nome, descricao, categoria, preco, duracao, professor, comissao, indicacao)
left join academia_profissionais p on p.nome = s.professor and p.store_id = '33333333-3333-4333-8333-333333333333';

insert into academia_avaliacoes (store_id, cliente_id, profissional_id, data, sexo, idade, peso, altura_cm, metodo_gordura,
  gordura_pct, medida_cintura, objetivo, created_at)
select '33333333-3333-4333-8333-333333333333', i.cliente_id,
       (select p.id from academia_profissionais p where p.nome = 'Rafael Tanaka' and p.store_id = '33333333-3333-4333-8333-333333333333'),
       dateadd('DAY', -mod(a.x * 3, 40), current_date), n.sexo, datediff('YEAR', a.nascimento, current_date),
       case when n.sexo = 'M' then 72 + mod(a.x * 7, 25) else 56 + mod(a.x * 5, 18) end,
       case when n.sexo = 'M' then 168 + mod(a.x * 3, 20) else 157 + mod(a.x * 3, 15) end,
       'bioimpedancia', case when n.sexo = 'M' then 13 + mod(a.x, 9) else 20 + mod(a.x, 9) end,
       case when n.sexo = 'M' then 80 + mod(a.x * 3, 15) else 68 + mod(a.x * 3, 12) end,
       case when a.m1 in ('Boxe', 'MMA') then 'Condicionamento e perda de peso' else 'Competir no próximo campeonato' end,
       cast(dateadd('DAY', -mod(a.x * 3, 40), current_date) as timestamp) + interval '16' hour
from demo_alunos a
join demo_ids i on i.x = a.x
join demo_nomes n on n.i = mod(a.x, 45)
where not a.kid and a.cancelada is null and mod(a.x, 6) = 2;

-- ---------------------------------------------------------------------------
-- Limpeza das tabelas auxiliares.
-- ---------------------------------------------------------------------------
drop table demo_presencas;
drop table demo_opcoes;
drop table demo_prof;
drop table demo_trilha;
drop table demo_am;
drop table demo_ids;
drop table demo_alunos;
drop table demo_sobrenomes;
drop table demo_nomes;
