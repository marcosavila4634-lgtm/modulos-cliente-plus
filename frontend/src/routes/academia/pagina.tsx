import { createFileRoute } from "@tanstack/react-router";
import { EditorPagina } from "../../components/pagina/EditorPagina";
import { apiPagina } from "../../lib/pagina";
import { paginaAcademia, type PaginaAcademiaDados } from "../../lib/pagina-academia";

// Editor da página pública da academia (/a/<slug>). O editor é o mesmo de
// todos os módulos (components/pagina); aqui só entra o adaptador da Academia.
export const Route = createFileRoute("/academia/pagina")({
  loader: () => apiPagina.buscar<PaginaAcademiaDados>(paginaAcademia.modulo),
  component: TelaPagina,
});

function TelaPagina() {
  return <EditorPagina modulo={paginaAcademia} inicial={Route.useLoaderData()} />;
}
