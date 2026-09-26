-- Dados de exemplo (DEMO) de serviços, vendas, aulas coletivas e agenda da
-- "Academia Prime". Só do laboratório: usa funções do H2.

-- Nutricionista (atende consultas; não monta fichas).
insert into academia_profissionais (store_id, nome, especialidade, telefone, email, registro) values
  ('11111111-1111-4111-8111-111111111111', 'Patrícia Moura', 'Nutrição esportiva', '11995556666',
   'patricia.moura@academiaprime.com', 'CRN-3 54321');

-- ---------------------------------------------------------------------------
-- Serviços
-- ---------------------------------------------------------------------------
insert into academia_servicos (store_id, nome, descricao, categoria, preco, duracao_minutos, profissional_id,
                               comissao_pct, participa_indicacoes)
select '11111111-1111-4111-8111-111111111111', s.nome, s.descricao, s.categoria, s.preco, s.duracao,
       (select id from academia_profissionais where nome = s.profissional), s.comissao, s.indicacoes
from (values
  ('Personal trainer (sessão)', 'Treino individual acompanhado do começo ao fim.', 'personal', 90.00, 60, 'Rafael Nogueira', 40.00, true),
  ('Pacote personal 8 sessões', 'Oito sessões de personal para usar em até 45 dias.', 'personal', 640.00, 60, 'Rafael Nogueira', 40.00, true),
  ('Avaliação física avulsa', 'Bioimpedância, medidas e orientação do professor.', 'avaliacao', 60.00, 45, 'Luana Prado', 30.00, false),
  ('Consulta com nutricionista', 'Plano alimentar alinhado ao treino.', 'nutricao', 150.00, 50, 'Patrícia Moura', 60.00, true),
  ('Day use', 'Um dia de acesso livre à academia para quem não é aluno.', 'day_use', 35.00, null, null, 0.00, false),
  ('Armário mensal', 'Armário com chave por 30 dias.', 'outro', 30.00, null, null, 0.00, false)
) as s (nome, descricao, categoria, preco, duracao, profissional, comissao, indicacoes);

-- Vendas dos últimos 60 dias (cada uma com o seu pagamento no Cliente Plus).
create table demo_vendas (pid uuid, cliente_id uuid, servico text, qtd integer, dias integer, pago boolean, forma text);
insert into demo_vendas
select random_uuid(), c.id,
       case mod(r.rn, 6) when 0 then 'Personal trainer (sessão)' when 1 then 'Pacote personal 8 sessões'
                         when 2 then 'Avaliação física avulsa' when 3 then 'Consulta com nutricionista'
                         when 4 then 'Armário mensal' else 'Personal trainer (sessão)' end,
       1, mod(r.rn * 23, 60), mod(r.rn, 7) <> 0,
       case mod(r.rn, 3) when 0 then 'pix' when 1 then 'cartao_credito' else 'dinheiro' end
from (select id, row_number() over (order by nome) as rn from cp_clientes
      where store_id = '11111111-1111-4111-8111-111111111111') r
join cp_clientes c on c.id = r.id
where mod(r.rn, 5) = 1;

insert into cp_pagamentos (id, store_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento, origem,
                           descricao, created_at)
select v.pid, '11111111-1111-4111-8111-111111111111', v.cliente_id, s.preco,
       dateadd('DAY', -v.dias, current_date),
       case when v.pago then 'pago' else 'pendente' end,
       case when v.pago then dateadd('HOUR', 10 + mod(v.dias, 8), cast(dateadd('DAY', -v.dias, current_date) as timestamp)) end,
       case when v.pago then v.forma end,
       'academia', s.nome,
       dateadd('HOUR', 9, cast(dateadd('DAY', -v.dias, current_date) as timestamp))
from demo_vendas v
join academia_servicos s on s.nome = v.servico;

insert into academia_vendas (store_id, cliente_id, servico_id, profissional_id, quantidade, valor, comissao_pct,
                             pagamento_id, created_at)
select '11111111-1111-4111-8111-111111111111', v.cliente_id, s.id, s.profissional_id, 1, s.preco, s.comissao_pct,
       v.pid, dateadd('HOUR', 9, cast(dateadd('DAY', -v.dias, current_date) as timestamp))
from demo_vendas v
join academia_servicos s on s.nome = v.servico;

drop table demo_vendas;

-- ---------------------------------------------------------------------------
-- Aulas coletivas e grade semanal (1 = segunda ... 7 = domingo)
-- ---------------------------------------------------------------------------
insert into academia_aulas (store_id, nome, descricao, professor_id, sala, capacidade, duracao_minutos, cor)
select '11111111-1111-4111-8111-111111111111', a.nome, a.descricao,
       (select id from academia_profissionais where nome = a.professor), a.sala, a.capacidade, a.duracao, a.cor
from (values
  ('Spinning', 'Pedalada em grupo com música e variação de ritmo.', 'Diego Sampaio', 'Sala de bike', 20, 45, 'laranja'),
  ('Funcional', 'Circuito com peso do corpo, elásticos e kettlebell.', 'Camila Brandão', 'Área externa', 15, 50, 'verde'),
  ('Yoga', 'Posturas, respiração e relaxamento.', 'Luana Prado', 'Sala 1', 12, 60, 'violeta'),
  ('Pilates solo', 'Fortalecimento do core e postura, no colchonete.', 'Luana Prado', 'Sala 1', 10, 50, 'ciano'),
  ('Zumba', 'Aula de dança aeróbica.', 'Camila Brandão', 'Sala 1', 25, 60, 'rosa'),
  ('HIIT', 'Treino intervalado de alta intensidade, 30 minutos.', 'Diego Sampaio', 'Sala de bike', 16, 30, 'azul')
) as a (nome, descricao, professor, sala, capacidade, duracao, cor);

insert into academia_aula_horarios (store_id, aula_id, dia_semana, hora_inicio)
select a.store_id, a.id, h.dia, h.hora
from (values
  ('Spinning', 1, time '07:00'), ('Spinning', 3, time '07:00'), ('Spinning', 5, time '07:00'),
  ('Spinning', 1, time '19:00'), ('Spinning', 3, time '19:00'),
  ('Funcional', 2, time '07:00'), ('Funcional', 4, time '07:00'),
  ('Funcional', 2, time '18:30'), ('Funcional', 4, time '18:30'), ('Funcional', 6, time '09:00'),
  ('Yoga', 2, time '20:00'), ('Yoga', 4, time '20:00'), ('Yoga', 6, time '10:30'),
  ('Pilates solo', 1, time '09:00'), ('Pilates solo', 3, time '09:00'), ('Pilates solo', 5, time '09:00'),
  ('Zumba', 1, time '20:00'), ('Zumba', 3, time '20:00'),
  ('HIIT', 2, time '12:15'), ('HIIT', 4, time '12:15'), ('HIIT', 5, time '18:00')
) as h (aula, dia, hora)
join academia_aulas a on a.nome = h.aula;

-- Alunos ativos numerados (para sortear participantes).
create table demo_ativos (cliente_id uuid, rn integer);
insert into demo_ativos
select c.id, row_number() over (order by c.nome)
from cp_clientes c
join cp_assinaturas a on a.cliente_id = c.id and a.status = 'ativa'
where c.store_id = '11111111-1111-4111-8111-111111111111';

create table demo_horarios (horario_id uuid, hx integer, aula text, dia integer, hora time, capacidade integer);
insert into demo_horarios
select h.id, row_number() over (order by a.nome, h.dia_semana, h.hora_inicio), a.nome, h.dia_semana, h.hora_inicio,
       a.capacidade
from academia_aula_horarios h
join academia_aulas a on a.id = h.aula_id;

-- Turmas fixas: Pilates (7 alunos) e Yoga (6 alunos) em cada horário.
insert into academia_turma_alunos (store_id, horario_id, cliente_id, desde)
select '11111111-1111-4111-8111-111111111111', h.horario_id, d.cliente_id, dateadd('DAY', -60, current_date)
from demo_horarios h
join demo_ativos d on mod(d.rn * 3 + h.hx * 11, 16) = 0
where h.aula in ('Pilates solo', 'Yoga');

-- Presenças das últimas 3 semanas e reservas até o fim da semana que vem.
-- Fixos: chamada (85% presentes). Avulsos: sorteados entre os ativos.
insert into academia_aula_presencas (store_id, horario_id, cliente_id, data, avulso, status, origem, created_at)
select '11111111-1111-4111-8111-111111111111', t.horario_id, t.cliente_id, dateadd('DAY', -r.x, current_date), false,
       case when mod(r.x * 7 + h.hx, 7) = 0 then 'faltou' else 'presente' end, 'recepcao', now()
from academia_turma_alunos t
join demo_horarios h on h.horario_id = t.horario_id
cross join system_range(1, 21) as r (x)
where iso_day_of_week(dateadd('DAY', -r.x, current_date)) = h.dia;

insert into academia_aula_presencas (store_id, horario_id, cliente_id, data, avulso, status, origem, created_at)
select '11111111-1111-4111-8111-111111111111', h.horario_id, d.cliente_id, dateadd('DAY', r.x, current_date), true,
       case when r.x > 0 then 'reservado'
            when r.x = 0 and dateadd('MINUTE', hour(h.hora) * 60 + minute(h.hora), cast(current_date as timestamp)) > localtimestamp then 'reservado'
            when mod(d.rn + r.x, 9) = 0 then 'faltou' else 'presente' end,
       case when mod(d.rn, 3) = 0 then 'area_cliente' else 'recepcao' end,
       now()
from demo_horarios h
cross join system_range(-21, 9) as r (x)
join demo_ativos d
  on mod(abs(d.rn * 37 + h.hx * 101 + r.x * 13), 100)
     < case when r.x > 0 then h.capacidade * 35 / 112 else h.capacidade * 70 / 112 end
where iso_day_of_week(dateadd('DAY', r.x, current_date)) = h.dia
  and h.aula not in ('Pilates solo', 'Yoga')
  and not exists (select 1 from academia_turma_alunos t where t.horario_id = h.horario_id and t.cliente_id = d.cliente_id);

-- ---------------------------------------------------------------------------
-- Agenda: personal (Rafael), avaliações (Luana) e nutrição (Patrícia),
-- da semana passada até a semana que vem.
-- ---------------------------------------------------------------------------
create table demo_slots (profissional text, servico text, hora integer, dias text);
insert into demo_slots values
  ('Rafael Nogueira', 'Personal trainer (sessão)', 6, '12345'),
  ('Rafael Nogueira', 'Personal trainer (sessão)', 8, '135'),
  ('Rafael Nogueira', 'Personal trainer (sessão)', 10, '24'),
  ('Rafael Nogueira', 'Personal trainer (sessão)', 16, '12345'),
  ('Rafael Nogueira', 'Personal trainer (sessão)', 17, '1234'),
  ('Luana Prado', 'Avaliação física avulsa', 14, '24'),
  ('Luana Prado', 'Avaliação física avulsa', 15, '24'),
  ('Patrícia Moura', 'Consulta com nutricionista', 10, '3'),
  ('Patrícia Moura', 'Consulta com nutricionista', 11, '3'),
  ('Patrícia Moura', 'Consulta com nutricionista', 15, '35');

insert into academia_agendamentos (store_id, cliente_id, profissional_id, servico_id, tipo, inicio, fim, status, observacao)
select '11111111-1111-4111-8111-111111111111', d.cliente_id, p.id, s.id,
       case when s.categoria = 'avaliacao' then 'avaliacao' else 'servico' end,
       dateadd('HOUR', sl.hora, cast(dateadd('DAY', r.x, current_date) as timestamp)),
       dateadd('MINUTE', s.duracao_minutos, dateadd('HOUR', sl.hora, cast(dateadd('DAY', r.x, current_date) as timestamp))),
       case when r.x < 0 or (r.x = 0 and sl.hora < hour(localtimestamp))
              then case when mod(d.rn + r.x, 8) = 0 then 'faltou' else 'concluido' end
            when mod(d.rn, 3) = 0 then 'confirmado' else 'agendado' end,
       ''
from demo_slots sl
join academia_profissionais p on p.nome = sl.profissional
join academia_servicos s on s.nome = sl.servico
cross join system_range(-7, 8) as r (x)
join demo_ativos d on d.rn = 1 + mod(abs(r.x * 17 + sl.hora * 7 + length(sl.servico) * 3), 110)
where locate(cast(iso_day_of_week(dateadd('DAY', r.x, current_date)) as varchar), sl.dias) > 0
  and mod(abs(r.x * 5 + sl.hora * 3), 4) <> 0;

drop table demo_slots;
drop table demo_horarios;
drop table demo_ativos;
