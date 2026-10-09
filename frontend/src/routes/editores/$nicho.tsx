import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditorPagina } from "../../components/pagina/EditorPagina";
import { apiPagina } from "../../lib/pagina";
import { nichos, type NichoDados } from "../../lib/pagina-nichos";

// Editor da página de um nicho (barbearia, salão, terapeutas). É o editor de
// todos os módulos (components/pagina); aqui só entra o adaptador do nicho.
export const Route = createFileRoute("/editores/$nicho")({
  loader: ({ params }) => {
    const nicho = nichos[params.nicho];
    if (!nicho) throw notFound();
    return apiPagina.buscar<NichoDados>(nicho.modulo);
  },
  component: Tela,
});

function Tela() {
  const { nicho } = Route.useParams();
  // key: trocar de nicho abre um editor novo (sem misturar o que estava sendo editado)
  return <EditorPagina key={nicho} modulo={nichos[nicho]} inicial={Route.useLoaderData()} />;
}
