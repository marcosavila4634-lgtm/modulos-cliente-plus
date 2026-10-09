# Prompt: trazer o editor de páginas novo para o Cliente Plus

Copie tudo abaixo da linha e cole no Claude que cuida do projeto Cliente Plus.

---

Quero trocar o "Personalizar Loja" (`/painel/personalizar`) e a página pública da loja (`/loja/:slug`) por um editor novo, que já está pronto e testado em outro projeto meu (um laboratório). O trabalho aqui é **portar** esse editor para dentro do Cliente Plus, não reinventar. Leia o código de lá antes de escrever qualquer coisa.

Eu não sou desenvolvedor. Fale comigo em português simples, diga o que vai fazer antes de fazer e me avise de qualquer decisão que mude o que o lojista vê.

## Onde está o código pronto

Repositório público: `https://github.com/marcosavila4634-lgtm/modulos-cliente-plus`, branch `grupo-vip`. Clone numa pasta temporária fora deste projeto (ou leia os arquivos pelo GitHub). Leia por inteiro, nesta ordem:

| Arquivo (dentro de `frontend/src/`) | O que é |
|---|---|
| `lib/pagina.ts` | Formato da página (modelo 3), catálogo de seções, peças livres, `completar` (abre páginas salvas, inclusive do modelo 2) |
| `lib/pagina-cores.ts` | 20 combinações de cores × claro/escuro, cores personalizadas, aviso de leitura difícil |
| `components/pagina/PaginaPublica.tsx` | Desenho da página (usado na página pública e na prévia) |
| `components/pagina/Texto.tsx` | Texto que na prévia do editor pode ser digitado ali mesmo |
| `components/pagina/Pecas.tsx` | Desenho das peças livres |
| `components/pagina/PecasEdicao.tsx` | Arrastar, esticar, escolher várias peças, aba "Peças livres" |
| `components/pagina/Soltar.tsx` | "Soltar tudo em peças livres" (transforma uma seção pronta em peças) |
| `components/pagina/EditorPagina.tsx` | O editor |
| `components/pagina/campos.tsx` | Campos do formulário, arrastar listas, envio de arquivo |
| `lib/pagina-modelos.ts` e `public/modelos/` | Modelos prontos por nicho (barbearia, salão de beleza, terapeutas) com fotos |
| `lib/pagina-academia.tsx`, `lib/pagina-grupo-vip.tsx` e `lib/pagina-nichos.tsx` | Exemplos de "adaptador" (como um sistema entrega seus dados ao editor) |
| `routes/a.$slug.tsx`, `routes/academia/pagina.tsx` | Exemplos de página pública e de tela do editor |

Leia também, no `CLAUDE.md` da raiz daquele repositório, a seção "Página pública personalizável": ela explica as decisões e lista o que precisa mudar na vinda para cá.

Para ver funcionando: naquela pasta, `npm install` na raiz e em `frontend`, depois `npm run dev` (precisa de Java 21) e abra `http://localhost:5173/academia/pagina`.

## O que o editor faz (tudo isto precisa funcionar aqui)

1. **Seções arrastáveis**: a ordem das seções e dos itens das listas (benefícios, passos, depoimentos, fotos, perguntas) muda arrastando pela alça. Também por teclado.
2. **Combinações de cores**: 20 prontas com miniatura, cada uma em fundo escuro ou claro, e "Editar a minha" (10 cores, vira a combinação "Personalizada", avisa quando o texto some no fundo).
3. **Aparência por seção** (aba Aparência): fundo (da página, alternado, escuro, cores da marca, uma cor, degradê, foto), cor do texto, cor dos botões, espaço, largura, alinhamento, tamanho dos títulos, colunas. Em fundo parecido com a cor dos botões, os botões trocam de cor sozinhos.
4. **Digitar direto na prévia**: clicar num texto e escrever ali.
5. **Peças livres** (aba Peças livres): texto, foto, botão, forma e ícone soltos por cima de qualquer seção; arrastar, esticar pelos quadradinhos, grudar em bordas/meio/outras peças com linha-guia; setas e Delete; frente/trás; duplicar; números exatos.
6. **Posição separada para celular e computador** em cada peça, "Copiar o lugar do computador/celular" e "Arrumar o celular sozinho".
7. **Várias peças de uma vez**: Shift+clique, caixinhas na lista, "Escolher todas", Ctrl+A, laço na Tela livre; arrastar uma move todas.
8. **Seção "Tela livre"**: área em branco só com peças, que cresce sozinha quando uma peça passa do fim.
9. **"Soltar tudo em peças livres"**: transforma uma seção pronta numa Tela livre com o mesmo conteúdo no mesmo lugar, nos dois aparelhos.
10. **Margens**: botão que mostra a borda da tela e a margem segura na prévia.
11. Desfazer/refazer (Ctrl+Z), botões subir/descer/duplicar/esconder/apagar na prévia, prévia de celular e computador, versões publicadas.

## O que já existe aqui e precisa ser respeitado

Eu levantei isto olhando o site no ar; **confira no código**, porque você conhece o projeto melhor do que eu:

- O "Personalizar Loja" atual guarda um documento no **modelo 2**: `{ modelo: 2, tema: { marca, tom, raio, densidade, titulacao }, secoes: [{ id, tipo, visivel, props }] }`, com as seções capa, destaques, comoFunciona, sobre, planos, beneficios, galeria, depoimentos, duvidas, chamada, contato e rodape.
- Rotas: `GET/PUT /stores/mine/pagina` (PUT com `{ doc }`), `POST /stores/mine/pagina/publicar`, `DELETE /stores/mine/pagina/publicacao`, `GET /stores/mine/pagina/versoes` e `/versoes/:id`, `POST /stores/mine/imagem` (campo `file`, até 2 MB), `GET /public/stores/:slug` (traz `pagina` e `plans`).
- O editor novo usa o **mesmo formato**, evoluído para o **modelo 3**: mesmos nomes de seções e campos, mais `estilo` e `pecas` em cada seção e as cores resolvidas em `tema.cores`. A função `completar` de `lib/pagina.ts` já converte o modelo 2 para o 3.

## Como fazer

1. **Copie os arquivos** de `lib/pagina.ts`, `lib/pagina-cores.ts` e `components/pagina/` para os lugares equivalentes deste projeto, seguindo a organização de pastas e os nomes daqui. Mude o mínimo; não reescreva a lógica.
2. **Instale** `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities`.
3. **Confira o Tailwind.** O código de lá usa Tailwind v4: `bg-(--variavel)`, `text-(--variavel)`, variantes de container (`@container`, `@xl:`, `@3xl:`, `@5xl:`) e `text-[length:calc(...)]`. Se este projeto usar outra versão, converta as classes com cuidado (e me avise), porque a prévia de celular e as peças livres dependem das variantes de container.
4. **Ligue às rotas daqui.** Lá, `apiPagina` (no fim de `lib/pagina.ts`) fala com `/api/paginas/<modulo>` e o editor salva o rascunho sozinho. Troque pelas rotas `/stores/mine/pagina...`, mantendo o salvar sozinho. Ajuste os nomes das respostas (`publicado`, `versao`, `no_ar`, `publicado_em`) e mantenha o "Tirar do ar" que existe hoje.
5. **Envio de imagens**: envolva o editor com `<EnvioDeArquivo.Provider>` (está em `campos.tsx`) usando `POST /stores/mine/imagem`. O limite daqui é 2 MB: ajuste os textos de ajuda. Envio de vídeo só se existir uma rota para isso; se não existir, deixe a seção de vídeo só com link do YouTube/Vimeo.
6. **Escreva o adaptador da loja** (um `ModuloPagina`, como os dois exemplos): transforma a loja e os planos em `DadosPagina`, define a página padrão e quais seções o lojista pode adicionar. A página padrão deve ser a **mesma que a loja tem hoje** quando nunca foi personalizada, convertida para o modelo 3.
7. **Seção de planos**: a de lá é simples. A daqui tem filtro por recorrência, tabela comparativa, "Economize X%" e o fluxo de assinar. **Mantenha o desenho de planos daqui** dentro do desenho novo, para ele receber o fundo e as cores da seção. `props.filtro` e `props.comparativo` já existem no modelo 3.
8. **O que só existe aqui e não pode sumir**: a barra do topo da página pública ("Minha área", "Assinar"), o cartão e o botão fixo de "Agendar horário" da agenda, e o fluxo de indicação (`?ref=`, `?raiz=`). O editor de lá não tem nada disso.
9. **Variáveis de cor**: o desenho novo usa `--pg-fundo`, `--pg-card`, `--pg-linha`, `--pg-titulo`, `--pg-texto`, `--pg-suave`, `--pg-cor1`, `--pg-cor2`, `--pg-sobre`, `--pg-realce`. Os componentes daqui que você mantiver (planos, agenda) usam outros nomes (`--pg-tinta`, `--pg-marca`...). Faça a ponte entre os dois para tudo seguir a combinação de cores escolhida.
10. **Servidor**: confira se o salvar e o publicar aceitam o documento do modelo 3 (campos `estilo`, `pecas`, `tema.cores`, seção `livre`) e documentos maiores (uma página com muitas peças passa fácil de 100 mil caracteres). Mantenha a checagem que barra `javascript:` e `data:` em links e imagens, incluindo os campos `alvo`, `alvoSecundario` e `imagem` dentro de `estilo` e de `pecas`. Se precisar mudar o banco, me avise antes.
11. **Segurança do site (CSP)**: as fontes do editor (Poppins, Outfit, Inter, Anton) precisam ser servidas pelo próprio site, porque o Google Fonts é bloqueado. O mapa do Google da seção "Endereço e mapa" também é bloqueado: ou libere o endereço do mapa na CSP, ou deixe só o botão "Como chegar". Me diga qual prefere antes de decidir.
12. **Seções que dependem de dados dos módulos** (`aulas`, `horarios`, `equipe`, `localizacao`): inclua só as que tiverem dados aqui (por exemplo, o horário de funcionamento do estabelecimento). As outras ficam fora da lista do adaptador.
13. **Aparência do editor**: lá ele usa cores fixas de tema escuro. Aqui, deixe com a cara do painel (os componentes e cores que o resto do painel usa), sem mudar o comportamento.

## Modelos por nicho

O laboratório tem modelos prontos de página para barbearia, salão de beleza e terapeutas (`lib/pagina-modelos.ts`, área `/editores`). Traga-os junto: quando a loja nunca personalizou a página, ela nasce com o modelo do **nicho da loja** (o nicho já existe no cadastro, ex.: `Barbearias`, `Massoterapia`; me mostre como vai ligar cada nicho a um modelo). Nichos sem modelo continuam com a página padrão de hoje. No editor, o botão "Modelos prontos" deixa o lojista trocar de modelo quando quiser.

## O que não pode quebrar

- Páginas já publicadas no modelo 2 precisam abrir na página pública e no editor com a **mesma aparência de hoje**, sem o lojista fazer nada.
- Versões antigas publicadas continuam podendo ser restauradas.
- A página pública continua carregando rápido e funcionando com renderização no servidor: `PecasEdicao.tsx`, `Soltar.tsx`, `EditorPagina.tsx` e `campos.tsx` são só do editor e não devem ir no pacote da página pública.
- Quem não usa o Cliente Plus completo (loja só com agenda) continua vendo a página de agendamento.

## Como conferir antes de me dizer que terminou

Teste de verdade, no navegador, com o mouse (um defeito de arrastar que tivemos só aparecia com mouse real):

1. Abrir uma loja que já tem página no modelo 2: a página pública e o editor mostram o mesmo de antes.
2. Arrastar uma seção e um item de lista; trocar a combinação de cores e o fundo claro/escuro; mudar o fundo de uma seção para foto.
3. Clicar no título na prévia e digitar.
4. Criar uma Tela livre, pôr um texto, uma foto, um botão e uma forma; arrastar e esticar cada um; escolher três e arrastar juntos.
5. Na capa, usar "Soltar tudo em peças livres" e conferir no computador e no celular.
6. Salvar, publicar, abrir `/loja/<slug>` no computador e no celular, restaurar uma versão anterior, tirar do ar.
7. Assinar um plano e agendar um horário pela página pública, para garantir que os fluxos daqui continuam.

No fim, me entregue uma lista curta: o que foi portado igual, o que você adaptou e por quê, e o que ficou diferente do laboratório.
