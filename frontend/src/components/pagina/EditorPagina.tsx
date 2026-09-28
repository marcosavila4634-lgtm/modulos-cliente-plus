import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  CloudCheck,
  Copy,
  CopyPlus,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  LoaderCircle,
  Monitor,
  Palette,
  PenLine,
  Plus,
  RotateCcw,
  Rocket,
  Smartphone,
  Star,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  apiPagina,
  cantos,
  catalogo,
  completar,
  coresProntas,
  fontes,
  fundos,
  novaSecao,
  novoId,
  type Cantos,
  type DadosPagina,
  type EditorPaginaApi,
  type Fonte,
  type Fundo,
  type IdIcone,
  type ModuloPagina,
  type PaginaConfig,
  type Secao,
  type SecaoDo,
  type Tema,
  type TipoSecao,
} from "../../lib/pagina";
import { AreaTexto, Alternar, BotaoIcone, Campo, CampoArquivo, classeBotaoEd, classeEntrada, Entrada, Lista, Opcoes, SeletorIcone } from "./campos";
import { PaginaPublica, videoEmbutido } from "./PaginaPublica";

// Editor da página pública, o mesmo para todos os módulos. Cada módulo passa
// o seu adaptador (lib/pagina-<modulo>.tsx) e os dados que vieram de
// GET /api/paginas/<modulo>.
//
// Tudo o que o dono muda é salvo sozinho como RASCUNHO (clientes não veem).
// "Publicar" coloca o rascunho no ar e guarda uma versão (dá para voltar).

type Estado = "salvo" | "salvando" | "erro";

export function EditorPagina<D>({ modulo, inicial, ajuda }: { modulo: ModuloPagina<D>; inicial: EditorPaginaApi<D>; ajuda?: ReactNode }) {
  const [api, setApi] = useState(inicial);
  const dados = useMemo(() => modulo.normalizar(api.dados), [modulo, api.dados]);
  const carregar = (a: EditorPaginaApi<D>) => completar(a.rascunho ?? a.publicada, modulo.normalizar(a.dados), modulo.padrao(a.dados));

  const [pagina, setPagina] = useState<PaginaConfig>(() => carregar(inicial));
  const paginaRef = useRef(pagina);
  paginaRef.current = pagina;
  const salvoRef = useRef(JSON.stringify(pagina));
  const [estado, setEstado] = useState<Estado>("salvo");
  const [pendente, setPendente] = useState(inicial.pendente);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [dispositivo, setDispositivo] = useState<"celular" | "computador">("celular");
  const [aba, setAba] = useState<"editar" | "ver">("editar"); // telas pequenas
  const [adicionando, setAdicionando] = useState(false);
  const [versoesAbertas, setVersoesAbertas] = useState(false);
  const origemSelecao = useRef<"lista" | "previa">("lista");

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
    setApi(a);
    setPagina(p);
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

  const mudarTema = (patch: Partial<Tema>) => setPagina((p) => ({ ...p, tema: { ...p.tema, ...patch } }));
  const mudar = (id: string, patch: Partial<Secao>) =>
    setPagina((p) => ({ ...p, secoes: p.secoes.map((s) => (s.id === id ? ({ ...s, ...patch } as Secao) : s)) }));
  const mover = (id: string, d: number) =>
    setPagina((p) => {
      const i = p.secoes.findIndex((s) => s.id === id);
      const j = i + d;
      if (i <= 0 || j <= 0 || j >= p.secoes.length) return p; // o topo fica sempre em cima
      const secoes = [...p.secoes];
      const [x] = secoes.splice(i, 1);
      secoes.splice(j, 0, x);
      return { ...p, secoes };
    });
  const apagar = (s: Secao) => {
    if (!confirm(`Apagar a seção "${catalogo[s.tipo].nome}"?`)) return;
    setPagina((p) => ({ ...p, secoes: p.secoes.filter((x) => x.id !== s.id) }));
    if (selecionada === s.id) setSelecionada(null);
  };
  const duplicar = (s: Secao) =>
    setPagina((p) => {
      const i = p.secoes.findIndex((x) => x.id === s.id);
      const copia = { ...structuredClone(s), id: novoId() };
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
        const contato = secoes.findIndex((s) => s.tipo === "contato");
        i = contato > 0 ? contato : secoes.length;
      }
      secoes.splice(i, 0, nova);
      return { ...p, secoes };
    });
    origemSelecao.current = "lista";
    setSelecionada(nova.id);
    setAdicionando(false);
  };

  const selecionar = (id: string | null, origem: "lista" | "previa") => {
    origemSelecao.current = origem;
    setSelecionada((atual) => (origem === "lista" && atual === id ? null : id));
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
    } else {
      setAba("editar");
      document.getElementById(`ed-${selecionada}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selecionada]);

  const tiposDisponiveis = modulo.tipos.filter((t) => !(catalogo[t].unica && pagina.secoes.some((s) => s.tipo === t)));
  const acento = { "--ed-1": modulo.acento[0], "--ed-2": modulo.acento[1] } as CSSProperties;

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
        <Link to={modulo.ondeMudar.endereco} className="text-[12px] text-slate-400 underline underline-offset-2 hover:text-white">
          Mudar endereço
        </Link>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {erro}
        </div>
      )}

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
          <ItemLista
            id="tema"
            aberto={selecionada === "tema"}
            aoAbrir={() => selecionar("tema", "lista")}
            icone={<Palette className="size-4 text-(--ed-2)" />}
            titulo="Aparência"
            resumo={`${fundos[pagina.tema.fundo].nome} · ${fontes[pagina.tema.fonte].nome}`}
          >
            <FormTema tema={pagina.tema} muda={mudarTema} />
          </ItemLista>

          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Seções da página (de cima para baixo)</span>
          </div>

          {pagina.secoes.map((s, i) => {
            const info = catalogo[s.tipo];
            return (
              <ItemLista
                key={s.id}
                id={s.id}
                aberto={selecionada === s.id}
                aoAbrir={() => selecionar(s.id, "lista")}
                apagada={!s.visivel}
                titulo={info.nome}
                resumo={resumo(s)}
                botoes={
                  s.tipo !== "topo" && (
                    <>
                      <BotaoIcone rotulo="Subir" disabled={i <= 1} onClick={() => mover(s.id, -1)}>
                        <ArrowUp className="size-3.5" />
                      </BotaoIcone>
                      <BotaoIcone rotulo="Descer" disabled={i === pagina.secoes.length - 1} onClick={() => mover(s.id, 1)}>
                        <ArrowDown className="size-3.5" />
                      </BotaoIcone>
                      <BotaoIcone rotulo={s.visivel ? "Esconder" : "Mostrar"} ativo={!s.visivel} onClick={() => mudar(s.id, { visivel: !s.visivel })}>
                        {s.visivel ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      </BotaoIcone>
                      {!info.unica && (
                        <BotaoIcone rotulo="Duplicar" onClick={() => duplicar(s)}>
                          <CopyPlus className="size-3.5" />
                        </BotaoIcone>
                      )}
                      {!info.fixa && (
                        <BotaoIcone rotulo="Apagar" perigo onClick={() => apagar(s)}>
                          <Trash2 className="size-3.5" />
                        </BotaoIcone>
                      )}
                    </>
                  )
                }
              >
                <p className="mb-3 text-[12px] text-slate-500">{info.descricao}</p>
                {!s.visivel && (
                  <p className="mb-3 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[12px] text-amber-200">
                    Escondida: não aparece na página. Toque no olho para mostrar.
                    {s.tipo === "planos" && " Sem os planos, ninguém consegue assinar pela página."}
                  </p>
                )}
                <FormSecao s={s} muda={(patch) => mudar(s.id, patch)} dados={dados} modulo={modulo} />
              </ItemLista>
            );
          })}

          <button type="button" onClick={() => setAdicionando(true)} className={`${classeBotaoEd()} mt-1 border-dashed`}>
            <Plus className="size-4" /> Adicionar seção
          </button>

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
            <span className="text-[12px] text-slate-400">Prévia do rascunho. Toque numa parte da página para editar.</span>
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
            selecionada={selecionada}
            aoSelecionar={(id) => selecionar(id, "previa")}
          />
        </div>
      </div>

      {adicionando && (
        <Janela titulo="Adicionar seção" aoFechar={() => setAdicionando(false)}>
          <p className="mb-3 text-[13px] text-slate-400">
            {selecionada && selecionada !== "tema" ? "A seção entra logo abaixo da que está aberta." : "A seção entra no fim da página, antes do contato."}
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

function ItemLista({
  id,
  aberto,
  aoAbrir,
  icone,
  titulo,
  resumo,
  apagada = false,
  botoes,
  children,
}: {
  id: string;
  aberto: boolean;
  aoAbrir: () => void;
  icone?: ReactNode;
  titulo: string;
  resumo?: string;
  apagada?: boolean;
  botoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      id={`ed-${id}`}
      className={`scroll-mt-3 rounded-2xl border transition ${aberto ? "border-(--ed-2)/60 bg-white/[0.04]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
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

function resumo(s: Secao): string {
  switch (s.tipo) {
    case "topo":
      return s.titulo;
    case "aviso":
      return s.texto;
    case "contato":
      return s.texto || "Redes sociais e rodapé";
    case "beneficios":
      return s.titulo || `${s.itens.length} benefícios`;
    default:
      return "titulo" in s ? s.titulo : "";
  }
}

function Previa({
  refCaixa,
  dispositivo,
  pagina,
  dados,
  selecionada,
  aoSelecionar,
}: {
  refCaixa: RefObject<HTMLDivElement | null>;
  dispositivo: "celular" | "computador";
  pagina: PaginaConfig;
  dados: DadosPagina;
  selecionada: string | null;
  aoSelecionar: (id: string) => void;
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
        <PaginaPublica pagina={pagina} dados={dados} aoEscolherPlano={() => {}} edicao={{ selecionada, aoSelecionar }} />
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

// ---------- Formulários ----------

function FormTema({ tema, muda }: { tema: Tema; muda: (p: Partial<Tema>) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Campo rotulo="Cor de fundo">
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(fundos) as Fundo[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => muda({ fundo: f })}
              className={`flex flex-col items-center gap-1 rounded-xl p-1.5 text-[11px] transition ${tema.fundo === f ? "bg-white/10 text-white ring-1 ring-(--ed-2)" : "text-slate-400 hover:bg-white/5"}`}
            >
              <span className="h-8 w-full rounded-lg border border-white/15" style={{ background: fundos[f].fundo }} />
              {fundos[f].nome}
            </button>
          ))}
        </div>
      </Campo>
      <Campo rotulo="Cor de destaque (botões e detalhes)">
        <div className="flex flex-wrap gap-2">
          {coresProntas.map((c) => {
            const ativo = tema.cor1.toLowerCase() === c.cor1 && tema.cor2.toLowerCase() === c.cor2;
            return (
              <button
                key={c.nome}
                type="button"
                title={c.nome}
                onClick={() => muda({ cor1: c.cor1, cor2: c.cor2 })}
                className={`size-9 rounded-full transition ${ativo ? "ring-2 ring-white ring-offset-2 ring-offset-[#0d1322]" : "hover:scale-110"}`}
                style={{ background: `linear-gradient(135deg, ${c.cor1}, ${c.cor2})` }}
              />
            );
          })}
        </div>
      </Campo>
      <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-400">
        Ou escolha as suas:
        <label className="inline-flex items-center gap-1.5">
          <input type="color" value={tema.cor1} onChange={(e) => muda({ cor1: e.target.value })} className="size-8 cursor-pointer rounded border-0 bg-transparent" />
          Cor 1
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input type="color" value={tema.cor2} onChange={(e) => muda({ cor2: e.target.value })} className="size-8 cursor-pointer rounded border-0 bg-transparent" />
          Cor 2
        </label>
      </div>
      <Campo rotulo="Letra dos títulos">
        <Opcoes<Fonte>
          valor={tema.fonte}
          aoMudar={(fonte) => muda({ fonte })}
          opcoes={(Object.keys(fontes) as Fonte[]).map((f) => [
            f,
            <span key={f} style={{ fontFamily: fontes[f].familia }}>
              {fontes[f].nome}
            </span>,
          ])}
        />
      </Campo>
      <Campo rotulo="Cantos dos cartões e botões">
        <Opcoes<Cantos> valor={tema.cantos} aoMudar={(c) => muda({ cantos: c })} opcoes={(Object.keys(cantos) as Cantos[]).map((c) => [c, cantos[c].nome])} />
      </Campo>
    </div>
  );
}

const grade = "flex flex-col gap-3";

function FormSecao<D>({ s, muda, dados, modulo }: { s: Secao; muda: (p: Partial<Secao>) => void; dados: DadosPagina; modulo: ModuloPagina<D> }) {
  switch (s.tipo) {
    case "topo":
      return <FormTopo s={s} muda={muda} dados={dados} />;
    case "aviso":
      return (
        <div className={grade}>
          <Campo rotulo="Texto da faixa">
            <Entrada valor={s.texto} aoMudar={(texto) => muda({ texto })} maxLength={140} />
          </Campo>
          <Campo rotulo="Link ao tocar (opcional)" dica="Ex.: #planos para ir aos planos, ou um endereço https://...">
            <Entrada valor={s.link} aoMudar={(link) => muda({ link })} placeholder="#planos" />
          </Campo>
        </div>
      );
    case "beneficios":
      return (
        <div className={grade}>
          <TituloTexto s={s} muda={muda} />
          <Campo rotulo="Benefícios">
            <ListaIcones itens={s.itens} aoMudar={(itens) => muda({ itens })} max={12} rotuloNovo="Adicionar benefício" />
          </Campo>
        </div>
      );
    case "planos":
      return <FormPlanos s={s} muda={muda} dados={dados} ondeMudar={modulo.ondeMudar.planos} />;
    case "passos":
      return (
        <div className={grade}>
          <Campo rotulo="Título (opcional)">
            <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo rotulo="Passos (numerados na ordem)">
            <Lista itens={s.itens} aoMudar={(itens) => muda({ itens })} novo={() => ({ titulo: "", texto: "" })} max={6} rotuloNovo="Adicionar passo">
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
    case "texto":
      return (
        <div className={grade}>
          <Campo rotulo="Título">
            <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo rotulo="Texto">
            <AreaTexto valor={s.texto} aoMudar={(texto) => muda({ texto })} linhas={5} />
          </Campo>
          <Campo rotulo="Foto (opcional)">
            <CampoArquivo url={s.imagem} aoMudar={(imagem) => muda({ imagem })} />
          </Campo>
          {s.imagem && (
            <Campo rotulo="Foto do lado">
              <Opcoes valor={s.lado} aoMudar={(lado) => muda({ lado })} opcoes={[["esquerda", "Esquerdo"], ["direita", "Direito"]]} />
            </Campo>
          )}
          <Campo rotulo="Texto do botão (vazio = sem botão)">
            <Entrada valor={s.botao} aoMudar={(botao) => muda({ botao })} />
          </Campo>
          {s.botao && (
            <Campo rotulo="Link do botão" dica="Vazio = leva para os planos. Pode ser um endereço https://...">
              <Entrada valor={s.link} aoMudar={(link) => muda({ link })} placeholder="#planos" />
            </Campo>
          )}
        </div>
      );
    case "video": {
      const enviado = s.url.startsWith("/api/arquivos/");
      return (
        <div className={grade}>
          <TituloTexto s={s} muda={muda} />
          <Campo
            rotulo="Link do vídeo"
            dica={s.url && !videoEmbutido(s.url) ? <span className="text-red-300">Link não reconhecido. Use um link do YouTube ou do Vimeo.</span> : "YouTube ou Vimeo (copie o link do navegador ou do botão Compartilhar)."}
          >
            <Entrada valor={enviado ? "" : s.url} aoMudar={(url) => muda({ url })} placeholder="https://www.youtube.com/watch?v=..." />
          </Campo>
          <Campo rotulo="Ou envie um vídeo (até 100 MB)">
            {enviado ? (
              <div className="flex items-center gap-2 text-[13px] text-slate-300">
                Vídeo enviado.
                <button type="button" className={classeBotaoEd(false, true)} onClick={() => muda({ url: "" })}>
                  Remover
                </button>
              </div>
            ) : (
              <CampoArquivo tipo="video" url={null} aoMudar={(url) => muda({ url: url ?? "" })} />
            )}
          </Campo>
        </div>
      );
    }
    case "depoimentos":
      return (
        <div className={grade}>
          <Campo rotulo="Título">
            <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo rotulo="Depoimentos">
            <Lista
              itens={s.itens}
              aoMudar={(itens) => muda({ itens })}
              novo={() => ({ nome: "", detalhe: "", texto: "", foto: null, estrelas: 5 })}
              max={12}
              rotuloNovo="Adicionar depoimento"
            >
              {(x, m) => (
                <div className="flex gap-2">
                  <CampoArquivo pequeno url={x.foto} aoMudar={(foto) => m({ foto })} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input className={classeEntrada} placeholder="Nome" value={x.nome} onChange={(e) => m({ nome: e.target.value })} />
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
    case "imagens":
      return (
        <div className={grade}>
          <Campo rotulo="Título (opcional)">
            <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo rotulo="Fotos">
            <Lista itens={s.itens} aoMudar={(itens) => muda({ itens })} novo={() => ({ imagem: null, legenda: "" })} max={12} rotuloNovo="Adicionar foto">
              {(x, m) => (
                <div className="flex items-center gap-2">
                  <CampoArquivo pequeno url={x.imagem} aoMudar={(imagem) => m({ imagem })} />
                  <input className={classeEntrada} placeholder="Legenda (opcional)" value={x.legenda} onChange={(e) => m({ legenda: e.target.value })} />
                </div>
              )}
            </Lista>
          </Campo>
        </div>
      );
    case "perguntas":
      return (
        <div className={grade}>
          <Campo rotulo="Título">
            <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo rotulo="Perguntas e respostas">
            <Lista itens={s.itens} aoMudar={(itens) => muda({ itens })} novo={() => ({ pergunta: "", resposta: "" })} max={15} rotuloNovo="Adicionar pergunta">
              {(x, m) => (
                <div className="flex flex-col gap-1.5">
                  <input className={classeEntrada} placeholder="Pergunta" value={x.pergunta} onChange={(e) => m({ pergunta: e.target.value })} />
                  <textarea className={`${classeEntrada} h-auto py-2`} rows={2} placeholder="Resposta" value={x.resposta} onChange={(e) => m({ resposta: e.target.value })} />
                </div>
              )}
            </Lista>
          </Campo>
        </div>
      );
    case "equipe":
      return (
        <div className={grade}>
          <TituloTexto s={s} muda={muda} />
          <Campo rotulo="Pessoas">
            <Lista itens={s.itens} aoMudar={(itens) => muda({ itens })} novo={() => ({ nome: "", cargo: "", foto: null })} max={16} rotuloNovo="Adicionar pessoa">
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
                const novos = (dados.equipe ?? []).filter((p) => !s.itens.some((x) => x.nome === p.nome));
                muda({ itens: [...s.itens, ...novos.map((p) => ({ nome: p.nome, cargo: p.cargo, foto: null }))] });
              }}
            >
              Trazer quem está no cadastro de profissionais
            </button>
          )}
        </div>
      );
    case "aulas":
      return (
        <div className={grade}>
          <TituloTexto s={s} muda={muda} />
          <Info>
            {dados.aulas?.length ? `${dados.aulas.length} aula(s) com horário. ` : "Nenhuma aula com horário ainda. "}
            As aulas, dias e horários vêm sozinhos do cadastro de aulas e turmas.
          </Info>
        </div>
      );
    case "horarios":
      return (
        <div className={grade}>
          <TituloTexto s={s} muda={muda} />
          <Info>Os dias e horários vêm sozinhos das Configurações (horário de funcionamento). O dia de hoje fica em destaque.</Info>
        </div>
      );
    case "localizacao":
      return (
        <div className={grade}>
          <Campo rotulo="Título">
            <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} />
          </Campo>
          <Campo rotulo="Endereço" dica={dados.endereco ? "Vazio = usa o endereço das Configurações." : "Rua, número, bairro e cidade."}>
            <Entrada valor={s.endereco} aoMudar={(endereco) => muda({ endereco })} placeholder={dados.endereco ?? ""} />
          </Campo>
          <Alternar ligado={s.mostrarMapa} aoMudar={(mostrarMapa) => muda({ mostrarMapa })} titulo="Mostrar o mapa" />
        </div>
      );
    case "chamada":
      return (
        <div className={grade}>
          <TituloTexto s={s} muda={muda} />
          <Campo rotulo="Texto do botão" dica="O botão leva para os planos.">
            <Entrada valor={s.botao} aoMudar={(botao) => muda({ botao })} />
          </Campo>
        </div>
      );
    case "contato":
      return (
        <div className={grade}>
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
            <Entrada valor={s.texto} aoMudar={(texto) => muda({ texto })} />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Instagram">
              <Entrada valor={s.instagram} aoMudar={(instagram) => muda({ instagram })} placeholder="@seuperfil" />
            </Campo>
            <Campo rotulo="Facebook">
              <Entrada valor={s.facebook} aoMudar={(facebook) => muda({ facebook })} placeholder="suapagina" />
            </Campo>
            <Campo rotulo="YouTube">
              <Entrada valor={s.youtube} aoMudar={(youtube) => muda({ youtube })} placeholder="@seucanal" />
            </Campo>
            <Campo rotulo="TikTok">
              <Entrada valor={s.tiktok} aoMudar={(tiktok) => muda({ tiktok })} placeholder="@seuperfil" />
            </Campo>
          </div>
          <Campo rotulo="Site (opcional)">
            <Entrada valor={s.site} aoMudar={(site) => muda({ site })} placeholder="www.seusite.com.br" />
          </Campo>
          <Campo rotulo="Rodapé" dica="Ex.: nome da empresa, CNPJ, endereço.">
            <AreaTexto valor={s.rodape} aoMudar={(rodape) => muda({ rodape })} linhas={2} />
          </Campo>
        </div>
      );
  }
}

function FormTopo({ s, muda, dados }: { s: SecaoDo<"topo">; muda: (p: Partial<SecaoDo<"topo">>) => void; dados: DadosPagina }) {
  const destaqueFora = s.destaque.trim() && !s.titulo.toLowerCase().includes(s.destaque.trim().toLowerCase());
  return (
    <div className={grade}>
      <div className="flex gap-3">
        <Campo rotulo="Logo">
          <CampoArquivo pequeno url={s.logo} aoMudar={(logo) => muda({ logo })} />
        </Campo>
        <div className="flex min-w-0 flex-1 flex-col justify-end gap-2 pb-1">
          <span className="text-[11.5px] text-slate-500">Sem logo, aparece a marca padrão do sistema.</span>
          <Alternar ligado={s.mostrarNome} aoMudar={(mostrarNome) => muda({ mostrarNome })} titulo={`Mostrar o nome "${dados.nome}"`} />
        </div>
      </div>
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
      <Campo rotulo="Foto de capa (fica atrás do título)" dica="De preferência deitada, 1600 × 900.">
        <CampoArquivo url={s.capa} aoMudar={(capa) => muda({ capa })} />
      </Campo>
      {s.capa && (
        <Campo rotulo={`Escurecer a foto: ${s.escurecer}%`} dica="Mais escuro deixa o texto mais fácil de ler.">
          <input type="range" min={0} max={90} step={5} value={s.escurecer} onChange={(e) => muda({ escurecer: Number(e.target.value) })} className="accent-(--ed-2)" />
        </Campo>
      )}
      <Campo rotulo="Posição do texto">
        <Opcoes valor={s.alinhamento} aoMudar={(alinhamento) => muda({ alinhamento })} opcoes={[["esquerda", "À esquerda"], ["centro", "No centro"]]} />
      </Campo>
      {dados.numero && (
        <Alternar
          ligado={s.mostrarNumero}
          aoMudar={(mostrarNumero) => muda({ mostrarNumero })}
          titulo={`Mostrar "${dados.numero.valor} ${dados.numero.rotulo}"`}
          descricao="O número é atualizado sozinho."
        />
      )}
      <Campo rotulo="Frases curtas com ícone (abaixo do texto)">
        <ListaIcones itens={s.selos} aoMudar={(selos) => muda({ selos })} max={4} rotuloNovo="Adicionar frase" />
      </Campo>
      <Campo rotulo="Texto do botão (leva aos planos; vazio = sem botão)">
        <Entrada valor={s.botao} aoMudar={(botao) => muda({ botao })} />
      </Campo>
    </div>
  );
}

function FormPlanos({ s, muda, dados, ondeMudar }: { s: SecaoDo<"planos">; muda: (p: Partial<SecaoDo<"planos">>) => void; dados: DadosPagina; ondeMudar: string | null }) {
  return (
    <div className={grade}>
      <TituloTexto s={s} muda={muda} />
      <Campo rotulo="Planos que aparecem">
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

function TituloTexto({ s, muda }: { s: { titulo: string; texto: string }; muda: (p: { titulo?: string; texto?: string }) => void }) {
  return (
    <>
      <Campo rotulo="Título">
        <Entrada valor={s.titulo} aoMudar={(titulo) => muda({ titulo })} />
      </Campo>
      <Campo rotulo="Texto abaixo do título (opcional)">
        <AreaTexto valor={s.texto} aoMudar={(texto) => muda({ texto })} linhas={2} />
      </Campo>
    </>
  );
}

function ListaIcones({
  itens,
  aoMudar,
  max,
  rotuloNovo,
}: {
  itens: { icone: IdIcone; texto: string }[];
  aoMudar: (v: { icone: IdIcone; texto: string }[]) => void;
  max: number;
  rotuloNovo: string;
}) {
  return (
    <Lista itens={itens} aoMudar={aoMudar} novo={() => ({ icone: "check" as IdIcone, texto: "" })} max={max} rotuloNovo={rotuloNovo}>
      {(x, m) => (
        <div className="flex items-center gap-2">
          <SeletorIcone valor={x.icone} aoMudar={(icone) => m({ icone })} />
          <input className={classeEntrada} value={x.texto} placeholder="Escreva aqui" onChange={(e) => m({ texto: e.target.value })} />
        </div>
      )}
    </Lista>
  );
}

function Info({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-sky-500/10 px-2.5 py-2 text-[12.5px] text-sky-100">{children}</p>;
}
