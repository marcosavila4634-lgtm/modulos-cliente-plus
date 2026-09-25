import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  Clock,
  Dumbbell,
  FlaskConical,
  Gift,
  Repeat,
  TriangleAlert,
  UserRound,
  Wallet,
  Weight,
} from "lucide-react";
import { useState } from "react";
import { MiniaturaExercicio, VideoExercicio } from "../components/academia/MidiaExercicio";
import { fmt } from "../lib/academia-alunos";
import { apiTreinos, descanso, seriesERepeticoes, type ItemFicha } from "../lib/academia-treinos";

// SIMULAÇÃO da área do cliente do Cliente Plus (projeto principal), aba
// "Meu treino". No Cliente Plus o aluno entra logado; aqui ele é escolhido
// pelo endereço /cliente/<id do aluno>.
export const Route = createFileRoute("/cliente/$alunoId")({
  loader: ({ params }) => apiTreinos.treinoDoAluno(params.alunoId),
  component: AreaDoCliente,
});

function AreaDoCliente() {
  const { academia, aluno, ficha } = Route.useLoaderData();
  const [aba, setAba] = useState<"treino" | "indicacoes" | "carteira">("treino");
  const [treino, setTreino] = useState(0);
  const primeiroNome = aluno.split(" ")[0];
  const atual = ficha?.treinos[treino];

  return (
    <div className="min-h-full bg-bg">
      <div className="bg-violet-950/60 px-4 py-1.5 text-center text-[11px] text-violet-200">
        <FlaskConical className="mr-1 inline size-3" />
        Laboratório: simulação da área do cliente do Cliente Plus
      </div>

      <div className="mx-auto flex max-w-md flex-col pb-24">
        <header className="bg-brand-gradient rounded-b-3xl px-5 pt-5 pb-6 text-white">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold">Cliente Plus</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{academia}</span>
          </div>
          <p className="mt-5 text-sm text-white/80">Olá,</p>
          <h1 className="font-display text-2xl font-bold">{primeiroNome}</h1>
        </header>

        {aba === "treino" ? (
          <main className="flex flex-col gap-4 px-4 pt-5">
            {!ficha ? (
              <div className="rounded-2xl border border-line bg-surface p-6 text-center">
                <Dumbbell className="mx-auto size-8 text-muted" />
                <p className="mt-3 font-medium">Você ainda não tem ficha de treino</p>
                <p className="mt-1 text-sm text-muted">Fale com o seu professor ou com a recepção da academia.</p>
              </div>
            ) : (
              <>
                <section className="rounded-2xl border border-line bg-surface p-4">
                  <div className="text-xs text-muted">Minha ficha</div>
                  <h2 className="font-display text-lg font-semibold">{ficha.nome}</h2>
                  {ficha.objetivo && <p className="text-sm text-muted">{ficha.objetivo}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <UserRound className="size-3.5" />
                      {ficha.professor?.nome ?? "—"}
                    </span>
                    <span>Válida até {fmt.data(ficha.validade)}</span>
                  </div>
                  {ficha.situacao !== "em_dia" && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                      {ficha.situacao === "vencida"
                        ? "Sua ficha venceu. Peça ao professor para renovar o treino."
                        : "Sua ficha vence em breve. Converse com o professor sobre o próximo treino."}
                    </div>
                  )}
                  {ficha.observacoes && (
                    <p className="mt-3 border-t border-line pt-3 text-sm whitespace-pre-line">{ficha.observacoes}</p>
                  )}
                </section>

                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {ficha.treinos.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTreino(i)}
                      className={`shrink-0 rounded-2xl border px-4 py-2 text-left transition ${
                        treino === i ? "bg-brand-gradient border-transparent text-white" : "border-line bg-surface"
                      }`}
                    >
                      <div className="font-display text-sm font-bold">Treino {t.letra}</div>
                      <div className={`max-w-[9rem] truncate text-[11px] ${treino === i ? "text-white/85" : "text-muted"}`}>
                        {t.nome || `${t.exercicios.length} exercícios`}
                      </div>
                    </button>
                  ))}
                </div>

                <ol className="flex flex-col gap-3">
                  {atual?.exercicios.map((item, i) => <CartaoExercicio key={item.id} numero={i + 1} item={item} />)}
                  {atual && atual.exercicios.length === 0 && (
                    <li className="py-6 text-center text-sm text-muted">Nenhum exercício neste treino.</li>
                  )}
                </ol>
              </>
            )}
          </main>
        ) : (
          <main className="px-4 pt-5">
            <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
              Esta parte já existe no Cliente Plus ({aba === "indicacoes" ? "rede de indicações" : "carteira e saques"}
              ). Aqui no laboratório só a aba de treino foi simulada.
            </div>
          </main>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {(
            [
              ["treino", "Meu treino", Dumbbell],
              ["indicacoes", "Indicações", Gift],
              ["carteira", "Carteira", Wallet],
            ] as const
          ).map(([valor, rotulo, Icone]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setAba(valor)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                aba === valor ? "text-brand" : "text-muted"
              }`}
            >
              <Icone className="size-5" />
              {rotulo}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function CartaoExercicio({ numero, item }: { numero: number; item: ItemFicha }) {
  const [aberto, setAberto] = useState(false);
  const e = item.exercicio;
  const temDetalhes = !!(e.instrucoes || e.imagemUrl || e.videoUrl || e.videoLink || item.observacao);

  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        disabled={!temDetalhes}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <MiniaturaExercicio exercicio={e} className="size-14 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-muted">Exercício {numero}</div>
          <div className="truncate font-semibold">{e.nome}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
            {seriesERepeticoes(item) && (
              <span className="flex items-center gap-1 font-medium text-fg">
                <Repeat className="size-3.5 text-brand" />
                {seriesERepeticoes(item)}
              </span>
            )}
            {item.carga && (
              <span className="flex items-center gap-1">
                <Weight className="size-3.5" />
                {item.carga}
              </span>
            )}
            {item.descansoSegundos !== null && item.descansoSegundos > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {descanso(item.descansoSegundos)}
              </span>
            )}
          </div>
        </div>
        {temDetalhes && (
          <ChevronDown className={`size-5 shrink-0 text-muted transition ${aberto ? "rotate-180" : ""}`} />
        )}
      </button>
      {aberto && (
        <div className="flex flex-col gap-3 border-t border-line p-3">
          {item.observacao && (
            <p className="rounded-xl bg-brand/10 px-3 py-2 text-sm text-violet-200">{item.observacao}</p>
          )}
          {e.imagemUrl && <img src={e.imagemUrl} alt={e.nome} className="w-full rounded-xl" />}
          <VideoExercicio exercicio={e} />
          {e.instrucoes && <p className="text-sm leading-relaxed text-muted">{e.instrucoes}</p>}
        </div>
      )}
    </li>
  );
}
