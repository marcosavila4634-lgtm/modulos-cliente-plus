import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { PaginaPublica } from "../components/pagina/PaginaPublica";
import { completar, linkZap, moeda, type PlanoPagina } from "../lib/pagina";
import { buscarPaginaDoNicho, nichos } from "../lib/pagina-nichos";

// Página pública da loja de exemplo de um nicho (/n/barbearia, /n/salao,
// /n/terapeuta), montada no editor de /editores/<nicho>. No sistema principal
// é a página da loja (/loja/:slug). O botão do plano abre o WhatsApp.
export const Route = createFileRoute("/n/$nicho")({
  loader: ({ params }) => buscarPaginaDoNicho(params.nicho),
  component: PaginaDoNicho,
});

function PaginaDoNicho() {
  const a = Route.useLoaderData();
  const nicho = nichos[a.nicho];
  const dados = useMemo(() => nicho.normalizar(a), [nicho, a]);
  const pagina = useMemo(() => completar(a.pagina, dados, nicho.padrao(a)), [nicho, a, dados]);

  useEffect(() => {
    document.title = a.nome;
  }, [a.nome]);

  function escolher(p: PlanoPagina) {
    const zap = linkZap(a.whatsapp, `Olá! Quero assinar o plano ${p.nome} (${moeda(p.preco)} ${p.periodo}).`);
    if (zap) window.open(zap, "_blank", "noopener");
    else document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
  }

  return <PaginaPublica pagina={pagina} dados={dados} aoEscolherPlano={escolher} />;
}
