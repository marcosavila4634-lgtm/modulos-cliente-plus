import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import {
  EvolucaoAlunos,
  HorariosPico,
  ReceitaDespesas,
  RequerAtencao,
  TiposPlanos,
  UltimasAtividades,
} from "../../components/academia/Paineis";
import {
  AcoesRapidas,
  BannerMotivacional,
  CheckinsHoje,
  DataDeHoje,
  Indicadores,
  Saudacao,
} from "../../components/academia/Topo";

export const Route = createFileRoute("/academia/")({
  component: Dashboard,
});

const academiaApi = getRouteApi("/academia");

function Dashboard() {
  const d = academiaApi.useLoaderData();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px] [&>*]:min-w-0">
        <div className="flex min-w-0 flex-col gap-4">
          <Saudacao nome={d.gestor.nome} frase={d.frase} />
          <Indicadores dados={d.indicadores} />
          <AcoesRapidas />
        </div>
        <div className="flex flex-col gap-4">
          <DataDeHoje />
          <BannerMotivacional />
          <CheckinsHoje dados={d.indicadores.checkinsHoje} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.75fr_1fr_1.1fr] [&>*]:min-w-0">
        <EvolucaoAlunos dados={d.evolucaoAlunos} />
        <HorariosPico dados={d.horariosPico} />
        <RequerAtencao dados={d.alertas} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1.2fr] [&>*]:min-w-0">
        <ReceitaDespesas dados={d.receitaDespesas} />
        <TiposPlanos dados={d.tiposPlanos} total={d.indicadores.alunosAtivos.valor} />
        <UltimasAtividades dados={d.atividades} />
      </div>
    </div>
  );
}
