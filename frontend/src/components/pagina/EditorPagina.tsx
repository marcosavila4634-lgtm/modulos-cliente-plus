import { Link } from "@tanstack/react-router";
import {
  Check,
  CircleAlert,
  CloudCheck,
  Copy,
  CopyPlus,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  LayoutTemplate,
  LoaderCircle,
  Monitor,
  Palette,
  PenLine,
  Plus,
  Redo2,
  RotateCcw,
  Info as IconeInfo,
  Rocket,
  Ruler,
  Smartphone,
  Star,
  Trash2,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  apiPagina,
  catalogo,
  completar,
  densidades,
  espacos,
  fontes,
  fundosSecao,
  larguras,
  novaSecao,
  novoId,
  raios,
  tamanhosTitulo,
  type DadosPagina,
  type Densidade,
  type EditorPaginaApi,
  type Espaco,
  type Estilo,
  type Fonte,
  type FundoSecao,
  type IdIcone,
  type Largura,
  type Modo,
  type ModuloPagina,
  type PaginaConfig,
  type Peca,
  celularAcompanha,
  type PropsSecao,
  type Raio,
  type Secao,
  type TamanhoTitulo,
  type Tema,
  type TipoSecao,
} from "../../lib/pagina";
import { MINHA, avisosDeLeitura, camposCores, combinacao, combinacoes, coresDa, type Cores, type Tom } from "../../lib/pagina-cores";
import {
  Alca,
  AreaTexto,
  Alternar,
  BotaoIcone,
  Campo,
  CampoArquivo,
  CampoCor,
  classeBotaoEd,
  classeEntrada,
  Entrada,
  Lista,
  mudarOrdem,
  Opcoes,
  Ordenavel,
  SeletorIcone,
  useItemOrdenavel,
} from "./campos";
import { PaginaPublica, videoEmbutido, type Edicao } from "./PaginaPublica";
import { CamadaEdicao, FormPecas } from "./PecasEdicao";
import { podeSoltar, Soltador, type Soltura } from "./Soltar";

// Editor da página pública, o mesmo para todos os módulos. Cada módulo passa
// o seu adaptador (lib/pagina-<modulo>.tsx) e os dados que vieram de
// GET /api/paginas/<modulo>.
//
// Tudo o que o dono muda é salvo sozinho como RASCUNHO (clientes não veem).
// "Publicar" coloca o rascunho no ar e guarda uma versão (dá para voltar).
//
// As seções e os itens das listas mudam de ordem arrastando pela alça. Cada
// seção tem três abas: Conteúdo (textos, fotos), Aparência (fundo, cores,
// espaço, colunas) e Peças livres (textos, fotos, botões e formas soltos em
// qualquer lugar; PecasEdicao.tsx). "Cores e aparência" traz as combinações
// de cores prontas e a personalizada. Os textos também podem ser digitados
// direto na prévia (Texto.tsx).

type Estado = "salvo" | "salvando" | "erro";
type AbaForm = "conteudo" | "aparencia" | "pecas";
type Origem = "lista" | "previa" | "texto";

export function EditorPagina<D>({ modulo, inicial, ajuda }: { modulo: ModuloPagina<D>; inicial: EditorPaginaApi<D>; ajuda?: ReactNode }) {
  const [api, setApi] = useState(inicial);
  const dados = useMemo(() => modulo.normalizar(api.dados), [modulo, api.dados]);
  const carregar = (a: EditorPaginaApi<D>) => completar(a.rascunho ?? a.publicada, modulo.normalizar(a.dados), modulo.padrao(a.dados));

  const [pagina, setPaginaBruta] = useState<PaginaConfig>(() => carregar(inicial));
  const paginaRef = useRef(pagina);
  paginaRef.current = pagina;
  const salvoRef = useRef(JSON.stringify(pagina));
  const [estado, setEstado] = useState<Estado>("salvo");
  const [pendente, setPendente] = useState(inicial.pendente);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [pecaSel, setPecaSel] = useState<string[]>([]); // peças livres escolhidas (da seção selecionada)
  const [soltando, setSoltando] = useState<string | null>(null); // seção sendo solta em peças (Soltar.tsx)
  const [recado, setRecado] = useState<string | null>(null);
  const [margens, setMargens] = useState(true);
  const [acompanhar, setAcompanhar] = useState(true); // o celular repete o que é feito no computador
  const [abaForm, setAbaForm] = useState<AbaForm>("conteudo");
  const [dispositivo, setDispositivo] = useState<"celular" | "computador">("celular");
  const [aba, setAba] = useState<"editar" | "ver">("editar"); // telas pequenas
  const [adicionando, setAdicionando] = useState(false);
  const [versoesAbertas, setVersoesAbertas] = useState(false);
  const [modelosAbertos, setModelosAbertos] = useState(false);
  const origemSelecao = useRef<Origem>("lista");

  // ---------- desfazer e refazer ----------

  const passado = useRef<PaginaConfig[]>([]);
  const futuro = useRef<PaginaConfig[]>([]);
  const ultimaMudanca = useRef(0);
  const [, repintar] = useState(0);

  // Toda mudança passa por aqui. Mudanças seguidas (digitar, arrastar a barra
  // de cor) contam como um passo só no desfazer.
  function setPagina(mudanca: PaginaConfig | ((p: PaginaConfig) => PaginaConfig)) {
    const atual = paginaRef.current;
    const nova = typeof mudanca === "function" ? mudanca(atual) : mudanca;
    if (nova === atual) return;
    const agora = Date.now();
    if (agora - ultimaMudanca.current > 800) passado.current = [...passado.current.slice(-59), atual];
    ultimaMudanca.current = agora;
    futuro.current = [];
    paginaRef.current = nova;
    setPaginaBruta(nova);
  }

  function voltarNoTempo(de: RefObject<PaginaConfig[]>, para: RefObject<PaginaConfig[]>) {
    const destino = de.current.at(-1);
    if (!destino) return;
    de.current = de.current.slice(0, -1);
    para.current = [...para.current, paginaRef.current];
    ultimaMudanca.current = 0;
    paginaRef.current = destino;
    setPaginaBruta(destino);
    repintar((n) => n + 1);
  }
  const desfazer = () => voltarNoTempo(passado, futuro);
  const refazer = () => voltarNoTempo(futuro, passado);

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      // dentro de um campo de texto, o Ctrl+Z é o do próprio campo
      if (alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))) return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) refazer();
      else desfazer();
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- salvar sozinho ----------

  async function salvarAgora(): Promise<boolean> {
    const p = paginaRef.current;
    const texto = JSON.stringify(p);
    if (texto === salvoRef.current) return true;
    try {
      const r = await apiPagina.salvar(modulo.modulo, p);
      salvoRef.current = texto;
      setPendente(r.pendente);
      if (JSON.stringify(paginaRef.current) === texto) setEstado("salvo");
      setErro(null);
      return true;
    } catch (e) {
      setEstado("erro");
      setErro(e instanceof Error ? e.message : "Não foi possível salvar");
      return false;
    }
  }

  useEffect(() => {
    if (JSON.stringify(pagina) === salvoRef.current) return;
    setEstado("salvando");
    const t = setTimeout(salvarAgora, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(paginaRef.current) !== salvoRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, []);

  function aplicar(a: EditorPaginaApi<D>) {
    const p = carregar(a);
    salvoRef.current = JSON.stringify(p);
    passado.current = [];
    futuro.current = [];
    paginaRef.current = p;
    setApi(a);
    setPaginaBruta(p);
    setPendente(a.pendente);
    setEstado("salvo");
  }

  async function acao(chave: string, fazer: () => Promise<void>) {
    setOcupado(chave);
    setErro(null);
    try {
      await fazer();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado. Tente de novo.");
    } finally {
      setOcupado(null);
    }
  }

  const publicar = () =>
    acao("publicar", async () => {
      if (!(await salvarAgora())) return;
      aplicar(await apiPagina.publicar<D>(modulo.modulo));
    });

  // ---------- mexer nas seções ----------

  const mudarTema = (tema: Tema) => setPagina((p) => ({ ...p, tema }));
  const mudarSecao = (id: string, fn: (s: Secao) => Secao) => setPagina((p) => ({ ...p, secoes: p.secoes.map((s) => (s.id === id ? fn(s) : s)) }));
  const mudarProps = (id: string, patch: Record<string, unknown>) => mudarSecao(id, (s) => ({ ...s, props: { ...s.props, ...patch } }) as Secao);
  const mudarEstilo = (id: string, estilo: Estilo) => mudarSecao(id, (s) => ({ ...s, estilo }));
  const mudarPecas = (id: string, novas: Peca[]) =>
    mudarSecao(id, (s) => {
      const pecas = acompanhar && modo === "pc" ? celularAcompanha(s.pecas ?? [], novas) : novas;
      if (s.tipo !== "livre") return { ...s, pecas };
      // Tela livre: cresce sozinha quando uma peça passa do fim (texto e botão: altura estimada)
      const fim = (m: Modo) => Math.max(0, ...pecas.map((p) => p[m].y + (p.tipo === "texto" || p.tipo === "botao" ? 48 : p[m].a))) + 24;
      const cresce = (atual: number, m: Modo) => Math.max(atual, Math.min(4000, fim(m)));
      return { ...s, pecas, props: { ...s.props, altura: cresce(s.props.altura, "pc"), alturaCel: cresce(s.props.alturaCel, "cel") } };
    });
  // "Soltar tudo em peças livres": a seção vira uma Tela livre com o mesmo conteúdo, solto
  const terminarDeSoltar = (id: string, r: Soltura | null) => {
    setSoltando(null);
    if (!r || r.pecas.length === 0) return setErro("Não foi possível soltar esta seção em peças. Tente de novo.");
    mudarSecao(id, (s) => ({
      id: s.id,
      tipo: "livre",
      visivel: s.visivel,
      props: { altura: r.altura, alturaCel: r.alturaCel },
      estilo: { ...s.estilo, ...(r.fundo ? { fundo: "imagem" as const, ...r.fundo } : {}) },
      pecas: [...r.pecas, ...(s.pecas ?? [])],
    }));
    origemSelecao.current = "texto";
    setSelecionada(id);
    setPecaSel([]);
    setAbaForm("pecas");
    setRecado(
      `Pronto: a seção virou uma Tela livre com ${r.pecas.length} peças soltas. Arraste cada uma, ou marque várias para mover juntas.` +
        (r.ficouDeFora ? ` ${r.ficouDeFora} enfeite(s) pequeno(s) não vieram.` : "") +
        " Confira também a versão do celular. Para voltar atrás, use Desfazer (Ctrl+Z).",
    );
  };
  // digitar direto na prévia: "titulo", "itens/<id>/texto" ou "pecas/<id>/texto"
  const editarTexto = (id: string, caminho: string, valor: string) =>
    mudarSecao(id, (s) => {
      const [a, item, campo] = caminho.split("/");
      if (!item) return { ...s, props: { ...s.props, [a]: valor } } as Secao;
      const troca = <T extends { id: string }>(lista: T[]) => lista.map((x) => (x.id === item ? { ...x, [campo]: valor } : x));
      if (a === "pecas") return { ...s, pecas: troca(s.pecas ?? []) };
      const lista = (s.props as Record<string, unknown>)[a];
      return Array.isArray(lista) ? ({ ...s, props: { ...s.props, [a]: troca(lista) } } as Secao) : s;
    });
  const esconder = (id: string) => mudarSecao(id, (s) => ({ ...s, visivel: !s.visivel }));
  const reordenar = (de: number, para: number) => setPagina((p) => ({ ...p, secoes: mudarOrdem(p.secoes, de, para) }));
  // pela prévia: troca de lugar com a seção visível de cima ou de baixo
  const moverNaPrevia = (id: string, passo: number) => {
    const secoes = paginaRef.current.secoes;
    const de = secoes.findIndex((s) => s.id === id);
    let para = de + passo;
    while (secoes[para] && !secoes[para].visivel) para += passo;
    if (de >= 0 && secoes[para]) reordenar(de, para);
  };
  const apagar = (id: string) => {
    const s = paginaRef.current.secoes.find((x) => x.id === id);
    if (!s || !confirm(`Apagar a seção "${catalogo[s.tipo].nome}"?`)) return;
    setPagina((p) => ({ ...p, secoes: p.secoes.filter((x) => x.id !== id) }));
    if (selecionada === id) setSelecionada(null);
  };
  const duplicar = (id: string) =>
    setPagina((p) => {
      const i = p.secoes.findIndex((x) => x.id === id);
      if (i < 0) return p;
      const copia = structuredClone(p.secoes[i]);
      copia.id = novoId();
      // os itens das listas também precisam de ids novos
      for (const v of Object.values(copia.props)) if (Array.isArray(v)) for (const x of v) if (x && typeof x === "object" && "id" in x) x.id = novoId();
      for (const p of copia.pecas ?? []) p.id = novoId();
      const secoes = [...p.secoes];
      secoes.splice(i + 1, 0, copia);
      return { ...p, secoes };
    });
  const adicionar = (tipo: TipoSecao) => {
    const nova = novaSecao(tipo, dados);
    setPagina((p) => {
      const secoes = [...p.secoes];
      let i = selecionada ? secoes.findIndex((s) => s.id === selecionada) + 1 : -1;
      if (i <= 0) {
        const fim = secoes.findIndex((s) => s.tipo === "contato" || s.tipo === "rodape");
        i = fim > 0 ? fim : secoes.length;
      }
      secoes.splice(i, 0, nova as Secao);
      return { ...p, secoes };
    });
    origemSelecao.current = "lista";
    setSelecionada(nova.id);
    setAdicionando(false);
  };

  const selecionar = (id: string | null, origem: Origem) => {
    origemSelecao.current = origem;
    setPecaSel([]);
    setSelecionada((atual) => (origem === "lista" && atual === id ? null : id));
  };
  // peças livres escolhidas (na prévia ou na lista de peças): abre a aba delas
  const selecionarPecas = (secao: string, pecas: string[]) => {
    origemSelecao.current = "previa";
    setSelecionada(secao);
    setPecaSel(pecas);
    if (pecas.length) setAbaForm("pecas");
  };

  // A prévia acompanha a seção escolhida na lista, e vice-versa.
  const previaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selecionada || selecionada === "tema") return;
    if (origemSelecao.current === "lista") {
      // rola só a caixa da prévia (scrollIntoView rolaria a tela toda)
      const caixa = previaRef.current;
      const el = caixa?.querySelector(`#pg-${selecionada}`);
      if (caixa && el) {
        const topo = el.getBoundingClientRect().top - caixa.getBoundingClientRect().top + caixa.scrollTop;
        caixa.scrollTo({ top: Math.max(0, topo - 12), behavior: "smooth" });
      }
    } else if (origemSelecao.current === "previa") {
      // (ao clicar num texto para digitar, a tela fica onde está)
      setAba("editar");
      document.getElementById(`ed-${selecionada}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selecionada]);

  const modo: Modo = dispositivo === "celular" ? "cel" : "pc";

  const tiposDisponiveis = modulo.tipos.filter((t) => !(catalogo[t].unica && pagina.secoes.some((s) => s.tipo === t)));
  const acento = { "--ed-1": modulo.acento[0], "--ed-2": modulo.acento[1] } as CSSProperties;
  const nomeDasCores = pagina.tema.combinacao === MINHA ? "Personalizada" : (combinacao(pagina.tema.combinacao)?.nome ?? "");

  return (
    <div className="flex flex-col gap-4 py-4" style={acento}>
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-poppins text-[26px] font-bold text-white md:text-[28px]">{modulo.titulo}</h1>
            {ajuda}
          </div>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Monte a página do seu jeito. Tudo é salvo sozinho como rascunho, e os clientes só veem depois que você toca em <b>Publicar</b>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SituacaoSalvamento estado={estado} pendente={pendente} publicadaEm={api.publicadaEm} />
          <div className="flex items-center rounded-xl border border-white/10">
            <BotaoIcone rotulo="Desfazer (Ctrl+Z)" disabled={passado.current.length === 0} onClick={desfazer}>
              <Undo2 className="size-4" />
            </BotaoIcone>
            <BotaoIcone rotulo="Refazer (Ctrl+Shift+Z)" disabled={futuro.current.length === 0} onClick={refazer}>
              <Redo2 className="size-4" />
            </BotaoIcone>
          </div>
          <button
            type="button"
            className={classeBotaoEd(true)}
            disabled={!pendente || estado === "salvando" || ocupado !== null}
            onClick={publicar}
            title={pendente ? "Colocar as alterações no ar" : "Nenhuma alteração para publicar"}
          >
            {ocupado === "publicar" ? <LoaderCircle className="size-4 animate-spin" /> : <Rocket className="size-4" />} Publicar
          </button>
        </div>
      </div>

      {/* Link da página */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="min-w-0 flex-1 basis-full truncate text-sm text-slate-200 sm:basis-0">{api.link}</span>
        <BotaoCopiar texto={api.link} />
        <a href={api.link} target="_blank" rel="noreferrer" className={classeBotaoEd(false, true)}>
          <ExternalLink className="size-3.5" /> Ver no ar
        </a>
        <span className="basis-full text-[11.5px] text-slate-500">O endereço é definido na criação da loja. Para mudar, fale com o suporte do Cliente Plus.</span>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erro}
        </div>
      )}

      {recado && (
        <div className="flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-100">
          <IconeInfo className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{recado}</span>
          <button type="button" aria-label="Fechar" onClick={() => setRecado(null)} className="text-sky-200/70 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
      )}
      {soltando &&
        (() => {
          const s = pagina.secoes.find((x) => x.id === soltando);
          return s ? <Soltador pagina={pagina} dados={dados} secao={s} aoTerminar={(r) => terminarDeSoltar(s.id, r)} /> : null;
        })()}

      {/* Celular / tablet: alterna entre editar e ver */}
      <div className="flex gap-1.5 lg:hidden">
        <Opcoes
          valor={aba}
          aoMudar={setAba}
          opcoes={[
            ["editar", <span key="e" className="inline-flex items-center gap-1.5"><PenLine className="size-3.5" /> Editar</span>],
            ["ver", <span key="v" className="inline-flex items-center gap-1.5"><Eye className="size-3.5" /> Ver prévia</span>],
          ]}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(340px,420px)_1fr]">
        {/* Coluna do editor */}
        <div className={`flex min-w-0 flex-col gap-2 ${aba === "ver" ? "hidden lg:flex" : ""}`}>
          <CaixaItem
            id="tema"
            aberto={selecionada === "tema"}
            aoAbrir={() => selecionar("tema", "lista")}
            icone={<Palette className="size-4 text-(--ed-2)" />}
            titulo="Cores e aparência"
            resumo={`${nomeDasCores} · ${pagina.tema.tom === "claro" ? "fundo claro" : "fundo escuro"} · letra ${fontes[pagina.tema.fonte].nome.toLowerCase()}`}
          >
            <FormTema tema={pagina.tema} muda={mudarTema} />
          </CaixaItem>

          <div className="mt-2 px-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Seções da página · arraste para mudar a ordem</div>

          <Ordenavel ids={pagina.secoes.map((s) => s.id)} aoMover={reordenar}>
            {pagina.secoes.map((s) => {
              const info = catalogo[s.tipo];
              return (
                <ItemSecao
                  key={s.id}
                  id={s.id}
                  aberto={selecionada === s.id}
                  aoAbrir={() => selecionar(s.id, "lista")}
                  apagada={!s.visivel}
                  titulo={info.nome}
                  resumo={resumo(s)}
                  botoes={
                    <>
                      <BotaoIcone rotulo={s.visivel ? "Esconder" : "Mostrar"} ativo={!s.visivel} onClick={() => esconder(s.id)}>
                        {s.visivel ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      </BotaoIcone>
                      {!info.unica && (
                        <BotaoIcone rotulo="Duplicar" onClick={() => duplicar(s.id)}>
                          <CopyPlus className="size-3.5" />
                        </BotaoIcone>
                      )}
                      {!info.fixa && (
                        <BotaoIcone rotulo="Apagar" perigo onClick={() => apagar(s.id)}>
                          <Trash2 className="size-3.5" />
                        </BotaoIcone>
                      )}
                    </>
                  }
                >
                  <div className="mb-3">
                    <Opcoes<AbaForm>
                      valor={abaForm}
                      aoMudar={setAbaForm}
                      opcoes={[["conteudo", "Conteúdo"], ["aparencia", "Aparência"], ["pecas", `Peças livres${s.pecas?.length ? ` (${s.pecas.length})` : ""}`]]}
                    />
                  </div>
                  {!s.visivel && (
                    <p className="mb-3 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[12px] text-amber-200">
                      Escondida: não aparece na página. Toque no olho para mostrar.
                      {s.tipo === "planos" && " Sem os planos, ninguém consegue assinar pela página."}
                    </p>
                  )}
                  {abaForm === "conteudo" ? (
                    <>
                      <p className="mb-3 text-[12px] text-slate-500">{info.descricao}</p>
                      <FormSecao s={s} muda={(patch) => mudarProps(s.id, patch)} dados={dados} modulo={modulo} />
                    </>
                  ) : abaForm === "aparencia" ? (
                    <FormEstilo s={s} tema={pagina.tema} muda={(estilo) => mudarEstilo(s.id, estilo)} />
                  ) : (
                    <FormPecas
                      secao={s}
                      modo={modo}
                      selecionadas={pecaSel}
                      aoSelecionar={(pecas) => selecionarPecas(s.id, pecas)}
                      aoMudar={(pecas) => mudarPecas(s.id, pecas)}
                      aoSoltar={
                        podeSoltar[s.tipo] && s.visivel
                          ? () =>
                              confirm(
                                `Soltar a seção "${info.nome}" em peças livres?\n\nO título, os textos, as fotos e os botões viram peças que você arrasta para onde quiser. A seção deixa de se arrumar sozinha.\n\nSe não gostar, é só usar Desfazer (Ctrl+Z).`,
                              ) && setSoltando(s.id)
                          : undefined
                      }
                      aoMudarAlturaCel={s.tipo === "livre" ? (alturaCel) => mudarProps(s.id, { alturaCel }) : undefined}
                      acompanhar={acompanhar}
                      aoAcompanhar={setAcompanhar}
                    />
                  )}
                </ItemSecao>
              );
            })}
          </Ordenavel>

          <button type="button" onClick={() => setAdicionando(true)} className={`${classeBotaoEd()} mt-1 border-dashed`}>
            <Plus className="size-4" /> Adicionar seção
          </button>
          {modulo.modelos && modulo.modelos.length > 0 && (
            <button type="button" onClick={() => setModelosAbertos(true)} className={classeBotaoEd()}>
              <LayoutTemplate className="size-4" /> Modelos prontos
            </button>
          )}

          {/* Versões e voltar atrás */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={classeBotaoEd(false, true)} onClick={() => setVersoesAbertas(true)}>
              <History className="size-3.5" /> Versões publicadas ({api.versoes.length})
            </button>
            {pendente && api.publicada !== null && (
              <button
                type="button"
                className={classeBotaoEd(false, true)}
                onClick={() =>
                  confirm("Descartar as alterações que ainda não foram publicadas? A página volta a ficar igual à que está no ar.") &&
                  acao("descartar", async () => {
                    await salvarAgora();
                    aplicar(await apiPagina.descartar<D>(modulo.modulo));
                  })
                }
              >
                <Undo2 className="size-3.5" /> Descartar alterações
              </button>
            )}
            <button
              type="button"
              className={classeBotaoEd(false, true)}
              onClick={() => {
                if (!confirm("Voltar ao modelo inicial? Seus textos, fotos e cores deste rascunho serão trocados pelo modelo. (O que está no ar só muda quando você publicar.)")) return;
                setPagina(modulo.padrao(api.dados));
                setSelecionada(null);
              }}
            >
              <RotateCcw className="size-3.5" /> Voltar ao modelo inicial
            </button>
          </div>
        </div>

        {/* Prévia */}
        <div className={`min-w-0 lg:sticky lg:top-3 ${aba === "editar" ? "hidden lg:block" : ""}`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[12px] text-slate-400">Prévia do rascunho. Toque num texto para digitar ali mesmo, ou numa parte da página para editar.</span>
            <button
              type="button"
              onClick={() => setMargens((v) => !v)}
              title="Mostra onde a tela acaba e a margem segura"
              className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ring-1 transition ${margens ? "bg-white/10 text-white ring-(--ed-2)" : "text-slate-300 ring-white/10 hover:bg-white/5"}`}
            >
              <Ruler className="size-3.5" /> Margens
            </button>
            <Opcoes
              valor={dispositivo}
              aoMudar={setDispositivo}
              opcoes={[
                ["celular", <span key="c" className="inline-flex items-center gap-1.5"><Smartphone className="size-3.5" /> Celular</span>],
                ["computador", <span key="p" className="inline-flex items-center gap-1.5"><Monitor className="size-3.5" /> Computador</span>],
              ]}
            />
          </div>
          <Previa
            refCaixa={previaRef}
            dispositivo={dispositivo}
            pagina={pagina}
            dados={dados}
            edicao={{
              selecionada,
              // clique numa peça: quem escolhe as peças é a camada delas (aqui só a seção)
              aoSelecionar: (id, onde) => (onde.peca ? setSelecionada(id) : selecionar(id, onde.texto ? "texto" : "previa")),
              aoEditarTexto: editarTexto,
              acoes: { mover: moverNaPrevia, duplicar, esconder, apagar },
              margens,
            }}
            pecas={{ modo, selecionadas: pecaSel, aoSelecionar: selecionarPecas, aoMudar: mudarPecas }}
          />
        </div>
      </div>

      {adicionando && (
        <Janela titulo="Adicionar seção" aoFechar={() => setAdicionando(false)}>
          <p className="mb-3 text-[13px] text-slate-400">
            {selecionada && selecionada !== "tema" ? "A seção entra logo abaixo da que está aberta." : "A seção entra no fim da página, antes do contato."} Depois é só
            arrastar para onde quiser.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {tiposDisponiveis.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => adicionar(t)}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-(--ed-2) hover:bg-white/[0.06]"
              >
                <div className="text-sm font-semibold text-white">{catalogo[t].nome}</div>
                <div className="mt-0.5 text-[12px] text-slate-400">{catalogo[t].descricao}</div>
              </button>
            ))}
            {tiposDisponiveis.length === 0 && <p className="text-sm text-slate-400">Todas as seções já estão na página.</p>}
          </div>
        </Janela>
      )}

      {modelosAbertos && (
        <Janela titulo="Modelos prontos" aoFechar={() => setModelosAbertos(false)}>
          <p className="mb-3 text-[13px] text-slate-400">
            Um modelo troca a página inteira (cores, seções, textos e fotos de exemplo) e você edita tudo depois. O que está no ar só muda quando você publicar,
            e dá para voltar atrás com Desfazer (Ctrl+Z).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(modulo.modelos ?? []).map((m) => (
              <button
                key={m.chave}
                type="button"
                onClick={() => {
                  setPagina(m.criar(dados));
                  setSelecionada(null);
                  setPecaSel([]);
                  setModelosAbertos(false);
                }}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-left transition hover:border-(--ed-2)"
              >
                <img src={m.foto} alt="" className="aspect-[16/9] w-full object-cover" />
                <div className="p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="h-2.5 w-6 rounded-full" style={{ background: `linear-gradient(90deg, ${m.acento[0]}, ${m.acento[1]})` }} />
                    {m.nome}
                  </div>
                  <div className="mt-1 text-[12px] text-slate-400">{m.descricao}</div>
                </div>
              </button>
            ))}
          </div>
        </Janela>
      )}

      {versoesAbertas && (
        <Janela titulo="Versões publicadas" aoFechar={() => setVersoesAbertas(false)}>
          <p className="mb-3 text-[13px] text-slate-400">
            Cada vez que você publica, uma cópia fica guardada (as 20 últimas). Usar uma versão coloca ela no rascunho: confira na prévia e
            toque em Publicar.
          </p>
          {api.versoes.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma versão publicada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {api.versoes.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="flex-1 text-sm text-slate-200">
                    {dataHora(v.publicadaEm)}
                    {i === 0 && <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-300">no ar</span>}
                  </span>
                  <button
                    type="button"
                    className={classeBotaoEd(false, true)}
                    disabled={ocupado !== null}
                    onClick={() =>
                      acao("versao", async () => {
                        await salvarAgora();
                        aplicar(await apiPagina.restaurar<D>(modulo.modulo, v.id));
                        setVersoesAbertas(false);
                      })
                    }
                  >
                    Usar esta
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Janela>
      )}
    </div>
  );
}

// ---------- Partes do editor ----------

function SituacaoSalvamento({ estado, pendente, publicadaEm }: { estado: Estado; pendente: boolean; publicadaEm: string | null }) {
  if (estado === "salvando")
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-400">
        <LoaderCircle className="size-3.5 animate-spin" /> Salvando rascunho...
      </span>
    );
  if (estado === "erro")
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-red-300">
        <CircleAlert className="size-3.5" /> Rascunho não salvo
      </span>
    );
  if (pendente)
    return (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-amber-300">
        <CloudCheck className="size-3.5" /> Rascunho salvo · falta publicar
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-emerald-300">
      <Check className="size-3.5" /> {publicadaEm ? `No ar desde ${dataHora(publicadaEm)}` : "No ar (modelo inicial)"}
    </span>
  );
}

type PropsCaixa = {
  id: string;
  aberto: boolean;
  aoAbrir: () => void;
  icone?: ReactNode;
  titulo: string;
  resumo?: string;
  apagada?: boolean;
  botoes?: ReactNode;
  children: ReactNode;
};

// Uma linha da coluna do editor: fechada mostra o nome; aberta, o formulário.
function CaixaItem({ id, aberto, aoAbrir, icone, titulo, resumo, apagada = false, botoes, children, alca, caixa, arrastando = false }: PropsCaixa & {
  alca?: ReactNode;
  caixa?: { ref: (el: HTMLElement | null) => void; style: CSSProperties };
  arrastando?: boolean;
}) {
  return (
    <div
      id={`ed-${id}`}
      ref={caixa?.ref}
      style={caixa?.style}
      className={`scroll-mt-3 rounded-2xl border transition-colors ${
        arrastando
          ? "border-(--ed-2) bg-[#131a2c] shadow-2xl"
          : aberto
            ? "border-(--ed-2)/60 bg-white/[0.04]"
            : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <div className={`flex items-center gap-1 py-2.5 pr-3 ${alca ? "pl-1.5" : "pl-3"}`}>
        {alca}
        <button type="button" onClick={aoAbrir} className={`flex min-w-0 flex-1 items-center gap-2.5 text-left ${apagada ? "opacity-45" : ""}`}>
          {icone}
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">{titulo}</span>
            {resumo && <span className="block truncate text-[12px] text-slate-400">{resumo}</span>}
          </span>
        </button>
        <div className="flex shrink-0 items-center">{botoes}</div>
      </div>
      {aberto && <div className="border-t border-white/[0.07] px-3 pt-3 pb-4">{children}</div>}
    </div>
  );
}

// Uma seção na lista: igual à CaixaItem, com a alça de arrastar.
function ItemSecao(p: PropsCaixa) {
  const { caixa, alca, arrastando } = useItemOrdenavel(p.id);
  return <CaixaItem {...p} caixa={caixa} arrastando={arrastando} alca={<Alca alca={alca} />} />;
}

function resumo(s: Secao): string {
  const p = s.props as { titulo?: string; texto?: string; itens?: unknown[] };
  if (s.tipo === "destaques") return `${p.itens?.length ?? 0} destaques`;
  return p.titulo || p.texto || (p.itens ? `${p.itens.length} itens` : "");
}

const semPecas: string[] = [];

function Previa({
  refCaixa,
  dispositivo,
  pagina,
  dados,
  edicao,
  pecas,
}: {
  refCaixa: RefObject<HTMLDivElement | null>;
  dispositivo: "celular" | "computador";
  pagina: PaginaConfig;
  dados: DadosPagina;
  edicao: Omit<Edicao, "escala" | "camada">;
  pecas: { modo: Modo; selecionadas: string[]; aoSelecionar: (secao: string, pecas: string[]) => void; aoMudar: (secao: string, pecas: Peca[]) => void };
}) {
  const [largura, setLargura] = useState(800);
  useEffect(() => {
    const el = refCaixa.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLargura(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [refCaixa]);
  // A página é desenhada no tamanho real (390 ou 1280) e diminuída para caber.
  const alvo = dispositivo === "celular" ? 390 : 1280;
  const zoom = Math.min(1, (largura - (dispositivo === "celular" ? 24 : 0)) / alvo);
  return (
    <div
      ref={refCaixa}
      className={`h-[calc(100dvh-190px)] min-h-[460px] overflow-y-auto rounded-2xl border border-white/10 ${dispositivo === "celular" ? "bg-black/40 py-3" : "bg-black/40"}`}
    >
      <div
        style={{ width: alvo, zoom }}
        className={`mx-auto min-h-full overflow-hidden ${dispositivo === "celular" ? "rounded-[28px] ring-8 ring-black/60" : ""}`}
      >
        <PaginaPublica
          pagina={pagina}
          dados={dados}
          aoEscolherPlano={() => {}}
          edicao={{
            ...edicao,
            escala: zoom,
            camada: (s) => (
              <CamadaEdicao
                secao={s}
                modo={pecas.modo}
                selecionadas={edicao.selecionada === s.id ? pecas.selecionadas : semPecas}
                aoSelecionar={(ids) => pecas.aoSelecionar(s.id, ids)}
                aoMudar={(lista) => pecas.aoMudar(s.id, lista)}
                escala={zoom}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}

function Janela({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aoFechar]);
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={aoFechar} />
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d1322] p-5 shadow-2xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="font-poppins text-lg font-semibold text-white">{titulo}</h2>
            <button type="button" onClick={aoFechar} aria-label="Fechar" className="-mt-1 -mr-2 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function BotaoCopiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={classeBotaoEd(false, true)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setOk(true);
          setTimeout(() => setOk(false), 1800);
        } catch {
          prompt("Copie o link:", texto);
        }
      }}
    >
      {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {ok ? "Copiado!" : "Copiar link"}
    </button>
  );
}

const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

// ---------- Cores e aparência da página ----------

function FormTema({ tema, muda }: { tema: Tema; muda: (t: Tema) => void }) {
  const [editando, setEditando] = useState(tema.combinacao === MINHA);
  const minha = tema.combinacao === MINHA;
  const base = combinacao(minha ? tema.base : tema.combinacao);
  const avisos = avisosDeLeitura(tema.cores);

  const escolher = (chave: string) => {
    const c = combinacao(chave);
    if (!c) return;
    const { base: _, ...resto } = tema;
    muda({ ...resto, combinacao: c.chave, cores: coresDa(c, tema.tom) });
  };
  // trocar claro/escuro refaz fundos e textos; as cores de destaque ficam
  const mudarTom = (tom: Tom) => {
    const novas = coresDa(minha ? tema.cores : (base ?? tema.cores), tom);
    muda({ ...tema, tom, cores: minha ? { ...novas, sobre: tema.cores.sobre } : novas });
  };
  const mudarCor = (campo: keyof Cores, valor: string) =>
    muda({ ...tema, combinacao: MINHA, ...(minha ? {} : { base: tema.combinacao }), cores: { ...tema.cores, [campo]: valor } });

  return (
    <div className="flex flex-col gap-4">
      <Campo rotulo="Fundo da página" grupo>
        <Opcoes<Tom> valor={tema.tom} aoMudar={mudarTom} opcoes={[["escuro", "Escuro"], ["claro", "Claro"]]} />
      </Campo>

      <Campo rotulo="Combinação de cores" dica="Toque numa combinação para ver a página inteira com ela." grupo>
        <div className="grid grid-cols-2 gap-2">
          {minha && <MiniCombinacao nome="Personalizada" descricao={base ? `Feita por você a partir de ${base.nome}` : "Feita por você"} cores={tema.cores} ativa soSua aoEscolher={() => setEditando(true)} />}
          {combinacoes.map((c) => (
            <MiniCombinacao
              key={c.chave}
              nome={c.nome}
              descricao={c.descricao}
              cores={coresDa(c, tema.tom)}
              ativa={tema.combinacao === c.chave}
              aoEscolher={() => escolher(c.chave)}
            />
          ))}
        </div>
      </Campo>

      <button type="button" className={`${classeBotaoEd(false, true)} w-fit`} onClick={() => setEditando((v) => !v)}>
        <Palette className="size-3.5" /> {editando ? "Fechar as cores" : "Editar a minha (trocar cor por cor)"}
      </button>

      {editando && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="text-[12px] text-slate-400">
            Troque as cores que quiser. O resultado vira a combinação <b className="text-slate-200">Personalizada</b>, só sua.
          </p>
          {camposCores.map(([campo, rotulo, onde]) => (
            <div key={campo} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-slate-200">{rotulo}</div>
                <div className="text-[11.5px] text-slate-500">{onde}</div>
                {avisos[campo] && (
                  <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-amber-300">
                    <TriangleAlert className="size-3" /> {avisos[campo]}
                  </div>
                )}
              </div>
              <CampoCor valor={tema.cores[campo]} aoMudar={(v) => mudarCor(campo, v)} />
            </div>
          ))}
          {minha && base && (
            <button type="button" className={`${classeBotaoEd(false, true)} w-fit`} onClick={() => escolher(base.chave)}>
              <RotateCcw className="size-3.5" /> Voltar para {base.nome}
            </button>
          )}
        </div>
      )}

      <Campo rotulo="Letra dos títulos" grupo>
        <Opcoes<Fonte>
          valor={tema.fonte}
          aoMudar={(fonte) => muda({ ...tema, fonte })}
          opcoes={(Object.keys(fontes) as Fonte[]).map((f) => [
            f,
            <span key={f} style={{ fontFamily: fontes[f].familia }}>
              {fontes[f].nome}
            </span>,
          ])}
        />
      </Campo>
      <Campo rotulo="Cantos dos cartões e botões" grupo>
        <Opcoes<Raio> valor={tema.raio} aoMudar={(raio) => muda({ ...tema, raio })} opcoes={(Object.keys(raios) as Raio[]).map((r) => [r, raios[r].nome])} />
      </Campo>
      <Campo rotulo="Espaço entre as seções" dica="Cada seção pode ter o seu espaço (aba Aparência da seção)." grupo>
        <Opcoes<Densidade>
          valor={tema.densidade}
          aoMudar={(densidade) => muda({ ...tema, densidade })}
          opcoes={(Object.keys(densidades) as Densidade[]).map((d) => [d, densidades[d].nome])}
        />
      </Campo>
    </div>
  );
}

// Miniatura de uma combinação: topo com as cores de destaque e um pedaço da página.
function MiniCombinacao({ nome, descricao, cores, ativa, soSua = false, aoEscolher }: { nome: string; descricao: string; cores: Cores; ativa: boolean; soSua?: boolean; aoEscolher: () => void }) {
  return (
    <button
      type="button"
      onClick={aoEscolher}
      className={`overflow-hidden rounded-xl text-left transition ${ativa ? "ring-2 ring-(--ed-2)" : "ring-1 ring-white/10 hover:ring-white/30"}`}
      style={{ background: cores.fundo }}
    >
      <div className="flex items-center justify-between px-2.5 py-1.5" style={{ background: `linear-gradient(90deg, ${cores.cor1}, ${cores.cor2})`, color: cores.sobre }}>
        <span className="text-[10px] font-bold tracking-wide">MINHA LOJA</span>
        <span className="rounded px-1.5 py-px text-[9px] font-bold" style={{ background: cores.fundo, color: cores.titulo }}>
          Planos
        </span>
      </div>
      <div className="px-2.5 pt-2 pb-2.5">
        <div className="flex gap-1">
          <span className="h-2 flex-1 rounded-full" style={{ background: cores.cor1 }} />
          <span className="h-2 flex-1 rounded-full" style={{ background: cores.cor2 }} />
          <span className="h-2 flex-1 rounded-full" style={{ background: cores.cartao, boxShadow: `inset 0 0 0 1px ${cores.borda}` }} />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: cores.titulo }}>
          <span className="truncate">{nome}</span>
          {soSua && (
            <span className="rounded px-1 py-px text-[9px] font-semibold" style={{ background: cores.cor2, color: cores.sobre }}>
              só sua
            </span>
          )}
          {ativa && <Check className="ml-auto size-3.5 shrink-0" style={{ color: cores.cor2 }} />}
        </div>
        <div className="truncate text-[10.5px]" style={{ color: cores.suave }}>
          {descricao}
        </div>
      </div>
    </button>
  );
}

// ---------- Aparência de uma seção ----------

function FormEstilo({ s, tema, muda }: { s: Secao; tema: Tema; muda: (e: Estilo) => void }) {
  const e = s.estilo;
  const info = catalogo[s.tipo];
  // valor vazio apaga a escolha (a seção volta a seguir a página)
  const m = (patch: Estilo) => {
    const novo: Record<string, unknown> = { ...e, ...patch };
    for (const k of Object.keys(novo)) if (novo[k] === undefined || novo[k] === "") delete novo[k];
    muda(novo as Estilo);
  };
  const fundo = e.fundo ?? "padrao";
  const padrao = [["", "Da página"]] as [string, ReactNode][];
  return (
    <div className={grade}>
      <Campo rotulo="Fundo da seção" grupo>
        <Opcoes<FundoSecao> valor={fundo} aoMudar={(f) => m({ fundo: f === "padrao" ? undefined : f })} opcoes={(Object.keys(fundosSecao) as FundoSecao[]).map((f) => [f, fundosSecao[f]])} />
      </Campo>
      {fundo === "cor" && (
        <Campo rotulo="Cor do fundo" grupo>
          <CampoCor valor={e.cor ?? tema.cores.fundoAlt} aoMudar={(cor) => m({ cor })} />
        </Campo>
      )}
      {fundo === "degrade" && (
        <div className="flex flex-wrap gap-4">
          <Campo rotulo="Começa em" grupo>
            <CampoCor valor={e.cor ?? tema.cores.cor1} aoMudar={(cor) => m({ cor })} />
          </Campo>
          <Campo rotulo="Termina em" grupo>
            <CampoCor valor={e.cor2 ?? tema.cores.cor2} aoMudar={(cor2) => m({ cor2 })} />
          </Campo>
        </div>
      )}
      {fundo === "imagem" && (
        <>
          <Campo rotulo="Foto de fundo" dica="De preferência deitada e sem texto. O conteúdo fica por cima." grupo>
            <CampoArquivo url={e.imagem ?? null} aoMudar={(imagem) => m({ imagem: imagem ?? undefined })} />
          </Campo>
          <Campo rotulo={`Escurecer a foto: ${e.escurecer ?? 55}%`} dica="Mais escuro deixa o texto mais fácil de ler.">
            <input type="range" min={0} max={90} step={5} value={e.escurecer ?? 55} onChange={(ev) => m({ escurecer: Number(ev.target.value) })} className="accent-(--ed-2)" />
          </Campo>
        </>
      )}

      <Campo rotulo="Cor do texto" dica="Automática: clara em fundo escuro, escura em fundo claro." grupo>
        {e.corTexto ? (
          <CampoCor valor={e.corTexto} aoMudar={(corTexto) => m({ corTexto })} aoLimpar={() => m({ corTexto: undefined })} />
        ) : (
          <BotaoEscolherCor aoEscolher={() => m({ corTexto: "#ffffff" })} />
        )}
      </Campo>
      <Campo rotulo="Cor dos botões e detalhes" dica="Só desta seção. Sem escolher, usa as cores da página." grupo>
        {e.corDestaque ? (
          <CampoCor valor={e.corDestaque} aoMudar={(corDestaque) => m({ corDestaque })} aoLimpar={() => m({ corDestaque: undefined })} />
        ) : (
          <BotaoEscolherCor aoEscolher={() => m({ corDestaque: tema.cores.cor2 })} />
        )}
      </Campo>

      <Campo rotulo="Espaço em cima e embaixo" grupo>
        <Opcoes<string> valor={e.espaco ?? ""} aoMudar={(v) => m({ espaco: v as Espaco })} opcoes={[...padrao, ...(Object.keys(espacos) as Espaco[]).map((k) => [k, espacos[k].nome] as [string, ReactNode])]} />
      </Campo>
      <Campo rotulo="Largura do conteúdo" grupo>
        <Opcoes<string> valor={e.largura ?? "normal"} aoMudar={(v) => m({ largura: v === "normal" ? undefined : (v as Largura) })} opcoes={(Object.keys(larguras) as Largura[]).map((k) => [k, larguras[k].nome])} />
      </Campo>
      {info.alinha && (
        <Campo rotulo="Posição do texto" grupo>
          <Opcoes valor={e.alinhamento ?? "esquerda"} aoMudar={(alinhamento) => m({ alinhamento })} opcoes={[["esquerda", "À esquerda"], ["centro", "No centro"]]} />
        </Campo>
      )}
      <Campo rotulo="Tamanho dos títulos" grupo>
        <Opcoes<string> valor={e.titulo ?? "m"} aoMudar={(v) => m({ titulo: v === "m" ? undefined : (v as TamanhoTitulo) })} opcoes={(Object.keys(tamanhosTitulo) as TamanhoTitulo[]).map((k) => [k, tamanhosTitulo[k].nome])} />
      </Campo>
      {info.colunas && (
        <Campo rotulo="Colunas (no computador)" dica="No celular os itens ficam um embaixo do outro (fotos e pessoas, dois por linha)." grupo>
          <Opcoes<string>
            valor={String(e.colunas ?? 0)}
            aoMudar={(v) => m({ colunas: Number(v) || undefined })}
            opcoes={[["0", "Automático"], ...info.colunas.map((n) => [String(n), String(n)] as [string, ReactNode])]}
          />
        </Campo>
      )}
      <button type="button" className={`${classeBotaoEd(false, true)} w-fit`} onClick={() => muda({ ...info.estilo })}>
        <RotateCcw className="size-3.5" /> Voltar à aparência padrão desta seção
      </button>
    </div>
  );
}

function BotaoEscolherCor({ aoEscolher }: { aoEscolher: () => void }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-slate-300">
      Automática
      <button type="button" className={classeBotaoEd(false, true)} onClick={aoEscolher}>
        Escolher uma cor
      </button>
    </div>
  );
}

// ---------- Conteúdo de cada seção ----------

const grade = "flex flex-col gap-3";

type P<T extends TipoSecao> = PropsSecao[T];
type Muda<T extends TipoSecao> = (patch: Partial<P<T>>) => void;

function FormSecao<D>({ s, muda, dados, modulo }: { s: Secao; muda: (patch: Record<string, unknown>) => void; dados: DadosPagina; modulo: ModuloPagina<D> }) {
  switch (s.tipo) {
    case "capa":
      return <FormCapa s={s.props} muda={muda} dados={dados} />;
    case "aviso":
      return (
        <div className={grade}>
          <Campo rotulo="Texto da faixa">
            <Entrada valor={s.props.texto} aoMudar={(texto) => muda({ texto })} maxLength={140} />
          </Campo>
          <CampoAlvo rotulo="Link ao tocar (opcional)" valor={s.props.alvo} aoMudar={(alvo) => muda({ alvo })} />
        </div>
      );
    case "destaques":
      return (
        <Campo rotulo="Destaques" grupo>
          <Lista itens={s.props.itens} aoMudar={(itens) => muda({ itens })} novo={() => ({ titulo: "", texto: "" })} max={8} rotuloNovo="Adicionar destaque">
            {(x, m) => (
              <div className="flex flex-col gap-1.5">
                <input className={classeEntrada} placeholder="Em destaque (ex.: +500)" value={x.titulo} onChange={(e) => m({ titulo: e.target.value })} />
                <input className={classeEntrada} placeholder="Explicação curta (ex.: clientes atendidos)" value={x.texto} onChange={(e) => m({ texto: e.target.value })} />
              </div>
            )}
          </Lista>
        </Campo>
      );
    case "beneficios":
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} etiqueta />
          <Campo rotulo="Benefícios" grupo>
            <Lista
              itens={s.props.itens}
              aoMudar={(itens) => muda({ itens })}
              novo={() => ({ icone: "check" as IdIcone, titulo: "", texto: "" })}
              max={12}
              rotuloNovo="Adicionar benefício"
            >
              {(x, m) => (
                <div className="flex items-start gap-2">
                  <SeletorIcone valor={x.icone} aoMudar={(icone) => m({ icone })} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input className={classeEntrada} value={x.titulo} placeholder="Benefício" onChange={(e) => m({ titulo: e.target.value })} />
                    <input className={classeEntrada} value={x.texto} placeholder="Explicação (opcional)" onChange={(e) => m({ texto: e.target.value })} />
                  </div>
                </div>
              )}
            </Lista>
          </Campo>
        </div>
      );
    case "planos":
      return <FormPlanos s={s.props} muda={muda} dados={dados} ondeMudar={modulo.ondeMudar.planos} />;
    case "comoFunciona":
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} etiqueta />
          <Campo rotulo="Passos (numerados na ordem)" grupo>
            <Lista itens={s.props.itens} aoMudar={(itens) => muda({ itens })} novo={() => ({ titulo: "", texto: "" })} max={6} rotuloNovo="Adicionar passo">
              {(p, m) => (
                <div className="flex flex-col gap-1.5">
                  <input className={classeEntrada} placeholder="Título do passo" value={p.titulo} onChange={(e) => m({ titulo: e.target.value })} />
                  <input className={classeEntrada} placeholder="Explicação curta" value={p.texto} onChange={(e) => m({ texto: e.target.value })} />
                </div>
              )}
            </Lista>
          </Campo>
        </div>
      );
    case "sobre":
      return (
        <div className={grade}>
          <Campo rotulo="Frase pequena acima do título (opcional)">
            <Entrada valor={s.props.etiqueta} aoMudar={(etiqueta) => muda({ etiqueta })} maxLength={50} />
          </Campo>
          <Campo rotulo="Título">
            <Entrada valor={s.props.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo rotulo="Texto">
            <AreaTexto valor={s.props.texto} aoMudar={(texto) => muda({ texto })} linhas={5} />
          </Campo>
          <Campo rotulo="Foto (opcional)" grupo>
            <CampoArquivo url={s.props.imagem} aoMudar={(imagem) => muda({ imagem })} />
          </Campo>
          {s.props.imagem && (
            <Campo rotulo="Foto do lado" grupo>
              <Opcoes valor={s.props.lado} aoMudar={(lado) => muda({ lado })} opcoes={[["esquerda", "Esquerdo"], ["direita", "Direito"]]} />
            </Campo>
          )}
          <Campo rotulo="Texto do botão (vazio = sem botão)">
            <Entrada valor={s.props.botao} aoMudar={(botao) => muda({ botao })} />
          </Campo>
          {s.props.botao && <CampoAlvo valor={s.props.alvo} aoMudar={(alvo) => muda({ alvo })} />}
        </div>
      );
    case "video": {
      const url = s.props.url;
      const enviado = url.startsWith("/api/arquivos/");
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} />
          <Campo
            rotulo="Link do vídeo"
            dica={url && !videoEmbutido(url) ? <span className="text-red-300">Link não reconhecido. Use um link do YouTube ou do Vimeo.</span> : "YouTube ou Vimeo (copie o link do navegador ou do botão Compartilhar)."}
          >
            <Entrada valor={enviado ? "" : url} aoMudar={(v) => muda({ url: v })} placeholder="https://www.youtube.com/watch?v=..." />
          </Campo>
          <Campo rotulo="Ou envie um vídeo (até 100 MB)" grupo>
            {enviado ? (
              <div className="flex items-center gap-2 text-[13px] text-slate-300">
                Vídeo enviado.
                <button type="button" className={classeBotaoEd(false, true)} onClick={() => muda({ url: "" })}>
                  Remover
                </button>
              </div>
            ) : (
              <CampoArquivo tipo="video" url={null} aoMudar={(v) => muda({ url: v ?? "" })} />
            )}
          </Campo>
        </div>
      );
    }
    case "depoimentos":
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} />
          <Campo rotulo="Depoimentos" grupo>
            <Lista
              itens={s.props.itens}
              aoMudar={(itens) => muda({ itens })}
              novo={() => ({ autor: "", detalhe: "", texto: "", foto: null, estrelas: 5 })}
              max={12}
              rotuloNovo="Adicionar depoimento"
            >
              {(x, m) => (
                <div className="flex gap-2">
                  <CampoArquivo pequeno url={x.foto} aoMudar={(foto) => m({ foto })} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input className={classeEntrada} placeholder="Nome" value={x.autor} onChange={(e) => m({ autor: e.target.value })} />
                    <input className={classeEntrada} placeholder="Ex.: Cliente há 6 meses" value={x.detalhe} onChange={(e) => m({ detalhe: e.target.value })} />
                    <textarea className={`${classeEntrada} h-auto py-2`} rows={3} placeholder="O que a pessoa disse" value={x.texto} onChange={(e) => m({ texto: e.target.value })} />
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" aria-label={`${n} estrelas`} onClick={() => m({ estrelas: n })}>
                          <Star className={`size-4 ${n <= x.estrelas ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Lista>
          </Campo>
        </div>
      );
    case "galeria":
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} />
          <Campo rotulo="Fotos" grupo>
            <Lista itens={s.props.itens} aoMudar={(itens) => muda({ itens })} novo={() => ({ imagem: null, titulo: "" })} max={12} rotuloNovo="Adicionar foto">
              {(x, m) => (
                <div className="flex items-center gap-2">
                  <CampoArquivo pequeno url={x.imagem} aoMudar={(imagem) => m({ imagem })} />
                  <input className={classeEntrada} placeholder="Legenda (opcional)" value={x.titulo} onChange={(e) => m({ titulo: e.target.value })} />
                </div>
              )}
            </Lista>
          </Campo>
        </div>
      );
    case "duvidas":
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} />
          <Campo rotulo="Perguntas e respostas" grupo>
            <Lista itens={s.props.itens} aoMudar={(itens) => muda({ itens })} novo={() => ({ titulo: "", texto: "" })} max={15} rotuloNovo="Adicionar pergunta">
              {(x, m) => (
                <div className="flex flex-col gap-1.5">
                  <input className={classeEntrada} placeholder="Pergunta" value={x.titulo} onChange={(e) => m({ titulo: e.target.value })} />
                  <textarea className={`${classeEntrada} h-auto py-2`} rows={2} placeholder="Resposta" value={x.texto} onChange={(e) => m({ texto: e.target.value })} />
                </div>
              )}
            </Lista>
          </Campo>
        </div>
      );
    case "equipe": {
      const itens = s.props.itens;
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} />
          <Campo rotulo="Pessoas" grupo>
            <Lista itens={itens} aoMudar={(v) => muda({ itens: v })} novo={() => ({ nome: "", cargo: "", foto: null })} max={16} rotuloNovo="Adicionar pessoa">
              {(x, m) => (
                <div className="flex gap-2">
                  <CampoArquivo pequeno url={x.foto} aoMudar={(foto) => m({ foto })} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input className={classeEntrada} placeholder="Nome" value={x.nome} onChange={(e) => m({ nome: e.target.value })} />
                    <input className={classeEntrada} placeholder="Função (ex.: Professor de musculação)" value={x.cargo} onChange={(e) => m({ cargo: e.target.value })} />
                  </div>
                </div>
              )}
            </Lista>
          </Campo>
          {(dados.equipe?.length ?? 0) > 0 && (
            <button
              type="button"
              className={`${classeBotaoEd(false, true)} w-fit`}
              onClick={() => {
                const novos = (dados.equipe ?? []).filter((p) => !itens.some((x) => x.nome === p.nome));
                muda({ itens: [...itens, ...novos.map((p) => ({ id: novoId(), nome: p.nome, cargo: p.cargo, foto: null }))] });
              }}
            >
              Trazer quem está no cadastro de profissionais
            </button>
          )}
        </div>
      );
    }
    case "aulas":
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} />
          <Info>
            {dados.aulas?.length ? `${dados.aulas.length} aula(s) com horário. ` : "Nenhuma aula com horário ainda. "}
            As aulas, dias e horários vêm sozinhos do cadastro de aulas e turmas.
          </Info>
        </div>
      );
    case "horarios":
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} />
          <Info>Os dias e horários vêm sozinhos das Configurações (horário de funcionamento). O dia de hoje fica em destaque.</Info>
        </div>
      );
    case "localizacao":
      return (
        <div className={grade}>
          <Campo rotulo="Título">
            <Entrada valor={s.props.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo rotulo="Endereço" dica={dados.endereco ? "Vazio = usa o endereço das Configurações." : "Rua, número, bairro e cidade."}>
            <Entrada valor={s.props.endereco} aoMudar={(endereco) => muda({ endereco })} placeholder={dados.endereco ?? ""} />
          </Campo>
          <Alternar ligado={s.props.mostrarMapa} aoMudar={(mostrarMapa) => muda({ mostrarMapa })} titulo="Mostrar o mapa" />
        </div>
      );
    case "chamada":
      return (
        <div className={grade}>
          <TituloTexto s={s.props} muda={muda} />
          <Campo rotulo="Texto do botão (vazio = sem botão)">
            <Entrada valor={s.props.botao} aoMudar={(botao) => muda({ botao })} />
          </Campo>
          {s.props.botao && <CampoAlvo valor={s.props.alvo} aoMudar={(alvo) => muda({ alvo })} />}
        </div>
      );
    case "contato":
      return (
        <div className={grade}>
          <Campo rotulo="Título (opcional)">
            <Entrada valor={s.props.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo
            rotulo="Texto do link do WhatsApp"
            dica={
              dados.whatsapp ? (
                "Abre uma conversa com o WhatsApp do negócio. Vazio = sem o link."
              ) : (
                <span className="text-amber-300">
                  O WhatsApp ainda não foi cadastrado.{" "}
                  <Link to={modulo.ondeMudar.whatsapp} className="underline">
                    Cadastrar
                  </Link>
                </span>
              )
            }
          >
            <Entrada valor={s.props.texto} aoMudar={(texto) => muda({ texto })} />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Instagram">
              <Entrada valor={s.props.instagram} aoMudar={(instagram) => muda({ instagram })} placeholder="@seuperfil" />
            </Campo>
            <Campo rotulo="Facebook">
              <Entrada valor={s.props.facebook} aoMudar={(facebook) => muda({ facebook })} placeholder="suapagina" />
            </Campo>
            <Campo rotulo="YouTube">
              <Entrada valor={s.props.youtube} aoMudar={(youtube) => muda({ youtube })} placeholder="@seucanal" />
            </Campo>
            <Campo rotulo="TikTok">
              <Entrada valor={s.props.tiktok} aoMudar={(tiktok) => muda({ tiktok })} placeholder="@seuperfil" />
            </Campo>
          </div>
          <Campo rotulo="Site (opcional)">
            <Entrada valor={s.props.site} aoMudar={(site) => muda({ site })} placeholder="www.seusite.com.br" />
          </Campo>
        </div>
      );
    case "rodape":
      return (
        <Campo rotulo="Texto do rodapé" dica="Ex.: nome da empresa, CNPJ, endereço.">
          <AreaTexto valor={s.props.texto} aoMudar={(texto) => muda({ texto })} linhas={2} />
        </Campo>
      );
    case "livre":
      return (
        <div className={grade}>
          <Info>Esta seção é uma tela em branco. Use a aba "Peças livres" para soltar textos, fotos, botões e formas onde quiser, e a aba "Aparência" para o fundo.</Info>
          <Campo rotulo={`Altura no computador: ${s.props.altura}`}>
            <input type="range" min={80} max={1600} step={10} value={s.props.altura} onChange={(e) => muda({ altura: Number(e.target.value) })} className="accent-(--ed-2)" />
          </Campo>
          <Campo rotulo={`Altura no celular: ${s.props.alturaCel}`}>
            <input type="range" min={80} max={2400} step={10} value={s.props.alturaCel} onChange={(e) => muda({ alturaCel: Number(e.target.value) })} className="accent-(--ed-2)" />
          </Campo>
        </div>
      );
  }
}

function FormCapa({ s, muda, dados }: { s: P<"capa">; muda: Muda<"capa">; dados: DadosPagina }) {
  const destaqueFora = s.destaque.trim() && !s.titulo.toLowerCase().includes(s.destaque.trim().toLowerCase());
  return (
    <div className={grade}>
      <div className="flex gap-3">
        <Campo rotulo="Logo" grupo>
          <CampoArquivo pequeno url={s.logo} aoMudar={(logo) => muda({ logo })} />
        </Campo>
        <div className="flex min-w-0 flex-1 flex-col justify-end gap-2 pb-1">
          <span className="text-[11.5px] text-slate-500">Sem logo, aparece a marca padrão do sistema.</span>
          <Alternar ligado={s.mostrarNome} aoMudar={(mostrarNome) => muda({ mostrarNome })} titulo={`Mostrar o nome "${dados.nome}"`} />
        </div>
      </div>
      <Campo rotulo="Frase pequena acima do título (opcional)">
        <Entrada valor={s.etiqueta} aoMudar={(etiqueta) => muda({ etiqueta })} maxLength={50} />
      </Campo>
      <Campo rotulo="Título">
        <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} maxLength={120} />
      </Campo>
      <Campo
        rotulo="Parte colorida do título (opcional)"
        dica={destaqueFora ? <span className="text-amber-300">Esse trecho não está no título, então nada fica colorido.</span> : "Escreva um pedaço do título para ele ficar com a cor de destaque."}
      >
        <Entrada valor={s.destaque} aoMudar={(destaque) => muda({ destaque })} />
      </Campo>
      <Campo rotulo="Texto abaixo do título">
        <AreaTexto valor={s.texto} aoMudar={(texto) => muda({ texto })} linhas={4} />
      </Campo>
      <Campo rotulo="Foto de capa (fica atrás do título)" dica="De preferência deitada, 1600 × 900." grupo>
        <CampoArquivo url={s.imagem} aoMudar={(imagem) => muda({ imagem })} />
      </Campo>
      {s.imagem && (
        <Campo rotulo={`Escurecer a foto: ${s.escurecer}%`} dica="Mais escuro deixa o texto mais fácil de ler.">
          <input type="range" min={0} max={90} step={5} value={s.escurecer} onChange={(e) => muda({ escurecer: Number(e.target.value) })} className="accent-(--ed-2)" />
        </Campo>
      )}
      {dados.numero && (
        <Alternar
          ligado={s.mostrarNumero}
          aoMudar={(mostrarNumero) => muda({ mostrarNumero })}
          titulo={`Mostrar "${dados.numero.valor} ${dados.numero.rotulo}"`}
          descricao="O número é atualizado sozinho."
        />
      )}
      <Campo rotulo="Frases curtas com ícone (abaixo do texto)" grupo>
        <Lista itens={s.selos} aoMudar={(selos) => muda({ selos })} novo={() => ({ icone: "check" as IdIcone, texto: "" })} max={4} rotuloNovo="Adicionar frase">
          {(x, m) => (
            <div className="flex items-center gap-2">
              <SeletorIcone valor={x.icone} aoMudar={(icone) => m({ icone })} />
              <input className={classeEntrada} value={x.texto} placeholder="Escreva aqui" onChange={(e) => m({ texto: e.target.value })} />
            </div>
          )}
        </Lista>
      </Campo>
      <Campo rotulo="Botão principal (vazio = sem botão)">
        <Entrada valor={s.botao} aoMudar={(botao) => muda({ botao })} />
      </Campo>
      {s.botao && <CampoAlvo valor={s.alvo} aoMudar={(alvo) => muda({ alvo })} />}
      <Campo rotulo="Segundo botão (opcional)">
        <Entrada valor={s.botaoSecundario} aoMudar={(botaoSecundario) => muda({ botaoSecundario })} />
      </Campo>
      {s.botaoSecundario && <CampoAlvo valor={s.alvoSecundario} aoMudar={(alvoSecundario) => muda({ alvoSecundario })} />}
      <Campo rotulo="Linha de apoio abaixo dos botões (opcional)" dica="Ex.: Sem fidelidade · Cancele quando quiser">
        <Entrada valor={s.rodape} aoMudar={(rodape) => muda({ rodape })} maxLength={120} />
      </Campo>
    </div>
  );
}

function FormPlanos({ s, muda, dados, ondeMudar }: { s: P<"planos">; muda: Muda<"planos">; dados: DadosPagina; ondeMudar: string | null }) {
  return (
    <div className={grade}>
      <TituloTexto s={s} muda={muda} etiqueta />
      <Campo rotulo="Planos que aparecem" grupo>
        <div className="flex flex-col gap-1.5">
          {dados.planos.map((p) => {
            const visivel = !s.ocultos.includes(p.id);
            return (
              <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/[0.07] px-2.5 py-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={visivel}
                  onChange={() => muda({ ocultos: visivel ? [...s.ocultos, p.id] : s.ocultos.filter((x) => x !== p.id) })}
                  className="accent-(--ed-2)"
                />
                <span className="flex-1">{p.nome}</span>
                <span className="text-[12px] text-slate-400">
                  {p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} {p.periodo}
                </span>
              </label>
            );
          })}
          {dados.planos.length === 0 && <span className="text-[12.5px] text-slate-400">Nenhum plano à venda.</span>}
          {ondeMudar ? (
            <Link to={ondeMudar} className="text-[12px] text-slate-400 underline underline-offset-2 hover:text-white">
              Criar ou mudar planos e preços
            </Link>
          ) : (
            <span className="text-[12px] text-slate-500">Os planos e preços são cadastrados no Cliente Plus (Produtos/Planos).</span>
          )}
        </div>
      </Campo>
      <Campo rotulo="Plano em destaque">
        <select className={classeEntrada} value={s.destaque} onChange={(e) => muda({ destaque: e.target.value })}>
          <option value="auto">Automático (o segundo mais barato)</option>
          <option value="nenhum">Nenhum</option>
          {dados.planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </Campo>
      {s.destaque !== "nenhum" && (
        <Campo rotulo="Selo do plano em destaque">
          <Entrada valor={s.selo} aoMudar={(selo) => muda({ selo })} maxLength={30} />
        </Campo>
      )}
      <Campo rotulo="Texto do botão">
        <Entrada valor={s.botao} aoMudar={(botao) => muda({ botao })} maxLength={40} />
      </Campo>
      <Alternar ligado={s.mostrarItens} aoMudar={(mostrarItens) => muda({ mostrarItens })} titulo="Mostrar o que cada plano inclui" />
    </div>
  );
}

function TituloTexto({
  s,
  muda,
  etiqueta = false,
}: {
  s: { titulo: string; texto: string; etiqueta?: string };
  muda: (p: { titulo?: string; texto?: string; etiqueta?: string }) => void;
  etiqueta?: boolean;
}) {
  return (
    <>
      {etiqueta && (
        <Campo rotulo="Frase pequena acima do título (opcional)">
          <Entrada valor={s.etiqueta ?? ""} aoMudar={(v) => muda({ etiqueta: v })} maxLength={50} />
        </Campo>
      )}
      <Campo rotulo="Título">
        <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} />
      </Campo>
      <Campo rotulo="Texto abaixo do título (opcional)">
        <AreaTexto valor={s.texto} aoMudar={(texto) => muda({ texto })} linhas={2} />
      </Campo>
    </>
  );
}

// Para onde um botão leva.
function CampoAlvo({ valor, aoMudar, rotulo = "Para onde o botão leva" }: { valor: string; aoMudar: (v: string) => void; rotulo?: string }) {
  return (
    <Campo rotulo={rotulo} dica="#planos leva aos planos e #contato ao contato. Também pode ser um endereço https://...">
      <Entrada valor={valor} aoMudar={aoMudar} placeholder="#planos" />
    </Campo>
  );
}

function Info({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-sky-500/10 px-2.5 py-2 text-[12.5px] text-sky-100">{children}</p>;
}
