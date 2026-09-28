import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { PaginaPublica } from "../components/pagina/PaginaPublica";
import { completar, linkZap, moeda, type PlanoPagina } from "../lib/pagina";
import { buscarPaginaAcademia, paginaAcademia } from "../lib/pagina-academia";

// Página pública da academia: planos, aulas, horários, equipe e contato.
// Aparência e textos vêm do editor de páginas (Academia > Página da academia;
// components/pagina). A matrícula continua na recepção: o botão do plano abre
// o WhatsApp da academia com o plano escolhido.
export const Route = createFileRoute("/a/$slug")({
  loader: ({ params }) => buscarPaginaAcademia(params.slug),
  component: PaginaAcademiaPublica,
});

function PaginaAcademiaPublica() {
  const a = Route.useLoaderData();
  const dados = useMemo(() => paginaAcademia.normalizar(a), [a]);
  const pagina = useMemo(() => completar(a.pagina, dados, paginaAcademia.padrao(a)), [a, dados]);

  useEffect(() => {
    document.title = a.nome;
  }, [a.nome]);

  function escolher(p: PlanoPagina) {
    const zap = linkZap(a.whatsapp, `Olá! Quero me matricular no plano ${p.nome} (${moeda(p.preco)} ${p.periodo}).`);
    if (zap) window.open(zap, "_blank", "noopener");
    else if (a.telefone) window.location.href = `tel:${a.telefone}`;
    else document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
  }

  return <PaginaPublica pagina={pagina} dados={dados} aoEscolherPlano={escolher} />;
}
