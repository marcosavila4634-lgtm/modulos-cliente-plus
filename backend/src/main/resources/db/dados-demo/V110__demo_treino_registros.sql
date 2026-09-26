-- Dados de exemplo (DEMO) de treinos marcados pelos alunos na área do cliente.
-- 2 em cada 5 alunos com ficha marcam o treino nos dias em que entraram na
-- academia (últimas 4 semanas), seguindo a ordem A, B, C... A carga dos
-- exercícios de musculação sobe 2 kg a cada 3 treinos.
-- Só do laboratório: usa funções do H2.

create table demo_sessoes (cliente_id uuid, ficha_id uuid, data date, k integer, treinos integer);
insert into demo_sessoes
select s.cliente_id, s.ficha_id, s.data, row_number() over (partition by s.cliente_id order by s.data), s.treinos
from (
  select distinct a.cliente_id, f.id as ficha_id, cast(a.momento as date) as data,
         (select count(*) from academia_ficha_treinos t where t.ficha_id = f.id) as treinos
  from academia_acessos a
  join academia_fichas f on f.cliente_id = a.cliente_id and f.status = 'ativa'
  where a.resultado = 'liberado'
    and cast(a.momento as date) >= dateadd('DAY', -27, current_date)
    and cast(a.momento as date) >= f.inicio
) s
join (select id, row_number() over (order by nome) as rn from cp_clientes) c on c.id = s.cliente_id
where mod(c.rn, 5) < 2;

insert into academia_treino_registros (store_id, cliente_id, ficha_id, exercicio_id, treino_letra, data, feito, carga_kg,
                                       created_at)
select '11111111-1111-4111-8111-111111111111', s.cliente_id, s.ficha_id, i.exercicio_id, t.letra, s.data, true,
       case when e.grupo_muscular in ('cardio', 'alongamento', 'abdomen', 'corpo_todo') then null
            else 8 + mod(length(e.nome) * 7, 36) + floor((s.k - 1) / 3) * 2 end,
       cast(s.data as timestamp) + interval '19' hour
from demo_sessoes s
join academia_ficha_treinos t on t.ficha_id = s.ficha_id and t.ordem = mod(s.k - 1, s.treinos) + 1
join academia_ficha_exercicios i on i.treino_id = t.id
join academia_exercicios e on e.id = i.exercicio_id
-- hoje: só os treinos de quem já entrou (e só a metade dos exercícios, "treinando agora")
where s.data < current_date or mod(i.ordem, 2) = 1;

drop table demo_sessoes;
