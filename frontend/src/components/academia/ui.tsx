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

// Cartão com ícone, rótulo e um número em destaque (topo das telas).
export function CardNumero({
  icone: Icone,
  cor,
  rotulo,
  children,
  className = "",
}: {
  icone: LucideIcon;
  cor: string;
  rotulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`!p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${cor}`}>
          <Icone className="size-[18px]" />
        </span>
        <span className="text-[13px] text-slate-300">{rotulo}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">{children}</div>
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
            valor === a.valor ? "bg-violet-600/25 text-white ring-1 ring-violet-500/60" : "text-slate-300 hover:bg-white/5"
          }`}
        >
          {a.rotulo}
          {a.quantidade !== undefined && <span className="ml-1.5 text-xs text-ac-muted">{a.quantidade}</span>}
        </button>
      ))}
    </div>
  );
}

// Cabeçalho padrão das telas: título, descrição e ações à direita.
export function CabecalhoPagina({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-poppins text-[28px] font-bold text-white">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-ac-muted">{descricao}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// Aviso de "nada por aqui" dentro de um card.
export function Vazio({ icone: Icone, children }: { icone: LucideIcon; children: ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <Icone className="mx-auto size-8 text-ac-muted" />
      <p className="mt-2 text-sm text-ac-muted">{children}</p>
    </div>
  );
}
