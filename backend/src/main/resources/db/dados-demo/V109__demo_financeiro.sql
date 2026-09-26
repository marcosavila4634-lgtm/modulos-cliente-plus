-- Dados de exemplo (DEMO) de despesas, comissões, indicações e benefícios da
-- "Academia Prime". Só do laboratório: usa funções do H2.

-- ---------------------------------------------------------------------------
-- Despesas dos últimos 8 meses (e as recorrentes do mês que vem)
-- ---------------------------------------------------------------------------
create table demo_despesas (descricao text, categoria text, fornecedor text, valor numeric(10, 2), variacao integer,
                            dia integer, recorrente boolean, forma text);
insert into demo_despesas values
  ('Aluguel do galpão', 'aluguel', 'Imobiliária Paulista', 3500.00, 0, 5, true, 'boleto'),
  ('Salário da recepção', 'salarios', 'Folha de pagamento', 2800.00, 0, 5, true, 'transferencia'),
  ('Conta de energia', 'energia', 'Enel', 820.00, 380, 20, true, 'boleto'),
  ('Conta de água', 'agua', 'Sabesp', 170.00, 90, 15, true, 'boleto'),
  ('Internet fibra', 'internet', 'Vivo Empresas', 149.90, 0, 28, true, 'boleto'),
  ('Cliente Plus / Gestão Plus', 'sistemas', 'Cliente Plus', 138.00, 0, 10, true, 'cartao_credito'),
  ('Material de limpeza', 'limpeza', 'Distribuidora Limpa Bem', 210.00, 120, 12, false, 'pix'),
  ('Anúncios no Instagram', 'marketing', 'Meta', 300.00, 350, 3, false, 'cartao_credito'),
  ('Simples Nacional', 'impostos', 'Receita Federal', 420.00, 480, 20, true, 'boleto');

insert into academia_despesas (store_id, descricao, categoria, fornecedor, valor, vencimento, status, pago_em,
                               forma_pagamento, recorrente, created_at)
select '11111111-1111-4111-8111-111111111111', v.descricao, v.categoria, v.fornecedor,
       v.valor + case when v.variacao > 0 then mod(abs(v.x * 37 + v.dia * 11), v.variacao) else 0 end,
       v.venc,
       case when v.pago then 'paga' else 'pendente' end,
       case when v.pago then cast(v.venc as timestamp) + interval '11' hour end,
       case when v.pago then v.forma end,
       v.recorrente,
       cast(dateadd('DAY', -10, v.venc) as timestamp)
from (
  select d.*, r.x, m.venc,
         -- a conta de água deste mês ficou em atraso
         m.venc <= current_date and not (r.x = 0 and d.categoria = 'agua') as pago
  from demo_despesas d
  cross join system_range(-1, 7) as r (x)
  join (select r2.x as x, d2.dia as dia,
               dateadd('DAY', d2.dia - 1, dateadd('MONTH', -r2.x, dateadd('DAY', 1 - day_of_month(current_date), current_date))) as venc
        from system_range(-1, 7) as r2 (x) cross join (select distinct dia from demo_despesas) d2) m
    on m.x = r.x and m.dia = d.dia
  where r.x >= 0 or d.recorrente
) v;

-- Manutenção das esteiras (dois meses atrás) e um equipamento novo.
insert into academia_despesas (store_id, descricao, categoria, fornecedor, valor, vencimento, status, pago_em,
                               forma_pagamento, created_at)
values
  ('11111111-1111-4111-8111-111111111111', 'Manutenção das esteiras', 'manutencao', 'TecFit Assistência', 780.00,
   dateadd('MONTH', -2, current_date), 'paga', cast(dateadd('MONTH', -2, current_date) as timestamp) + interval '15' hour,
   'pix', cast(dateadd('MONTH', -2, current_date) as timestamp)),
  ('11111111-1111-4111-8111-111111111111', 'Kit de kettlebells (4 a 24 kg)', 'equipamentos', 'Loja Fitness Pro', 1890.00,
   dateadd('DAY', 12, current_date), 'pendente', null, null, cast(current_date as timestamp));

drop table demo_despesas;

-- ---------------------------------------------------------------------------
-- Comissão do mês passado já paga (Rafael e Patrícia), como despesa
-- ---------------------------------------------------------------------------
create table demo_comissoes (profissional_id uuid, nome text, valor numeric(10, 2), despesa_id uuid);
insert into demo_comissoes
select p.id, p.nome, sum(round(v.valor * v.comissao_pct / 100, 2)), random_uuid()
from academia_vendas v
join cp_pagamentos pg on pg.id = v.pagamento_id and pg.status = 'pago'
join academia_profissionais p on p.id = v.profissional_id
where p.nome in ('Rafael Nogueira', 'Patrícia Moura')
  and year(pg.pago_em) = year(dateadd('MONTH', -1, current_date))
  and month(pg.pago_em) = month(dateadd('MONTH', -1, current_date))
group by p.id, p.nome;

insert into academia_despesas (id, store_id, descricao, categoria, fornecedor, valor, vencimento, status, pago_em,
                               forma_pagamento)
select c.despesa_id, '11111111-1111-4111-8111-111111111111', 'Comissão de ' || c.nome || ' (mês passado)', 'comissoes',
       c.nome, c.valor, dateadd('DAY', 1 - day_of_month(current_date), current_date), 'paga',
       cast(dateadd('DAY', 1 - day_of_month(current_date), current_date) as timestamp) + interval '10' hour, 'pix'
from demo_comissoes c where c.valor > 0;

insert into academia_comissoes_pagas (store_id, profissional_id, competencia, valor, despesa_id)
select '11111111-1111-4111-8111-111111111111', c.profissional_id,
       dateadd('MONTH', -1, dateadd('DAY', 1 - day_of_month(current_date), current_date)), c.valor, c.despesa_id
from demo_comissoes c where c.valor > 0;

drop table demo_comissoes;

-- ---------------------------------------------------------------------------
-- Programa de indicações (simulação do Cliente Plus): 10% / 5% / 2%
-- e quem indicou quem. João Silva é o grande indicador da academia.
-- ---------------------------------------------------------------------------
insert into cp_programa_indicacao (store_id, nivel1_pct, nivel2_pct, nivel3_pct) values
  ('11111111-1111-4111-8111-111111111111', 10, 5, 2);

create table demo_ordem (id uuid, rn integer);
insert into demo_ordem
select id, row_number() over (order by created_at, nome)
from cp_clientes where store_id = '11111111-1111-4111-8111-111111111111';

-- A partir do 8º cliente, 1 em cada 3 foi indicado por alguém que entrou antes
-- (o de número rn / 3), o que forma redes de até 3 níveis.
update cp_clientes c set indicado_por_id = (
  select o2.id from demo_ordem o1 join demo_ordem o2 on o2.rn = o1.rn / 3 where o1.id = c.id
)
where c.id in (select id from demo_ordem where rn >= 8 and mod(rn, 3) <> 1);

update cp_clientes set indicado_por_id = (select id from cp_clientes where nome = 'João Silva')
where nome in ('Maria Eduarda Santos', 'Carlos Souza', 'Ana Paula Ribeiro', 'Pedro Henrique Costa', 'Lucas Martins');
update cp_clientes set indicado_por_id = (select id from cp_clientes where nome = 'Maria Eduarda Santos')
where nome in ('Beatriz Rocha', 'Camila Ferreira');
update cp_clientes set indicado_por_id = null where nome = 'João Silva';

drop table demo_ordem;

-- ---------------------------------------------------------------------------
-- Benefícios
-- ---------------------------------------------------------------------------
insert into academia_beneficios (store_id, titulo, descricao, tipo, regra, recompensa, parceiro, codigo, validade) values
  ('11111111-1111-4111-8111-111111111111', 'Indicou, ganhou', 'Traga um amigo para treinar com você.', 'indicacao', 1,
   'Camiseta oficial da Academia Prime', '', '', null),
  ('11111111-1111-4111-8111-111111111111', 'Trio de amigos', 'Com 3 amigos indicados e ativos, a próxima mensalidade é por nossa conta.',
   'indicacao', 3, '1 mensalidade grátis', '', '', null),
  ('11111111-1111-4111-8111-111111111111', '6 meses de Prime', 'Obrigado por treinar com a gente há meio ano!', 'fidelidade', 6,
   'Squeeze exclusivo', '', '', null),
  ('11111111-1111-4111-8111-111111111111', 'Aniversariante do mês', 'Comemore com um treino especial.', 'aniversario', null,
   '1 sessão de personal grátis', '', '', null),
  ('11111111-1111-4111-8111-111111111111', 'Frequência de ouro', '12 treinos no mês garantem desconto.', 'frequencia', 12,
   '10% de desconto na próxima mensalidade', '', '', null),
  ('11111111-1111-4111-8111-111111111111', 'Suplementos com desconto', 'Válido na loja física e no site.', 'parceiro', null,
   '15% de desconto', 'Força Max Suplementos', 'PRIME15', null),
  ('11111111-1111-4111-8111-111111111111', 'Avaliação postural', 'Agende pelo WhatsApp da clínica.', 'parceiro', null,
   'Avaliação postural grátis', 'Clínica Fisio+', 'FISIOPRIME', dateadd('MONTH', 3, current_date));

-- Resgates de exemplo: camiseta (entregue) para quem indicou, e o aniversário
-- de alguns alunos (falta entregar).
insert into academia_beneficio_resgates (store_id, beneficio_id, cliente_id, referencia, origem, entregue_em, created_at)
select distinct '11111111-1111-4111-8111-111111111111', b.id, c.indicado_por_id, '',
       'recepcao', dateadd('DAY', -5, now()), dateadd('DAY', -6, now())
from cp_clientes c
join academia_beneficios b on b.titulo = 'Indicou, ganhou'
join cp_assinaturas a on a.cliente_id = c.id and a.status = 'ativa'
join cp_assinaturas a2 on a2.cliente_id = c.indicado_por_id and a2.status = 'ativa'
join cp_clientes i on i.id = c.indicado_por_id
where substring(i.nome, 1, 1) <= 'L';

insert into academia_beneficio_resgates (store_id, beneficio_id, cliente_id, referencia, origem, created_at)
select '11111111-1111-4111-8111-111111111111', b.id, c.id, cast(year(current_date) as varchar), 'area_cliente',
       dateadd('DAY', -2, now())
from cp_clientes c
join academia_beneficios b on b.titulo = 'Aniversariante do mês'
join cp_assinaturas a on a.cliente_id = c.id and a.status = 'ativa'
where month(c.data_nascimento) = month(current_date) and mod(day_of_month(c.data_nascimento), 2) = 0;
