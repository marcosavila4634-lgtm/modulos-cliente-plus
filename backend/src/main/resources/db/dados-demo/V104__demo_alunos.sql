-- Dados de exemplo (DEMO) de alunos, planos, matrículas e mensalidades da
-- "Academia Prime" (store_id 11111111-1111-4111-8111-111111111111).
-- Só do laboratório: usa funções do H2 (dateadd) e não vai para o Supabase.

insert into cp_planos (store_id, nome, descricao, preco, duracao_meses, participa_indicacoes) values
  ('11111111-1111-4111-8111-111111111111', 'Mensal', 'Musculação e aulas coletivas, renovação todo mês', 119.90, 1, true),
  ('11111111-1111-4111-8111-111111111111', 'Trimestral', 'Musculação e aulas coletivas por 3 meses', 329.90, 3, true),
  ('11111111-1111-4111-8111-111111111111', 'Semestral', 'Musculação e aulas coletivas por 6 meses', 599.90, 6, true),
  ('11111111-1111-4111-8111-111111111111', 'Anual', 'Musculação e aulas coletivas por 12 meses', 1079.90, 12, true),
  ('11111111-1111-4111-8111-111111111111', 'Estudante', 'Mensal com desconto para estudantes', 89.90, 1, false);

insert into cp_clientes (store_id, nome, email, telefone, cpf, data_nascimento, created_at) values
  ('11111111-1111-4111-8111-111111111111', 'João Silva', 'joao.silva@email.com', '11987654321', '12345678901', date '1994-03-12', now()),
  ('11111111-1111-4111-8111-111111111111', 'Maria Eduarda Santos', 'maria.eduarda@email.com', '11991234567', '23456789012', date '2001-07-25', now()),
  ('11111111-1111-4111-8111-111111111111', 'Carlos Souza', 'carlos.souza@email.com', '11982345678', '34567890123', date '1988-11-02', now()),
  ('11111111-1111-4111-8111-111111111111', 'Ana Paula Ribeiro', 'anapaula@email.com', '11973456789', '45678901234', date '1996-01-30', now()),
  ('11111111-1111-4111-8111-111111111111', 'Pedro Henrique Costa', 'pedrohc@email.com', '11964567890', '56789012345', date '1999-09-18', now()),
  ('11111111-1111-4111-8111-111111111111', 'Juliana Castro', 'ju.castro@email.com', '11955678901', '67890123456', date '1991-05-07', now()),
  ('11111111-1111-4111-8111-111111111111', 'Lucas Martins', 'lucas.martins@email.com', '11946789012', '78901234567', date '1985-12-21', now()),
  ('11111111-1111-4111-8111-111111111111', 'Beatriz Rocha', 'bia.rocha@email.com', '11937890123', '89012345678', date '2004-02-14', now()),
  ('11111111-1111-4111-8111-111111111111', 'Rafael Gomes', 'rafael.gomes@email.com', '11928901234', '90123456789', date '1993-08-09', now()),
  ('11111111-1111-4111-8111-111111111111', 'Camila Ferreira', 'camila.f@email.com', '11919012345', '01234567890', date '1997-10-27', now()),
  ('11111111-1111-4111-8111-111111111111', 'Fernanda Lima', 'fernanda.lima@email.com', '11998765432', '11223344556', date '1990-04-03', now()),
  ('11111111-1111-4111-8111-111111111111', 'Gustavo Almeida', 'gustavo.almeida@email.com', '11987651234', null, date '2000-06-11', dateadd('DAY', -2, now())),
  ('11111111-1111-4111-8111-111111111111', 'Thiago Nunes', 'thiago.nunes@email.com', '11976543210', '22334455667', date '1995-09-24', now());

-- Situação de cada matrícula de exemplo:
--   pagas       = quantas mensalidades já foram pagas
--   ajuste_dias = em quantos dias vence a próxima (negativo = atrasada)
create table demo_matriculas (cliente text, plano text, pagas integer, ajuste_dias integer, forma text);

insert into demo_matriculas values
  ('João Silva', 'Mensal', 5, 8, 'pix'),
  ('Maria Eduarda Santos', 'Trimestral', 1, 85, 'cartao_credito'),
  ('Carlos Souza', 'Mensal', 2, -12, 'dinheiro'),
  ('Ana Paula Ribeiro', 'Semestral', 1, 150, 'cartao_credito'),
  ('Pedro Henrique Costa', 'Mensal', 3, -5, 'pix'),
  ('Juliana Castro', 'Anual', 1, 300, 'boleto'),
  ('Lucas Martins', 'Mensal', 8, 2, 'cartao_debito'),
  ('Beatriz Rocha', 'Estudante', 4, 15, 'pix'),
  ('Rafael Gomes', 'Trimestral', 2, -20, 'pix'),
  ('Camila Ferreira', 'Mensal', 6, 20, 'cartao_credito'),
  ('Fernanda Lima', 'Mensal', 3, -40, 'pix'),
  ('Thiago Nunes', 'Mensal', 1, 0, 'dinheiro');

-- Início calculado para a próxima mensalidade vencer em "ajuste_dias".
insert into cp_assinaturas (store_id, cliente_id, plano_id, valor, inicio, created_at)
select c.store_id, c.id, p.id, p.preco,
       dateadd('DAY', m.ajuste_dias, dateadd('MONTH', -m.pagas * p.duracao_meses, current_date)),
       cast(dateadd('DAY', m.ajuste_dias, dateadd('MONTH', -m.pagas * p.duracao_meses, current_date)) as timestamp)
         + interval '9' hour
from demo_matriculas m
join cp_clientes c on c.nome = m.cliente
join cp_planos p on p.nome = m.plano;

-- Mensalidades já pagas.
insert into cp_pagamentos (store_id, assinatura_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento)
select a.store_id, a.id, a.cliente_id, a.valor,
       dateadd('MONTH', n.i * p.duracao_meses, a.inicio), 'pago',
       cast(dateadd('MONTH', n.i * p.duracao_meses, a.inicio) as timestamp) + interval '10' hour,
       m.forma
from demo_matriculas m
join cp_clientes c on c.nome = m.cliente
join cp_assinaturas a on a.cliente_id = c.id
join cp_planos p on p.id = a.plano_id
join (values (0), (1), (2), (3), (4), (5), (6), (7), (8), (9)) as n (i) on n.i < m.pagas;

-- Próxima mensalidade (pendente).
insert into cp_pagamentos (store_id, assinatura_id, cliente_id, valor, vencimento, status)
select a.store_id, a.id, a.cliente_id, a.valor,
       dateadd('MONTH', m.pagas * p.duracao_meses, a.inicio), 'pendente'
from demo_matriculas m
join cp_clientes c on c.nome = m.cliente
join cp_assinaturas a on a.cliente_id = c.id
join cp_planos p on p.id = a.plano_id;

drop table demo_matriculas;

-- ---------------------------------------------------------------------------
-- Mais 120 alunos gerados automaticamente, com matrículas espalhadas pelos
-- últimos 8 meses, para o Dashboard ter histórico. Nomes = nome + sobrenome
-- das listas abaixo (cada combinação aparece uma vez só).
-- ---------------------------------------------------------------------------
create table demo_nomes (i integer, nome text, slug text);
insert into demo_nomes values
  (0, 'Adriana', 'adriana'), (1, 'Bruno', 'bruno'), (2, 'Caio', 'caio'), (3, 'Daniela', 'daniela'),
  (4, 'Eduardo', 'eduardo'), (5, 'Fábio', 'fabio'), (6, 'Gabriela', 'gabriela'), (7, 'Heitor', 'heitor'),
  (8, 'Isabela', 'isabela'), (9, 'Igor', 'igor'), (10, 'Jéssica', 'jessica'), (11, 'Kaique', 'kaique'),
  (12, 'Larissa', 'larissa'), (13, 'Leonardo', 'leonardo'), (14, 'Mariana', 'mariana'), (15, 'Matheus', 'matheus'),
  (16, 'Natália', 'natalia'), (17, 'Otávio', 'otavio'), (18, 'Patrícia', 'patricia'), (19, 'Paulo', 'paulo'),
  (20, 'Renata', 'renata'), (21, 'Rodrigo', 'rodrigo'), (22, 'Sabrina', 'sabrina'), (23, 'Samuel', 'samuel'),
  (24, 'Tatiane', 'tatiane'), (25, 'Vinícius', 'vinicius'), (26, 'Vanessa', 'vanessa'), (27, 'Wesley', 'wesley'),
  (28, 'Yasmin', 'yasmin'), (29, 'Aline', 'aline'), (30, 'Bernardo', 'bernardo'), (31, 'Clara', 'clara'),
  (32, 'Diego', 'diego'), (33, 'Elisa', 'elisa'), (34, 'Felipe', 'felipe'), (35, 'Giovana', 'giovana'),
  (36, 'Henrique', 'henrique'), (37, 'Letícia', 'leticia'), (38, 'Marcelo', 'marcelo'), (39, 'Priscila', 'priscila');

create table demo_sobrenomes (i integer, sobrenome text, slug text);
insert into demo_sobrenomes values
  (0, 'Oliveira', 'oliveira'), (1, 'Pereira', 'pereira'), (2, 'Carvalho', 'carvalho'), (3, 'Araújo', 'araujo'),
  (4, 'Barbosa', 'barbosa'), (5, 'Cardoso', 'cardoso'), (6, 'Teixeira', 'teixeira'), (7, 'Moreira', 'moreira'),
  (8, 'Mendes', 'mendes'), (9, 'Freitas', 'freitas'), (10, 'Dias', 'dias'), (11, 'Cavalcanti', 'cavalcanti'),
  (12, 'Monteiro', 'monteiro'), (13, 'Vieira', 'vieira'), (14, 'Correia', 'correia'), (15, 'Pinto', 'pinto'),
  (16, 'Moura', 'moura'), (17, 'Batista', 'batista'), (18, 'Campos', 'campos'), (19, 'Duarte', 'duarte'),
  (20, 'Farias', 'farias'), (21, 'Lopes', 'lopes'), (22, 'Machado', 'machado'), (23, 'Nascimento', 'nascimento'),
  (24, 'Ramos', 'ramos'), (25, 'Reis', 'reis'), (26, 'Siqueira', 'siqueira'), (27, 'Tavares', 'tavares'),
  (28, 'Xavier', 'xavier'), (29, 'Andrade', 'andrade');

-- g.x = número do aluno gerado (1 a 120).
create table demo_gerados (x integer, cliente text, plano text, inicio date, cancelada date, atrasado boolean);

insert into demo_gerados
select r.x, n.nome || ' ' || s.sobrenome,
       case mod(r.x, 10) when 5 then 'Trimestral' when 6 then 'Trimestral' when 7 then 'Semestral'
                         when 8 then 'Anual' when 9 then 'Estudante' else 'Mensal' end,
       dateadd('DAY', -(mod(r.x * 37, 240) + 1), current_date),
       -- 1 em cada 7 cancelou (se já estava há mais de 45 dias)
       case when mod(r.x, 7) = 0 and mod(r.x * 37, 240) + 1 > 45
            then dateadd('DAY', -((mod(r.x * 37, 240) + 1) * 2 / 5), current_date) end,
       -- 1 em cada 11 está com a mensalidade atrasada
       mod(r.x, 11) = 0
from system_range(1, 120) as r (x)
join demo_nomes n on n.i = mod(r.x, 40)
join demo_sobrenomes s on s.i = mod(r.x * 7, 30);

-- Todos os gerados viram clientes; os de número múltiplo de 17 ficam sem matrícula.
insert into cp_clientes (store_id, nome, email, telefone, data_nascimento, created_at)
select '11111111-1111-4111-8111-111111111111', g.cliente,
       n.slug || '.' || s.slug || g.x || '@email.com',
       '119' || lpad(cast(mod(g.x * 7919 + 1234567, 100000000) as varchar), 8, '0'),
       dateadd('DAY', -(6570 + mod(g.x * 263, 9000)), current_date),
       dateadd('DAY', -mod(g.x, 20), now())
from demo_gerados g
join demo_nomes n on n.i = mod(g.x, 40)
join demo_sobrenomes s on s.i = mod(g.x * 7, 30);

delete from demo_gerados where mod(x, 17) = 0;

insert into cp_assinaturas (store_id, cliente_id, plano_id, valor, status, inicio, cancelada_em, created_at)
select c.store_id, c.id, p.id, p.preco,
       case when g.cancelada is null then 'ativa' else 'cancelada' end,
       g.inicio,
       cast(g.cancelada as timestamp) + interval '15' hour,
       dateadd('HOUR', 7 + mod(g.x, 12), cast(g.inicio as timestamp))
from demo_gerados g
join cp_clientes c on c.nome = g.cliente
join cp_planos p on p.nome = g.plano;

-- Mensalidades de cada matrícula gerada (até 13 ciclos):
--   ativa em dia -> pagas até hoje + a próxima pendente
--   atrasada     -> pagas, e a última que venceu fica pendente
--   cancelada    -> pagas até o cancelamento + a seguinte cancelada
insert into cp_pagamentos (store_id, assinatura_id, cliente_id, valor, vencimento, status, pago_em, forma_pagamento)
select store_id, assinatura_id, cliente_id, valor, venc,
       case
         when cancelada is not null then case when venc <= cancelada then 'pago' else 'cancelado' end
         when atrasado then case when prox <= current_date then 'pago' else 'pendente' end
         else case when venc <= current_date then 'pago' else 'pendente' end
       end,
       -- pago até 2 dias depois do vencimento, às 10h (se cair no futuro, algumas horas atrás)
       least(dateadd('DAY', mod(gx, 3), cast(venc as timestamp)) + interval '10' hour,
             dateadd('MINUTE', -(20 + mod(gx * 17, 300)), localtimestamp)),
       case mod(gx + ciclo, 5) when 0 then 'pix' when 1 then 'cartao_credito' when 2 then 'pix'
                               when 3 then 'dinheiro' else 'cartao_debito' end
from (
  select a.store_id, a.id as assinatura_id, a.cliente_id, a.valor, g.cancelada, g.atrasado, g.x as gx, r.x as ciclo,
         dateadd('MONTH', r.x * p.duracao_meses, g.inicio) as venc,
         dateadd('MONTH', (r.x + 1) * p.duracao_meses, g.inicio) as prox,
         dateadd('MONTH', (r.x - 1) * p.duracao_meses, g.inicio) as ant
  from demo_gerados g
  join cp_clientes c on c.nome = g.cliente
  join cp_assinaturas a on a.cliente_id = c.id
  join cp_planos p on p.id = a.plano_id
  cross join system_range(0, 12) as r (x)
) v
where case
        when cancelada is not null then venc <= cancelada or ant <= cancelada
        when atrasado then venc <= current_date
        else venc <= current_date or ant <= current_date
      end;

-- Só as pagas têm data e forma de pagamento.
update cp_pagamentos set pago_em = null, forma_pagamento = null where status <> 'pago';

drop table demo_gerados;
drop table demo_nomes;
drop table demo_sobrenomes;

-- Aluno desde o dia da matrícula.
update cp_clientes c set created_at = (select a.created_at from cp_assinaturas a where a.cliente_id = c.id)
where exists (select 1 from cp_assinaturas a where a.cliente_id = c.id);

-- Fernanda Lima cancelou a matrícula depois de atrasar.
update cp_assinaturas set status = 'cancelada', cancelada_em = dateadd('DAY', -10, now())
where cliente_id = (select id from cp_clientes where nome = 'Fernanda Lima');

update cp_pagamentos set status = 'cancelado'
where status = 'pendente' and cliente_id = (select id from cp_clientes where nome = 'Fernanda Lima');

