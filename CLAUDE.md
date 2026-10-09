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

Levantado em 09/10/2026 olhando o site no ar (clienteplus.club, só leitura; o
código-fonte do principal NÃO está nesta máquina nem no GitHub do usuário):

- **Backend Java/Quarkus (RESTEasy)** no Google Cloud Run, em
  `clienteplus.club/api/...`, JSON em snake_case, `Authorization: Bearer`
  com o token do Supabase Auth. **Supabase só faz login e guarda arquivos**
  (bucket público `cliente-plus`, `stores/<storeId>/...`); o front não lê
  tabelas direto.
- Frontend: React 19 + TanStack Router/Start (SSR) + TanStack Query +
  shadcn/Radix + Tailwind + lucide + recharts. **Sem dnd-kit e sem Zustand.**
- Segurança do site (CSP): imagens só do próprio site, do Supabase e
  `img.youtube.com`; iframes só YouTube-nocookie, Vimeo e Supabase (mapa do
  Google é bloqueado); fontes só do próprio site (Google Fonts bloqueado).
- Página pública em `/loja/:slug`. "Personalizar Loja"
  (`/painel/personalizar`): `GET/PUT /stores/mine/pagina` (PUT `{doc}`;
  resposta `{rascunho, publicado, versao, publicado_em, no_ar}`),
  `POST .../pagina/publicar`, `DELETE .../pagina/publicacao`,
  `GET .../pagina/versoes[/id]`, `POST /stores/mine/imagem` (multipart
  `file`, até 2 MB, devolve `{url}`), `GET /public/stores/<slug>` (traz
  `pagina` e `plans`). Documento no **modelo 2**:
  `{ modelo, tema: {marca, tom, raio, densidade, titulacao}, secoes: [{id, tipo, visivel, props}] }`.

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
- Os Dashboards da Academia e dos Grupos VIP são calculados dos dados (ver
  a seção de cada módulo).
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

## Página pública personalizável (comum a TODOS os módulos)

Pedido do usuário: o dono de qualquer módulo monta a própria página pública
(mesmo layout, tudo editável) e o MESMO editor serve para todos os módulos.

- Banco: `db/migration/V20__paginas.sql` (`modulos_paginas`: rascunho e
  publicada por loja+módulo, JSON em text; `modulos_paginas_versoes`: 20
  últimas publicações). O servidor não interpreta as seções; só valida forma,
  tamanho e bloqueia `javascript:`/`data:` em campos de link/imagem.
- Backend `paginas/`: `Paginas.java` (rascunho, publicar, descartar,
  restaurar), `PaginasResource` em `/api/paginas/<modulo>`,
  `ModuloComPagina` (interface que cada módulo implementa: loja, link,
  dados para a prévia, `aoPublicar`).
- **Formato igual ao do "Personalizar Loja" do sistema principal**, para o
  editor ser puxado para lá com pouco trabalho: **modelo 3** =
  `{ modelo: 3, tema, secoes: [{ id: "s_...", tipo, visivel, props, estilo }] }`.
  `completar` abre o modelo 2 do principal (cor `marca` vira as cores;
  `props.fundo`/`props.alinhamento` viram `estilo`). Os nomes de seções e
  de campos em comum são os do principal (capa, destaques, comoFunciona,
  sobre, planos, beneficios, galeria, depoimentos, duvidas, chamada,
  contato, rodape; itens com `id`, `titulo`, `texto`, `autor`, `imagem`).
- Frontend: formato, catálogo e `completar` em `lib/pagina.ts`; cores em
  `lib/pagina-cores.ts`; desenho em `components/pagina/PaginaPublica.tsx`
  (container queries `@xl/@3xl/@5xl` para a prévia "celular" ficar igual ao
  celular; cores por variáveis `--pg-*`, que cada seção pode trocar); editor
  em `components/pagina/EditorPagina.tsx` + `campos.tsx` (salva o rascunho
  sozinho, Publicar, versões, desfazer/refazer com Ctrl+Z, prévia
  celular/computador, clicar na prévia abre a seção e mostra os botões
  subir/descer/duplicar/esconder/apagar).
- **Arrastar** (dnd-kit, `Ordenavel`/`useItemOrdenavel`/`Lista` em
  `campos.tsx`): seções e itens das listas mudam de ordem pela alça.
- **Combinações de cores** (ideia do Delivery Plus,
  `H:\PROJECTS\delivery-plus\src\lib\panelThemes.ts`): 20 prontas × fundo
  escuro/claro (`coresDa`) e "Editar a minha" (10 cores, vira a
  "Personalizada"; avisa quando o texto some no fundo). A página guarda as
  cores já resolvidas em `tema.cores`.
- **Aparência por seção** (`estilo`, aba Aparência): fundo (da página,
  alternado, escuro, cores da marca, uma cor, degradê, foto), cor do texto,
  cor dos botões, espaço, largura, alinhamento, tamanho dos títulos e
  colunas. Em fundo parecido com a cor dos botões, os botões trocam de cor
  sozinhos (`aparencia` em `PaginaPublica.tsx`).
- Seções além das do principal: aviso, vídeo (YouTube/Vimeo/enviado),
  equipe, aulas, horários, endereço e mapa. Tema: combinação, tom, letra,
  cantos, respiro.
- **Para puxar para o sistema principal**: copiar `lib/pagina.ts`,
  `lib/pagina-cores.ts` e `components/pagina/`; instalar `@dnd-kit/core`,
  `@dnd-kit/sortable`, `@dnd-kit/utilities`; trocar `apiPagina` pelas rotas
  `/stores/mine/pagina...`; envolver o editor com
  `<EnvioDeArquivo.Provider>` usando `POST /stores/mine/imagem`; escrever o
  adaptador da loja (`ModuloPagina`: `loja`/`plans` → `DadosPagina`); a
  seção de planos daqui é simples (o principal tem filtro por recorrência e
  tabela comparativa: reaproveitar o desenho de lá, `props.filtro` e
  `props.comparativo` já existem); conferir se o servidor aceita `estilo` e
  o tamanho do documento; por causa da CSP, levar as fontes junto e liberar
  ou tirar o mapa.
- **Digitar direto na prévia** (`components/pagina/Texto.tsx`, `Txt`): na
  página de verdade é texto comum; no editor vira `contentEditable` e cada
  tecla chega em `editarTexto` (caminho `"titulo"`, `"itens/<id>/texto"` ou
  `"pecas/<id>/texto"`). O conteúdo é escrito fora do React para o que a
  pessoa digita não ser desfeito. No editor, itens vazios das listas
  aparecem (para dar para clicar) e as perguntas ficam abertas.
- **Peças livres ("tela livre tipo Canva", pedido do usuário)**:
  `secao.pecas` (texto, foto, botão, forma, ícone) por cima de QUALQUER
  seção, e a seção **Tela livre** (`livre`, só peças, altura do dono).
  Cada peça tem uma caixa para o computador (`pc`) e outra para o celular
  (`cel`), em unidades de desenho: tela do computador = 1200 (faixa central),
  celular = 390; troca aos 768px (`@3xl`) e tudo escala com a tela
  (`--u`, `classeCamada`/`classePeca` em `Pecas.tsx`). Texto e botão têm a
  altura do conteúdo. Desenho em `Pecas.tsx` (vai para a página pública);
  arrastar, esticar pelos quadradinhos, grudar em bordas/meio/outras peças
  com linhas-guia, setas/Delete e a aba "Peças livres" em
  `PecasEdicao.tsx` (só o editor carrega). O editor mexe só na caixa do
  aparelho escolhido em cima da prévia; "Copiar o lugar do
  computador/celular" e "Arrumar o celular sozinho" (empilha) ajudam.
  **Margens**: botão em cima da prévia liga as linhas "borda da tela"
  (rosa) e "margem segura" (azul, 16 unidades).
- **Várias peças de uma vez** (pedido do usuário: "selecionar tudo menos o
  banner e arrastar junto"): Shift+clique, caixinhas na lista, "Escolher
  todas", Ctrl+A e, na Tela livre, laço arrastando no vazio. Arrastar uma
  move todas; setas e Delete valem para o grupo. A Tela livre cresce
  sozinha quando uma peça passa do fim (`mudarPecas`).
- **"Soltar tudo em peças livres"** (`Soltar.tsx`, botão na aba Peças
  livres): o conteúdo pronto de uma seção NÃO é arrastável; este botão
  desenha a seção escondida em 1280 e em 390, mede cada elemento
  (`[data-txt]`, img, a/button, svg do catálogo, caixas com fundo/borda) e
  troca a seção por uma Tela livre com tudo no mesmo lugar nos dois
  aparelhos. Vale para capa, aviso, destaques, benefícios, como funciona,
  texto com foto, depoimentos, galeria, equipe, chamada, contato e rodapé
  (`podeSoltar`). Perde: logo padrão do módulo e ícones fora do catálogo,
  parte colorida do título, estrelas. Por isso a capa deixou de ser
  obrigatória (`completar` só garante os planos).
- Seções com dados automáticos (planos, aulas, horários, mapa) continuam
  como blocos (decisão: soltas quebrariam quando o cadastro muda); aceitam
  peças por cima.
- Defeito já corrigido: sem `onDragStart preventDefault` na peça, o
  navegador "arrastava o link/texto" (botões, texto selecionado) e
  cancelava o movimento. O teste por CDP não pega isso (só mouse de verdade).
- Teste sem publicar: `scratchpad/publica-rascunho.mjs` da conversa de
  09/10/2026 trocava a resposta da rota pública pelo rascunho (CDP
  `Fetch.fulfillRequest`); o usuário costuma testar no navegador ao mesmo
  tempo, então não publicar nem reiniciar o backend durante os testes.
- Ideias que ficaram de fora: girar peças, alça para puxar a altura da
  Tela livre na prévia (hoje é uma régua ao lado), trocar foto clicando na
  prévia, peças presas fora da área visível só voltam pelos números ou por
  "Pôr no meio da tela".
- **O celular acompanha o computador** (`celularAcompanha` em `lib/pagina.ts`,
  chave ligada por padrão na aba Peças livres): mexer no computador repete no
  celular (vertical igual, horizontal e tamanho na proporção, sem sair da
  tela); mexer no celular fica só no celular. Peça que muda as duas caixas no
  mesmo passo não é tocada. A Tela livre cresce nos dois aparelhos.
- Cada módulo tem um adaptador `lib/pagina-<modulo>.tsx` (seções permitidas,
  página padrão, dados → `DadosPagina`, cores do editor) e a tela
  `routes/<modulo>/pagina.tsx`. **Módulo novo com página:** implementar
  `ModuloComPagina`, a rota pública que devolve `Paginas.publicada(...)` e
  o adaptador.
  - Grupos VIP: `/g/<slug>`, `PaginaGrupoVip.java`, menu "Página de
    vendas". A página padrão é igual à que existia; ao publicar, a descrição,
    os benefícios e a capa são copiados para `grupo_vip_config` (robô
    "Conhecer mais" e Primeiros passos usam). Checkout usa as cores da página.
  - Academia: página NOVA `/a/<slug>`, `PaginaAcademia.java` (rota
    `/api/academia/publico/<slug>`), menu "Página da academia";
    `academia_config.slug` e `whatsapp` (Configurações). Botão do plano
    abre o WhatsApp com o plano (matrícula continua na recepção; decisão).
- **Endereço da página (slug): o lojista NÃO muda** (pedido do usuário).
  É definido na criação da loja (Academia: gerado com o nome em
  `Configuracoes.config`; Grupos VIP: vem com a loja) e depois só a
  plataforma troca: `PUT /api/plataforma/paginas/<modulo>/lojas/<storeId>/endereco`
  (`paginas/PlataformaResource.java`, `ModuloComPagina.mudarEndereco`).
  As telas do lojista só mostram o link. No projeto principal: usar o slug
  da loja (`/loja/:slug`) e proteger a rota com permissão de admin.
- No projeto principal este editor entra no lugar do "Personalizar Loja".
- **Editores por nicho** (pedido do usuário: área SEPARADA dos módulos, fácil
  de levar ao principal): `/editores` (atalho "Editores de página" no menu do
  laboratório), um editor por nicho em `/editores/<nicho>` e a página
  pública em `/n/<nicho>`. Nichos: barbearia (preto e dourado, letra
  Impacto), salão de beleza (claro e rosa) e terapeutas (claro e
  verde-água). Modelos em `frontend/src/lib/pagina-modelos.ts` (uma função
  por nicho; fotos em `frontend/public/modelos/`, Unsplash); adaptador em
  `lib/pagina-nichos.tsx`; servidor em `nichos/` (`PaginaDeNicho` +
  lojas de exemplo em `NichosResource`; módulo do editor =
  `nicho-<nicho>`). O botão "Modelos prontos" do editor (campo
  `modelos` do `ModuloPagina`) troca a página inteira pelo modelo.
  **Nicho novo**: função em `pagina-modelos.ts` + item em `modelos` +
  classe em `NichosResource`. No principal, o nicho da loja (tabela de
  nichos) escolhe o modelo com que a página nasce.

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

## Módulo Grupos VIP ("Gestão Plus Grupos VIP") — pronto para migrar

Para quem vende acesso a grupos pagos no **Telegram e no WhatsApp**. Feito
inteiro de uma vez a pedido do usuário ("todas as etapas, sem perguntar"); as
decisões abaixo podem ser revistas por ele.

- Painel em `/grupo-vip` (layout `frontend/src/routes/grupo-vip.tsx`, telas em
  `frontend/src/routes/grupo-vip/`, componentes em
  `frontend/src/components/grupo-vip/`, cores `gv-*` laranja sobre
  azul-marinho). Backend em `grupovip/`; entidades com
  `@Entity(name = "GrupoVip...")` porque a academia já tem uma entidade
  `Acesso` (nomes de entidade não podem se repetir no Hibernate).
- Tabelas em `db/migration/V3__grupo_vip.sql`; FKs para o Cliente Plus e a
  imitação de saques (`cp_saques`) em `cliente-plus-simulado/V19`; exemplo em
  `dados-demo/V111__demo_grupo_vip.sql` (fica DEPOIS da academia porque
  V104–V110 procuram clientes pelo nome sem olhar a loja).
- Contratos: `MembrosContrato`, `AcessosContrato`, `ConteudosContrato`,
  `FinanceiroContrato`, `PublicoContrato` (+ records dentro de
  `GruposResource`, `AutomacaoResource`, `ConfiguracoesResource`,
  `Relatorios`, `Suporte`) ↔ `frontend/src/lib/grupo-vip*.ts`.
- **Membro = cliente; plano/assinatura/mensalidade = Cliente Plus**
  (pagamentos com `origem='grupo-vip'`). Planos podem ser criados no módulo
  (para funcionar sozinho); `grupo_vip_plano_grupos` diz quais grupos cada
  plano libera. Uma assinatura ativa por membro.
- **Situação** (`Membros.java`, calculada): aguardando_pagamento, em_dia,
  vencendo (≤3 dias), atrasado (≤ tolerância, continua com acesso), bloqueado
  (atraso > tolerância ou bloqueio manual), cancelando (cancelou, acesso até o
  fim do período pago), sem_plano. Tolerância em Configurações (demo 3 dias).
- **Controle de acesso** (`ControleAcesso.java`): compara quem tem direito com
  `grupo_vip_acessos` (convidado/no_grupo/removido) → pendências adicionar /
  aguardando / remover. Grupo **automático** = Telegram + robô conectado +
  `telegram_chat_id`: o robô cria um link exclusivo por membro
  (`creates_join_request`), aprova só quem tem direito, tira quem perdeu (ban +
  unban). Demais grupos (WhatsApp, decisão: sem API não oficial para não
  arriscar banimento) são **assistidos**: a tela mostra a lista e o dono marca
  "Já adicionei / Já tirei". Histórico em `grupo_vip_acesso_eventos`.
- **Robô do Telegram** (`Telegram.java` HTTP da Bot API, `RoboTelegram.java`
  consulta `getUpdates` a cada 3 s): `/start <codigo>` liga o Telegram ao
  membro e manda os links; `/id` no grupo responde o ID; detecta grupos onde
  foi adicionado. Token guardado só no servidor. No Supabase: Edge Function
  com webhook e o token como segredo.
- **Automações** (`Automacoes.java`, `@Scheduled` a cada 60 s + botão "Rodar
  agora"): sincroniza acessos, gera mensagens (boas_vindas, lembrete, vencido,
  remocao, reconquista, aniversario, live — textos editáveis com variáveis
  `{nome}`, `{link_area}`...), publica conteúdos agendados, avisa lives e envia
  as pendentes do Telegram. **Caixa de saída** `grupo_vip_mensagens` (chave
  única evita repetir): Telegram envia sozinho; WhatsApp fica pendente e o
  dono toca "Enviar" (abre wa.me com o texto). Links nas mensagens usam
  `EnderecoPublico` (IP do computador na rede; `grupo-vip.url-publica`).
- **Página de vendas** `/g/<slug>` (`?ref=<codigo>` = indicação) e checkout
  (cupom na 1ª mensalidade, `grupo_vip_checkouts`). **Pix**: `Pix.java` gera o
  BR Code "copia e cola" estático (valor + txid, CRC conferido) e a tela faz o
  QR (lib `qrcode`). Confirmação: dono em "Receber", ou no laboratório o botão
  "Simular pagamento confirmado" da área do membro. No projeto principal:
  gateway do Cliente Plus (webhook).
- **Área do membro** `/membro/<codigo>` (simula a área do cliente do Cliente
  Plus): grupos e links, pagamentos com Pix, biblioteca de conteúdos (cada
  abertura grava `grupo_vip_conteudo_views` = "visualizações" do Dashboard),
  lives, indique e ganhe (saldo, saque) e suporte.
- **Controle do Telegram** (tela `/grupo-vip/telegram`, `GestaoTelegram.java`,
  `Enquetes.java`, `TelegramResource`/`TelegramContrato` ↔
  `lib/grupo-vip-telegram.ts`; colunas novas em `grupo_vip_grupos` e tabelas
  `grupo_vip_telegram_topicos`, `grupo_vip_enquetes`,
  `grupo_vip_enquete_envios`, `grupo_vip_moderacao` no V3). Por grupo: proteger
  conteúdo (`protect_content` em posts, lives e enquetes do robô), moderação
  (apaga links e palavras proibidas de quem não é admin; admins em cache de 10
  min; pode silenciar N minutos; histórico em "Mensagens apagadas"),
  boas-vindas no grupo (`{nome}` marca a pessoa), apagar avisos de
  entrada/saída, travar/liberar na hora ou por horário (`aplicarHorarios` roda
  nas Automações e só age na virada), nome/foto/descrição e tópicos (criados no
  painel ou detectados pelo robô). Enquetes/quiz: votos chegam pelo update
  `poll`. Suporte pelo Telegram: texto no privado do robô vira conversa no
  Suporte (`chamados.origem='telegram'`), `/grupos` reenvia os links.
  Mensagens do privado têm botão conforme o tipo (`Mensageiro.botoes`); se o
  Telegram recusar o link do botão (endereço local), reenvia sem botão.
  NÃO testado com um robô real no laboratório (sem token): testar ao conectar.
  Teste com Telegram/Google de mentira: empacotar (`mvnw package
  -Dquarkus.package.output-directory=teste-app`), copiar para fora de
  `target`, rodar o jar na porta 3002 com `-Dgrupo-vip.telegram-api=...`
  etc. apontando para um servidor node falso (assim o `npm run dev` do
  usuário na 3001 continua intacto).
- **Biblioteca** (tela `/grupo-vip/biblioteca`, `Biblioteca.java`,
  `EnvioEmMassa.java`, `GoogleDrive.java`, `BibliotecaResource`/
  `BibliotecaContrato` ↔ `lib/grupo-vip-biblioteca.ts`; tabelas
  `grupo_vip_livros`, `grupo_vip_importacoes`, `grupo_vip_importacao_itens`,
  `grupo_vip_livro_pedidos` no V3; `grupo_vip_config.google_api_key`).
  Envio em massa de uma pasta PÚBLICA do Google Drive (Drive API v3 com chave
  de API, subpastas incluídas) ou de arquivos do computador (navegador manda
  um por vez; guardados em `data/livros`, fora da pasta pública) para um grupo
  do Telegram. `EnvioEmMassa` roda a cada 1 s: lê a pasta e posta 1 arquivo a
  cada 3 s por grupo (respeita `retry_after` do Telegram); baixar/subir fica
  FORA das transações. Sem repetir: md5 por grupo. Limite 50 MB por arquivo
  (API de robôs). Opção "só no robô" não posta no grupo. Robô bibliotecário:
  `/livro <nome>` no privado, lista com botões (`callback_query`), só para
  quem tem acesso ao grupo do livro, 30 por dia; o `file_id` do Telegram é
  guardado no 1º envio. `grupo-vip.telegram-api` e `grupo-vip.google-drive-api`
  trocam os endereços das APIs (testado no laboratório com um Telegram/Drive de
  mentira; com o servidor próprio `telegram-bot-api` o limite sobe para 2 GB).
  CONFIRMAR com Drive e robô reais.
  - **Cópia entre grupos** (origem `telegram`, para quando um grupo lota):
    livros que o robô já postou no grupo de origem vão pelo `file_id`; o resto
    o robô descobre lendo as mensagens do grupo de origem (da 1ª até a do link
    "última mensagem"), 1 por segundo: `forwardMessage` para o privado do
    DONO (`config.telegram_dono_id`, ligado por `/start dono_<codigo>`),
    apaga na hora e, se for documento (ou foto/vídeo/áudio com
    `copiar_midias`), põe na fila; a cópia usa `copyMessage`. Livros copiados
    entram na biblioteca dos dois grupos (`md5 = "tg:<file_unique_id>"`).
    Conteúdo protegido não pode ser encaminhado (conta em `protegidas`; o
    dono desliga "Restringir conteúdo salvo"). Robô não copia grupos em que
    não é administrador (grupos de terceiros: não fazer).
  - **Menu do robô** (`Atendente.java`, a pedido do usuário): no privado,
    o robô responde com botões (`callback_data` "m:<ação>" e "livro:<id>";
    tocar troca a própria mensagem com `editMessageText`). Membro: Baixar um
    livro (nome, autor, categoria, gênero, novidades, mais pedidos), Sugerir,
    Livro surpresa, Meus pedidos, Meus grupos, Minha assinatura, Indique e
    ganhe, Falar com a equipe, Conhecer mais. Visitante: Conhecer, planos,
    "Já sou membro". Quando espera texto (nome, autor, sugestão, suporte)
    guarda o passo em `grupo_vip_robo_conversas` por 15 min. Texto sem passo
    que não é "oi"/"menu" vai para o Suporte (como antes). Mesmo arquivo em
    vários grupos aparece uma vez (md5). Comandos /menu /livro /sugerir
    /grupos (setMyCommands ao conectar o robô).
  - **Dados dos livros** (`Catalogador.java`, `GoogleBooks.java`): subpasta
    do Drive (ou da pasta do computador, campo `pasta`) = categoria; nome
    "Autor - Título" dá o autor quando só um lado parece nome; o Google Books
    (1 livro a cada 2 s, com a chave da Biblioteca ou sem chave) completa
    título, autor, gênero (traduzido), capa, ano e resumo, só se o título
    bater. `dados_status` manual = o dono editou (não troca mais).
    `grupo-vip.google-books-api` troca o endereço (testes).
  - Livros do Drive acima de 50 MB entram na biblioteca (não vão para o
    grupo) e o robô entrega um **link temporário do sistema**
    (`LinksDeLivro.java`, `LivroLinkResource` em `/api/grupo-vip/l/<token>`,
    tabela `grupo_vip_livro_links`), NUNCA o endereço do Drive (pedido do
    usuário: quem deixa de pagar não pode continuar abrindo). O link é de uma
    pessoa, vale 24 h e, a cada clique, confere se ela ainda tem acesso ao
    grupo do livro; o sistema busca o arquivo no Drive e repassa (`?ler=1`
    abre PDF no navegador). Também é usado quando o Telegram recusa o arquivo.
    Arquivo já baixado fica com a pessoa (isso nenhum sistema evita); os que
    vão pelo Telegram seguem com `protect_content`.
  - **Pasta do Drive privada** (`ContaServicoGoogle.java`,
    `config.google_conta_servico`): o dono envia o JSON da conta de serviço
    e compartilha a pasta (Restrita) com o e-mail dela. O sistema assina um
    JWT RS256 e troca por um passe OAuth de 1 h (escopo drive.readonly;
    `grupo-vip.google-token-api` troca o endereço nos testes). Com conta de
    serviço, a chave de API é opcional (só Google Books). `GoogleDrive`
    recebe `Credencial` (chave OU passe).
  - **Sugestões** (`Sugestoes.java`, `grupo_vip_livro_sugestoes`, aba
    Sugestões): 5 por dia por membro; atendida sozinha nas Automações quando
    chega livro com as palavras do título (e do autor); o robô avisa com
    botão "Receber agora". Dono pode marcar "Já está na biblioteca" ou recusar.
  - **Livros ou outros materiais** (`config.biblioteca_tipo`, seletor no
    topo da Biblioteca, `PUT /biblioteca/tipo`): em "materiais" os textos do
    robô trocam "livro" por "material" (`Vocabulario.java`, só em textos
    fixos, nunca em títulos), aceita também vídeo/imagem/planilha/
    apresentação (`Biblioteca.extensoes`), não usa Google Books, gênero nem
    autor pelo nome do arquivo, e o botão "Pelo autor" some se nenhum
    material tiver autor. No código tudo continua se chamando `Livro`.
    Arquivos sobem com `disable_content_type_detection` (vídeo/foto também
    ficam como documento e o `file_id` vem em `document`).
- **Permissões no Telegram** (`Permissoes.java`, `grupo_vip_permissoes`,
  `grupo_vip_plano_grupos.permissao`, `config.atrasado_somente_leitura`):
  robôs NÃO conseguem adicionar pessoas em grupos (regra do Telegram); a
  entrada continua pelo link exclusivo. Níveis completo / sem_midia / leitura
  (`restrictChatMember`). Ordem: administrador escolhido na ficha
  (`promoteChatMember` + título até 16 letras) > nível escolhido na ficha
  (com prazo opcional) > atrasado só lê (Configurações) > nível do plano no
  grupo (Grupos e planos). Aplica nas Automações (25 por rodada), ao entrar
  no grupo e ao salvar a ficha; `aplicado` evita repetir; erro espera 10
  min. `aplicado` null + completo = nada a fazer (o robô nunca mexeu).
- **Ajuda e passo a passo** (pedido do usuário: tudo intuitivo, com passo a
  passo em qualquer integração/cadastro, sem poluir o visual). Textos em
  `frontend/src/lib/grupo-vip-guias.tsx` (um guia por assunto: passos, "deu
  certo quando", dicas, problemas comuns, tela). Componentes em
  `components/grupo-vip/Ajuda.tsx`: `BotaoGuia` (link discreto "Como
  fazer?" — no `guia` do `CabecalhoPagina`, no `acao` do `TituloCard` ou
  dentro de dicas de campos; abre por portal), `CentralAjuda` (botão "?" do
  topo, com busca) e `PrimeirosPassos` (Dashboard; itens vêm de
  `PrimeirosPassosResource.java`, some quando o obrigatório está feito ou
  se o dono esconder — localStorage). **Toda integração ou configuração
  nova ganha um guia e um `BotaoGuia` na tela.** Janelas abertas de dentro
  da barra do topo precisam de `createPortal` (o desfoque da barra prende
  elementos `fixed`).
- Conteúdos (`Conteudos.java`): publicar agora/agendar/rascunho em grupos
  escolhidos; WhatsApp fica "manual" até o dono marcar "Já postei". No
  Telegram: botão com link (`botao_texto`), fixar, tópico por grupo; o id do
  post fica em `conteudo_grupos.telegram_message_id` para fixar/desafixar,
  apagar do grupo e atualizar o texto ao editar.
  Categorias, Lives (aviso X min antes) e Anúncios (públicos: todos, em_dia,
  atrasados, sem_acesso, plano, grupo, novos; opção postar nos grupos).
- Financeiro: Receitas (mês, por dia/plano/forma), Assinaturas (receita
  recorrente mensal, previsão 30 dias), Saques e indicações (SIMULAÇÃO do
  motor do Cliente Plus em `Indicacoes.java`, 10/5/2%; saques em `cp_saques`).
  Relatórios com CSV. Suporte: conversas membro ↔ equipe
  (`grupo_vip_chamados`), resposta também vai pela caixa de saída.
- CONFIRMAR na migração: como o Cliente Plus guarda planos/pagamentos e
  saques reais; gateway de pagamento no lugar do Pix estático; login da
  área do membro (hoje o código do link identifica a pessoa).
- Fotos em `frontend/public/grupo-vip/` (Unsplash).
