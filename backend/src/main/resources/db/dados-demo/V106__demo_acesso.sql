-- Dados de exemplo (DEMO) de configurações, dispositivos e entradas (check-ins)
-- da "Academia Prime". Só do laboratório: usa funções do H2.

insert into academia_config (store_id, telefone, email, endereco, cnpj, capacidade, whatsapp, slug) values
  ('11111111-1111-4111-8111-111111111111', '1133334444', 'contato@academiaprime.com',
   'Av. Paulista, 1000 - Bela Vista, São Paulo - SP', '12345678000190', 12, '11999990000', 'academia-prime');

insert into academia_horarios (store_id, dia_semana, abre, fecha, fechado) values
  ('11111111-1111-4111-8111-111111111111', 1, time '06:00', time '23:00', false),
  ('11111111-1111-4111-8111-111111111111', 2, time '06:00', time '23:00', false),
  ('11111111-1111-4111-8111-111111111111', 3, time '06:00', time '23:00', false),
  ('11111111-1111-4111-8111-111111111111', 4, time '06:00', time '23:00', false),
  ('11111111-1111-4111-8111-111111111111', 5, time '06:00', time '22:00', false),
  ('11111111-1111-4111-8111-111111111111', 6, time '08:00', time '14:00', false),
  ('11111111-1111-4111-8111-111111111111', 7, time '08:00', time '12:00', false);

insert into academia_dispositivos (store_id, nome, tipo, fabricante, identificador, token, ultimo_contato) values
  ('11111111-1111-4111-8111-111111111111', 'Catraca da entrada', 'catraca', 'Henry', 'SN 7A31-0042',
   'demo0catraca0entrada00000000001', dateadd('MINUTE', -3, now())),
  ('11111111-1111-4111-8111-111111111111', 'Leitor facial da recepção', 'leitor_facial', 'Control iD', '192.168.0.50',
   'demo0leitor0facial000000000002', dateadd('MINUTE', -8, now()));

-- Bloqueio manual de exemplo.
insert into academia_bloqueios (store_id, cliente_id, motivo, created_at)
select store_id, id, 'Atestado médico pendente', dateadd('DAY', -3, now())
from cp_clientes where nome = 'Rafael Gomes';

-- ---------------------------------------------------------------------------
-- Entradas das últimas 9 semanas. Cada aluno tem uma frequência (2 a 5 vezes
-- por semana) e um horário preferido; sábado e domingo têm menos movimento.
-- ---------------------------------------------------------------------------
create table demo_frequentadores (cliente_id uuid, x integer, inicio date, fim date);
insert into demo_frequentadores
select a.cliente_id, row_number() over (order by a.cliente_id), a.inicio,
       case when a.cancelada_em is null then dateadd('DAY', 1, current_date) else cast(a.cancelada_em as date) end
from cp_assinaturas a
where a.store_id = '11111111-1111-4111-8111-111111111111';

create table demo_horas (i integer, hora integer);
insert into demo_horas values
  (0, 6), (1, 7), (2, 7), (3, 8), (4, 9), (5, 10), (6, 12), (7, 15),
  (8, 17), (9, 18), (10, 18), (11, 18), (12, 19), (13, 19), (14, 20), (15, 21);

insert into academia_acessos (store_id, cliente_id, momento, meio, dispositivo_id, resultado)
select '11111111-1111-4111-8111-111111111111', v.cliente_id, v.momento, v.meio,
       (select id from academia_dispositivos where tipo = v.meio), 'liberado'
from (
  select f.cliente_id,
         dateadd('MINUTE', mod(f.x * 7 + r.x * 13, 60),
           dateadd('HOUR',
             case iso_day_of_week(dateadd('DAY', -r.x, current_date))
               when 6 then 8 + mod(f.x, 5)
               when 7 then 8 + mod(f.x, 3)
               else least(21, greatest(6, h.hora + case mod(f.x * 3 + r.x, 5) when 0 then -1 when 4 then 1 else 0 end))
             end,
             cast(dateadd('DAY', -r.x, current_date) as timestamp))) as momento,
         case mod(f.x + r.x, 10) when 0 then 'recepcao' when 1 then 'leitor_facial' when 2 then 'leitor_facial'
                                 else 'catraca' end as meio,
         dateadd('DAY', -r.x, current_date) as dia,
         iso_day_of_week(dateadd('DAY', -r.x, current_date)) as dow,
         f.x, r.x as d, f.inicio, f.fim
  from demo_frequentadores f
  cross join system_range(0, 62) as r (x)
  join demo_horas h on h.i = mod(f.x * 5, 16)
) v
where v.dia >= v.inicio and v.dia < v.fim
  and mod(abs(v.x * 7919 + v.d * 104729 + v.x * v.d * 31), 100)
      < (28 + mod(v.x, 4) * 13) / case v.dow when 6 then 2 when 7 then 3 else 1 end
  and v.momento <= localtimestamp;

update academia_acessos set dispositivo_id = null where meio = 'recepcao';

-- Quem está com a mensalidade atrasada há mais de 5 dias (tolerância) parou de
-- entrar depois disso, e a catraca barrou uma tentativa ontem.
delete from academia_acessos a
where exists (
  select 1 from cp_pagamentos p
  join cp_assinaturas s on s.id = p.assinatura_id and s.status = 'ativa'
  where p.cliente_id = a.cliente_id and p.status = 'pendente'
    and p.vencimento < dateadd('DAY', -5, current_date)
    and a.momento >= cast(dateadd('DAY', 6, p.vencimento) as timestamp)
);

insert into academia_acessos (store_id, cliente_id, momento, meio, dispositivo_id, resultado, motivo)
select distinct p.store_id, p.cliente_id,
       dateadd('MINUTE', 30, cast(dateadd('DAY', -1, current_date) as timestamp) + interval '18' hour),
       'catraca', (select id from academia_dispositivos where tipo = 'catraca'), 'bloqueado', 'inadimplente'
from cp_pagamentos p
join cp_assinaturas s on s.id = p.assinatura_id and s.status = 'ativa'
where p.status = 'pendente' and p.vencimento < dateadd('DAY', -6, current_date);

-- Uma liberação manual pela recepção (aluno em atraso que prometeu pagar).
update academia_acessos set liberado_manual = true, motivo = 'inadimplente',
       observacao = 'Vai acertar a mensalidade amanhã'
where id = (
  select min(a.id) from academia_acessos a
  join cp_clientes c on c.id = a.cliente_id
  where c.nome = 'Carlos Souza' and a.meio = 'recepcao'
);

drop table demo_frequentadores;
drop table demo_horas;
