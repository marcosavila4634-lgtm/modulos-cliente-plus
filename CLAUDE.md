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

## Módulo Academia ("Gestão Plus Academia") — em desenvolvimento

- Abre em `/academia` em tela cheia, com menu e topo próprios (layout em
  `frontend/src/routes/academia.tsx`, componentes em
  `frontend/src/components/academia/`, cores `ac-*` em `index.css`).
- Dashboard recriado a partir de um print enviado pelo usuário. **Números
  reais**: `GET /api/academia/dashboard` é calculado em `PainelAcademia.java`
  a partir de `cp_clientes/cp_assinaturas/cp_pagamentos` (formato em
  `DashboardAcademia.java` ↔ `frontend/src/lib/academia.ts`). Só o cabeçalho
  (nome, gestor, frase) vem de `academia_painel`.
  - Ativo = matrícula ativa no dia (inclui em atraso). Inadimplência = % dos
    ativos com mensalidade vencida e não paga (variação em pontos).
    Faturamento/receita = pagas no mês pela data do pagamento.
  - Alertas: mensalidades_atrasadas, vencem_em_breve (7 dias), sem_matricula, fichas_treino,
    cancelamentos (cada um é link para Faturamento ou Alunos).
  - Atividades: matricula, pagamento, cancelamento, novo_aluno (5 últimas).
  - Check-ins hoje / Horários de pico mostram "Em breve" (checkinsHoje null,
    horariosPico vazio). Gráfico vira "Receita mensal" enquanto `despesas`
    for null (não existe lançamento de despesas ainda).
  - `V104__demo_alunos.sql` gera +120 alunos com 8 meses de histórico
    (H2 `system_range(...) as r (x)`: a coluna precisa de apelido).
- **Fase 1 pronta: Alunos + Matrícula + Faturamento.** Aluno = cliente,
  matrícula = assinatura, mensalidade = pagamento do Cliente Plus.
  - Telas: `/academia/alunos` (lista, filtros, busca, "Novo aluno" com
    matrícula opcional), `/academia/alunos/$id` (ficha, editar, matricular,
    cancelar, receber, histórico) e `/academia/faturamento` (resumo do mês,
    abas a receber/em atraso/pagas/todas, receber).
  - API: `AlunosResource`, `PlanosResource`, `CobrancasResource`; regras em
    `Matriculas.java`; formatos em `AlunosContrato.java` ↔
    `frontend/src/lib/academia-alunos.ts`.
  - Regras: matricular cria a 1ª mensalidade (vence no início); receber cria a
    próxima (vencimento + duração do plano) enquanto a matrícula está ativa;
    cancelar cancela as em aberto. "Atrasada"/"em atraso" = pendente com
    vencimento antes de hoje (calculado, não gravado). Pagamento `pago` com
    `origem='academia'` é o que o motor de comissões consome.
  - Planos são cadastrados no Cliente Plus; o módulo só lista (sem tela).
  - Atalhos do Dashboard "Novo aluno", "Nova matrícula" e "Cobrança" e a busca
    do topo já levam a essas telas.
- **Fase 2 (parcial): Dashboard real pronto.** O usuário pediu para deixar o
  Check-in para depois. Lançamento de despesas também ainda não existe.
- **Treinos — Etapa 1 pronta.** Decisões do usuário: toda ficha tem professor
  responsável; o aluno vê o treino na **área do cliente do Cliente Plus**;
  exercícios com texto, imagem (upload), vídeo (upload) e link de vídeo.
  - Tabelas (`V5__academia_treinos.sql`): `academia_profissionais`,
    `academia_exercicios`, `academia_fichas` (sem `cliente_id` = MODELO),
    `academia_ficha_treinos` (A, B, C...), `academia_ficha_exercicios`. FK de
    `cliente_id` para o cliente simulado fica em `cliente-plus-simulado/V6`.
    Exemplo em `V105__demo_treinos.sql` (4 professores, 63 exercícios,
    3 modelos, fichas para 3/4 dos alunos ativos com validades variadas).
  - Regras em `Treinos.java`: 1 ficha ativa por aluno (montar nova encerra a
    anterior); validade padrão 8 semanas; situação vencida / vence_em_breve
    (7 dias) / em_dia; salvar troca a ficha inteira (treinos e exercícios).
  - API: `ProfissionaisResource`, `ExerciciosResource`, `TreinosResource`
    (`GET /academia/treinos`, `POST/GET/PUT /academia/fichas`,
    `POST /academia/fichas/{id}/excluir`), `AreaClienteResource`
    (`GET /area-cliente/{clienteId}/treino`). Contrato em
    `TreinosContrato.java` ↔ `frontend/src/lib/academia-treinos.ts`.
  - Telas: `/academia/profissionais`, `/academia/exercicios`,
    `/academia/treinos` (abas Fichas dos alunos / Modelos),
    `/academia/treinos/$fichaId` (editor único para modelo e ficha de aluno,
    avisa ao sair sem salvar), cartão "Treino" na ficha do aluno.
  - Área do cliente SIMULADA em `/cliente/$alunoId` (fora do layout da
    academia, visual do Cliente Plus, feita para celular). No projeto
    principal vira uma aba "Meu treino" na área do cliente real.
  - Dashboard: alerta `fichas_treino` e atalho "Ficha de treino".
- Próximas etapas de treino combinadas: aluno marca exercício feito e anota a
  carga; depois evolução de carga e ligação com Avaliação física/Check-in.
- Outras fases: Check-in (manual primeiro, depois catraca); Avaliação física,
  Aulas e turmas; Comissão, Relatórios, extras.
- Os outros itens do menu abrem `/academia/<secao>` com "Tela em construção".
- Fotos em `frontend/public/academia/` (Unsplash, licença livre), que podem ser
  trocadas pelas da academia.
- Gráficos em recharts com animação desligada (`isAnimationActive={false}`),
  para ficarem iguais ao print e aparecerem nas capturas automáticas.
- O usuário pediu para tirar "Planos" e "Matrículas" do menu (existem no
  Cliente Plus; no módulo a matrícula é feita pela ficha do aluno).
- Testar no celular: o Chrome headless não abre janela < ~500px; para 390px
  usar emulação pelo protocolo do Chrome (Emulation.setDeviceMetricsOverride).

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
