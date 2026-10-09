import { Link } from "@tanstack/react-router";
import { Blocks, Dumbbell, GraduationCap, LayoutGrid, LayoutTemplate, Scissors, Send, Stethoscope } from "lucide-react";
import type { ComponentType } from "react";
import type { Modulo } from "../lib/api";

const icones: Record<string, ComponentType<{ className?: string }>> = {
  "agenda-barbearia": Scissors,
  academia: Dumbbell,
  consultorio: Stethoscope,
  escola: GraduationCap,
  "grupo-vip": Send,
};

const itemBase =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg";
const itemAtivo = "bg-brand-gradient !text-white font-medium";

export function Sidebar({ modulos }: { modulos: Modulo[] }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-bg">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="bg-brand-gradient grid size-10 place-items-center rounded-xl font-display text-lg font-bold text-white">
          C+
        </div>
        <div className="leading-tight">
          <div className="font-display font-semibold">Cliente Plus</div>
          <div className="text-xs text-muted">Laboratório de módulos</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        <Link to="/" className={itemBase} activeProps={{ className: itemAtivo }} activeOptions={{ exact: true }}>
          <LayoutGrid className="size-4" />
          Visão geral
        </Link>

        {/* área separada dos módulos: o editor de páginas com os modelos por nicho */}
        <Link to="/editores" className={itemBase}>
          <LayoutTemplate className="size-4" />
          Editores de página
        </Link>

        <div className="mt-5 mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted/70">
          Módulos
        </div>
        {modulos.map((m) => {
          const Icone = icones[m.slug] ?? Blocks;
          return (
            <Link
              key={m.id}
              to="/modulos/$slug"
              params={{ slug: m.slug }}
              className={itemBase}
              activeProps={{ className: itemAtivo }}
            >
              <Icone className="size-4" />
              <span className="truncate">{m.nome}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
