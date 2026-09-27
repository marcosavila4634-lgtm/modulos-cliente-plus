import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-gv-line bg-gradient-to-b from-gv-card-2/70 to-gv-card p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] ${className}`}
    >
      {children}
    </section>
  );
}

export function TituloCard({
  icone: Icone,
  cor = "text-orange-400",
  children,
  acao,
}: {
  icone: LucideIcon;
  cor?: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-poppins text-[14px] font-semibold text-white">
        <Icone className={`size-[18px] ${cor}`} />
        {children}
      </h2>
      {acao}
    </div>
  );
}

// "Ver todos" que leva a outra tela do módulo.
export function LinkVerTodos({ para, children = "Ver todos", seta = false }: { para: string; children?: ReactNode; seta?: boolean }) {
  return (
    <Link
      to={para}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium whitespace-nowrap text-orange-400 underline underline-offset-2 hover:text-orange-300"
    >
      {children}
      {seta && <ArrowRight className="size-3.5" />}
    </Link>
  );
}

export const classeBotaoLaranja =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-[0_6px_18px_-8px_rgba(249,115,22,0.9)] transition-[filter] hover:brightness-110";

export function Variacao({ valor, melhorQuandoCai = false }: { valor: number; melhorQuandoCai?: boolean }) {
  const subiu = valor >= 0;
  const bom = melhorQuandoCai ? !subiu : subiu;
  const Seta = subiu ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${bom ? "text-emerald-400" : "text-red-400"}`}>
      <Seta className="size-3.5" strokeWidth={2.75} />
      {Math.abs(valor)}%
    </span>
  );
}

export function SeletorPeriodo({ valor, aoMudar }: { valor: number; aoMudar: (meses: number) => void }) {
  return (
    <label className="relative">
      <select
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="appearance-none rounded-lg border border-gv-line bg-gv-card py-1.5 pr-8 pl-3 text-xs text-slate-200 outline-none hover:border-slate-600"
      >
        <option value={3}>Últimos 3 meses</option>
        <option value={6}>Últimos 6 meses</option>
        <option value={7}>Últimos 7 meses</option>
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-gv-muted" />
    </label>
  );
}

// Cabeçalho padrão das telas: título, descrição e ações à direita.
export function CabecalhoPagina({ titulo, descricao, children }: { titulo: string; descricao?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-poppins text-[26px] font-bold text-white md:text-[28px]">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-3xl text-sm text-gv-muted">{descricao}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 print:hidden">{children}</div>}
    </div>
  );
}

// Cartão com ícone, rótulo e um número em destaque (topo das telas).
export function CardNumero({
  icone: Icone,
  cor,
  rotulo,
  valor,
  detalhe,
}: {
  icone: LucideIcon;
  cor: string;
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
}) {
  return (
    <Card className="flex items-center gap-3 !px-3.5">
      <span className={`grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-b ${cor}`}>
        <Icone className="size-[21px] text-white" />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="text-[11.5px] text-slate-300">{rotulo}</div>
        <div className="mt-1 font-poppins text-[20px] font-bold whitespace-nowrap text-white">{valor}</div>
        {detalhe && <div className="mt-0.5 text-[11px] text-gv-muted">{detalhe}</div>}
      </div>
    </Card>
  );
}

// Abas em forma de "pílula" (filtros das listas).
export function Abas<T extends string>({
  abas,
  valor,
  aoMudar,
}: {
  abas: { valor: T; rotulo: string; quantidade?: number }[];
  valor: T;
  aoMudar: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {abas.map((a) => (
        <button
          key={a.valor}
          type="button"
          onClick={() => aoMudar(a.valor)}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
            valor === a.valor ? "bg-orange-500/20 text-white ring-1 ring-orange-500/60" : "text-slate-300 hover:bg-white/5"
          }`}
        >
          {a.rotulo}
          {a.quantidade !== undefined && <span className="ml-1.5 text-xs text-gv-muted">{a.quantidade}</span>}
        </button>
      ))}
    </div>
  );
}

// Aviso de "nada por aqui" dentro de um card.
export function Vazio({ icone: Icone, children }: { icone: LucideIcon; children: ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <Icone className="mx-auto size-8 text-gv-muted" />
      <div className="mt-2 text-sm text-gv-muted">{children}</div>
    </div>
  );
}

// Caixa de explicação (como funciona).
export function Dica({ icone: Icone, children, cor = "sky" }: { icone: LucideIcon; children: ReactNode; cor?: "sky" | "amber" | "emerald" }) {
  const cores = {
    sky: "border-sky-500/30 bg-sky-500/[0.07] text-sky-100",
    amber: "border-amber-500/30 bg-amber-500/[0.07] text-amber-100",
    emerald: "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-100",
  };
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] leading-relaxed ${cores[cor]}`}>
      <Icone className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export const cabecalhoTabela = "border-b border-gv-line text-[11px] tracking-wide text-gv-muted uppercase";
