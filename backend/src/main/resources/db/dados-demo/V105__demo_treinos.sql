-- Dados de exemplo (DEMO) de treinos da "Academia Prime": professores,
-- biblioteca de exercícios, modelos de treino e fichas dos alunos.
-- Só do laboratório: usa funções do H2 e não vai para o Supabase.

insert into academia_profissionais (store_id, nome, especialidade, telefone, email, registro) values
  ('11111111-1111-4111-8111-111111111111', 'Rafael Nogueira', 'Musculação e hipertrofia', '11991112222', 'rafael.nogueira@academiaprime.com', 'CREF 012345-G/SP'),
  ('11111111-1111-4111-8111-111111111111', 'Camila Brandão', 'Iniciantes e funcional', '11992223333', 'camila.brandao@academiaprime.com', 'CREF 023456-G/SP'),
  ('11111111-1111-4111-8111-111111111111', 'Diego Sampaio', 'Emagrecimento e HIIT', '11993334444', 'diego.sampaio@academiaprime.com', 'CREF 034567-G/SP'),
  ('11111111-1111-4111-8111-111111111111', 'Luana Prado', 'Mobilidade e alongamento', '11994445555', 'luana.prado@academiaprime.com', 'CREF 045678-G/SP');

insert into academia_exercicios (store_id, nome, grupo_muscular, equipamento, instrucoes)
select '11111111-1111-4111-8111-111111111111', e.nome, e.grupo, e.equipamento, e.instrucoes
from (values
  ('Supino reto com barra', 'peito', 'Barra e banco reto', 'Deite no banco, desça a barra até o meio do peito e empurre até estender os braços, sem tirar o quadril do banco.'),
  ('Supino inclinado com halteres', 'peito', 'Halteres e banco inclinado', 'Com o banco a 30–45°, desça os halteres ao lado do peito e empurre para cima, aproximando-os no final.'),
  ('Supino declinado', 'peito', 'Barra e banco declinado', 'Com os pés presos, desça a barra até a parte baixa do peito e empurre de volta.'),
  ('Crucifixo reto com halteres', 'peito', 'Halteres e banco reto', 'Braços levemente flexionados, abra até sentir o peito alongar e feche como se abraçasse uma árvore.'),
  ('Crucifixo no voador', 'peito', 'Máquina voador (peck deck)', 'Costas apoiadas, feche os braços à frente do peito e volte devagar.'),
  ('Crossover na polia', 'peito', 'Polia dupla', 'Um pé à frente, puxe os cabos de cima para baixo cruzando as mãos à frente do corpo.'),
  ('Flexão de braço', 'peito', 'Peso corporal', 'Corpo alinhado da cabeça aos pés, desça o peito até perto do chão e empurre de volta.'),
  ('Puxada frontal na polia', 'costas', 'Polia alta com barra', 'Puxe a barra até a parte de cima do peito, levando os cotovelos para baixo e para trás.'),
  ('Remada curvada com barra', 'costas', 'Barra', 'Tronco inclinado e coluna reta, puxe a barra em direção ao umbigo.'),
  ('Remada baixa sentada', 'costas', 'Polia baixa com triângulo', 'Coluna reta, puxe o triângulo até o abdômen juntando as escápulas.'),
  ('Remada unilateral com halter', 'costas', 'Halter e banco', 'Apoie joelho e mão no banco e puxe o halter até a lateral do tronco.'),
  ('Barra fixa', 'costas', 'Barra fixa', 'Pendurado com as mãos afastadas, puxe o corpo até o queixo passar da barra.'),
  ('Pulldown com braços estendidos', 'costas', 'Polia alta com barra ou corda', 'Braços quase retos, leve a barra da altura da cabeça até as coxas.'),
  ('Levantamento terra', 'costas', 'Barra', 'Pés na largura do quadril, levante a barra do chão estendendo quadril e joelhos juntos, coluna neutra.'),
  ('Desenvolvimento com halteres', 'ombros', 'Halteres e banco', 'Sentado, empurre os halteres da altura das orelhas até em cima da cabeça.'),
  ('Desenvolvimento na máquina', 'ombros', 'Máquina de desenvolvimento', 'Costas apoiadas, empurre as alças para cima sem travar os cotovelos.'),
  ('Elevação lateral', 'ombros', 'Halteres', 'Eleve os braços pelas laterais até a altura dos ombros, cotovelos levemente flexionados.'),
  ('Elevação frontal', 'ombros', 'Halteres ou anilha', 'Eleve os braços à frente até a altura dos ombros e desça devagar.'),
  ('Crucifixo inverso', 'ombros', 'Máquina voador ou halteres', 'Abra os braços para trás, trabalhando a parte de trás dos ombros.'),
  ('Encolhimento com halteres', 'ombros', 'Halteres', 'Braços estendidos, suba os ombros em direção às orelhas e desça devagar.'),
  ('Rosca direta com barra', 'biceps', 'Barra reta ou W', 'Cotovelos junto ao corpo, flexione os braços levando a barra até o peito.'),
  ('Rosca alternada com halteres', 'biceps', 'Halteres', 'Alterne os braços girando o punho para cima durante a subida.'),
  ('Rosca martelo', 'biceps', 'Halteres', 'Palmas voltadas uma para a outra, flexione os cotovelos sem balançar o tronco.'),
  ('Rosca Scott', 'biceps', 'Banco Scott e barra W', 'Braços apoiados no banco, flexione até o alto e desça controlando.'),
  ('Rosca na polia', 'biceps', 'Polia baixa com barra', 'De pé, flexione os braços mantendo os cotovelos parados.'),
  ('Tríceps na polia com corda', 'triceps', 'Polia alta com corda', 'Cotovelos colados ao corpo, estenda os braços abrindo a corda no final.'),
  ('Tríceps testa', 'triceps', 'Barra W e banco', 'Deitado, desça a barra em direção à testa dobrando só os cotovelos e estenda de volta.'),
  ('Tríceps francês', 'triceps', 'Halter', 'Segure o halter atrás da cabeça e estenda os braços para cima.'),
  ('Mergulho no banco', 'triceps', 'Banco', 'Mãos no banco atrás do corpo, desça dobrando os cotovelos e suba estendendo.'),
  ('Tríceps pulley com barra', 'triceps', 'Polia alta com barra', 'Empurre a barra para baixo até estender os braços, cotovelos parados.'),
  ('Agachamento livre', 'pernas', 'Barra e suporte', 'Barra nas costas, desça como se fosse sentar mantendo o peito aberto e os joelhos alinhados aos pés.'),
  ('Leg press 45°', 'pernas', 'Máquina leg press', 'Pés na largura do quadril, desça até 90° nos joelhos e empurre sem travar.'),
  ('Cadeira extensora', 'pernas', 'Máquina extensora', 'Estenda os joelhos até quase travar e desça devagar.'),
  ('Mesa flexora', 'pernas', 'Máquina flexora deitada', 'Deitado de bruços, flexione os joelhos trazendo o rolo em direção aos glúteos.'),
  ('Cadeira flexora', 'pernas', 'Máquina flexora sentada', 'Sentado, puxe o rolo para baixo e para trás flexionando os joelhos.'),
  ('Afundo com halteres', 'pernas', 'Halteres', 'Dê um passo à frente e desça até os dois joelhos formarem 90°.'),
  ('Agachamento búlgaro', 'pernas', 'Halteres e banco', 'Pé de trás apoiado no banco, desça com a perna da frente até 90°.'),
  ('Stiff com barra', 'pernas', 'Barra', 'Joelhos levemente flexionados, desça a barra rente às pernas levando o quadril para trás.'),
  ('Hack squat', 'pernas', 'Máquina hack', 'Costas apoiadas, desça até 90° nos joelhos e suba empurrando com os calcanhares.'),
  ('Cadeira adutora', 'pernas', 'Máquina adutora', 'Feche as pernas contra a resistência e abra devagar.'),
  ('Elevação pélvica', 'gluteos', 'Barra e banco', 'Costas apoiadas no banco, suba o quadril até alinhar com os joelhos, contraindo os glúteos.'),
  ('Cadeira abdutora', 'gluteos', 'Máquina abdutora', 'Abra as pernas contra a resistência e volte devagar.'),
  ('Glúteo na polia', 'gluteos', 'Polia baixa com tornozeleira', 'Leve a perna para trás estendendo o quadril, sem arquear a lombar.'),
  ('Ponte de glúteo', 'gluteos', 'Peso corporal', 'Deitado com joelhos dobrados, suba o quadril contraindo os glúteos.'),
  ('Panturrilha em pé', 'panturrilha', 'Máquina ou degrau', 'Suba na ponta dos pés o mais alto possível e desça alongando.'),
  ('Panturrilha sentado', 'panturrilha', 'Máquina de panturrilha sentado', 'Com o peso sobre os joelhos, suba os calcanhares e desça devagar.'),
  ('Abdominal supra', 'abdomen', 'Colchonete', 'Deitado com joelhos dobrados, tire as escápulas do chão contraindo o abdômen.'),
  ('Prancha', 'abdomen', 'Colchonete', 'Apoie antebraços e pontas dos pés, corpo reto, abdômen contraído. Segure o tempo indicado.'),
  ('Abdominal infra', 'abdomen', 'Colchonete ou banco', 'Deitado, eleve as pernas estendidas até 90° e desça sem encostar no chão.'),
  ('Abdominal oblíquo', 'abdomen', 'Colchonete', 'Leve o cotovelo em direção ao joelho oposto, alternando os lados.'),
  ('Abdominal na polia', 'abdomen', 'Polia alta com corda', 'Ajoelhado, flexione o tronco trazendo a corda em direção aos joelhos.'),
  ('Esteira', 'cardio', 'Esteira', 'Caminhada ou corrida no ritmo indicado pelo professor.'),
  ('Bicicleta ergométrica', 'cardio', 'Bicicleta', 'Pedale mantendo a carga e o ritmo indicados.'),
  ('Elíptico', 'cardio', 'Elíptico', 'Movimento contínuo de braços e pernas, sem impacto.'),
  ('Remo ergômetro', 'cardio', 'Remo', 'Empurre com as pernas, depois puxe com os braços, e volte na ordem inversa.'),
  ('Pular corda', 'cardio', 'Corda', 'Saltos curtos na ponta dos pés, girando a corda com os punhos.'),
  ('Burpee', 'corpo_todo', 'Peso corporal', 'Agache, leve as pernas para trás, faça uma flexão, volte e salte.'),
  ('Kettlebell swing', 'corpo_todo', 'Kettlebell', 'Balance o kettlebell até a altura do peito com a força do quadril, braços relaxados.'),
  ('Agachamento com salto', 'corpo_todo', 'Peso corporal', 'Agache e salte o mais alto possível, aterrissando suavemente.'),
  ('Polichinelo', 'corpo_todo', 'Peso corporal', 'Salte abrindo pernas e braços e volte fechando, em ritmo constante.'),
  ('Alongamento de posterior de coxa', 'alongamento', 'Colchonete', 'Sentado, pernas estendidas, leve o tronco à frente até sentir alongar. Segure.'),
  ('Alongamento de peitoral', 'alongamento', 'Parede ou batente', 'Apoie o antebraço e gire o tronco para o lado oposto até sentir o peito alongar.'),
  ('Mobilidade de quadril', 'alongamento', 'Colchonete', 'Movimentos circulares e de abertura do quadril, lentos e controlados.')
) as e (nome, grupo, equipamento, instrucoes);

-- ---------------------------------------------------------------------------
-- Modelos de treino (fichas sem aluno)
-- ---------------------------------------------------------------------------
insert into academia_fichas (store_id, nome, objetivo, observacoes, professor_id)
select '11111111-1111-4111-8111-111111111111', m.nome, m.objetivo, m.obs, p.id
from (values
  ('Hipertrofia ABC', 'Ganho de massa muscular', 'Aquecer 5 min antes. Aumentar a carga quando completar todas as repetições com facilidade.', 'Rafael Nogueira'),
  ('Adaptação iniciante AB', 'Adaptação e aprendizado da técnica', 'Cargas leves nas primeiras 2 semanas. Foco na execução correta.', 'Camila Brandão'),
  ('Emagrecimento full body', 'Perda de gordura e condicionamento', 'Fazer em circuito: um exercício atrás do outro, descanso ao final da volta.', 'Diego Sampaio')
) as m (nome, objetivo, obs, professor)
join academia_profissionais p on p.nome = m.professor;

create table demo_itens (modelo text, letra text, treino text, ordem integer, exercicio text,
                         series integer, repeticoes text, descanso integer);
insert into demo_itens values
  ('Hipertrofia ABC', 'A', 'Peito, ombros e tríceps', 1, 'Supino reto com barra', 4, '8 a 10', 90),
  ('Hipertrofia ABC', 'A', 'Peito, ombros e tríceps', 2, 'Supino inclinado com halteres', 3, '10 a 12', 60),
  ('Hipertrofia ABC', 'A', 'Peito, ombros e tríceps', 3, 'Crucifixo no voador', 3, '12', 60),
  ('Hipertrofia ABC', 'A', 'Peito, ombros e tríceps', 4, 'Desenvolvimento com halteres', 3, '10 a 12', 60),
  ('Hipertrofia ABC', 'A', 'Peito, ombros e tríceps', 5, 'Elevação lateral', 3, '15', 45),
  ('Hipertrofia ABC', 'A', 'Peito, ombros e tríceps', 6, 'Tríceps na polia com corda', 3, '12', 45),
  ('Hipertrofia ABC', 'A', 'Peito, ombros e tríceps', 7, 'Tríceps testa', 3, '10 a 12', 60),
  ('Hipertrofia ABC', 'B', 'Costas e bíceps', 1, 'Puxada frontal na polia', 4, '10 a 12', 60),
  ('Hipertrofia ABC', 'B', 'Costas e bíceps', 2, 'Remada curvada com barra', 4, '8 a 10', 90),
  ('Hipertrofia ABC', 'B', 'Costas e bíceps', 3, 'Remada unilateral com halter', 3, '12', 60),
  ('Hipertrofia ABC', 'B', 'Costas e bíceps', 4, 'Pulldown com braços estendidos', 3, '15', 45),
  ('Hipertrofia ABC', 'B', 'Costas e bíceps', 5, 'Rosca direta com barra', 3, '10 a 12', 60),
  ('Hipertrofia ABC', 'B', 'Costas e bíceps', 6, 'Rosca martelo', 3, '12', 45),
  ('Hipertrofia ABC', 'B', 'Costas e bíceps', 7, 'Abdominal supra', 3, '20', 30),
  ('Hipertrofia ABC', 'C', 'Pernas e glúteos', 1, 'Agachamento livre', 4, '8 a 10', 120),
  ('Hipertrofia ABC', 'C', 'Pernas e glúteos', 2, 'Leg press 45°', 4, '12', 90),
  ('Hipertrofia ABC', 'C', 'Pernas e glúteos', 3, 'Cadeira extensora', 3, '15', 60),
  ('Hipertrofia ABC', 'C', 'Pernas e glúteos', 4, 'Mesa flexora', 3, '12', 60),
  ('Hipertrofia ABC', 'C', 'Pernas e glúteos', 5, 'Elevação pélvica', 4, '12', 60),
  ('Hipertrofia ABC', 'C', 'Pernas e glúteos', 6, 'Panturrilha em pé', 4, '15', 45),
  ('Hipertrofia ABC', 'C', 'Pernas e glúteos', 7, 'Prancha', 3, '40 s', 30),
  ('Adaptação iniciante AB', 'A', 'Membros superiores', 1, 'Supino reto com barra', 3, '12', 60),
  ('Adaptação iniciante AB', 'A', 'Membros superiores', 2, 'Puxada frontal na polia', 3, '12', 60),
  ('Adaptação iniciante AB', 'A', 'Membros superiores', 3, 'Remada baixa sentada', 3, '12', 60),
  ('Adaptação iniciante AB', 'A', 'Membros superiores', 4, 'Desenvolvimento na máquina', 3, '12', 60),
  ('Adaptação iniciante AB', 'A', 'Membros superiores', 5, 'Rosca alternada com halteres', 2, '12', 45),
  ('Adaptação iniciante AB', 'A', 'Membros superiores', 6, 'Tríceps pulley com barra', 2, '12', 45),
  ('Adaptação iniciante AB', 'A', 'Membros superiores', 7, 'Esteira', 1, '10 min', null),
  ('Adaptação iniciante AB', 'B', 'Membros inferiores e core', 1, 'Leg press 45°', 3, '12', 60),
  ('Adaptação iniciante AB', 'B', 'Membros inferiores e core', 2, 'Cadeira extensora', 3, '12', 60),
  ('Adaptação iniciante AB', 'B', 'Membros inferiores e core', 3, 'Mesa flexora', 3, '12', 60),
  ('Adaptação iniciante AB', 'B', 'Membros inferiores e core', 4, 'Cadeira abdutora', 3, '15', 45),
  ('Adaptação iniciante AB', 'B', 'Membros inferiores e core', 5, 'Panturrilha sentado', 3, '15', 45),
  ('Adaptação iniciante AB', 'B', 'Membros inferiores e core', 6, 'Prancha', 3, '30 s', 30),
  ('Adaptação iniciante AB', 'B', 'Membros inferiores e core', 7, 'Bicicleta ergométrica', 1, '10 min', null),
  ('Emagrecimento full body', 'A', 'Circuito 1', 1, 'Agachamento com salto', 3, '15', 30),
  ('Emagrecimento full body', 'A', 'Circuito 1', 2, 'Flexão de braço', 3, 'até a falha', 30),
  ('Emagrecimento full body', 'A', 'Circuito 1', 3, 'Kettlebell swing', 3, '15', 30),
  ('Emagrecimento full body', 'A', 'Circuito 1', 4, 'Remada baixa sentada', 3, '15', 30),
  ('Emagrecimento full body', 'A', 'Circuito 1', 5, 'Burpee', 3, '10', 60),
  ('Emagrecimento full body', 'A', 'Circuito 1', 6, 'Esteira', 1, '20 min intervalado', null),
  ('Emagrecimento full body', 'B', 'Circuito 2', 1, 'Afundo com halteres', 3, '12 cada perna', 30),
  ('Emagrecimento full body', 'B', 'Circuito 2', 2, 'Desenvolvimento com halteres', 3, '12', 30),
  ('Emagrecimento full body', 'B', 'Circuito 2', 3, 'Puxada frontal na polia', 3, '15', 30),
  ('Emagrecimento full body', 'B', 'Circuito 2', 4, 'Polichinelo', 3, '40 s', 30),
  ('Emagrecimento full body', 'B', 'Circuito 2', 5, 'Abdominal oblíquo', 3, '20', 60),
  ('Emagrecimento full body', 'B', 'Circuito 2', 6, 'Elíptico', 1, '20 min', null);

insert into academia_ficha_treinos (store_id, ficha_id, letra, nome, ordem)
select distinct f.store_id, f.id, i.letra, i.treino, ascii(i.letra) - 64
from demo_itens i
join academia_fichas f on f.nome = i.modelo and f.cliente_id is null;

insert into academia_ficha_exercicios (store_id, treino_id, exercicio_id, ordem, series, repeticoes, descanso_segundos)
select f.store_id, t.id, e.id, i.ordem, i.series, i.repeticoes, i.descanso
from demo_itens i
join academia_fichas f on f.nome = i.modelo and f.cliente_id is null
join academia_ficha_treinos t on t.ficha_id = f.id and t.letra = i.letra
join academia_exercicios e on e.nome = i.exercicio;

drop table demo_itens;

-- ---------------------------------------------------------------------------
-- Fichas dos alunos: 3 em cada 4 alunos com matrícula ativa, copiadas de um
-- modelo, com validade de 8 semanas (algumas já vencidas ou vencendo).
-- ---------------------------------------------------------------------------
create table demo_fichas (cliente_id uuid, rn integer);
insert into demo_fichas
select c.id, row_number() over (order by c.nome)
from cp_clientes c
join cp_assinaturas a on a.cliente_id = c.id and a.status = 'ativa';

insert into academia_fichas (store_id, cliente_id, modelo_origem_id, nome, objetivo, observacoes,
                             professor_id, inicio, validade, created_at)
select m.store_id, d.cliente_id, m.id, m.nome, m.objetivo, m.observacoes, m.professor_id,
       dateadd('DAY', -mod(d.rn * 13, 75), current_date),
       dateadd('DAY', 56 - mod(d.rn * 13, 75), current_date),
       cast(dateadd('DAY', -mod(d.rn * 13, 75), current_date) as timestamp) + interval '11' hour
from demo_fichas d
join academia_fichas m on m.cliente_id is null
 and m.nome = case mod(d.rn, 3) when 0 then 'Hipertrofia ABC'
                                when 1 then 'Adaptação iniciante AB'
                                else 'Emagrecimento full body' end
where mod(d.rn, 4) <> 0;

drop table demo_fichas;

-- Copia as divisões e os exercícios do modelo para cada ficha de aluno.
insert into academia_ficha_treinos (store_id, ficha_id, letra, nome, ordem)
select f.store_id, f.id, mt.letra, mt.nome, mt.ordem
from academia_fichas f
join academia_ficha_treinos mt on mt.ficha_id = f.modelo_origem_id
where f.cliente_id is not null;

insert into academia_ficha_exercicios (store_id, treino_id, exercicio_id, ordem, series, repeticoes,
                                       carga, descanso_segundos, observacao)
select f.store_id, t.id, me.exercicio_id, me.ordem, me.series, me.repeticoes,
       me.carga, me.descanso_segundos, me.observacao
from academia_fichas f
join academia_ficha_treinos t on t.ficha_id = f.id
join academia_ficha_treinos mt on mt.ficha_id = f.modelo_origem_id and mt.letra = t.letra
join academia_ficha_exercicios me on me.treino_id = mt.id
where f.cliente_id is not null;
