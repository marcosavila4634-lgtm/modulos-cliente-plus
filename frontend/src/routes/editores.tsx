import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, LayoutTemplate } from "lucide-react";
import { modelos } from "../lib/pagina-modelos";

// Área "Editores de página por nicho": separada dos módulos, para ser fácil
// de achar e de levar ao sistema principal. Cada nicho abre o mesmo editor
// (components/pagina) já com o modelo pronto dele (lib/pagina-modelos.ts).
export const Route = createFileRoute("/editores")({
  component: LayoutEditores,
});

function LayoutEditores() {
  const aba = "rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/5";
  return (
    <div className="flex h-full flex-col bg-[#070b14] text-slate-100">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 px-5 py-3">
        <Link to="/editores" className="flex items-center gap-2 font-display text-[15px] font-semibold text-white">
          <LayoutTemplate className="size-5 text-fuchsia-400" /> Editores de página por nicho
        </Link>
        <nav className="flex flex-wrap gap-1.5">
          {modelos.map((m) => (
            <Link key={m.chave} to="/editores/$nicho" params={{ nicho: m.chave }} className={aba} activeProps={{ className: `${aba} bg-white/10 !text-white ring-fuchsia-400` }}>
              {m.nome}
            </Link>
          ))}
        </nav>
        <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white">
          <ArrowLeft className="size-4" /> Laboratório
        </Link>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1500px] px-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
