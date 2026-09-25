import { ArrowDown, ArrowUp, ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-ac-line bg-gradient-to-b from-ac-card-2/70 to-ac-card p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] ${className}`}
    >
      {children}
    </section>
  );
}

export function TituloCard({
  icone: Icone,
  cor,
  children,
  acao,
}: {
  icone: LucideIcon;
  cor: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-poppins text-[15px] font-semibold text-white">
        <Icone className={`size-5 ${cor}`} />
        {children}
      </h2>
      {acao}
    </div>
  );
}

// Variação percentual. "melhorQuandoCai" deixa verde uma queda (ex.: inadimplência).
export function Variacao({ valor, melhorQuandoCai = false }: { valor: number; melhorQuandoCai?: boolean }) {
  const subiu = valor >= 0;
  const bom = melhorQuandoCai ? !subiu : subiu;
  const Seta = subiu ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[13px] font-semibold ${bom ? "text-emerald-400" : "text-red-400"}`}>
      <Seta className="size-3.5" strokeWidth={2.5} />
      {Math.abs(valor)}%
    </span>
  );
}

export function SeletorPeriodo({
  valor,
  aoMudar,
}: {
  valor: number;
  aoMudar: (meses: number) => void;
}) {
  return (
    <label className="relative">
      <select
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="appearance-none rounded-lg border border-ac-line bg-ac-card py-1.5 pr-8 pl-3 text-xs text-slate-200 outline-none hover:border-slate-600"
      >
        <option value={3}>Últimos 3 meses</option>
        <option value={6}>Últimos 6 meses</option>
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ac-muted" />
    </label>
  );
}

export function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-300">
      {itens.map((i) => (
        <span key={i.rotulo} className="inline-flex items-center gap-2">
          <span className="size-3 rounded-[3px]" style={{ background: i.cor }} />
          {i.rotulo}
        </span>
      ))}
    </div>
  );
}
