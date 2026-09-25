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

export function LinkVerTodos({ children = "Ver todos", seta = false }: { children?: ReactNode; seta?: boolean }) {
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium whitespace-nowrap text-orange-400 underline underline-offset-2 hover:text-orange-300"
    >
      {children}
      {seta && <ArrowRight className="size-3.5" />}
    </button>
  );
}

export function BotaoLaranja({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-[0_6px_18px_-8px_rgba(249,115,22,0.9)] transition-[filter] hover:brightness-110 ${className}`}
    >
      {children}
    </button>
  );
}

export function Variacao({ valor }: { valor: number }) {
  const Seta = valor >= 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[13px] font-semibold ${valor >= 0 ? "text-emerald-400" : "text-red-400"}`}
    >
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
