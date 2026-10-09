import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type Modifier } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Film, GripVertical, ImageUp, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { createContext, useContext, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { enviarArquivo } from "../../lib/academia-treinos";
import { icones, novoId, type IdIcone } from "../../lib/pagina";
import { ehCor } from "../../lib/pagina-cores";

// Peças do formulário do editor de páginas. Cores neutras para servir no
// painel de qualquer módulo; a cor de destaque vem de --ed-1/--ed-2
// (definidas pelo EditorPagina com as cores do módulo).

export const classeEntrada =
  "h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-slate-100 outline-none [color-scheme:dark] placeholder:text-slate-500 focus:border-(--ed-2)";
export const classeArea =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 focus:border-(--ed-2)";
export const classeBotaoEd = (primario = false, pequeno = false) =>
  `inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 ${
    pequeno ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"
  } ${
    primario
      ? "bg-linear-to-r from-(--ed-1) to-(--ed-2) text-white shadow-[0_6px_20px_-10px_var(--ed-2)] hover:brightness-110"
      : "border border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/25 hover:text-white"
  }`;

// Como o editor envia fotos e vídeos. No laboratório é POST /api/arquivos; em
// outro sistema, basta envolver o editor com <EnvioDeArquivo.Provider value={...}>.
export type Envio = (arquivo: File, aoProgredir?: (pct: number) => void) => Promise<{ url: string }>;
export const EnvioDeArquivo = createContext<Envio>(enviarArquivo);

// grupo = o campo tem vários controles (lista, botões): não usa <label>,
// senão tocar em qualquer lugar acionaria o primeiro controle.
export function Campo({ rotulo, dica, grupo = false, children }: { rotulo: string; dica?: ReactNode; grupo?: boolean; children: ReactNode }) {
  const Caixa = grupo ? "div" : "label";
  return (
    <Caixa className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-300">{rotulo}</span>
      {children}
      {dica && <span className="text-[11.5px] leading-snug text-slate-500">{dica}</span>}
    </Caixa>
  );
}

// Escolher uma cor: o quadradinho abre as cores e o código (#rrggbb) pode ser colado.
export function CampoCor({ valor, aoMudar, aoLimpar }: { valor: string; aoMudar: (v: string) => void; aoLimpar?: () => void }) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={ehCor(valor) ? valor : "#888888"}
        onChange={(e) => aoMudar(e.target.value)}
        className="size-10 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-black/25 p-1"
      />
      <input
        className={`${classeEntrada} w-28 font-mono uppercase`}
        value={texto ?? valor}
        maxLength={7}
        spellCheck={false}
        onFocus={() => setTexto(valor)}
        onBlur={() => setTexto(null)}
        onChange={(e) => {
          const v = e.target.value.trim();
          setTexto(v);
          const cor = v.startsWith("#") ? v : `#${v}`;
          if (ehCor(cor)) aoMudar(cor.toLowerCase());
        }}
      />
      {aoLimpar && (
        <button type="button" onClick={aoLimpar} className="text-[12px] text-slate-400 underline underline-offset-2 hover:text-white">
          Tirar
        </button>
      )}
    </div>
  );
}

export function Entrada({ valor, aoMudar, ...props }: { valor: string; aoMudar: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return <input className={classeEntrada} value={valor} onChange={(e) => aoMudar(e.target.value)} {...props} />;
}

export function AreaTexto({ valor, aoMudar, linhas = 3, placeholder }: { valor: string; aoMudar: (v: string) => void; linhas?: number; placeholder?: string }) {
  return <textarea className={classeArea} rows={linhas} value={valor} placeholder={placeholder} onChange={(e) => aoMudar(e.target.value)} />;
}

export function Alternar({ ligado, aoMudar, titulo, descricao }: { ligado: boolean; aoMudar: (v: boolean) => void; titulo: string; descricao?: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} onClick={() => aoMudar(!ligado)} className="flex w-full items-start gap-3 text-left">
      <span className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${ligado ? "bg-linear-to-r from-(--ed-1) to-(--ed-2)" : "bg-white/10"}`}>
        <span className={`size-5 rounded-full bg-white shadow transition ${ligado ? "translate-x-5" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{titulo}</span>
        {descricao && <span className="mt-0.5 block text-xs text-slate-400">{descricao}</span>}
      </span>
    </button>
  );
}

// Botões lado a lado para escolher uma opção.
export function Opcoes<T extends string>({ valor, opcoes, aoMudar }: { valor: T; opcoes: [T, ReactNode][]; aoMudar: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map(([v, rotulo]) => (
        <button
          key={v}
          type="button"
          onClick={() => aoMudar(v)}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
            valor === v ? "bg-white/10 text-white ring-1 ring-(--ed-2)" : "text-slate-300 ring-1 ring-white/10 hover:bg-white/5"
          }`}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}

export function SeletorIcone({ valor, aoMudar }: { valor: IdIcone; aoMudar: (v: IdIcone) => void }) {
  const [aberto, setAberto] = useState(false);
  const Atual = (icones[valor] ?? icones.check).icone;
  return (
    <>
      <button
        type="button"
        title="Trocar ícone"
        onClick={() => setAberto(true)}
        className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/25 text-(--ed-2) hover:border-white/25"
      >
        <Atual className="size-[18px]" />
      </button>
      {aberto &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setAberto(false)} />
            <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1322] p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Escolha um ícone</span>
                <button type="button" aria-label="Fechar" onClick={() => setAberto(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5">
                  <X className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {(Object.keys(icones) as IdIcone[]).map((id) => {
                  const I = icones[id].icone;
                  return (
                    <button
                      key={id}
                      type="button"
                      title={icones[id].nome}
                      onClick={() => {
                        aoMudar(id);
                        setAberto(false);
                      }}
                      className={`grid aspect-square place-items-center rounded-lg transition ${
                        id === valor ? "bg-white/10 text-white ring-1 ring-(--ed-2)" : "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      <I className="size-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// Enviar uma foto (ou vídeo) do computador/celular. Guarda só o endereço.
export function CampoArquivo({
  url,
  aoMudar,
  tipo = "imagem",
  pequeno = false,
  rotuloVazio,
}: {
  url: string | null;
  aoMudar: (url: string | null) => void;
  tipo?: "imagem" | "video";
  pequeno?: boolean;
  rotuloVazio?: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const enviar = useContext(EnvioDeArquivo);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    setProgresso(0);
    try {
      aoMudar((await enviar(arquivo, setProgresso)).url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar");
    } finally {
      setProgresso(null);
      if (entrada.current) entrada.current.value = "";
    }
  }

  const Icone = tipo === "video" ? Film : ImageUp;
  return (
    <div className="min-w-0">
      <input
        ref={entrada}
        type="file"
        hidden
        accept={tipo === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif"}
        onChange={(e) => escolher(e.target.files?.[0])}
      />
      {url && tipo === "imagem" ? (
        <div className={`group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 ${pequeno ? "size-16" : "h-32"}`}>
          <img src={url} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button type="button" onClick={() => entrada.current?.click()} className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/25">
              Trocar
            </button>
            <button type="button" aria-label="Remover" onClick={() => aoMudar(null)} className="rounded-lg bg-white/15 p-1.5 text-red-300 hover:bg-white/25">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={progresso !== null}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 text-xs text-slate-400 hover:border-(--ed-2) hover:text-slate-200 ${
            pequeno ? "size-16" : "h-20 w-full"
          }`}
        >
          {progresso !== null ? (
            <>
              <LoaderCircle className="size-4 animate-spin" /> {progresso}%
            </>
          ) : (
            <>
              <Icone className="size-4" /> {!pequeno && (rotuloVazio ?? (tipo === "video" ? "Enviar vídeo" : "Escolher foto"))}
            </>
          )}
        </button>
      )}
      {erro && <p className="mt-1 text-xs text-red-300">{erro}</p>}
    </div>
  );
}

// ---------- Arrastar para mudar a ordem ----------

const soNaVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 });

// Envolve uma lista em que os itens mudam de ordem arrastando pela alça
// (com o mouse, o dedo ou o teclado: Espaço pega, setas movem, Espaço solta).
export function Ordenavel({ ids, aoMover, children }: { ids: string[]; aoMover: (de: number, para: number) => void; children: ReactNode }) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const aoSoltar = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const de = ids.indexOf(String(active.id));
    const para = ids.indexOf(String(over.id));
    if (de >= 0 && para >= 0) aoMover(de, para);
  };
  return (
    <DndContext sensors={sensores} collisionDetection={closestCenter} modifiers={[soNaVertical]} onDragEnd={aoSoltar}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// Um item dentro de <Ordenavel>: `caixa` vai no elemento do item e `alca` no botão de arrastar.
export function useItemOrdenavel(id: string) {
  const s = useSortable({ id });
  const estilo: CSSProperties = {
    transform: CSS.Translate.toString(s.transform),
    transition: s.transition,
    position: "relative",
    zIndex: s.isDragging ? 20 : undefined,
  };
  return { caixa: { ref: s.setNodeRef, style: estilo }, alca: { ref: s.setActivatorNodeRef, ...s.attributes, ...s.listeners }, arrastando: s.isDragging };
}

export function Alca({ alca, className = "" }: { alca: ReturnType<typeof useItemOrdenavel>["alca"]; className?: string }) {
  return (
    <button
      type="button"
      title="Arraste para mudar a ordem"
      aria-label="Arraste para mudar a ordem"
      {...alca}
      className={`grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white active:cursor-grabbing ${className}`}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

export function mudarOrdem<T>(lista: T[], de: number, para: number): T[] {
  const n = [...lista];
  const [x] = n.splice(de, 1);
  n.splice(para, 0, x);
  return n;
}

// Lista de itens (benefícios, depoimentos, perguntas...): arrastar para mudar
// a ordem, apagar e adicionar.
export function Lista<T extends { id: string }>({
  itens,
  aoMudar,
  novo,
  max = 20,
  rotuloNovo = "Adicionar",
  children,
}: {
  itens: T[];
  aoMudar: (itens: T[]) => void;
  novo: () => Omit<T, "id">;
  max?: number;
  rotuloNovo?: string;
  children: (item: T, muda: (patch: Partial<T>) => void, indice: number) => ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Ordenavel ids={itens.map((x) => x.id)} aoMover={(de, para) => aoMudar(mudarOrdem(itens, de, para))}>
        {itens.map((item, i) => (
          <ItemDaLista key={item.id} id={item.id} aoApagar={() => aoMudar(itens.filter((x) => x.id !== item.id))}>
            {children(item, (patch) => aoMudar(itens.map((x) => (x.id === item.id ? { ...x, ...patch } : x))), i)}
          </ItemDaLista>
        ))}
      </Ordenavel>
      {itens.length < max && (
        <button type="button" onClick={() => aoMudar([...itens, { ...novo(), id: novoId() } as T])} className={`${classeBotaoEd(false, true)} w-fit`}>
          <Plus className="size-3.5" /> {rotuloNovo}
        </button>
      )}
    </div>
  );
}

function ItemDaLista({ id, aoApagar, children }: { id: string; aoApagar: () => void; children: ReactNode }) {
  const { caixa, alca, arrastando } = useItemOrdenavel(id);
  return (
    <div
      {...caixa}
      className={`flex gap-1.5 rounded-xl border p-2 ${arrastando ? "border-(--ed-2) bg-[#131a2c] shadow-xl" : "border-white/[0.07] bg-white/[0.02]"}`}
    >
      <Alca alca={alca} className="mt-1.5 -ml-1" />
      <div className="min-w-0 flex-1">{children}</div>
      <BotaoIcone rotulo="Apagar" perigo onClick={aoApagar}>
        <Trash2 className="size-3.5" />
      </BotaoIcone>
    </div>
  );
}

export function BotaoIcone({
  rotulo,
  onClick,
  disabled,
  perigo,
  ativo,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  disabled?: boolean;
  perigo?: boolean;
  ativo?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`grid size-7 place-items-center rounded-lg transition disabled:opacity-25 ${
        perigo ? "text-slate-400 hover:bg-red-500/15 hover:text-red-300" : ativo ? "text-slate-500 hover:bg-white/10" : "text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
