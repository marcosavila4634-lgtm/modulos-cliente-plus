-- Dados de exemplo (DEMO) de avaliações físicas da "Academia Prime".
-- 7 em cada 10 alunos com matrícula ativa têm de 1 a 3 avaliações, a cada
-- ~90 dias, com peso e % de gordura caindo aos poucos. Algumas estão com a
-- reavaliação vencida. Só do laboratório: usa funções do H2.

create table demo_avaliados (cliente_id uuid, rn integer, sexo text, idade integer, n integer);
insert into demo_avaliados
select c.id, row_number() over (order by c.nome),
       case when substring(c.nome, 1, locate(' ', c.nome) - 1) in ('Tatiane', 'Yasmin', 'Beatriz', 'Aline') then 'F'
            when right(substring(c.nome, 1, locate(' ', c.nome) - 1), 1) = 'a' then 'F'
            else 'M' end,
       coalesce(datediff('YEAR', c.data_nascimento, current_date), 30),
       0
from cp_clientes c
join cp_assinaturas a on a.cliente_id = c.id and a.status = 'ativa'
where c.store_id = '11111111-1111-4111-8111-111111111111';

delete from demo_avaliados where mod(rn, 10) >= 7;
update demo_avaliados set n = 1 + mod(rn, 3);

create table demo_av (cliente_id uuid, rn integer, sexo text, idade integer, k integer, data date,
                      peso numeric(5, 2), altura numeric(5, 1), gordura numeric(4, 1));
insert into demo_av
select d.cliente_id, d.rn, d.sexo, d.idade, r.x,
       dateadd('DAY', -(mod(d.rn * 17, 60) + case when mod(d.rn, 5) = 0 then 45 else 0 end + (d.n - 1 - r.x) * 90),
               current_date),
       case d.sexo when 'M' then 72 + mod(d.rn * 7, 24) else 55 + mod(d.rn * 5, 22) end - r.x * 1.4,
       case d.sexo when 'M' then 168 + mod(d.rn * 11, 20) else 155 + mod(d.rn * 7, 17) end,
       case d.sexo when 'M' then 15 + mod(d.rn * 3, 12) else 22 + mod(d.rn * 3, 11) end - r.x * 1.3
from demo_avaliados d
cross join system_range(0, 2) as r (x)
where r.x < d.n;

insert into academia_avaliacoes (store_id, cliente_id, profissional_id, data, sexo, idade, peso, altura_cm,
  metodo_gordura, gordura_pct, medida_peitoral, medida_cintura, medida_abdomen, medida_quadril,
  medida_braco_direito, medida_braco_esquerdo, medida_coxa_direita, medida_coxa_esquerda, medida_panturrilha,
  pressao_sistolica, pressao_diastolica, fc_repouso, objetivo, restricoes, observacoes, created_at)
select '11111111-1111-4111-8111-111111111111', v.cliente_id,
       (select p.id from academia_profissionais p
        where p.nome = case mod(v.rn, 4) when 0 then 'Rafael Nogueira' when 1 then 'Camila Brandão'
                                         when 2 then 'Diego Sampaio' else 'Luana Prado' end),
       v.data, v.sexo, v.idade, v.peso, v.altura, 'bioimpedancia', v.gordura,
       case v.sexo when 'M' then 92 + (v.peso - 72) * 0.5 else 84 + (v.peso - 55) * 0.45 end,
       case v.sexo when 'M' then 78 + (v.peso - 72) * 0.7 + (v.gordura - 15) * 0.4
                   else 64 + (v.peso - 55) * 0.6 + (v.gordura - 22) * 0.4 end,
       case v.sexo when 'M' then 82 + (v.peso - 72) * 0.75 + (v.gordura - 15) * 0.5
                   else 70 + (v.peso - 55) * 0.65 + (v.gordura - 22) * 0.5 end,
       case v.sexo when 'M' then 94 + (v.peso - 72) * 0.4 else 94 + (v.peso - 55) * 0.55 end,
       case v.sexo when 'M' then 31 + (v.peso - 72) * 0.2 else 26 + (v.peso - 55) * 0.2 end,
       case v.sexo when 'M' then 30.5 + (v.peso - 72) * 0.2 else 25.5 + (v.peso - 55) * 0.2 end,
       case v.sexo when 'M' then 54 + (v.peso - 72) * 0.3 else 53 + (v.peso - 55) * 0.35 end,
       case v.sexo when 'M' then 53.5 + (v.peso - 72) * 0.3 else 52.5 + (v.peso - 55) * 0.35 end,
       case v.sexo when 'M' then 36 + (v.peso - 72) * 0.1 else 34 + (v.peso - 55) * 0.1 end,
       110 + mod(v.rn * 7, 25), 70 + mod(v.rn * 3, 15), 58 + mod(v.rn * 11, 22),
       case mod(v.rn, 4) when 0 then 'Ganho de massa muscular' when 1 then 'Condicionamento e saúde'
                         when 2 then 'Emagrecimento' else 'Mobilidade e postura' end,
       case when mod(v.rn, 6) = 0 then 'Dor no joelho direito ao agachar' when mod(v.rn, 9) = 0 then 'Hipertensão controlada (usa medicamento)'
            else '' end,
       case when v.k > 0 then 'Boa evolução desde a última avaliação.' else '' end,
       cast(v.data as timestamp) + interval '10' hour
from demo_av v;

drop table demo_av;
drop table demo_avaliados;
