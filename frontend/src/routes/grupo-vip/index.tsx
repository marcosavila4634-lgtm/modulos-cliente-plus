import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import {
  ConteudosMaisAcessados,
  CrescimentoMembros,
  MembrosRecentes,
  PlanosMembros,
  RodapeGrupoVip,
  UltimosAvisos,
} from "../../components/grupo-vip/Paineis";
import {
  AtalhosGrupoVip,
  BoasVindas,
  CardConvite,
  CardFrase,
  EstaSemana,
  IndicadoresGrupoVip,
  MeusGrupos,
  ProximosEventos,
} from "../../components/grupo-vip/Topo";

export const Route = createFileRoute("/grupo-vip/")({
  component: Dashboard,
});

const grupoVipApi = getRouteApi("/grupo-vip");

function Dashboard() {
  const d = grupoVipApi.useLoaderData();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] [&>*]:min-w-0">
        <div className="flex flex-col gap-3.5 [&>*]:min-w-0">
          <BoasVindas nome={d.gestor.nome} frase={d.frase} />
          <IndicadoresGrupoVip dados={d.indicadores} />
          <AtalhosGrupoVip />
          <div className="grid gap-3.5 lg:grid-cols-[1.75fr_1fr] [&>*]:min-w-0">
            <MembrosRecentes membros={d.membrosRecentes} />
            <CrescimentoMembros serie={d.crescimentoMembros} indicadores={d.indicadores} />
          </div>
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1.1fr] [&>*]:min-w-0">
            <ConteudosMaisAcessados conteudos={d.conteudosMaisAcessados} />
            <PlanosMembros planos={d.planosMembros} total={d.indicadores.membrosAtivos.valor} />
            <UltimosAvisos avisos={d.avisos} />
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <EstaSemana />
          <CardFrase frase={d.fraseDestaque} />
          <MeusGrupos grupos={d.grupos} />
          <ProximosEventos eventos={d.proximosEventos} />
          <CardConvite />
        </div>
      </div>

      <RodapeGrupoVip />
    </div>
  );
}
