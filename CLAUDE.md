# Módulos Cliente Plus

Laboratório local para criar e testar **novos módulos** do Cliente Plus. Quando um
módulo fica pronto, ele é levado para o projeto principal (que vive no Lovable).
Este projeto **não** está conectado ao Lovable.

## Sobre o usuário

Fala português (pt-BR) e não é desenvolvedor. Explique em linguagem simples,
com passos exatos (qual botão, qual comando), e responda em português.

## O que é o Cliente Plus (contexto de negócio)

CRM de **indicações com comissão recorrente** para negócios de recorrência
(barbearias, academias, clínicas, escolas, pet shops, provedores etc.).

- O **lojista** (estabelecimento) cria planos/produtos e define quais planos
  participam do programa de indicações.
- Cada **cliente** do lojista tem um link de indicação. Quem indica ganha
  comissão **enquanto o indicado continuar pagando**. Até 3 níveis, percentuais
  definidos pelo lojista (ex.: plano R$100 → 10% nível 1, 5% nível 2).
- O cliente acompanha rede, comissões, carteira/saldo e pede **saques**.
- Comissões só são geradas a partir de **pagamentos confirmados**.
- Planos comuns podem existir sem gerar comissão.
- **Clientes Parceiros Raiz**: base que o lojista já tinha antes de usar o
  sistema. Cadastro liberado só nos primeiros ~10 dias. Não contam para a faixa
  de licença até um gatilho configurável pelo admin (tempo, ex. 12 meses, e/ou
  receita/quantidade de novos clientes). Depois disso passam a contar.
- **Licença do lojista** por faixa de clientes ativos: até 10 grátis; 11–30
  R$80; 31–60 R$138; 61–90 R$189; 91–130 R$260; 131–170 R$323; ... até 5.000.
- **Consultores comerciais** vendem o Cliente Plus para estabelecimentos:
  recebem bônus em upgrades de plano, ~10% recorrente da mensalidade da
  carteira, e 5% para quem indicou o consultor.

Menu do painel do lojista hoje: Dashboard, Receitas, Assinaturas, Saques,
Clientes, Árvore de Indicações, Produtos/Planos, Benefícios, Materiais de
divulgação, Personalizar Loja, Relatórios, Integrações, Minha assinatura,
Configurações, Gerenciar Barbearias.

## Por que existem os módulos

Na venda, muitos estabelecimentos já têm outro sistema (agenda/CRM) e não querem
**lançar cada pagamento em dois lugares**. Sem os pagamentos no Cliente Plus, o
sistema não consegue calcular indicações e comissões. A solução: o Cliente Plus
oferece **módulos de gestão por segmento** que substituem o sistema que o lojista
já usa, e os pagamentos passam a alimentar as comissões automaticamente.

- Primeiro módulo (já existe no projeto principal): **Agenda para Barbearias**:
  agendamento presencial/online, profissionais com agenda própria, serviços e
  valores, histórico de clientes, resultados.
- Um módulo tem **cobrança própria** e funciona **sozinho** (sem assinaturas
  nem indicações) ou **integrado** ao Cliente Plus.
- Próximos segmentos: academias, clínicas/consultórios, escolas/cursos, salões,
  pet shops, terapeutas etc.

## Projeto principal (destino dos módulos)

Feito no Lovable: React + TypeScript + Tailwind + shadcn/ui, rotas por arquivo
do TanStack Router (`src/routes/_authenticated/painel.*.tsx`), Zustand, dnd-kit,
banco Supabase/Postgres (Lovable Cloud) com RLS e migrations em
`supabase/migrations`. Tabelas conhecidas: `stores` (com `page_config` jsonb),
`store_page_versions`; bucket de arquivos `store-media`; página pública em
`/loja/:slug`.

## Estrutura deste projeto

```
backend/    Java 21 + Quarkus 3 + Maven (wrapper mvnw) + H2 em memória
  src/main/java/br/com/clienteplus/modulos/
    comum/EntidadeDaLoja.java      base das entidades (id uuid + storeId)
    comum/Formatos.java            mês "Ago", "há 5 min", "Hoje, 14:30", números
    <modulo>/<Nome>Resource.java   rotas da API em /api/<modulo>/...
    <modulo>/Dashboard<Nome>.java  records com o formato do JSON (contrato)
    <modulo>/<Tabela>.java         entidades Panache (uma por tabela)
  src/main/resources/
    application.properties         porta 3001, prefixo /api, H2, Flyway
    db/migration/V*.sql            criação das tabelas (vai para o Supabase)
    db/cliente-plus-simulado/V4*   imitação de tabelas do Cliente Plus (NÃO vai)
    db/dados-demo/V1xx__*.sql      dados de exemplo (só do laboratório; pode usar
                                   funções do H2, ex. dateadd)
frontend/   Vite + React + TanStack Router + Tailwind v4 + lucide-react
  src/routes/        rotas por arquivo (mesmo padrão do projeto principal)
scripts/mvnw.mjs     chama backend/mvnw(.cmd) a partir dos scripts npm
```

- **Banco H2 em memória** em modo PostgreSQL (pedido do usuário). Cada
  (re)início do backend cria um banco novo (URL **sem** `DB_CLOSE_DELAY`, pool
  com `min-size=1` para o banco não sumir com o backend ligado) e o Flyway
  roda tudo; os dados voltam ao exemplo sempre que o backend reinicia. Editar
  um `.sql` ou `.java` com o `npm run dev` ligado reinicia o backend sozinho.
  **Não voltar a usar `clean-at-start` + `DB_CLOSE_DELAY=-1`**: depois de
  várias recargas o H2 2.4 corrompia uma regra CHECK ("Check constraint
  invalid") e fechava o banco ("database has been closed") nas gravações.
- Testes com `curl` no Git Bash: texto com acento no JSON chega com
  codificação errada (erro 400); o navegador manda certo.
- Arquivos enviados (imagens/vídeos): `POST /api/arquivos` (multipart, campo
  `arquivo`; imagens até 8 MB, vídeos até 100 MB), gravados em
  `backend/data/uploads` (ignorado pelo git) e servidos em
  `/api/arquivos/<nome>` com suporte a Range (`comum/Arquivos.java`). No
  projeto principal: Supabase Storage; no banco fica só a URL.
- SQL precisa rodar no H2 **e** no Supabase: escrever
  `timestamp with time zone` (H2 não aceita `timestamptz`), `default` antes de
  `primary key`, intervalos como `interval '5' minute`, e `integer` em vez de
  `smallint` (a validação do Hibernate no modo dev compara com `int` do Java).
- Entidades Panache com campos públicos em camelCase; o
  `CamelCaseToUnderscoresNamingStrategy` mapeia para snake_case.
- Loja de exemplo de cada módulo em `academia.store-id` / `grupo-vip.store-id`
  (application.properties) até existir login.
- Dashboard da Academia é calculado dos dados (ver seção do módulo). O de
  Grupos VIP ainda lê tabelas de resumo com os números do print.
- Cuidado com processos antigos: um Vite/Quarkus esquecido na porta 5173/3001
  faz o novo subir em outra porta (5174) e o navegador mostra código velho.
- Ver/consultar o banco: http://localhost:3001/q/dev-ui → Agroal → Database
  view (só no `npm run dev`).
- JSON em camelCase igual aos tipos do frontend; campos diferentes usam
  `@JsonProperty` (ex.: `created_at`). `numeric` do banco passa por
  `Formatos.numero()` para o JSON não sair como `482.0`.
- Java instalado via `winget install EclipseAdoptium.Temurin.21.JDK`
  (JAVA_HOME configurado). Maven não precisa ser instalado.
- `npm run dev` na raiz liga os dois (backend com `quarkus:dev`, que recompila
  sozinho ao salvar um `.java`). Front em http://localhost:5173, API em
  http://localhost:3001/api (o Vite redireciona `/api` para o backend).
- `npm run typecheck` compila o backend e verifica os tipos do frontend.

## Regras para facilitar a migração ao projeto principal

- Migrations em **SQL Postgres compatível com Supabase** (uuid,
  `timestamp with time zone`, `gen_random_uuid()`), agrupadas por módulo, com
  as policies de RLS anotadas como comentário. Dados de exemplo ficam
  separados em `db/dados-demo`.
- Tabelas de cada módulo com prefixo do módulo (ex.: `academia_checkins`) e
  sempre com `store_id` (o lojista dono dos dados).
- **Clientes, planos, assinaturas e pagamentos já existem no Cliente Plus**
  (confirmado pelo usuário). Os módulos não recriam isso: usam esses dados.
  No laboratório eles são simulados em `cp_clientes`, `cp_planos`,
  `cp_assinaturas`, `cp_pagamentos` (pacote Java `clienteplus`). Na migração,
  trocar `@Table`/colunas pelas tabelas reais. Dados só do módulo (ex.: ficha
  de treino) ficam em tabelas próprias ligadas ao cliente por `cliente_id`.
- Pagamentos de um módulo devem poder gerar comissões no Cliente Plus: registrar
  o pagamento confirmado de forma que o motor de comissões consiga consumir.
- Visual igual ao painel: tema escuro, gradiente roxo→rosa (`bg-brand-gradient`),
  cards `bg-surface` com `border-line`, títulos em `font-display` (Outfit).
- Cada módulo fica em `frontend/src/routes/modulos.<slug>.*` e
  `backend/src/main/java/br/com/clienteplus/modulos/<slug>/`, com componentes
  próprios em `frontend/src/components/<slug>/`.
- Atualize o `status` do módulo em `db/dados-demo/V101__demo_modulos.sql` conforme avança.

## Módulo Academia ("Gestão Plus Academia") — pronto para migrar

Todas as abas do menu funcionam (o usuário pediu para terminar o módulo sem
perguntar; as decisões tomadas estão abaixo e podem ser revistas por ele).

- Abre em `/academia` em tela cheia, com menu e topo próprios (layout em
  `frontend/src/routes/academia.tsx`, componentes em
  `frontend/src/components/academia/`, cores `ac-*` em `index.css`).
- Padrão de cada parte: tabelas em `db/migration/V*.sql`, FKs para o cliente
  simulado em `db/cliente-plus-simulado/`, exemplo em `db/dados-demo/V1xx`,
  regras numa classe de serviço, rotas em `*Resource.java`, formatos em
  `*Contrato.java` ↔ `frontend/src/lib/academia-*.ts`, telas em
  `frontend/src/routes/academia/`. Componentes comuns: `ui.tsx` (Card,
  CardNumero, Abas, CabecalhoPagina, Vazio), `formulario.tsx` (Modal, Campo,
  Botao, Interruptor), `SeletorAluno.tsx`.
- **Dashboard** (`PainelAcademia.java` ↔ `lib/academia.ts`): tudo calculado dos
  dados. Ativo = matrícula ativa no dia. Inadimplência = % dos ativos com
  mensalidade vencida. Receita = pagamentos recebidos no mês; despesas = pagas
  no mês (null enquanto não houver nenhuma). Check-ins hoje e horários de pico
  vêm dos acessos. Alertas: mensalidades_atrasadas, vencem_em_breve,
  sem_matricula, fichas_treino, sem_frequencia (14+ dias sem vir),
  reavaliacao, cancelamentos. O sininho do topo lista os mesmos alertas.
  Todos os atalhos levam às telas.
- **Alunos / Matrícula / Faturamento** (`Matriculas.java`, `AlunosContrato`).
  Aluno = cliente, matrícula = assinatura, mensalidade = pagamento do Cliente
  Plus. Matricular cria a 1ª mensalidade; receber cria a próxima; cancelar
  cancela as em aberto. "Atrasada" = pendente vencida (calculado). Pagamento
  `pago` com `origem='academia'` é o que o motor de comissões consome. Planos
  são do Cliente Plus (o módulo só lista). A ficha do aluno mostra também
  treino, evolução de carga, avaliação física e frequência.
  - Faturamento tem 3 partes (`?secao=`): Receitas (mensalidades e serviços),
    Despesas (`academia_despesas`, recorrente = ao pagar cria a do mês
    seguinte) e Resultado (regime de caixa, 6 meses, por categoria e forma).
  - **Pagamentos avulsos** (venda de serviço) ficam em `cp_pagamentos` SEM
    assinatura e com `descricao` (`cliente-plus-simulado/V13`). CONFIRMAR na
    migração como o Cliente Plus real guarda pagamento avulso. Todo código que
    usa `p.assinatura` precisa checar null.
- **Check-in e Controle de acesso** (`Acessos.java`, `AcessoContrato` ↔
  `lib/academia-acesso.ts`, `V7`). Tabela `academia_acessos` (liberado =
  check-in; tentativas bloqueadas de dispositivos também ficam). Bloqueia, nesta
  ordem: bloqueio manual, sem matrícula, atraso além da tolerância (padrão 5
  dias), fora do horário. Recepção pode "liberar mesmo assim" (fica marcado).
  Entrada repetida dentro do intervalo (60 min) não conta. Catraca/leitor chama
  `POST /api/academia/acesso/dispositivos/entrada` com o token do dispositivo e
  o CPF (ou id do aluno); não existe integração com catraca real (decisão:
  deixar a API pronta e o "Testar entrada" na tela). No Supabase isso vira uma
  Edge Function com service role.
- **Horários de pico** (`HorariosPico.java`): média de entradas por dia da
  semana e hora nas últimas N semanas; ocupação = média / capacidade
  (Configurações; demo = 12 pessoas).
- **Configurações** (`Configuracoes.java`, `academia_config` +
  `academia_horarios`): dados da academia, gestor/frase (continuam em
  `academia_painel`), horário de funcionamento, capacidade, validade padrão da
  ficha, prazo de reavaliação. Regras de entrada ficam no Controle de acesso.
- **Treinos** (`Treinos.java`, `V5`). Toda ficha tem professor; 1 ficha ativa
  por aluno; validade padrão em Configurações; salvar troca a ficha inteira.
  Área do cliente SIMULADA em `/cliente/$alunoId` (`?aba=aulas|beneficios`),
  que no projeto principal vira abas na área do cliente real: Meu treino
  (aluno marca exercício feito e anota a carga, `academia_treino_registros`,
  guardado por exercício), Aulas (reserva) e Benefícios (resgate).
- **Avaliação física** (`Avaliacoes.java`, `V9`): peso, altura, IMC (OMS),
  % de gordura digitado (bioimpedância) ou pelas 7 dobras (Jackson & Pollock +
  Siri), medidas, pressão, restrições. Sexo fica na avaliação (o cliente do
  Cliente Plus não tem). Reavaliação vencida após N dias (Configurações).
- **Aulas e turmas** (`Aulas.java`, `V12`): aula → horários na semana → turma
  fixa e reservas avulsas por data; ocupação = fixos − fixos que avisaram que
  não vão + avulsos; chamada presente/faltou até o dia da aula.
- **Agenda** (`Agenda.java`, `V11`): horários com profissionais (serviço,
  avaliação, compromisso). Não deixa marcar em cima de outro horário nem de
  uma aula do profissional. Concluir um serviço pode gerar a cobrança.
- **Serviços** (`Servicos.java`): preço, duração (aparece na Agenda), % de
  comissão do profissional (copiado na venda) e se gera comissão de indicação.
- **Comissão** (`Financeiro.java`): profissionais = % sobre vendas pagas no mês;
  "Pagar" cria uma despesa "comissoes" (`academia_comissoes_pagas`).
  Indicações = SIMULAÇÃO do motor do Cliente Plus (`cp_clientes.indicado_por_id`
  e `cp_programa_indicacao` em `cliente-plus-simulado/V16`, 10/5/2%); no
  projeto principal essa aba passa a ler do Cliente Plus.
- **Benefícios** (`Beneficios.java`, `V15`): tipos parceiro (cupom),
  indicacao, fidelidade (meses), aniversario (1x/ano), frequencia (check-ins no
  mês, 1x/mês). Resgate pela recepção ou pelo app; "entregue" marca a entrega.
  Pode se juntar ao "Benefícios" que já existe no Cliente Plus na migração.
- **Relatórios** (`Relatorios.java`): alunos por mês (churn), aniversariantes,
  sumidos (7/14/30 dias, com WhatsApp), inadimplência, aulas, profissionais.
  Cada tabela baixa CSV (`;` e BOM, para o Excel) e a tela imprime.
- Dados de exemplo: `V104` alunos, `V105` treinos, `V106` acessos (9 semanas),
  `V107` avaliações, `V108` serviços/vendas/aulas/agenda, `V109` despesas,
  comissões, indicações e benefícios, `V110` treinos marcados. H2:
  `system_range(...) as r (x)` precisa do apelido da coluna; `lateral` e
  `hash()[1]` não foram usados (evitar).
- Fotos em `frontend/public/academia/` (Unsplash, licença livre).
- Gráficos em recharts com animação desligada (`isAnimationActive={false}`).
- O usuário pediu para tirar "Planos" e "Matrículas" do menu.
- Testar no celular: o Chrome headless não abre janela < ~500px; para 390px
  usar emulação pelo protocolo do Chrome (Emulation.setDeviceMetricsOverride).
- No terminal (Bash), evitar `node -e "..."` com crases de template string:
  o Bash as executa. Para edições grandes, escrever um script `.mjs`.

## Módulo Grupos VIP ("Gestão Plus Grupos VIP") — em desenvolvimento

- Para quem vende acesso a grupos pagos no **Telegram e no WhatsApp**
  (cada grupo tem `plataforma: "telegram" | "whatsapp"`).
- Mesmo padrão da academia: layout em `frontend/src/routes/grupo-vip.tsx`,
  componentes em `frontend/src/components/grupo-vip/`, cores `gv-*` (laranja
  sobre azul-marinho), tabelas `grupo_vip_*` (exemplo em `V103__demo_grupo_vip.sql`) servidas
  por `GET /api/grupo-vip/dashboard`, tipos em `frontend/src/lib/grupo-vip.ts`.
- Menu com submenu Financeiro (Receitas, Assinaturas, Saques). Demais itens
  abrem `/grupo-vip/<secao>` com "Tela em construção".
- Fotos em `frontend/public/grupo-vip/` (Unsplash).
