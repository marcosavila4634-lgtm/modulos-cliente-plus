import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarGrupoVip } from "../components/grupo-vip/SidebarGrupoVip";
import { TopbarGrupoVip } from "../components/grupo-vip/TopbarGrupoVip";
import { buscarDashboard } from "../lib/grupo-vip";

// Layout do módulo Grupos VIP (Telegram e WhatsApp): menu lateral + barra do topo.
// O loader traz o Dashboard (também usado pelos avisos do sininho); cada tela
// chama router.invalidate() depois de uma alteração para tudo se atualizar.
export const Route = createFileRoute("/grupo-vip")({
  loader: buscarDashboard,
  component: LayoutGrupoVip,
});

function LayoutGrupoVip() {
  const d = Route.useLoaderData();
  const [recolhida, setRecolhida] = useState(false); // computador: menu só com ícones
  const [aberta, setAberta] = useState(false); // celular: menu por cima da tela

  const alternarMenu = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setRecolhida((v) => !v);
    else setAberta((v) => !v);
  };

  const iniciais = `${d.gestor.nome[0] ?? ""}${d.gestor.sobrenome[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex h-full bg-gv-bg text-slate-100">
      <div className="hidden h-full lg:block print:hidden">
        <SidebarGrupoVip gestor={d.gestor} recolhida={recolhida} />
      </div>

      {aberta && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAberta(false)} />
          <div className="relative h-full w-fit">
            <SidebarGrupoVip gestor={d.gestor} recolhida={false} aoNavegar={() => setAberta(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopbarGrupoVip
          nomeNegocio={d.grupoAtual.nome}
          iniciais={iniciais}
          alertas={d.alertas}
          paginaVendas={d.paginaVendas}
          aoAlternarMenu={alternarMenu}
        />
        <main className="flex-1 px-4 pt-1 pb-8 md:px-6 print:px-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
