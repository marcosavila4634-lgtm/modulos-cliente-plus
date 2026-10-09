import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarAcademia } from "../components/academia/SidebarAcademia";
import { TopbarAcademia } from "../components/academia/TopbarAcademia";
import { buscarDashboard } from "../lib/academia";
import { apiLutas } from "../lib/artes-marciais";
import { ehArtesMarciais } from "../lib/modulo-atual";

// Layout do módulo Academia (Gestão Plus Academia) e do Artes Marciais (as
// mesmas telas em /artes-marciais, ver lib/modulo-atual.ts): menu lateral +
// barra do topo.
export const Route = createFileRoute("/academia")({
  // No Artes Marciais (/artes-marciais) também carrega o painel de luta.
  loader: async () => {
    const [academia, lutas] = await Promise.all([
      buscarDashboard(),
      ehArtesMarciais() ? apiLutas.dashboard() : Promise.resolve(null),
    ]);
    return { ...academia, lutas };
  },
  component: LayoutAcademia,
});

function LayoutAcademia() {
  const d = Route.useLoaderData();
  const [recolhida, setRecolhida] = useState(false); // computador: menu só com ícones
  const [aberta, setAberta] = useState(false); // celular: menu por cima da tela

  const alternarMenu = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setRecolhida((v) => !v);
    else setAberta((v) => !v);
  };

  const sidebar = { nomeAcademia: d.academia.nome, gestor: d.gestor };

  return (
    <div className="flex h-full bg-ac-bg text-slate-100">
      <div className="hidden h-full lg:block print:hidden">
        <SidebarAcademia {...sidebar} recolhida={recolhida} />
      </div>

      {aberta && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAberta(false)} />
          <div className="relative h-full w-fit">
            <SidebarAcademia {...sidebar} recolhida={false} aoNavegar={() => setAberta(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopbarAcademia
          nomeAcademia={d.academia.nome}
          alertas={d.lutas ? [...d.alertas, ...d.lutas.alertas] : d.alertas}
          demo={d.demo}
          aoAlternarMenu={alternarMenu}
        />
        <main className="flex-1 px-4 pt-2 pb-8 md:px-6 print:px-0">
          <Outlet />
        </main>
        {d.lutas && <RodapeLutas lema={d.lutas.lema} />}
      </div>
    </div>
  );
}

// Faixa do rodapé do Artes Marciais (lema da academia).
function RodapeLutas({ lema }: { lema: string }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ac-line px-4 py-3 text-[10.5px] font-semibold tracking-[0.25em] text-ac-muted uppercase md:px-6 print:hidden">
      <span className="flex items-center gap-3">
        <svg viewBox="0 0 40 14" className="h-3.5 w-10" aria-hidden>
          <path d="M0 14 L22 0 L18 8 L40 4 L12 14 Z" fill="#dc2626" />
        </svg>
        {lema}
      </span>
      <span className="tracking-[0.2em]">
        Gestão Plus <span className="mx-1 text-ac-line">|</span> Artes Marciais
      </span>
    </footer>
  );
}
