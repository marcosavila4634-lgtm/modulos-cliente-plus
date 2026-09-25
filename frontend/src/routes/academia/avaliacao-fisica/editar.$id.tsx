import { createFileRoute } from "@tanstack/react-router";
import { FormAvaliacao } from "../../../components/academia/FormAvaliacao";
import { apiAvaliacoes } from "../../../lib/academia-avaliacoes";
import { apiTreinos } from "../../../lib/academia-treinos";

export const Route = createFileRoute("/academia/avaliacao-fisica/editar/$id")({
  loader: async ({ params }) => {
    const avaliacao = await apiAvaliacoes.buscar(params.id);
    const [historico, profissionais] = await Promise.all([
      apiAvaliacoes.historico(avaliacao.aluno.id),
      apiTreinos.profissionais(),
    ]);
    return { avaliacao, historico, profissionais };
  },
  component: EditarAvaliacao,
});

function EditarAvaliacao() {
  const { avaliacao: a, historico, profissionais } = Route.useLoaderData();
  return (
    <FormAvaliacao
      aluno={a.aluno}
      avaliacaoId={a.id}
      profissionais={profissionais}
      // com data de nascimento cadastrada, a idade é calculada pelo sistema
      idadeCalculada={historico.idadeAtual !== null ? a.idade : null}
      inicial={{
        alunoId: a.aluno.id,
        profissionalId: a.profissional?.id ?? null,
        data: a.data,
        sexo: a.sexo,
        idade: a.idade,
        peso: a.peso,
        alturaCm: a.alturaCm,
        metodoGordura: a.metodoGordura,
        gorduraPct: a.metodoGordura === "bioimpedancia" ? a.gorduraPct : null,
        dobras: a.dobras,
        medidas: a.medidas,
        pressaoSistolica: a.pressaoSistolica,
        pressaoDiastolica: a.pressaoDiastolica,
        fcRepouso: a.fcRepouso,
        objetivo: a.objetivo,
        restricoes: a.restricoes,
        observacoes: a.observacoes,
      }}
    />
  );
}
