import { createFileRoute } from "@tanstack/react-router";
import { BotaoGuia } from "../../components/grupo-vip/Ajuda";
import { EditorPagina } from "../../components/pagina/EditorPagina";
import type { PaginaVendas } from "../../lib/grupo-vip-publico";
import { apiPagina } from "../../lib/pagina";
import { paginaGrupoVip } from "../../lib/pagina-grupo-vip";

// Editor da página de vendas (/g/<slug>). O editor é o mesmo de todos os
// módulos (components/pagina); aqui só entra o adaptador dos Grupos VIP.
export const Route = createFileRoute("/grupo-vip/pagina")({
  loader: () => apiPagina.buscar<PaginaVendas>(paginaGrupoVip.modulo),
  component: TelaPagina,
});

function TelaPagina() {
  return <EditorPagina modulo={paginaGrupoVip} inicial={Route.useLoaderData()} ajuda={<BotaoGuia id="pagina" />} />;
}
