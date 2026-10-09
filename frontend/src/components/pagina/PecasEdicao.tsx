import {
  AlignHorizontalJustifyCenter,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpToLine,
  CopyPlus,
  ImageUp,
  Monitor,
  MousePointerClick,
  Shapes,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
  Wand2,
} from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as PonteiroReact, type ReactNode } from "react";
import {
  LARGURA_CEL,
  LARGURA_PC,
  MARGEM,
  MAX_PECAS,
  alturaSozinha,
  nomesPecas,
  novaPeca,
  novoId,
  paraCelular,
  paraComputador,
  type Caixa,
  type Modo,
  type Peca,
  type Secao,
  type TipoPeca,
} from "../../lib/pagina";
import { Alca, Alternar, AreaTexto, BotaoIcone, Campo, CampoArquivo, CampoCor, classeBotaoEd, classeEntrada, Entrada, mudarOrdem, Opcoes, Ordenavel, SeletorIcone, useItemOrdenavel } from "./campos";
import { classeCamada, classePeca, PecaVisual, varsPeca } from "./Pecas";

// Peças livres no editor: na prévia, arrastar para mover, puxar os quadradinhos
// para esticar (CamadaEdicao); ao lado, a lista de peças e as opções da peça
// escolhida (FormPecas). O desenho das peças é o mesmo da página (Pecas.tsx).
//
// Dá para escolher várias peças (Shift+clique, caixinhas da lista, "Escolher
// todas" ou, na Tela livre, um laço arrastando no espaço vazio) e arrastar
// todas juntas.

const larguraDo = (modo: Modo) => (modo === "pc" ? LARGURA_PC : LARGURA_CEL);
const arredonda = (c: Caixa): Caixa => ({ x: Math.round(c.x), y: Math.round(c.y), l: Math.round(c.l), a: Math.round(c.a) });
const MINIMO = 8;

// ---------- Na prévia ----------

type Guia = { x: number } | { y: number };

// Puxar um quadradinho: [hx, hy] diz o lado (-1 = esquerda/cima, 1 = direita/baixo, 0 = não mexe).
function esticar(c: Caixa, [hx, hy]: [number, number], dx: number, dy: number, proporcao: boolean): Caixa {
  let { x, y, l, a } = c;
  if (hx === 1) l = Math.max(MINIMO, c.l + dx);
  if (hx === -1) {
    l = Math.max(MINIMO, c.l - dx);
    x = c.x + c.l - l;
  }
  if (proporcao && hx !== 0 && hy !== 0) {
    a = (l * c.a) / c.l;
    if (hy === -1) y = c.y + c.a - a;
    return { x, y, l, a };
  }
  if (hy === 1) a = Math.max(MINIMO, c.a + dy);
  if (hy === -1) {
    a = Math.max(MINIMO, c.a - dy);
    y = c.y + c.a - a;
  }
  return { x, y, l, a };
}

// Ao mover, a peça "gruda" nas bordas da tela, na margem, no meio e nas outras peças.
function grudar(c: Caixa, outras: Caixa[], largura: number, alturaSecao: number, folga: number): { caixa: Caixa; guias: Guia[] } {
  const perto = (pontos: number[], linhas: number[]) => {
    let melhor: { d: number; linha: number } | null = null;
    for (const p of pontos) for (const linha of linhas) if (Math.abs(linha - p) < folga && (!melhor || Math.abs(linha - p) < Math.abs(melhor.d))) melhor = { d: linha - p, linha };
    return melhor;
  };
  const gx = perto([c.x, c.x + c.l / 2, c.x + c.l], [0, MARGEM, largura / 2, largura - MARGEM, largura, ...outras.flatMap((o) => [o.x, o.x + o.l / 2, o.x + o.l])]);
  const gy = perto([c.y, c.y + c.a / 2, c.y + c.a], [0, alturaSecao / 2, alturaSecao, ...outras.flatMap((o) => [o.y, o.y + o.a / 2, o.y + o.a])]);
  const guias: Guia[] = [];
  if (gx) guias.push({ x: gx.linha });
  if (gy) guias.push({ y: gy.linha });
  return { caixa: { ...c, x: c.x + (gx?.d ?? 0), y: c.y + (gy?.d ?? 0) }, guias };
}

const cursores: Record<string, string> = { "-1,-1": "nwse-resize", "1,1": "nwse-resize", "1,-1": "nesw-resize", "-1,1": "nesw-resize", "0,-1": "ns-resize", "0,1": "ns-resize", "-1,0": "ew-resize", "1,0": "ew-resize" };
const todasAsAlcas: [number, number][] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
const alcasDosLados: [number, number][] = [[-1, 0], [1, 0]];

const andou = (c: Caixa, dx: number, dy: number): Caixa => ({ ...c, x: c.x + dx, y: c.y + dy });
const encostam = (a: Caixa, b: Caixa) => a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.a && b.y < a.y + a.a;

// Depois de arrastar, o navegador ainda manda um "clique": ele não deve chegar à página
// (senão a seção tiraria a escolha das peças).
function engolirClique() {
  const parar = (e: MouseEvent) => e.stopPropagation();
  window.addEventListener("click", parar, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", parar, { capture: true }), 0);
}

type AoVivo =
  | { tipo: "esticar"; id: string; caixa: Caixa }
  | { tipo: "mover"; ids: string[]; dx: number; dy: number; guias: Guia[] };

export function CamadaEdicao({
  secao,
  modo,
  selecionadas,
  aoSelecionar,
  aoMudar,
  escala,
}: {
  secao: Secao;
  modo: Modo;
  selecionadas: string[]; // peças escolhidas (se forem desta seção)
  aoSelecionar: (pecas: string[]) => void;
  aoMudar: (pecas: Peca[]) => void;
  escala: number; // zoom da prévia: os quadradinhos compensam para não encolher
}) {
  const pecas = secao.pecas ?? [];
  const camada = useRef<HTMLDivElement>(null);
  const [aoVivo, setAoVivo] = useState<AoVivo | null>(null);
  const [laco, setLaco] = useState<Caixa | null>(null);
  const telaLivre = secao.tipo === "livre";

  // área das peças na tela e o tamanho de uma unidade
  function medidas() {
    const area = camada.current!.getBoundingClientRect();
    const u = area.width / larguraDo(modo);
    // onde cada peça está de verdade (texto e botão têm a altura do conteúdo)
    const medir = (id: string): Caixa | null => {
      const r = camada.current?.querySelector(`[data-peca="${id}"]`)?.getBoundingClientRect();
      return r ? { x: (r.left - area.left) / u, y: (r.top - area.top) / u, l: r.width / u, a: r.height / u } : null;
    };
    return { area, u, medir };
  }

  function ouvir(mover: (ev: PointerEvent) => void, soltar: () => void) {
    const fim = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", fim);
      window.removeEventListener("pointercancel", fim);
      document.body.style.userSelect = "";
      soltar();
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", fim);
    window.addEventListener("pointercancel", fim);
  }

  function comecar(e: PonteiroReact, p: Peca, alca: [number, number] | null) {
    if (e.button !== 0 || !camada.current) return;
    e.stopPropagation();
    const juntar = e.shiftKey || e.ctrlKey || e.metaKey;
    // quais peças este gesto move
    let ids = selecionadas;
    if (alca) ids = [p.id];
    else if (juntar) {
      ids = ids.includes(p.id) ? ids.filter((x) => x !== p.id) : [...ids, p.id];
      aoSelecionar(ids);
      e.preventDefault();
      if (!ids.includes(p.id)) return;
    } else if (!ids.includes(p.id)) ids = [p.id];
    if (!juntar && ids !== selecionadas) aoSelecionar(ids);

    const { area, u, medir } = medidas();
    const inicio = p[modo];
    const alturaReal = medir(p.id)?.a ?? inicio.a;
    const outras = pecas.filter((o) => !ids.includes(o.id)).flatMap((o) => medir(o.id) ?? []);
    const [x0, y0] = [e.clientX, e.clientY];
    let moveu = false;
    let esticada: Caixa | null = null;
    let passo: { dx: number; dy: number } | null = null;
    // num texto ou botão sozinho, o clique serve para digitar; no resto, evita selecionar a página ao arrastar
    if (alca || ids.length > 1 || !alturaSozinha(p)) {
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur?.();
    }

    ouvir(
      (ev) => {
        if (!moveu) {
          if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
          moveu = true;
          document.body.style.userSelect = "none"; // só agora: antes disso o clique ainda pode ser para digitar
          (document.activeElement as HTMLElement | null)?.blur?.();
          window.getSelection()?.removeAllRanges();
        }
        const dx = (ev.clientX - x0) / u;
        const dy = (ev.clientY - y0) / u;
        if (alca) {
          const manter = (p.tipo === "imagem" || p.tipo === "icone") !== ev.shiftKey; // foto e ícone não deformam (Shift solta)
          esticada = arredonda(esticar(inicio, alca, dx, dy, manter));
          setAoVivo({ tipo: "esticar", id: p.id, caixa: esticada });
        } else {
          const g = grudar({ ...andou(inicio, dx, dy), a: alturaReal }, outras, larguraDo(modo), area.height / u, 6 / u);
          passo = { dx: Math.round(g.caixa.x - inicio.x), dy: Math.round(g.caixa.y - inicio.y) };
          setAoVivo({ tipo: "mover", ids, ...passo, guias: g.guias });
        }
      },
      () => {
        const [final, andar] = [esticada, passo];
        if (final) aoMudar(pecas.map((o) => (o.id === p.id ? { ...o, [modo]: final } : o)));
        else if (andar) aoMudar(pecas.map((o) => (ids.includes(o.id) ? { ...o, [modo]: andou(o[modo], andar.dx, andar.dy) } : o)));
        // clique simples numa peça do grupo: fica só ela
        else if (!juntar && selecionadas.length > 1) aoSelecionar([p.id]);
        setAoVivo(null);
      },
    );
  }

  // Tela livre: arrastar no espaço vazio desenha um laço e escolhe as peças dentro dele.
  function comecarLaco(e: PonteiroReact) {
    if (e.button !== 0 || e.target !== e.currentTarget || !camada.current) return;
    const { area, u, medir } = medidas();
    const ponto = (ev: { clientX: number; clientY: number }) => [(ev.clientX - area.left) / u, (ev.clientY - area.top) / u];
    const [x0, y0] = ponto(e);
    let caixa: Caixa | null = null;
    document.body.style.userSelect = "none";
    (document.activeElement as HTMLElement | null)?.blur?.();
    ouvir(
      (ev) => {
        const [x, y] = ponto(ev);
        if (!caixa && Math.hypot(x - x0, y - y0) * u < 4) return;
        caixa = { x: Math.min(x0, x), y: Math.min(y0, y), l: Math.abs(x - x0), a: Math.abs(y - y0) };
        setLaco(caixa);
      },
      () => {
        const final = caixa;
        setLaco(null);
        if (!final) return; // clique simples: a seção cuida (tira a escolha)
        aoSelecionar(pecas.filter((p) => encostam(final, medir(p.id) ?? p[modo])).map((p) => p.id));
        engolirClique();
      },
    );
  }

  // teclado: setas movem, Delete apaga, Ctrl+A escolhe todas, Esc solta
  useEffect(() => {
    if (pecas.length === 0) return;
    function tecla(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      if (alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))) return;
      const passo = e.shiftKey ? 10 : 1;
      const andar: Record<string, [number, number]> = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] };
      const escolhida = (p: Peca) => selecionadas.includes(p.id);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a" && (telaLivre || selecionadas.length > 0)) aoSelecionar(pecas.map((p) => p.id));
      else if (selecionadas.length === 0) return;
      else if (e.key === "Delete" || e.key === "Backspace") {
        aoMudar(pecas.filter((p) => !escolhida(p)));
        aoSelecionar([]);
      } else if (andar[e.key]) aoMudar(pecas.map((p) => (escolhida(p) ? { ...p, [modo]: andou(p[modo], ...andar[e.key]) } : p)));
      else if (e.key === "Escape") aoSelecionar([]);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  const caixaAoVivo = (p: Peca) => {
    if (aoVivo?.tipo === "esticar" && aoVivo.id === p.id) return { modo, caixa: aoVivo.caixa };
    if (aoVivo?.tipo === "mover" && aoVivo.ids.includes(p.id)) return { modo, caixa: andou(p[modo], aoVivo.dx, aoVivo.dy) };
    return undefined;
  };

  return (
    <div ref={camada} data-camada className={`${telaLivre ? "pointer-events-auto" : "pointer-events-none"} ${classeCamada}`} onPointerDown={telaLivre ? comecarLaco : undefined}>
      {pecas.map((p) => {
        const sel = selecionadas.includes(p.id);
        return (
          <div
            key={p.id}
            data-peca={p.id}
            className={`pointer-events-auto cursor-move outline-sky-400 ${classePeca(p)} ${sel ? "outline-2" : "hover:outline-1 hover:outline-dashed"}`}
            style={varsPeca(p, caixaAoVivo(p))}
            onPointerDown={(e) => comecar(e, p, null)}
            // o navegador tentaria "arrastar o link/texto" e cancelaria o movimento da peça
            onDragStart={(e) => e.preventDefault()}
          >
            <PecaVisual p={p} />
            {sel &&
              selecionadas.length === 1 &&
              (alturaSozinha(p) ? alcasDosLados : todasAsAlcas).map(([hx, hy]) => (
                <span
                  key={`${hx},${hy}`}
                  onPointerDown={(e) => comecar(e, p, [hx, hy])}
                  className="absolute size-2.5 -translate-1/2 rounded-xs border border-sky-500 bg-white"
                  style={{ left: `${(hx + 1) * 50}%`, top: `${(hy + 1) * 50}%`, cursor: cursores[`${hx},${hy}`], zoom: 1 / (escala || 1) }}
                />
              ))}
          </div>
        );
      })}
      {aoVivo?.tipo === "mover" &&
        aoVivo.guias.map((g, i) =>
          "x" in g ? (
            <span key={i} className="pointer-events-none absolute inset-y-0 w-px bg-pink-500" style={{ left: `calc(${g.x}*var(--u))` }} />
          ) : (
            <span key={i} className="pointer-events-none absolute inset-x-0 h-px bg-pink-500" style={{ top: `calc(${g.y}*var(--u))` }} />
          ),
        )}
      {laco && (
        <span
          className="pointer-events-none absolute border border-sky-400 bg-sky-400/15"
          style={{ left: `calc(${laco.x}*var(--u))`, top: `calc(${laco.y}*var(--u))`, width: `calc(${laco.l}*var(--u))`, height: `calc(${laco.a}*var(--u))` }}
        />
      )}
    </div>
  );
}

// ---------- Ao lado ----------

const iconesPecas: Record<TipoPeca, ReactNode> = {
  texto: <Type className="size-3.5" />,
  imagem: <ImageUp className="size-3.5" />,
  botao: <MousePointerClick className="size-3.5" />,
  forma: <Shapes className="size-3.5" />,
  icone: <Sparkles className="size-3.5" />,
};

const resumoDaPeca = (p: Peca) => (p.tipo === "texto" || p.tipo === "botao" ? p.texto.split("\n")[0] : p.tipo === "forma" ? (p.forma === "elipse" ? "Círculo" : "Retângulo") : "");

// Empilha as peças no celular, uma embaixo da outra, na ordem em que aparecem no computador.
export function arrumarNoCelular(pecas: Peca[]): { pecas: Peca[]; altura: number } {
  let y = 24;
  const novas = new Map<string, Caixa>();
  for (const p of [...pecas].sort((a, b) => a.pc.y - b.pc.y || a.pc.x - b.pc.x)) {
    const c = paraCelular(p.pc);
    const x = Math.round((LARGURA_CEL - c.l) / 2);
    // texto e botão: altura estimada pelo tamanho do texto
    let a = c.a;
    if (p.tipo === "botao") a = 48;
    if (p.tipo === "texto") {
      const linhas = p.texto.split("\n").reduce((n, linha) => n + Math.max(1, Math.ceil((linha.length * p.tamanhoCel * 0.54) / c.l)), 0);
      a = Math.ceil(linhas * p.tamanhoCel * 1.15);
    }
    novas.set(p.id, { x, y, l: c.l, a: alturaSozinha(p) ? p.cel.a : a });
    y += a + 18;
  }
  return { pecas: pecas.map((p) => ({ ...p, cel: novas.get(p.id) ?? p.cel })), altura: y + 6 };
}

export function FormPecas({
  secao,
  modo,
  selecionadas,
  aoSelecionar,
  aoMudar,
  aoMudarAlturaCel,
  aoSoltar,
  acompanhar,
  aoAcompanhar,
}: {
  secao: Secao;
  modo: Modo;
  selecionadas: string[];
  aoSelecionar: (pecas: string[]) => void;
  aoMudar: (pecas: Peca[]) => void;
  // só na "Tela livre": acerta a altura do celular depois de arrumar as peças sozinho
  aoMudarAlturaCel?: (altura: number) => void;
  // seções que podem virar Tela livre: transforma título, textos, fotos e botões em peças soltas
  aoSoltar?: () => void;
  acompanhar: boolean; // o celular repete o que é feito no computador
  aoAcompanhar: (v: boolean) => void;
}) {
  const pecas = secao.pecas ?? [];
  const escolhidas = pecas.filter((p) => selecionadas.includes(p.id));
  const atual = escolhidas.length === 1 ? escolhidas[0] : null;
  const muda = (id: string, patch: Partial<Peca>) => aoMudar(pecas.map((p) => (p.id === id ? ({ ...p, ...patch } as Peca) : p)));
  const moverEscolhidas = (dx: number, dy: number) =>
    aoMudar(pecas.map((p) => (selecionadas.includes(p.id) ? { ...p, [modo]: { ...p[modo], x: p[modo].x + dx, y: p[modo].y + dy } } : p)));

  const adicionar = (tipo: TipoPeca) => {
    const meio = secao.tipo === "livre" ? (modo === "pc" ? secao.props.altura : secao.props.alturaCel) / 2 - 40 : 24;
    const nova = novaPeca(tipo, modo, meio);
    aoMudar([...pecas, nova]);
    aoSelecionar([nova.id]);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 rounded-lg bg-sky-500/10 px-2.5 py-2 text-[12.5px] text-sky-100">
        {modo === "pc" ? <Monitor className="mt-0.5 size-3.5 shrink-0" /> : <Smartphone className="mt-0.5 size-3.5 shrink-0" />}
        <span>
          Você está arrumando a versão do <b>{modo === "pc" ? "computador" : "celular"}</b>.{" "}
          {modo === "pc"
            ? acompanhar
              ? "O que você muda aqui o celular acompanha sozinho. Depois confira no celular e acerte o que precisar."
              : "O celular não está acompanhando: o que você muda aqui fica só no computador."
            : "O que você muda aqui fica só no celular; o computador não muda."}
        </span>
      </p>
      <Alternar
        ligado={acompanhar}
        aoMudar={aoAcompanhar}
        titulo="O celular acompanha o computador"
        descricao="Mover ou mudar o tamanho de uma peça no computador faz o mesmo no celular, na proporção da tela."
      />

      {aoSoltar && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[12.5px] text-slate-300">
            Nesta seção, o título, os textos e os botões ficam arrumados sozinhos. Para <b className="text-white">arrastar cada um para onde quiser</b>, solte tudo em
            peças.
          </p>
          <button type="button" className={`${classeBotaoEd(true, true)} w-fit`} onClick={aoSoltar}>
            <Wand2 className="size-3.5" /> Soltar tudo em peças livres
          </button>
        </div>
      )}

      <Campo rotulo="Adicionar uma peça" dica="Ela aparece na prévia. Arraste para o lugar e puxe os quadradinhos para mudar o tamanho." grupo>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(nomesPecas) as TipoPeca[]).map((t) => (
            <button key={t} type="button" disabled={pecas.length >= MAX_PECAS} className={classeBotaoEd(false, true)} onClick={() => adicionar(t)}>
              {iconesPecas[t]} {nomesPecas[t]}
            </button>
          ))}
        </div>
      </Campo>

      {pecas.length > 0 && (
        <Campo
          rotulo={`Peças desta seção (${pecas.length})`}
          dica="Marque as caixinhas para escolher várias e arrastar todas juntas na prévia (ou segure Shift e clique nelas). A de baixo na lista fica na frente das outras."
          grupo
        >
          <div className="mb-1 flex flex-wrap gap-1.5">
            <button type="button" className={classeBotaoEd(false, true)} onClick={() => aoSelecionar(pecas.map((p) => p.id))}>
              Escolher todas
            </button>
            {selecionadas.length > 0 && (
              <button type="button" className={classeBotaoEd(false, true)} onClick={() => aoSelecionar([])}>
                Soltar a escolha
              </button>
            )}
          </div>
          <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-0.5">
            <Ordenavel ids={pecas.map((p) => p.id)} aoMover={(de, para) => aoMudar(mudarOrdem(pecas, de, para))}>
              {pecas.map((p) => (
                <LinhaPeca
                  key={p.id}
                  p={p}
                  escolhida={selecionadas.includes(p.id)}
                  aoMarcar={() => aoSelecionar(selecionadas.includes(p.id) ? selecionadas.filter((x) => x !== p.id) : [...selecionadas, p.id])}
                  aoEscolher={() => aoSelecionar(atual?.id === p.id ? [] : [p.id])}
                  aoApagar={() => aoMudar(pecas.filter((x) => x.id !== p.id))}
                />
              ))}
            </Ordenavel>
          </div>
        </Campo>
      )}

      {aoMudarAlturaCel && pecas.length > 1 && (
        <button
          type="button"
          className={`${classeBotaoEd(false, true)} w-fit`}
          onClick={() => {
            const r = arrumarNoCelular(pecas);
            aoMudar(r.pecas);
            aoMudarAlturaCel(r.altura);
          }}
        >
          <Wand2 className="size-3.5" /> Arrumar o celular sozinho (uma embaixo da outra)
        </button>
      )}

      {escolhidas.length > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-(--ed-2)/50 bg-white/[0.03] p-3">
          <span className="text-sm font-semibold text-white">{escolhidas.length} peças escolhidas</span>
          <p className="text-[12.5px] text-slate-400">
            Na prévia, arraste qualquer uma delas: todas andam juntas. As setas do teclado também movem (com Shift, de 10 em 10).
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] text-slate-400">Mover 10:</span>
            <BotaoIcone rotulo="Para cima" onClick={() => moverEscolhidas(0, -10)}>
              <ArrowUp className="size-3.5" />
            </BotaoIcone>
            <BotaoIcone rotulo="Para baixo" onClick={() => moverEscolhidas(0, 10)}>
              <ArrowDown className="size-3.5" />
            </BotaoIcone>
            <BotaoIcone rotulo="Para a esquerda" onClick={() => moverEscolhidas(-10, 0)}>
              <ArrowLeft className="size-3.5" />
            </BotaoIcone>
            <BotaoIcone rotulo="Para a direita" onClick={() => moverEscolhidas(10, 0)}>
              <ArrowRight className="size-3.5" />
            </BotaoIcone>
            <button
              type="button"
              className={`${classeBotaoEd(false, true)} ml-auto text-red-300`}
              onClick={() => {
                aoMudar(pecas.filter((p) => !selecionadas.includes(p.id)));
                aoSelecionar([]);
              }}
            >
              <Trash2 className="size-3.5" /> Apagar as {escolhidas.length}
            </button>
          </div>
        </div>
      )}

      {atual && (
        <div className="flex flex-col gap-3 rounded-xl border border-(--ed-2)/50 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
              {iconesPecas[atual.tipo]} {nomesPecas[atual.tipo]}
            </span>
            <div className="flex items-center">
              <BotaoIcone rotulo="Trazer para a frente" onClick={() => aoMudar([...pecas.filter((p) => p.id !== atual.id), atual])}>
                <ArrowUpToLine className="size-3.5" />
              </BotaoIcone>
              <BotaoIcone rotulo="Mandar para trás" onClick={() => aoMudar([atual, ...pecas.filter((p) => p.id !== atual.id)])}>
                <ArrowDownToLine className="size-3.5" />
              </BotaoIcone>
              <BotaoIcone
                rotulo="Duplicar"
                disabled={pecas.length >= MAX_PECAS}
                onClick={() => {
                  const desloca = (c: Caixa) => ({ ...c, x: c.x + 16, y: c.y + 16 });
                  const copia = { ...structuredClone(atual), id: novoId(), pc: desloca(atual.pc), cel: desloca(atual.cel) };
                  aoMudar([...pecas, copia]);
                  aoSelecionar([copia.id]);
                }}
              >
                <CopyPlus className="size-3.5" />
              </BotaoIcone>
              <BotaoIcone rotulo="Apagar (Delete)" perigo onClick={() => aoMudar(pecas.filter((p) => p.id !== atual.id))}>
                <Trash2 className="size-3.5" />
              </BotaoIcone>
            </div>
          </div>
          <OpcoesDaPeca p={atual} modo={modo} muda={(patch) => muda(atual.id, patch)} />
          <Medidas p={atual} modo={modo} muda={(caixa) => muda(atual.id, { [modo]: caixa })} />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={classeBotaoEd(false, true)}
              onClick={() => muda(atual.id, { [modo]: { ...atual[modo], x: Math.round((larguraDo(modo) - atual[modo].l) / 2) } })}
            >
              <AlignHorizontalJustifyCenter className="size-3.5" /> Pôr no meio da tela
            </button>
            <button
              type="button"
              className={classeBotaoEd(false, true)}
              // as duas caixas mudam juntas: o celular não "acompanha" esta troca
              onClick={() => muda(atual.id, modo === "cel" ? { cel: paraCelular(atual.pc) } : { pc: paraComputador(atual.cel), cel: { ...atual.cel } })}
            >
              {modo === "cel" ? "Copiar o lugar do computador" : "Copiar o lugar do celular"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LinhaPeca({ p, escolhida, aoMarcar, aoEscolher, aoApagar }: { p: Peca; escolhida: boolean; aoMarcar: () => void; aoEscolher: () => void; aoApagar: () => void }) {
  const { caixa, alca, arrastando } = useItemOrdenavel(p.id);
  return (
    <div
      {...caixa}
      className={`flex items-center gap-1 rounded-lg border py-1 pr-1 pl-0.5 ${arrastando ? "border-(--ed-2) bg-[#131a2c] shadow-xl" : escolhida ? "border-(--ed-2)/70 bg-white/[0.06]" : "border-white/[0.07] bg-white/[0.02]"}`}
    >
      <Alca alca={alca} />
      <input type="checkbox" checked={escolhida} onChange={aoMarcar} aria-label="Escolher esta peça" className="size-4 shrink-0 accent-(--ed-2)" />
      <button type="button" onClick={aoEscolher} className="ml-1 flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] text-slate-200">
        <span className="text-(--ed-2)">{iconesPecas[p.tipo]}</span>
        <span className="font-medium">{nomesPecas[p.tipo]}</span>
        <span className="truncate text-slate-500">{resumoDaPeca(p)}</span>
      </button>
      <BotaoIcone rotulo="Apagar" perigo onClick={aoApagar}>
        <Trash2 className="size-3.5" />
      </BotaoIcone>
    </div>
  );
}

function Regua({ rotulo, valor, min, max, passo = 1, aoMudar }: { rotulo: string; valor: number; min: number; max: number; passo?: number; aoMudar: (v: number) => void }) {
  return (
    <Campo rotulo={`${rotulo}: ${valor}`}>
      <input type="range" min={min} max={max} step={passo} value={valor} onChange={(e) => aoMudar(Number(e.target.value))} className="accent-(--ed-2)" />
    </Campo>
  );
}

function CorOpcional({ rotulo, automatica, valor, sugestao, aoMudar }: { rotulo: string; automatica: string; valor?: string; sugestao: string; aoMudar: (v: string | undefined) => void }) {
  return (
    <Campo rotulo={rotulo} grupo>
      {valor ? (
        <CampoCor valor={valor} aoMudar={aoMudar} aoLimpar={() => aoMudar(undefined)} />
      ) : (
        <div className="flex items-center gap-2 text-[13px] text-slate-300">
          {automatica}
          <button type="button" className={classeBotaoEd(false, true)} onClick={() => aoMudar(sugestao)}>
            Escolher uma cor
          </button>
        </div>
      )}
    </Campo>
  );
}

function OpcoesDaPeca({ p, modo, muda }: { p: Peca; modo: Modo; muda: (patch: Partial<Peca>) => void }) {
  // "cor: undefined" precisa sumir do objeto (senão vira cor inválida ao reabrir)
  const semVazios = (patch: Record<string, unknown>) => muda(patch as Partial<Peca>);
  const comum = <Regua rotulo="Transparência (100 = sem)" valor={p.opacidade ?? 100} min={10} max={100} passo={5} aoMudar={(opacidade) => muda({ opacidade })} />;
  switch (p.tipo) {
    case "texto":
      return (
        <>
          <Campo rotulo="Texto" dica="Também dá para clicar no texto na prévia e digitar ali.">
            <AreaTexto valor={p.texto} aoMudar={(texto) => muda({ texto })} linhas={3} />
          </Campo>
          {modo === "pc" ? (
            <Regua rotulo="Tamanho da letra no computador" valor={p.tamanho} min={10} max={160} aoMudar={(tamanho) => muda({ tamanho })} />
          ) : (
            <Regua rotulo="Tamanho da letra no celular" valor={p.tamanhoCel} min={10} max={90} aoMudar={(tamanhoCel) => muda({ tamanhoCel })} />
          )}
          <Campo rotulo="Posição do texto" grupo>
            <Opcoes valor={p.alinhar} aoMudar={(alinhar) => muda({ alinhar })} opcoes={[["esquerda", "Esquerda"], ["centro", "Centro"], ["direita", "Direita"]]} />
          </Campo>
          <Alternar ligado={p.titulo} aoMudar={(titulo) => muda({ titulo })} titulo="Letra dos títulos" />
          <Alternar ligado={p.negrito} aoMudar={(negrito) => muda({ negrito })} titulo="Negrito" />
          <CorOpcional rotulo="Cor" automatica="A dos títulos" valor={p.cor} sugestao="#ffffff" aoMudar={(cor) => semVazios({ cor })} />
          {comum}
        </>
      );
    case "imagem":
      return (
        <>
          <Campo rotulo="Foto" grupo>
            <CampoArquivo url={p.imagem} aoMudar={(imagem) => muda({ imagem })} />
          </Campo>
          <Regua rotulo="Cantos arredondados" valor={p.raio} min={0} max={200} passo={2} aoMudar={(raio) => muda({ raio })} />
          <Alternar ligado={!!p.inteira} aoMudar={(inteira) => muda({ inteira })} titulo="Mostrar a foto inteira" descricao="Desligado, a foto preenche a peça e pode cortar as beiradas." />
          {comum}
        </>
      );
    case "botao":
      return (
        <>
          <Campo rotulo="Texto do botão">
            <Entrada valor={p.texto} aoMudar={(texto) => muda({ texto })} maxLength={60} />
          </Campo>
          <Campo rotulo="Para onde o botão leva" dica="#planos leva aos planos e #contato ao contato. Também pode ser um endereço https://...">
            <Entrada valor={p.alvo} aoMudar={(alvo) => muda({ alvo })} placeholder="#planos" />
          </Campo>
          <Alternar ligado={!!p.simples} aoMudar={(simples) => muda({ simples })} titulo="Botão discreto (sem cor)" />
          {comum}
        </>
      );
    case "forma":
      return (
        <>
          <Campo rotulo="Formato" grupo>
            <Opcoes valor={p.forma} aoMudar={(forma) => muda({ forma })} opcoes={[["retangulo", "Retângulo"], ["elipse", "Círculo"]]} />
          </Campo>
          <CorOpcional rotulo="Cor" automatica="As cores da marca" valor={p.cor} sugestao="#7c3aed" aoMudar={(cor) => semVazios(cor ? { cor } : { cor: undefined, cor2: undefined })} />
          {p.cor && <CorOpcional rotulo="Segunda cor (degradê)" automatica="Sem degradê" valor={p.cor2} sugestao="#ec4899" aoMudar={(cor2) => semVazios({ cor2 })} />}
          {p.forma === "retangulo" && <Regua rotulo="Cantos arredondados" valor={p.raio} min={0} max={200} passo={2} aoMudar={(raio) => muda({ raio })} />}
          {comum}
        </>
      );
    case "icone":
      return (
        <>
          <Campo rotulo="Ícone" grupo>
            <SeletorIcone valor={p.icone} aoMudar={(icone) => muda({ icone })} />
          </Campo>
          <CorOpcional rotulo="Cor" automatica="A cor de destaque" valor={p.cor} sugestao="#ffffff" aoMudar={(cor) => semVazios({ cor })} />
          {comum}
        </>
      );
  }
}

// Lugar e tamanho em números (para acertar no detalhe).
function Medidas({ p, modo, muda }: { p: Peca; modo: Modo; muda: (c: Caixa) => void }) {
  const c = p[modo];
  const campos: [keyof Caixa, string][] = alturaSozinha(p) ? [["x", "Esquerda"], ["y", "Topo"], ["l", "Largura"]] : [["x", "Esquerda"], ["y", "Topo"], ["l", "Largura"], ["a", "Altura"]];
  return (
    <Campo rotulo={`Lugar e tamanho no ${modo === "pc" ? "computador (tela de 1200)" : "celular (tela de 390)"}`} grupo>
      <div className="grid grid-cols-4 gap-1.5">
        {campos.map(([k, nome]) => (
          <label key={k} className="flex flex-col gap-0.5 text-[10.5px] text-slate-500">
            {nome}
            <input
              type="number"
              className={`${classeEntrada} h-8 px-2 text-[13px]`}
              value={c[k]}
              onChange={(e) => {
                const v = Math.round(Number(e.target.value));
                if (Number.isFinite(v)) muda({ ...c, [k]: k === "l" || k === "a" ? Math.max(MINIMO, v) : v });
              }}
            />
          </label>
        ))}
      </div>
    </Campo>
  );
}
