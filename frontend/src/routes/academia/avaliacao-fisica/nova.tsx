import { createFileRoute, redirect } from "@tanstack/react-router";
import { FormAvaliacao } from "../../../components/academia/FormAvaliacao";
import { hojeIso } from "../../../lib/academia-alunos";
import { apiAvaliacoes, type DadosAvaliacao } from "../../../lib/academia-avaliacoes";
import { apiTreinos } from "../../../lib/academia-treinos";

type Busca = { aluno?: string };

// Nova avaliação. Sexo, altura e objetivo vêm da avaliação anterior.
export const Route = createFileRoute("/academia/avaliacao-fisica/nova")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    aluno: typeof s.aluno === "string" ? s.aluno : undefined,
  }),
  loaderDeps: ({ search }) => ({ aluno: search.aluno }),
  loader: async ({ deps }) => {
    if (!deps.aluno) throw redirect({ to: "/academia/avaliacao-fisica" });
    const [historico, profissionais] = await Promise.all([
      apiAvaliacoes.historico(deps.aluno),
      apiTreinos.profissionais(),
    ]);
    return { historico, profissionais };
  },
  component: NovaAvaliacao,
});

function NovaAvaliacao() {
  const { historico, profissionais } = Route.useLoaderData();
  const anterior = historico.avaliacoes[0];
  const vazio = { peitoral: null, axilar: null, triceps: null, subescapular: null, abdominal: null, suprailiaca: null, coxa: null };
  const inicial: DadosAvaliacao = {
    alunoId: historico.aluno.id,
    profissionalId: anterior?.profissional?.id ?? null,
    data: hojeIso(),
    sexo: historico.sexo,
    idade: null,
    peso: null,
    alturaCm: anterior?.alturaCm ?? null,
    metodoGordura: anterior?.metodoGordura ?? "bioimpedancia",
    gorduraPct: null,
    dobras: vazio,
    medidas: {
      peitoral: null,
      cintura: null,
      abdomen: null,
      quadril: null,
      bracoDireito: null,
      bracoEsquerdo: null,
      coxaDireita: null,
      coxaEsquerda: null,
      panturrilha: null,
    },
    pressaoSistolica: null,
    pressaoDiastolica: null,
    fcRepouso: null,
    objetivo: anterior?.objetivo ?? "",
    restricoes: anterior?.restricoes ?? "",
    observacoes: "",
  };
  return (
    <FormAvaliacao
      aluno={historico.aluno}
      inicial={inicial}
      profissionais={profissionais}
      idadeCalculada={historico.idadeAtual}
    />
  );
}
