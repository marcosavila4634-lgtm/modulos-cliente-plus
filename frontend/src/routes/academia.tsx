import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarAcademia } from "../components/academia/SidebarAcademia";
import { TopbarAcademia } from "../components/academia/TopbarAcademia";
import { buscarDashboard } from "../lib/academia";

// Layout do módulo Academia (Gestão Plus Academia): menu lateral + barra do topo.
export const Route = createFileRoute("/academia")({
  loader: buscarDashboard,
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
      <div className="hidden h-full lg:block">
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
          notificacoes={d.notificacoes}
          demo={d.demo}
          aoAlternarMenu={alternarMenu}
        />
        <main className="flex-1 px-4 pt-2 pb-8 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
