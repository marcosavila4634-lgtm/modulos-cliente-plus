import { ArrowDown, ArrowUp, Check, ChevronDown, Clock, CopyPlus, ExternalLink, EyeOff, Gift, MapPin, MessageCircle, Quote, Sparkles, Star, Trash2, Users } from "lucide-react";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import {
  catalogo,
  densidades,
  enderecoSeguro,
  espacos,
  fontes,
  icones,
  larguras,
  linkZap,
  moeda,
  raios,
  tamanhosTitulo,
  type DadosPagina,
  type Estilo,
  type IdIcone,
  type PaginaConfig,
  type PlanoPagina,
  type PropsSecao,
  type Secao,
  type Tema,
} from "../../lib/pagina";
import { contraste, ehEscura, mistura, rgba, sobreACor } from "../../lib/pagina-cores";
import { CamadaPecas, classeCamada } from "./Pecas";
import { EdicaoTexto, Txt, useEditando } from "./Texto";

// Desenha a página pública de qualquer módulo a partir do tema e das seções
// (lib/pagina.ts). Usada na página pública de verdade e na prévia do editor.
//
// Os tamanhos seguem a LARGURA DA PÁGINA (container queries @xl/@3xl/@5xl),
// não a da tela: assim a prévia "celular" dentro do editor fica igual ao
// celular de verdade.
//
// As cores chegam por variáveis CSS (--pg-*). A página define as do tema e
// cada seção pode trocar as suas (estilo da seção): o conteúdo só usa as
// variáveis, então acompanha o fundo que o dono escolher.

export type Edicao = {
  selecionada: string | null;
  // onde: se o clique foi num texto (para digitar ali) ou numa peça livre
  aoSelecionar: (id: string, onde: { texto: boolean; peca: string | null }) => void;
  // digitar direto na prévia: caminho = "titulo", "itens/<id>/texto" ou "pecas/<id>/texto"
  aoEditarTexto?: (secao: string, caminho: string, valor: string) => void;
  // peças livres da seção, com arrastar e esticar (PecasEdicao.tsx)
  camada?: (secao: Secao) => ReactNode;
  // linhas mostrando a borda da tela e a margem segura
  margens?: boolean;
  // a prévia é desenhada menor (zoom); os botões da seção compensam para não encolher
  escala?: number;
  acoes?: {
    mover: (id: string, passo: number) => void;
    duplicar: (id: string) => void;
    esconder: (id: string) => void;
    apagar: (id: string) => void;
  };
};

export function PaginaPublica({
  pagina,
  dados,
  aoEscolherPlano,
  edicao,
  children,
}: {
  pagina: PaginaConfig;
  dados: DadosPagina;
  aoEscolherPlano: (p: PlanoPagina) => void;
  // só no editor: clicar numa seção seleciona (links e botões não funcionam)
  edicao?: Edicao;
  // ex.: janela de checkout (herda as cores da página)
  children?: ReactNode;
}) {
  const visiveis = pagina.secoes.filter((s) => s.visivel);
  return (
    <div className="@container relative min-h-full bg-(--pg-fundo) font-sans text-(--pg-texto)" style={variaveis(pagina.tema)}>
      {visiveis.map((s, i) => (
        <Bloco key={s.id} secao={s} edicao={edicao} primeira={i === 0} ultima={i === visiveis.length - 1}>
          <Moldura tema={pagina.tema} secao={s} camada={edicao?.camada}>
            <Conteudo s={s} d={dados} editando={!!edicao} aoEscolherPlano={aoEscolherPlano} />
          </Moldura>
        </Bloco>
      ))}
      {edicao?.margens && <Margens />}
      {children}
    </div>
  );
}

// ---------- Tema → variáveis CSS ----------

export function variaveis(t: Tema): CSSProperties {
  const c = t.cores;
  const escuro = ehEscura(c.fundo);
  const r = raios[t.raio] ?? raios.redondo;
  return {
    "--pg-fundo": c.fundo,
    "--pg-card": c.cartao,
    "--pg-linha": c.borda,
    "--pg-titulo": c.titulo,
    "--pg-texto": c.texto,
    "--pg-suave": c.suave,
    "--pg-cor1": c.cor1,
    "--pg-cor2": c.cor2,
    "--pg-sobre": c.sobre,
    ...destaque(c.cor2, escuro),
    "--pg-fonte": (fontes[t.fonte] ?? fontes.outfit).familia,
    "--pg-raio": r.card,
    "--pg-raio-p": r.pequeno,
    "--pg-raio-botao": r.botao,
    "--pg-y": `${(densidades[t.densidade] ?? densidades.padrao).espaco}px`,
    "--pg-largura": larguras.normal.css,
    "--pg-t": "1",
    colorScheme: escuro ? "dark" : "light",
  } as CSSProperties;
}

// Tons que saem da cor de destaque (texto colorido, fundo e borda dos selos).
function destaque(cor: string, fundoEscuro: boolean): Record<string, string> {
  return {
    "--pg-realce": fundoEscuro ? mistura(cor, "#ffffff", 0.3) : mistura(cor, "#000000", 0.15),
    "--pg-cor-fundo": rgba(cor, fundoEscuro ? 0.14 : 0.1),
    "--pg-cor-borda": rgba(cor, 0.55),
    "--pg-sombra": rgba(cor, 0.8),
  };
}

const FUNDO_ESCURO = "#0b0e15";

// Estilo da seção → fundo e variáveis que valem só dentro dela.
function aparencia(tema: Tema, e: Estilo): { style: CSSProperties; foto?: string; pelicula: number } {
  const c = tema.cores;
  const v: Record<string, string> = {};
  const foto = e.fundo === "imagem" ? enderecoSeguro(e.imagem) : undefined;
  let cor: string | null = null;
  let cor2: string | null = null;
  if (e.fundo === "alternado") cor = c.fundoAlt;
  else if (e.fundo === "escuro" || e.fundo === "imagem") cor = FUNDO_ESCURO;
  else if (e.fundo === "marca") [cor, cor2] = [c.cor1, c.cor2];
  else if (e.fundo === "cor") cor = e.cor ?? c.fundoAlt;
  else if (e.fundo === "degrade") [cor, cor2] = [e.cor ?? c.cor1, e.cor2 ?? c.cor2];

  let fundoEscuro = ehEscura(c.fundo);
  if (cor) {
    const media = cor2 ? mistura(cor, cor2, 0.5) : cor;
    fundoEscuro = foto ? true : ehEscura(media);
    v["--pg-fundo"] = media;
    if (e.fundo !== "alternado") {
      v["--pg-titulo"] = fundoEscuro ? "#ffffff" : "#0f172a";
      v["--pg-texto"] = fundoEscuro ? "rgba(255,255,255,0.86)" : "#334155";
      v["--pg-suave"] = fundoEscuro ? "rgba(255,255,255,0.66)" : "#64748b";
      v["--pg-card"] = fundoEscuro ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)";
      v["--pg-linha"] = fundoEscuro ? "rgba(255,255,255,0.17)" : "rgba(15,23,42,0.14)";
      v.colorScheme = fundoEscuro ? "dark" : "light";
      Object.assign(v, destaque(c.cor2, fundoEscuro));
      // fundo quase da cor dos botões: os botões trocam de cor para não sumir
      if (!foto && !e.corDestaque && (contraste(media, c.cor1) < 1.7 || contraste(media, c.cor2) < 1.7)) {
        const troca = fundoEscuro ? "#ffffff" : "#0f172a";
        Object.assign(v, { "--pg-cor1": troca, "--pg-cor2": troca, "--pg-sobre": fundoEscuro ? "#0f172a" : "#ffffff" }, destaque(troca, fundoEscuro));
        v["--pg-realce"] = troca;
      }
    }
  }
  if (e.corDestaque) {
    Object.assign(v, { "--pg-cor1": e.corDestaque, "--pg-cor2": e.corDestaque, "--pg-sobre": sobreACor(e.corDestaque) }, destaque(e.corDestaque, fundoEscuro));
  }
  if (e.corTexto) {
    v["--pg-titulo"] = e.corTexto;
    v["--pg-texto"] = `color-mix(in srgb, ${e.corTexto} 86%, transparent)`;
    v["--pg-suave"] = `color-mix(in srgb, ${e.corTexto} 64%, transparent)`;
  }
  if (e.espaco) v["--pg-y"] = `${espacos[e.espaco].px}px`;
  if (e.largura) v["--pg-largura"] = larguras[e.largura].css;
  if (e.titulo) v["--pg-t"] = String(tamanhosTitulo[e.titulo].escala);
  const fundo = cor ? (cor2 ? `linear-gradient(135deg, ${cor}, ${cor2})` : cor) : undefined;
  return { style: { ...v, background: fundo, color: "var(--pg-texto)" } as CSSProperties, foto, pelicula: e.escurecer ?? 55 };
}

// O que o conteúdo precisa saber do estilo da seção.
const Estilos = createContext<{ centro: boolean; colunas: number }>({ centro: false, colunas: 0 });
const useEstilo = () => useContext(Estilos);

// Só no editor: onde a tela acaba. No computador, a faixa central (1200) é o
// que aparece em qualquer tela; nos monitores maiores sobra espaço dos lados.
function Margens() {
  const etiqueta = "absolute top-1 rounded-sm px-1 font-sans text-[length:calc(9px/var(--pg-escala,1))] leading-tight font-semibold whitespace-nowrap text-white";
  return (
    <div className={`pointer-events-none z-20 border-x border-dashed border-pink-500 ${classeCamada}`}>
      <span className={`${etiqueta} left-0 bg-pink-500`}>borda da tela</span>
      <div className="absolute inset-y-0 right-[calc(16*var(--u))] left-[calc(16*var(--u))] border-x border-dotted border-sky-400/80">
        <span className={`${etiqueta} right-0 bg-sky-500`}>margem segura</span>
      </div>
    </div>
  );
}

function Moldura({ tema, secao, camada, children }: { tema: Tema; secao: Secao; camada?: (secao: Secao) => ReactNode; children: ReactNode }) {
  const a = aparencia(tema, secao.estilo);
  const temPecas = (secao.pecas?.length ?? 0) > 0;
  return (
    <div className={`relative ${temPecas ? "overflow-clip" : ""}`} style={a.style}>
      {a.foto && (
        <>
          <img src={a.foto} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-black" style={{ opacity: a.pelicula / 100 }} />
        </>
      )}
      <div className="relative">
        <Estilos.Provider value={{ centro: secao.estilo.alinhamento === "centro", colunas: secao.estilo.colunas ?? 0 }}>{children}</Estilos.Provider>
        {camada ? camada(secao) : temPecas && <CamadaPecas pecas={secao.pecas!} />}
      </div>
    </div>
  );
}

// ---------- Peças ----------

const fonteTitulo = "[font-family:var(--pg-fonte)]";
const card = "rounded-(--pg-raio-p) border border-(--pg-linha) bg-(--pg-card)";
const botaoPrincipal =
  "rounded-(--pg-raio-botao) bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) font-semibold text-(--pg-sobre) shadow-[0_10px_30px_-12px_var(--pg-sombra)] transition hover:brightness-110";
const botaoSimples =
  "rounded-(--pg-raio-botao) border border-(--pg-linha) bg-(--pg-card) font-semibold text-(--pg-titulo) transition hover:border-(--pg-cor-borda)";
const h2 = `text-[length:calc(24px*var(--pg-t))] leading-tight font-bold text-(--pg-titulo) @xl:text-[length:calc(28px*var(--pg-t))] ${fonteTitulo}`;

// Colunas escolhidas pelo dono (estilo.colunas); sem escolha, vale o padrão da seção.
const COLUNAS: Record<number, string> = {
  1: "",
  2: "@xl:grid-cols-2",
  3: "@xl:grid-cols-2 @4xl:grid-cols-3",
  4: "@xl:grid-cols-2 @4xl:grid-cols-4",
};
// para fotos e pessoas: já são 2 por linha no celular
const COLUNAS_FOTOS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 @3xl:grid-cols-3",
  4: "grid-cols-2 @3xl:grid-cols-4",
};
function useColunas(padrao: string, mapa = COLUNAS) {
  const { colunas } = useEstilo();
  return colunas ? (mapa[colunas] ?? padrao) : padrao;
}

function Bloco({ secao, edicao, primeira, ultima, children }: { secao: Secao; edicao?: Edicao; primeira: boolean; ultima: boolean; children: ReactNode }) {
  if (!edicao) return <>{children}</>;
  const sel = edicao.selecionada === secao.id;
  const info = catalogo[secao.tipo];
  const a = edicao.acoes;
  return (
    <div
      id={`pg-${secao.id}`}
      className={`relative cursor-pointer outline-2 -outline-offset-2 ${
        sel ? "outline-sky-400" : "outline-transparent hover:outline-sky-400/60 hover:outline-dashed"
      }`}
      onClickCapture={(e) => {
        // os botões da própria seção (subir, duplicar...) funcionam; o resto só seleciona
        const alvo = e.target as HTMLElement;
        if (alvo.closest("[data-barra]")) return;
        e.preventDefault();
        e.stopPropagation();
        edicao.aoSelecionar(secao.id, { texto: alvo.isContentEditable, peca: alvo.closest<HTMLElement>("[data-peca]")?.dataset.peca ?? null });
      }}
    >
      <EdicaoTexto.Provider value={edicao.aoEditarTexto ? (caminho, valor) => edicao.aoEditarTexto!(secao.id, caminho, valor) : null}>{children}</EdicaoTexto.Provider>
      {sel && (
        <div
          data-barra
          className="absolute top-2 right-2 z-10 flex origin-top-right items-center gap-0.5 rounded-lg bg-sky-500 p-0.5 font-sans text-white shadow-lg"
          style={{ zoom: 1 / (edicao.escala || 1) }}
        >
          <span className="px-1.5 text-[11px] font-semibold">{info.nome}</span>
          {a && (
            <>
              <BotaoBarra rotulo="Subir" desligado={primeira} aoClicar={() => a.mover(secao.id, -1)}>
                <ArrowUp className="size-3.5" />
              </BotaoBarra>
              <BotaoBarra rotulo="Descer" desligado={ultima} aoClicar={() => a.mover(secao.id, 1)}>
                <ArrowDown className="size-3.5" />
              </BotaoBarra>
              {!info.unica && (
                <BotaoBarra rotulo="Duplicar" aoClicar={() => a.duplicar(secao.id)}>
                  <CopyPlus className="size-3.5" />
                </BotaoBarra>
              )}
              <BotaoBarra rotulo="Esconder" aoClicar={() => a.esconder(secao.id)}>
                <EyeOff className="size-3.5" />
              </BotaoBarra>
              {!info.fixa && (
                <BotaoBarra rotulo="Apagar" aoClicar={() => a.apagar(secao.id)}>
                  <Trash2 className="size-3.5" />
                </BotaoBarra>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BotaoBarra({ rotulo, desligado, aoClicar, children }: { rotulo: string; desligado?: boolean; aoClicar: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      disabled={desligado}
      onClick={aoClicar}
      className="grid size-6 place-items-center rounded-md hover:bg-white/25 disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function Faixa({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-(--pg-largura) scroll-mt-4 px-4 py-(--pg-y) ${className}`}>
      {children}
    </section>
  );
}

function Cabecalho({ etiqueta, titulo, texto }: { etiqueta?: string; titulo: string; texto?: string }) {
  const { centro } = useEstilo();
  if (!etiqueta && !titulo && !texto) return null;
  return (
    <div className={`mb-5 ${centro ? "text-center" : ""}`}>
      {etiqueta && <Txt c="etiqueta" v={etiqueta} como="p" className="mb-1.5 text-[12px] font-semibold tracking-[0.09em] text-(--pg-realce) uppercase" />}
      {titulo && <Txt c="titulo" v={titulo} como="h2" className={h2} />}
      {texto && <Txt c="texto" v={texto} como="p" linhas className={`mt-1.5 max-w-2xl text-[15px] text-(--pg-suave) ${centro ? "mx-auto" : ""}`} />}
    </div>
  );
}

// Aviso que só aparece no editor (seção sem conteúdo ainda).
function Vazio({ editando, children }: { editando: boolean; children: ReactNode }) {
  if (!editando) return null;
  return (
    <div className="rounded-xl border border-dashed border-(--pg-linha) px-4 py-8 text-center font-sans text-sm text-(--pg-suave)">{children}</div>
  );
}

function Icone({ id, className }: { id: IdIcone; className?: string }) {
  const I = (icones[id] ?? icones.check).icone;
  return <I className={className} />;
}

const classeDestaque = "bg-linear-to-r from-(--pg-realce) to-(--pg-cor2) bg-clip-text text-transparent";

function TituloComDestaque({ titulo, destaque }: { titulo: string; destaque: string }) {
  const d = destaque.trim();
  const i = d ? titulo.toLowerCase().indexOf(d.toLowerCase()) : -1;
  if (i < 0) return <>{titulo}</>;
  return (
    <>
      {titulo.slice(0, i)}
      <span className={classeDestaque}>{titulo.slice(i, i + d.length)}</span>
      {titulo.slice(i + d.length)}
    </>
  );
}

// O mesmo desenho, escrito direto no elemento (no editor o título é digitável; ver Txt).
function pintarDestaque(destaque: string) {
  return (el: HTMLElement, titulo: string) => {
    const d = destaque.trim();
    const i = d ? titulo.toLowerCase().indexOf(d.toLowerCase()) : -1;
    if (i < 0) {
      if (el.childElementCount > 0 || el.textContent !== titulo) el.textContent = titulo;
      return;
    }
    const cor = el.querySelector("span");
    if (el.textContent === titulo && cor?.textContent === titulo.slice(i, i + d.length) && el.firstChild?.textContent === (i > 0 ? titulo.slice(0, i) : cor.textContent)) return;
    const span = document.createElement("span");
    span.className = classeDestaque;
    span.textContent = titulo.slice(i, i + d.length);
    el.replaceChildren(titulo.slice(0, i), span, titulo.slice(i + d.length));
  };
}

// Na página de verdade, itens vazios não aparecem; no editor aparecem, para dar para clicar e escrever.
function useItens<T>(itens: T[], preenchido: (x: T) => boolean) {
  const editando = useEditando();
  return editando ? itens : itens.filter(preenchido);
}

function Foto({ url, nome, className }: { url: string | null; nome: string; className: string }) {
  const src = enderecoSeguro(url);
  if (src) return <img src={src} alt="" className={`${className} object-cover`} />;
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className={`${className} grid place-items-center bg-(--pg-cor-fundo) font-semibold text-(--pg-realce)`}>{iniciais || "?"}</span>
  );
}

// Botão que leva a "#planos", "#contato" ou a um endereço de fora.
function BotaoLink({ c, texto, alvo, className, simples = false }: { c: string; texto: string; alvo: string; className: string; simples?: boolean }) {
  if (!texto) return null;
  const href = enderecoSeguro(alvo) ?? "#planos";
  const fora = href.startsWith("http");
  return (
    <a href={href} target={fora ? "_blank" : undefined} rel="noreferrer" className={`inline-flex items-center gap-2 ${className} ${simples ? botaoSimples : botaoPrincipal}`}>
      <Txt c={c} v={texto} />
      {fora && <ExternalLink className="size-4" />}
    </a>
  );
}

// ---------- Seções ----------

type P<T extends keyof PropsSecao> = PropsSecao[T];

function Conteudo({ s, d, editando, aoEscolherPlano }: { s: Secao; d: DadosPagina; editando: boolean; aoEscolherPlano: (p: PlanoPagina) => void }) {
  switch (s.tipo) {
    case "capa":
      return <Capa s={s.props} d={d} />;
    case "aviso":
      return <Aviso s={s.props} />;
    case "destaques":
      return <Destaques s={s.props} editando={editando} />;
    case "beneficios":
      return <Beneficios s={s.props} editando={editando} />;
    case "planos":
      return <Planos s={s.props} d={d} editando={editando} aoEscolherPlano={aoEscolherPlano} />;
    case "comoFunciona":
      return <Passos s={s.props} />;
    case "sobre":
      return <Sobre s={s.props} />;
    case "video":
      return <Video s={s.props} editando={editando} />;
    case "depoimentos":
      return <Depoimentos s={s.props} editando={editando} />;
    case "galeria":
      return <Galeria s={s.props} editando={editando} />;
    case "duvidas":
      return <Duvidas s={s.props} editando={editando} />;
    case "equipe":
      return <Equipe s={s.props} editando={editando} />;
    case "aulas":
      return <Aulas s={s.props} d={d} editando={editando} />;
    case "horarios":
      return <Horarios s={s.props} d={d} editando={editando} />;
    case "localizacao":
      return <Localizacao s={s.props} d={d} editando={editando} />;
    case "chamada":
      return <Chamada s={s.props} />;
    case "contato":
      return <Contato s={s.props} d={d} />;
    case "rodape":
      return <Rodape s={s.props} />;
    case "livre":
      return <Livre s={s.props} vazia={!s.pecas?.length} />;
  }
}

// Área em branco: a altura é do dono (uma para o celular, outra para o
// computador) e o conteúdo são as peças livres da seção.
function Livre({ s, vazia }: { s: P<"livre">; vazia: boolean }) {
  const editando = useEditando();
  return (
    <div
      className="grid h-[calc(var(--hc)*100cqw/390)] place-items-center @3xl:h-[calc(var(--hp)*min(100cqw,1200px)/1200)]"
      style={{ "--hp": s.altura, "--hc": s.alturaCel } as CSSProperties}
    >
      {vazia && editando && <span className="px-4 text-center font-sans text-sm text-(--pg-suave)">Tela livre: adicione textos, fotos, botões e formas na aba "Peças livres".</span>}
    </div>
  );
}

function Capa({ s, d }: { s: P<"capa">; d: DadosPagina }) {
  const { centro } = useEstilo();
  const selosDaCapa = useItens(s.selos, (x) => !!x.texto.trim());
  const capa = enderecoSeguro(s.imagem);
  const logo = s.logo ? <img src={enderecoSeguro(s.logo)} alt="" className="h-10 w-auto max-w-[180px] object-contain" /> : d.logoPadrao;
  const selos = [
    ...(s.mostrarNumero && d.numero && d.numero.valor > 0
      ? [{ chave: "numero", icone: <Users className="size-4 text-(--pg-realce)" />, texto: <>{`${d.numero.valor} ${d.numero.rotulo}`}</> }]
      : []),
    ...selosDaCapa.map((x) => ({ chave: x.id, icone: <Icone id={x.icone} className="size-4 text-(--pg-realce)" />, texto: <Txt c={`selos/${x.id}/texto`} v={x.texto} /> })),
  ];
  return (
    <header className="relative overflow-hidden">
      {capa && <img src={capa} alt="" className="absolute inset-0 size-full object-cover" style={{ opacity: (100 - s.escurecer) / 100 }} />}
      {capa && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--pg-fundo) 40%, transparent), color-mix(in srgb, var(--pg-fundo) 80%, transparent), var(--pg-fundo))",
          }}
        />
      )}
      <div
        className={`relative mx-auto flex max-w-(--pg-largura) flex-col px-4 pt-[calc(var(--pg-y)+4px)] pb-[calc(var(--pg-y)+12px)] @xl:pt-[calc(var(--pg-y)+20px)] ${centro ? "items-center text-center" : "items-start"}`}
      >
        {(logo || s.mostrarNome) && (
          <div className="flex items-center gap-2.5">
            {logo}
            {s.mostrarNome && <span className={`text-lg font-bold text-(--pg-titulo) ${fonteTitulo}`}>{d.nome}</span>}
          </div>
        )}
        {d.convite && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-(--pg-cor-borda) bg-(--pg-cor-fundo) px-3 py-1 text-[13px] text-(--pg-realce)">
            <Gift className="size-4" /> {d.convite}
          </div>
        )}
        {s.etiqueta && <Txt c="etiqueta" v={s.etiqueta} como="p" className="mt-5 text-[12px] font-semibold tracking-[0.09em] text-(--pg-realce) uppercase" />}
        <Txt
          c="titulo"
          v={s.titulo || d.nome}
          como="h1"
          pintar={pintarDestaque(s.destaque)}
          className={`mt-4 max-w-3xl text-[length:calc(32px*var(--pg-t))] leading-tight font-bold text-(--pg-titulo) @xl:text-[length:calc(44px*var(--pg-t))] ${fonteTitulo}`}
        >
          <TituloComDestaque titulo={s.titulo || d.nome} destaque={s.destaque} />
        </Txt>
        {s.texto && <Txt c="texto" v={s.texto} como="p" linhas className="mt-3 max-w-2xl text-[16px] leading-relaxed" />}
        {selos.length > 0 && (
          <div className={`mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] ${centro ? "justify-center" : ""}`}>
            {selos.map((x) => (
              <span key={x.chave} className="inline-flex items-center gap-1.5">
                {x.icone} {x.texto}
              </span>
            ))}
          </div>
        )}
        {(s.botao || s.botaoSecundario) && (
          <div className={`mt-7 flex flex-wrap gap-3 ${centro ? "justify-center" : ""}`}>
            <BotaoLink c="botao" texto={s.botao} alvo={s.alvo} className="h-12 px-6" />
            <BotaoLink c="botaoSecundario" texto={s.botaoSecundario} alvo={s.alvoSecundario} className="h-12 px-6" simples />
          </div>
        )}
        {s.rodape && <Txt c="rodape" v={s.rodape} como="p" className="mt-4 text-[13px] text-(--pg-suave)" />}
      </div>
    </header>
  );
}

function Aviso({ s }: { s: P<"aviso"> }) {
  const { centro } = useEstilo();
  if (!s.texto.trim()) return null;
  const link = enderecoSeguro(s.alvo);
  const classe = `mx-auto block max-w-(--pg-largura) px-4 py-[calc(var(--pg-y)*0.75)] text-[14px] font-semibold text-(--pg-titulo) ${centro ? "text-center" : ""}`;
  return link ? (
    <a href={link} className={classe}>
      <Txt c="texto" v={s.texto} />
    </a>
  ) : (
    <Txt c="texto" v={s.texto} como="div" className={classe} />
  );
}

function Destaques({ s, editando }: { s: P<"destaques">; editando: boolean }) {
  const itens = useItens(s.itens, (x) => !!(x.titulo.trim() || x.texto.trim()));
  const colunas = useColunas(itens.length === 2 ? COLUNAS_FOTOS[2] : itens.length === 4 ? COLUNAS_FOTOS[4] : "grid-cols-2 @xl:grid-cols-3", COLUNAS_FOTOS);
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      {itens.length === 0 ? (
        <Vazio editando={editando}>Adicione os destaques ao lado.</Vazio>
      ) : (
        <div className={`grid gap-x-4 gap-y-5 text-center ${colunas}`}>
          {itens.map((x) => (
            <div key={x.id}>
              <Txt
                c={`itens/${x.id}/titulo`}
                v={x.titulo}
                como="div"
                className={`bg-linear-to-r from-(--pg-realce) to-(--pg-cor2) bg-clip-text text-[length:calc(26px*var(--pg-t))] leading-tight font-bold text-transparent @xl:text-[length:calc(32px*var(--pg-t))] ${fonteTitulo}`}
              />
              {x.texto && <Txt c={`itens/${x.id}/texto`} v={x.texto} como="div" className="mt-1 text-[13.5px] text-(--pg-suave)" />}
            </div>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Beneficios({ s, editando }: { s: P<"beneficios">; editando: boolean }) {
  const itens = useItens(s.itens, (b) => !!(b.titulo.trim() || b.texto.trim()));
  const colunas = useColunas(COLUNAS[3]);
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho etiqueta={s.etiqueta} titulo={s.titulo} texto={s.texto} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Adicione os benefícios ao lado.</Vazio>
      ) : (
        <div className={`grid gap-3 ${colunas}`}>
          {itens.map((b) => (
            <div key={b.id} className={`flex items-start gap-3 p-4 ${card}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--pg-cor-fundo)">
                <Icone id={b.icone} className="size-4 text-(--pg-realce)" />
              </span>
              <span className="min-w-0 pt-1 text-[15px]">
                <Txt c={`itens/${b.id}/titulo`} v={b.titulo} className={b.texto ? "block font-semibold text-(--pg-titulo)" : "block"} />
                {b.texto && <Txt c={`itens/${b.id}/texto`} v={b.texto} linhas className="mt-0.5 block text-[14px] text-(--pg-suave)" />}
              </span>
            </div>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Planos({ s, d, editando, aoEscolherPlano }: { s: P<"planos">; d: DadosPagina; editando: boolean; aoEscolherPlano: (p: PlanoPagina) => void }) {
  const colunas = useColunas("@3xl:grid-cols-2 @5xl:grid-cols-3");
  const planos = d.planos.filter((p) => !s.ocultos.includes(p.id));
  const destacado =
    s.destaque === "nenhum"
      ? null
      : s.destaque === "auto"
        ? planos.length > 1
          ? planos[Math.min(1, planos.length - 1)].id
          : null
        : s.destaque;
  return (
    <Faixa id="planos">
      <Cabecalho etiqueta={s.etiqueta} titulo={s.titulo} texto={s.texto} />
      <div className={`grid gap-4 ${colunas}`}>
        {planos.map((pl) => {
          const destaque = pl.id === destacado;
          return (
            <div
              key={pl.id}
              className={`relative flex flex-col rounded-(--pg-raio) border p-5 ${
                destaque ? "border-(--pg-cor-borda) bg-linear-to-b from-(--pg-cor-fundo) to-transparent" : "border-(--pg-linha) bg-(--pg-card)"
              }`}
            >
              {destaque && s.selo && (
                <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) px-3 py-0.5 text-[12px] font-bold text-(--pg-sobre)">
                  <Sparkles className="size-3.5" /> <Txt c="selo" v={s.selo} />
                </span>
              )}
              <div className={`text-lg font-semibold text-(--pg-titulo) ${fonteTitulo}`}>{pl.nome}</div>
              {pl.descricao && <p className="mt-1 text-[13.5px] text-(--pg-suave)">{pl.descricao}</p>}
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className={`text-3xl font-bold text-(--pg-titulo) ${fonteTitulo}`}>{moeda(pl.preco)}</span>
                <span className="text-sm text-(--pg-suave)">{pl.periodo}</span>
              </div>
              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {s.mostrarItens &&
                  pl.itens.map((it, i) => (
                    <li key={i} className="flex items-center gap-2 text-[14px]">
                      <Check className="size-4 shrink-0 text-(--pg-realce)" />
                      <span className="flex-1">{it.texto}</span>
                      {it.selo}
                    </li>
                  ))}
              </ul>
              <button type="button" onClick={() => aoEscolherPlano(pl)} className={`mt-5 h-12 ${destaque ? botaoPrincipal : botaoSimples}`}>
                <Txt c="botao" v={s.botao || "Quero este plano"} />
              </button>
            </div>
          );
        })}
      </div>
      {planos.length === 0 &&
        (editando ? (
          <Vazio editando>Nenhum plano à venda. Os planos são cadastrados no sistema (ou todos estão escondidos).</Vazio>
        ) : (
          <p className="text-(--pg-suave)">Nenhum plano à venda no momento.</p>
        ))}
    </Faixa>
  );
}

function Passos({ s }: { s: P<"comoFunciona"> }) {
  const itens = useItens(s.itens, (p) => !!(p.titulo.trim() || p.texto.trim()));
  const colunas = useColunas(itens.length === 2 ? "@3xl:grid-cols-2" : itens.length === 4 ? "@3xl:grid-cols-2 @5xl:grid-cols-4" : "@3xl:grid-cols-3");
  if (itens.length === 0) return null;
  return (
    <Faixa id="como-funciona">
      <Cabecalho etiqueta={s.etiqueta} titulo={s.titulo} texto={s.texto} />
      <div className={`grid gap-4 ${colunas}`}>
        {itens.map((p, i) => (
          <div key={p.id} className={`p-4 ${card}`}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) text-[13px] font-bold text-(--pg-sobre)">
                {i + 1}
              </span>
              <Txt c={`itens/${p.id}/titulo`} v={p.titulo} className="font-semibold text-(--pg-titulo)" />
            </div>
            {p.texto && <Txt c={`itens/${p.id}/texto`} v={p.texto} como="p" linhas className="mt-2 text-[14px] text-(--pg-suave)" />}
          </div>
        ))}
      </div>
    </Faixa>
  );
}

function Sobre({ s }: { s: P<"sobre"> }) {
  const imagem = enderecoSeguro(s.imagem);
  return (
    <Faixa id="sobre">
      <div className={`grid items-center gap-6 ${imagem ? "@3xl:grid-cols-2 @3xl:gap-10" : ""}`}>
        {imagem && <img src={imagem} alt="" className={`aspect-[4/3] w-full rounded-(--pg-raio) object-cover ${s.lado === "esquerda" ? "" : "@3xl:order-2"}`} />}
        <div>
          {s.etiqueta && <Txt c="etiqueta" v={s.etiqueta} como="p" className="mb-1.5 text-[12px] font-semibold tracking-[0.09em] text-(--pg-realce) uppercase" />}
          {s.titulo && <Txt c="titulo" v={s.titulo} como="h2" className={h2} />}
          {s.texto && <Txt c="texto" v={s.texto} como="p" linhas className="mt-3 text-[15.5px] leading-relaxed" />}
          <BotaoLink c="botao" texto={s.botao} alvo={s.alvo} className="mt-5 h-11 px-5" />
        </div>
      </div>
    </Faixa>
  );
}

// YouTube / Vimeo viram player embutido; arquivo enviado vira <video>.
export function videoEmbutido(url: string): { tipo: "iframe" | "video"; src: string } | null {
  const u = url.trim();
  if (!u) return null;
  const yt = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i.exec(u);
  if (yt) return { tipo: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(u);
  if (vimeo) return { tipo: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  const seguro = enderecoSeguro(u);
  return seguro ? { tipo: "video", src: seguro } : null;
}

function Video({ s, editando }: { s: P<"video">; editando: boolean }) {
  const v = videoEmbutido(s.url);
  if (!v && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {v ? (
        <div className="mx-auto aspect-video max-w-3xl overflow-hidden rounded-(--pg-raio) border border-(--pg-linha) bg-black">
          {v.tipo === "iframe" ? (
            <iframe
              src={v.src}
              title={s.titulo || "Vídeo"}
              className={`size-full ${editando ? "pointer-events-none" : ""}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={v.src} controls preload="metadata" className="size-full" />
          )}
        </div>
      ) : (
        <Vazio editando={editando}>Cole o link do vídeo (YouTube ou Vimeo) ou envie um vídeo.</Vazio>
      )}
    </Faixa>
  );
}

function Depoimentos({ s, editando }: { s: P<"depoimentos">; editando: boolean }) {
  const itens = useItens(s.itens, (x) => !!x.texto.trim());
  const colunas = useColunas("@3xl:grid-cols-2 @5xl:grid-cols-3");
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Adicione os depoimentos ao lado.</Vazio>
      ) : (
        <div className={`grid gap-4 ${colunas}`}>
          {itens.map((x) => (
            <figure key={x.id} className={`flex flex-col p-5 ${card}`}>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, k) => (
                    <Star key={k} className={`size-4 ${k < x.estrelas ? "fill-(--pg-realce) text-(--pg-realce)" : "text-(--pg-linha)"}`} />
                  ))}
                </div>
                <Quote className="size-6 text-(--pg-cor-borda)" />
              </div>
              <Txt c={`itens/${x.id}/texto`} v={x.texto} como="blockquote" linhas className="mt-3 flex-1 text-[15px] leading-relaxed" />
              {(x.autor || x.detalhe) && (
                <figcaption className="mt-4 flex items-center gap-3">
                  <Foto url={x.foto} nome={x.autor} className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 leading-tight">
                    <Txt c={`itens/${x.id}/autor`} v={x.autor} como="div" className="font-semibold text-(--pg-titulo)" />
                    {x.detalhe && <Txt c={`itens/${x.id}/detalhe`} v={x.detalhe} como="div" className="mt-0.5 text-[12.5px] text-(--pg-suave)" />}
                  </div>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Galeria({ s, editando }: { s: P<"galeria">; editando: boolean }) {
  const itens = s.itens.filter((x) => enderecoSeguro(x.imagem));
  const colunas = useColunas(COLUNAS_FOTOS[3], COLUNAS_FOTOS);
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Envie as fotos ao lado.</Vazio>
      ) : (
        <div className={`grid gap-3 ${colunas}`}>
          {itens.map((x) => (
            <figure key={x.id}>
              <img src={enderecoSeguro(x.imagem)} alt={x.titulo} className="aspect-square w-full rounded-(--pg-raio-p) object-cover" />
              {x.titulo && <Txt c={`itens/${x.id}/titulo`} v={x.titulo} como="figcaption" className="mt-1.5 text-[13px] text-(--pg-suave)" />}
            </figure>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Duvidas({ s, editando }: { s: P<"duvidas">; editando: boolean }) {
  const itens = useItens(s.itens, (x) => !!x.titulo.trim());
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Adicione as perguntas ao lado.</Vazio>
      ) : (
        <div className="flex flex-col gap-2.5">
          {itens.map((x) => (
            <details key={x.id} open={editando || undefined} className={`group ${card}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold text-(--pg-titulo) [&::-webkit-details-marker]:hidden">
                <Txt c={`itens/${x.id}/titulo`} v={x.titulo} />
                <ChevronDown className="size-5 shrink-0 text-(--pg-suave) transition group-open:rotate-180" />
              </summary>
              <Txt c={`itens/${x.id}/texto`} v={x.texto} como="p" linhas className="px-4 pb-4 text-[14.5px] leading-relaxed text-(--pg-suave)" />
            </details>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Equipe({ s, editando }: { s: P<"equipe">; editando: boolean }) {
  const itens = useItens(s.itens, (x) => !!x.nome.trim());
  const colunas = useColunas(COLUNAS_FOTOS[4], COLUNAS_FOTOS);
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Adicione as pessoas da equipe ao lado.</Vazio>
      ) : (
        <div className={`grid gap-4 ${colunas}`}>
          {itens.map((x) => (
            <div key={x.id} className={`flex flex-col items-center p-4 text-center ${card}`}>
              <Foto url={x.foto} nome={x.nome} className="size-20 rounded-full text-xl" />
              <Txt c={`itens/${x.id}/nome`} v={x.nome} como="div" className="mt-3 font-semibold text-(--pg-titulo)" />
              {x.cargo && <Txt c={`itens/${x.id}/cargo`} v={x.cargo} como="div" className="mt-0.5 text-[13px] text-(--pg-suave)" />}
            </div>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Aulas({ s, d, editando }: { s: P<"aulas">; d: DadosPagina; editando: boolean }) {
  const aulas = d.aulas ?? [];
  const colunas = useColunas("@3xl:grid-cols-2");
  if (aulas.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {aulas.length === 0 ? (
        <Vazio editando={editando}>Nenhuma aula com horário cadastrado ainda. As aulas aparecem aqui sozinhas.</Vazio>
      ) : (
        <div className={`grid gap-3 ${colunas}`}>
          {aulas.map((a, i) => (
            <div key={i} className={`p-4 ${card}`}>
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full bg-(--pg-cor2)" style={a.cor ? { background: a.cor } : undefined} />
                <span className="font-semibold text-(--pg-titulo)">{a.nome}</span>
                {a.professor && <span className="text-[13px] text-(--pg-suave)">· {a.professor}</span>}
              </div>
              {a.descricao && <p className="mt-1.5 text-[13.5px] text-(--pg-suave)">{a.descricao}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.horarios.map((h, k) => (
                  <span key={k} className="rounded-md border border-(--pg-linha) px-2 py-0.5 text-[12.5px]">
                    {h.dia.slice(0, 3)} {h.hora}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Horarios({ s, d, editando }: { s: P<"horarios">; d: DadosPagina; editando: boolean }) {
  const { centro } = useEstilo();
  const horarios = d.horarios ?? [];
  if (horarios.length === 0) return <Vazio editando={editando}>Sem horário de funcionamento cadastrado.</Vazio>;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      <div className={`max-w-xl divide-y divide-(--pg-linha) ${centro ? "mx-auto" : ""} ${card}`}>
        {horarios.map((h) => (
          <div key={h.dia} className={`flex items-center justify-between px-4 py-2.5 text-[14.5px] ${h.hoje ? "font-semibold text-(--pg-titulo)" : ""}`}>
            <span className="flex items-center gap-2">
              {h.hoje && <Clock className="size-4 text-(--pg-realce)" />}
              {h.dia}
              {h.hoje && <span className="text-[12px] font-normal text-(--pg-realce)">hoje</span>}
            </span>
            <span className={h.texto === "Fechado" ? "text-(--pg-suave)" : ""}>{h.texto}</span>
          </div>
        ))}
      </div>
    </Faixa>
  );
}

function Localizacao({ s, d, editando }: { s: P<"localizacao">; d: DadosPagina; editando: boolean }) {
  const endereco = (s.endereco || d.endereco || "").trim();
  if (!endereco) return <Vazio editando={editando}>Escreva o endereço ao lado (ou preencha nas Configurações).</Vazio>;
  const q = encodeURIComponent(endereco);
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} />
      <div className={`grid gap-4 ${s.mostrarMapa ? "@3xl:grid-cols-[1fr_1.4fr]" : ""}`}>
        <div className={`flex flex-col justify-center gap-4 p-5 ${card}`}>
          <p className="flex items-start gap-2.5 text-[15px]">
            <MapPin className="mt-0.5 size-5 shrink-0 text-(--pg-realce)" /> {endereco}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${q}`}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex h-11 w-fit items-center gap-2 px-5 ${botaoPrincipal}`}
          >
            Como chegar <ExternalLink className="size-4" />
          </a>
        </div>
        {s.mostrarMapa && (
          <iframe
            title="Mapa"
            src={`https://maps.google.com/maps?q=${q}&z=16&output=embed`}
            loading="lazy"
            className={`aspect-video w-full rounded-(--pg-raio) border border-(--pg-linha) ${editando ? "pointer-events-none" : ""}`}
          />
        )}
      </div>
    </Faixa>
  );
}

function Chamada({ s }: { s: P<"chamada"> }) {
  const { centro } = useEstilo();
  return (
    <Faixa>
      <div className="rounded-(--pg-raio) bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) p-px">
        <div className={`rounded-[calc(var(--pg-raio)-1px)] bg-(--pg-fundo) px-5 py-10 @xl:px-10 ${centro ? "text-center" : ""}`}>
          {s.titulo && <Txt c="titulo" v={s.titulo} como="h2" className={`${h2} @xl:text-[length:calc(30px*var(--pg-t))]`} />}
          {s.texto && <Txt c="texto" v={s.texto} como="p" linhas className={`mt-2 max-w-xl text-[15.5px] ${centro ? "mx-auto" : ""}`} />}
          <BotaoLink c="botao" texto={s.botao} alvo={s.alvo} className="mt-6 h-12 px-7" />
        </div>
      </div>
    </Faixa>
  );
}

// ---------- Redes sociais (a biblioteca de ícones não tem as marcas) ----------

const redes = {
  instagram: {
    nome: "Instagram",
    url: (v: string) => `https://instagram.com/${v.replace(/^@/, "")}`,
    caminho:
      "M12 2.2c3.2 0 3.6 0 4.8.1 3.2.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 4.7a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6zm5.3-9.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
  },
  facebook: {
    nome: "Facebook",
    url: (v: string) => `https://facebook.com/${v.replace(/^@/, "")}`,
    caminho: "M14 13.5h2.5l1-4H14v-2c0-1 0-2 2-2h1.5V2.1C17.2 2.1 15.9 2 14.6 2 11.9 2 10 3.7 10 6.7v2.8H7v4h3V22h4v-8.5z",
  },
  youtube: {
    nome: "YouTube",
    url: (v: string) => `https://youtube.com/${v.startsWith("@") ? v : `@${v}`}`,
    caminho:
      "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3-5.8 3z",
  },
  tiktok: {
    nome: "TikTok",
    url: (v: string) => `https://tiktok.com/${v.startsWith("@") ? v : `@${v}`}`,
    caminho:
      "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z",
  },
} as const;

function linkRede(rede: keyof typeof redes, valor: string) {
  const v = valor.trim();
  if (!v) return undefined;
  return /^https?:\/\//i.test(v) || v.includes(".") ? enderecoSeguro(v) : redes[rede].url(v);
}

function Contato({ s, d }: { s: P<"contato">; d: DadosPagina }) {
  const { centro } = useEstilo();
  const zap = linkZap(d.whatsapp, d.mensagemWhatsapp);
  const sociais = (Object.keys(redes) as (keyof typeof redes)[]).map((r) => ({ r, href: linkRede(r, s[r]) })).filter((x) => x.href);
  const site = enderecoSeguro(s.site);
  if (!s.titulo && !(zap && s.texto) && sociais.length === 0 && !site) return null;
  return (
    <Faixa id="contato" className={centro ? "text-center" : ""}>
      {s.titulo && <Txt c="titulo" v={s.titulo} como="h2" className={`mb-2 ${h2}`} />}
      {zap && s.texto && (
        <a href={zap} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[14.5px] font-medium text-[#25D366] hover:underline">
          <MessageCircle className="size-4" /> <Txt c="texto" v={s.texto} />
        </a>
      )}
      {(sociais.length > 0 || site) && (
        <div className={`mt-5 flex flex-wrap items-center gap-2.5 ${centro ? "justify-center" : ""}`}>
          {sociais.map((x) => (
            <a
              key={x.r}
              href={x.href}
              target="_blank"
              rel="noreferrer"
              aria-label={redes[x.r].nome}
              className="grid size-10 place-items-center rounded-full border border-(--pg-linha) bg-(--pg-card) text-(--pg-texto) transition hover:border-(--pg-cor-borda) hover:text-(--pg-realce)"
            >
              <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden>
                <path d={redes[x.r].caminho} />
              </svg>
            </a>
          ))}
          {site && (
            <a href={site} target="_blank" rel="noreferrer" className={`inline-flex h-10 items-center gap-1.5 px-4 text-[13.5px] ${botaoSimples}`}>
              Site <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      )}
    </Faixa>
  );
}

function Rodape({ s }: { s: P<"rodape"> }) {
  const { centro } = useEstilo();
  if (!s.texto.trim()) return null;
  return (
    <footer className={`mx-auto max-w-(--pg-largura) px-4 pt-(--pg-y) pb-[calc(var(--pg-y)+24px)] ${centro ? "text-center" : ""}`}>
      <Txt c="texto" v={s.texto} como="p" linhas className="border-t border-(--pg-linha) pt-5 text-[12.5px] text-(--pg-suave)" />
    </footer>
  );
}
