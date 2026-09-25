import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRight, Blocks, CheckCircle2, Hammer, Rocket } from "lucide-react";
import type { ComponentType } from "react";
import { StatusBadge } from "../../components/StatusBadge";

export const Route = createFileRoute("/_lab/")({
  component: VisaoGeral,
});

const labApi = getRouteApi("/_lab");

function VisaoGeral() {
  const modulos = labApi.useLoaderData();
  const contar = (s: string) => modulos.filter((m) => m.status === s).length;

  return (
    <>
      <h1 className="font-display text-4xl font-bold">Visão geral</h1>
      <p className="mt-1 text-muted">
        Crie e teste novos módulos aqui antes de levá-los ao Cliente Plus.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador icone={Blocks} valor={modulos.length} rotulo="Módulos no laboratório" />
        <Indicador icone={Hammer} valor={contar("em_desenvolvimento")} rotulo="Em desenvolvimento" />
        <Indicador icone={Rocket} valor={contar("pronto_para_migrar")} rotulo="Prontos para migrar" />
        <Indicador icone={CheckCircle2} valor={contar("migrado")} rotulo="Já no Cliente Plus" />
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Módulos</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {modulos.map((m) => (
          <Link
            key={m.id}
            to="/modulos/$slug"
            params={{ slug: m.slug }}
            className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-brand/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted">{m.segmento}</div>
                <div className="mt-0.5 font-display text-lg font-semibold">{m.nome}</div>
              </div>
              <ArrowUpRight className="size-4 text-muted transition-colors group-hover:text-brand" />
            </div>
            <p className="mt-2 text-sm text-muted">{m.descricao}</p>
            <div className="mt-4">
              <StatusBadge status={m.status} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function Indicador({
  icone: Icone,
  valor,
  rotulo,
}: {
  icone: ComponentType<{ className?: string }>;
  valor: number;
  rotulo: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <Icone className="size-5 text-brand" />
      <div className="mt-4 font-display text-3xl font-bold">{valor}</div>
      <div className="mt-1 text-sm text-muted">{rotulo}</div>
    </div>
  );
}
