import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";

export const Route = createFileRoute("/_lab/modulos/$slug")({
  loader: ({ params }) => api.modulo(params.slug),
  component: PaginaModulo,
});

// Módulos que já têm telas próprias e a rota onde abrem.
const rotaDoModulo = { academia: "/academia", "grupo-vip": "/grupo-vip" } as const;

function PaginaModulo() {
  const modulo = Route.useLoaderData();
  const rota = rotaDoModulo[modulo.slug as keyof typeof rotaDoModulo];

  return (
    <>
      <div className="text-sm text-muted">{modulo.segmento}</div>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold">{modulo.nome}</h1>
        <StatusBadge status={modulo.status} />
      </div>
      <p className="mt-2 max-w-2xl text-muted">{modulo.descricao}</p>

      {rota ? (
        <Link
          to={rota}
          className="bg-brand-gradient mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium text-white"
        >
          Abrir módulo
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Sparkles className="mx-auto size-8 text-brand" />
          <h2 className="mt-3 font-display text-xl font-semibold">Este módulo ainda não tem telas</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Quando começarmos a construir o módulo, as telas dele vão aparecer aqui.
          </p>
        </div>
      )}
    </>
  );
}
