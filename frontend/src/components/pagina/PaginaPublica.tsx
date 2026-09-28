import { Check, ChevronDown, Clock, ExternalLink, Gift, MapPin, MessageCircle, Quote, Sparkles, Star, Users } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import {
  cantos,
  catalogo,
  enderecoSeguro,
  fontes,
  fundos,
  icones,
  linkZap,
  moeda,
  type DadosPagina,
  type IdIcone,
  type PaginaConfig,
  type PlanoPagina,
  type Secao,
  type SecaoDo,
  type Tema,
} from "../../lib/pagina";

// Desenha a página pública de qualquer módulo a partir do tema e das seções
// (lib/pagina.ts). Usada na página pública de verdade e na prévia do editor.
//
// Os tamanhos seguem a LARGURA DA PÁGINA (container queries @xl/@3xl/@5xl),
// não a da tela: assim a prévia "celular" dentro do editor fica igual ao
// celular de verdade.

export type Edicao = { selecionada: string | null; aoSelecionar: (id: string) => void };

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
  return (
    <div className="@container min-h-full bg-(--pg-fundo) font-sans text-(--pg-texto)" style={variaveis(pagina.tema)}>
      {pagina.secoes
        .filter((s) => s.visivel)
        .map((s) => (
          <Bloco key={s.id} secao={s} edicao={edicao}>
            <Conteudo s={s} d={dados} editando={!!edicao} aoEscolherPlano={aoEscolherPlano} />
          </Bloco>
        ))}
      <div className="h-10" />
      {children}
    </div>
  );
}

// ---------- Tema → variáveis CSS ----------

function rgb(hex: string): [number, number, number] {
  const h = /^#?([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? "f97316";
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function mistura(hex: string, com: string, t: number) {
  const a = rgb(hex);
  const b = rgb(com);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

const rgba = (hex: string, alfa: number) => `rgba(${rgb(hex).join(",")},${alfa})`;

function luminancia(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function variaveis(t: Tema): CSSProperties {
  const f = fundos[t.fundo] ?? fundos.marinho;
  const c = cantos[t.cantos] ?? cantos.redondos;
  return {
    "--pg-fundo": f.fundo,
    "--pg-card": f.card,
    "--pg-linha": f.linha,
    "--pg-titulo": f.titulo,
    "--pg-texto": f.texto,
    "--pg-suave": f.suave,
    "--pg-cor1": t.cor1,
    "--pg-cor2": t.cor2,
    // texto por cima do degradê: escuro em cores claras, branco nas escuras
    "--pg-sobre": (luminancia(t.cor1) + luminancia(t.cor2)) / 2 > 0.3 ? "#0b0f19" : "#ffffff",
    // cor de destaque em texto e ícones (mais clara no fundo escuro)
    "--pg-realce": f.escuro ? mistura(t.cor2, "#ffffff", 0.3) : mistura(t.cor2, "#000000", 0.15),
    "--pg-cor-fundo": rgba(t.cor2, f.escuro ? 0.14 : 0.1),
    "--pg-cor-borda": rgba(t.cor2, 0.55),
    "--pg-sombra": rgba(t.cor2, 0.8),
    "--pg-fonte": (fontes[t.fonte] ?? fontes.poppins).familia,
    "--pg-raio": c.card,
    "--pg-raio-p": c.pequeno,
    "--pg-raio-botao": c.botao,
    colorScheme: f.escuro ? "dark" : "light",
  } as CSSProperties;
}

// ---------- Peças ----------

const fonteTitulo = "[font-family:var(--pg-fonte)]";
const card = "rounded-(--pg-raio-p) border border-(--pg-linha) bg-(--pg-card)";
const botaoPrincipal =
  "rounded-(--pg-raio-botao) bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) font-semibold text-(--pg-sobre) shadow-[0_10px_30px_-12px_var(--pg-sombra)] transition hover:brightness-110";
const botaoSimples =
  "rounded-(--pg-raio-botao) border border-(--pg-linha) bg-(--pg-card) font-semibold text-(--pg-titulo) transition hover:border-(--pg-cor-borda)";

function Bloco({ secao, edicao, children }: { secao: Secao; edicao?: Edicao; children: ReactNode }) {
  if (!edicao) return <>{children}</>;
  const sel = edicao.selecionada === secao.id;
  return (
    <div
      id={`pg-${secao.id}`}
      className={`relative cursor-pointer outline-2 -outline-offset-2 ${
        sel ? "outline-sky-400" : "outline-transparent hover:outline-sky-400/60 hover:outline-dashed"
      }`}
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        edicao.aoSelecionar(secao.id);
      }}
    >
      {children}
      {sel && (
        <span className="absolute top-2 right-2 z-10 rounded-md bg-sky-500 px-2 py-0.5 font-sans text-[11px] font-semibold text-white">
          {catalogo[secao.tipo].nome}
        </span>
      )}
    </div>
  );
}

function Faixa({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-5xl scroll-mt-4 px-4 py-7 ${className}`}>
      {children}
    </section>
  );
}

function Cabecalho({ titulo, texto, centro = false }: { titulo: string; texto?: string; centro?: boolean }) {
  if (!titulo && !texto) return null;
  return (
    <div className={`mb-5 ${centro ? "text-center" : ""}`}>
      {titulo && <h2 className={`text-2xl font-bold text-(--pg-titulo) @xl:text-[28px] ${fonteTitulo}`}>{titulo}</h2>}
      {texto && <p className={`mt-1.5 max-w-2xl text-[15px] whitespace-pre-line text-(--pg-suave) ${centro ? "mx-auto" : ""}`}>{texto}</p>}
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

function TituloComDestaque({ titulo, destaque }: { titulo: string; destaque: string }) {
  const d = destaque.trim();
  const i = d ? titulo.toLowerCase().indexOf(d.toLowerCase()) : -1;
  if (i < 0) return <>{titulo}</>;
  return (
    <>
      {titulo.slice(0, i)}
      <span className="bg-linear-to-r from-(--pg-realce) to-(--pg-cor2) bg-clip-text text-transparent">{titulo.slice(i, i + d.length)}</span>
      {titulo.slice(i + d.length)}
    </>
  );
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

// ---------- Seções ----------

type Props = { s: Secao; d: DadosPagina; editando: boolean; aoEscolherPlano: (p: PlanoPagina) => void };

function Conteudo({ s, d, editando, aoEscolherPlano }: Props) {
  switch (s.tipo) {
    case "topo":
      return <Topo s={s} d={d} />;
    case "aviso":
      return <Aviso s={s} />;
    case "beneficios":
      return <Beneficios s={s} editando={editando} />;
    case "planos":
      return <Planos s={s} d={d} editando={editando} aoEscolherPlano={aoEscolherPlano} />;
    case "passos":
      return <Passos s={s} />;
    case "texto":
      return <Texto s={s} />;
    case "video":
      return <Video s={s} editando={editando} />;
    case "depoimentos":
      return <Depoimentos s={s} editando={editando} />;
    case "imagens":
      return <Imagens s={s} editando={editando} />;
    case "perguntas":
      return <Perguntas s={s} editando={editando} />;
    case "equipe":
      return <Equipe s={s} editando={editando} />;
    case "aulas":
      return <Aulas s={s} d={d} editando={editando} />;
    case "horarios":
      return <Horarios s={s} d={d} editando={editando} />;
    case "localizacao":
      return <Localizacao s={s} d={d} editando={editando} />;
    case "chamada":
      return <Chamada s={s} />;
    case "contato":
      return <Contato s={s} d={d} />;
  }
}

function Topo({ s, d }: { s: SecaoDo<"topo">; d: DadosPagina }) {
  const centro = s.alinhamento === "centro";
  const capa = enderecoSeguro(s.capa);
  const logo = s.logo ? <img src={enderecoSeguro(s.logo)} alt="" className="h-10 w-auto max-w-[180px] object-contain" /> : d.logoPadrao;
  const selos = [
    ...(s.mostrarNumero && d.numero && d.numero.valor > 0
      ? [{ chave: "numero", icone: <Users className="size-4 text-(--pg-realce)" />, texto: `${d.numero.valor} ${d.numero.rotulo}` }]
      : []),
    ...s.selos
      .filter((x) => x.texto.trim())
      .map((x, i) => ({ chave: `${i}`, icone: <Icone id={x.icone} className="size-4 text-(--pg-realce)" />, texto: x.texto })),
  ];
  return (
    <header className="relative overflow-hidden">
      {capa && <img src={capa} alt="" className="absolute inset-0 size-full object-cover" style={{ opacity: (100 - s.escurecer) / 100 }} />}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--pg-fundo) 40%, transparent), color-mix(in srgb, var(--pg-fundo) 80%, transparent), var(--pg-fundo))",
        }}
      />
      <div className={`relative mx-auto flex max-w-5xl flex-col px-4 pt-8 pb-10 @xl:pt-12 ${centro ? "items-center text-center" : "items-start"}`}>
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
        <h1 className={`mt-4 max-w-3xl text-[32px] leading-tight font-bold text-(--pg-titulo) @xl:text-[44px] ${fonteTitulo}`}>
          <TituloComDestaque titulo={s.titulo} destaque={s.destaque} />
        </h1>
        {s.texto && <p className="mt-3 max-w-2xl text-[16px] leading-relaxed whitespace-pre-line">{s.texto}</p>}
        {selos.length > 0 && (
          <div className={`mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] ${centro ? "justify-center" : ""}`}>
            {selos.map((x) => (
              <span key={x.chave} className="inline-flex items-center gap-1.5">
                {x.icone} {x.texto}
              </span>
            ))}
          </div>
        )}
        {s.botao && (
          <a href="#planos" className={`mt-7 inline-flex h-12 items-center px-6 ${botaoPrincipal}`}>
            {s.botao}
          </a>
        )}
      </div>
    </header>
  );
}

function Aviso({ s }: { s: SecaoDo<"aviso"> }) {
  if (!s.texto.trim()) return null;
  const link = enderecoSeguro(s.link);
  const classe = "block bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) px-4 py-2.5 text-center text-[14px] font-semibold text-(--pg-sobre)";
  return link ? (
    <a href={link} className={classe}>
      {s.texto}
    </a>
  ) : (
    <div className={classe}>{s.texto}</div>
  );
}

function Beneficios({ s, editando }: { s: SecaoDo<"beneficios">; editando: boolean }) {
  const itens = s.itens.filter((b) => b.texto.trim());
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Adicione os benefícios ao lado.</Vazio>
      ) : (
        <div className="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-3">
          {itens.map((b, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 ${card}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--pg-cor-fundo)">
                <Icone id={b.icone} className="size-4 text-(--pg-realce)" />
              </span>
              <span className="pt-1 text-[15px]">{b.texto}</span>
            </div>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Planos({ s, d, editando, aoEscolherPlano }: { s: SecaoDo<"planos">; d: DadosPagina; editando: boolean; aoEscolherPlano: (p: PlanoPagina) => void }) {
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
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      <div className="grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3">
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
                  <Sparkles className="size-3.5" /> {s.selo}
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
              <button
                type="button"
                onClick={() => aoEscolherPlano(pl)}
                className={`mt-5 h-12 ${destaque ? botaoPrincipal : botaoSimples}`}
              >
                {s.botao || "Quero este plano"}
              </button>
            </div>
          );
        })}
      </div>
      {planos.length === 0 &&
        (editando ? (
          <Vazio editando>Nenhum plano à venda. Os planos são cadastrados no módulo (ou todos estão escondidos).</Vazio>
        ) : (
          <p className="text-(--pg-suave)">Nenhum plano à venda no momento.</p>
        ))}
    </Faixa>
  );
}

function Passos({ s }: { s: SecaoDo<"passos"> }) {
  const itens = s.itens.filter((p) => p.titulo.trim() || p.texto.trim());
  if (itens.length === 0) return null;
  const colunas = itens.length === 2 ? "@3xl:grid-cols-2" : itens.length === 4 ? "@3xl:grid-cols-2 @5xl:grid-cols-4" : "@3xl:grid-cols-3";
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} />
      <div className={`grid gap-4 ${colunas}`}>
        {itens.map((p, i) => (
          <div key={i} className={`p-4 ${card}`}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) text-[13px] font-bold text-(--pg-sobre)">
                {i + 1}
              </span>
              <span className="font-semibold text-(--pg-titulo)">{p.titulo}</span>
            </div>
            {p.texto && <p className="mt-2 text-[14px] text-(--pg-suave)">{p.texto}</p>}
          </div>
        ))}
      </div>
    </Faixa>
  );
}

function Texto({ s }: { s: SecaoDo<"texto"> }) {
  const imagem = enderecoSeguro(s.imagem);
  const link = enderecoSeguro(s.link) ?? "#planos";
  return (
    <Faixa>
      <div className={`grid items-center gap-6 ${imagem ? "@3xl:grid-cols-2 @3xl:gap-10" : ""}`}>
        {imagem && (
          <img
            src={imagem}
            alt=""
            className={`aspect-[4/3] w-full rounded-(--pg-raio) object-cover ${s.lado === "esquerda" ? "" : "@3xl:order-2"}`}
          />
        )}
        <div>
          {s.titulo && <h2 className={`text-2xl font-bold text-(--pg-titulo) @xl:text-[28px] ${fonteTitulo}`}>{s.titulo}</h2>}
          {s.texto && <p className="mt-3 text-[15.5px] leading-relaxed whitespace-pre-line">{s.texto}</p>}
          {s.botao && (
            <a
              href={link}
              target={link.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className={`mt-5 inline-flex h-11 items-center gap-2 px-5 ${botaoPrincipal}`}
            >
              {s.botao}
              {link.startsWith("http") && <ExternalLink className="size-4" />}
            </a>
          )}
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

function Video({ s, editando }: { s: SecaoDo<"video">; editando: boolean }) {
  const v = videoEmbutido(s.url);
  if (!v && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} centro />
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

function Depoimentos({ s, editando }: { s: SecaoDo<"depoimentos">; editando: boolean }) {
  const itens = s.itens.filter((x) => x.texto.trim());
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Adicione os depoimentos ao lado.</Vazio>
      ) : (
        <div className="grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3">
          {itens.map((x, i) => (
            <figure key={i} className={`flex flex-col p-5 ${card}`}>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, k) => (
                    <Star key={k} className={`size-4 ${k < x.estrelas ? "fill-(--pg-realce) text-(--pg-realce)" : "text-(--pg-linha)"}`} />
                  ))}
                </div>
                <Quote className="size-6 text-(--pg-cor-borda)" />
              </div>
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed whitespace-pre-line">{x.texto}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <Foto url={x.foto} nome={x.nome} className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 leading-tight">
                  <div className="font-semibold text-(--pg-titulo)">{x.nome}</div>
                  {x.detalhe && <div className="mt-0.5 text-[12.5px] text-(--pg-suave)">{x.detalhe}</div>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Imagens({ s, editando }: { s: SecaoDo<"imagens">; editando: boolean }) {
  const itens = s.itens.filter((x) => enderecoSeguro(x.imagem));
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Envie as fotos ao lado.</Vazio>
      ) : (
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3">
          {itens.map((x, i) => (
            <figure key={i}>
              <img src={enderecoSeguro(x.imagem)} alt={x.legenda} className="aspect-square w-full rounded-(--pg-raio-p) object-cover" />
              {x.legenda && <figcaption className="mt-1.5 text-[13px] text-(--pg-suave)">{x.legenda}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Perguntas({ s, editando }: { s: SecaoDo<"perguntas">; editando: boolean }) {
  const itens = s.itens.filter((x) => x.pergunta.trim());
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <div className="mx-auto max-w-3xl">
        <Cabecalho titulo={s.titulo} centro />
        {itens.length === 0 ? (
          <Vazio editando={editando}>Adicione as perguntas ao lado.</Vazio>
        ) : (
          <div className="flex flex-col gap-2.5">
            {itens.map((x, i) => (
              <details key={i} className={`group ${card}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold text-(--pg-titulo) [&::-webkit-details-marker]:hidden">
                  {x.pergunta}
                  <ChevronDown className="size-5 shrink-0 text-(--pg-suave) transition group-open:rotate-180" />
                </summary>
                <p className="px-4 pb-4 text-[14.5px] leading-relaxed whitespace-pre-line text-(--pg-suave)">{x.resposta}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </Faixa>
  );
}

function Equipe({ s, editando }: { s: SecaoDo<"equipe">; editando: boolean }) {
  const itens = s.itens.filter((x) => x.nome.trim());
  if (itens.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {itens.length === 0 ? (
        <Vazio editando={editando}>Adicione as pessoas da equipe ao lado.</Vazio>
      ) : (
        <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
          {itens.map((x, i) => (
            <div key={i} className={`flex flex-col items-center p-4 text-center ${card}`}>
              <Foto url={x.foto} nome={x.nome} className="size-20 rounded-full text-xl" />
              <div className="mt-3 font-semibold text-(--pg-titulo)">{x.nome}</div>
              {x.cargo && <div className="mt-0.5 text-[13px] text-(--pg-suave)">{x.cargo}</div>}
            </div>
          ))}
        </div>
      )}
    </Faixa>
  );
}

function Aulas({ s, d, editando }: { s: SecaoDo<"aulas">; d: DadosPagina; editando: boolean }) {
  const aulas = d.aulas ?? [];
  if (aulas.length === 0 && !editando) return null;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      {aulas.length === 0 ? (
        <Vazio editando={editando}>Nenhuma aula com horário cadastrado ainda. As aulas aparecem aqui sozinhas.</Vazio>
      ) : (
        <div className="grid gap-3 @3xl:grid-cols-2">
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

function Horarios({ s, d, editando }: { s: SecaoDo<"horarios">; d: DadosPagina; editando: boolean }) {
  const horarios = d.horarios ?? [];
  if (horarios.length === 0) return <Vazio editando={editando}>Sem horário de funcionamento cadastrado.</Vazio>;
  return (
    <Faixa>
      <Cabecalho titulo={s.titulo} texto={s.texto} />
      <div className={`max-w-xl divide-y divide-(--pg-linha) ${card}`}>
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

function Localizacao({ s, d, editando }: { s: SecaoDo<"localizacao">; d: DadosPagina; editando: boolean }) {
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

function Chamada({ s }: { s: SecaoDo<"chamada"> }) {
  return (
    <Faixa>
      <div className="rounded-(--pg-raio) bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) p-px">
        <div className="rounded-[calc(var(--pg-raio)-1px)] bg-(--pg-fundo) px-5 py-10 text-center @xl:px-10">
          <div className="rounded-[inherit]">
            {s.titulo && <h2 className={`text-2xl font-bold text-(--pg-titulo) @xl:text-[30px] ${fonteTitulo}`}>{s.titulo}</h2>}
            {s.texto && <p className="mx-auto mt-2 max-w-xl text-[15.5px] whitespace-pre-line">{s.texto}</p>}
            {s.botao && (
              <a href="#planos" className={`mt-6 inline-flex h-12 items-center px-7 ${botaoPrincipal}`}>
                {s.botao}
              </a>
            )}
          </div>
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

function Contato({ s, d }: { s: SecaoDo<"contato">; d: DadosPagina }) {
  const zap = linkZap(d.whatsapp, d.mensagemWhatsapp);
  const sociais = (Object.keys(redes) as (keyof typeof redes)[])
    .map((r) => ({ r, href: linkRede(r, s[r]) }))
    .filter((x) => x.href);
  const site = enderecoSeguro(s.site);
  return (
    <footer id="contato" className="mx-auto max-w-5xl px-4 pt-8 text-center">
      {zap && s.texto && (
        <a href={zap} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[14.5px] font-medium text-[#25D366] hover:underline">
          <MessageCircle className="size-4" /> {s.texto}
        </a>
      )}
      {(sociais.length > 0 || site) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
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
      {s.rodape && <p className="mt-6 border-t border-(--pg-linha) pt-5 text-[12.5px] whitespace-pre-line text-(--pg-suave)">{s.rodape}</p>}
    </footer>
  );
}
