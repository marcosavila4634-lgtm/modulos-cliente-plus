import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Smartphone,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { SeletorAluno } from "../../../components/academia/SeletorAluno";
import { AvatarAluno } from "../../../components/academia/Selos";
import { Botao, MensagemErro, mensagemDe } from "../../../components/academia/formulario";
import { Card, CardNumero, TituloCard, Vazio } from "../../../components/academia/ui";
import {
  apiAgenda,
  corAula,
  dataLocal,
  horaDe,
  rotuloPresenca,
  somarDias,
  type SessaoAula,
  type StatusPresenca,
} from "../../../lib/academia-agenda";
import { apiAlunos, hojeIso, type AlunoResumo } from "../../../lib/academia-alunos";

type Busca = { data?: string };

// Uma aula numa data: quem vai (fixos e reservas), vagas e chamada.
export const Route = createFileRoute("/academia/aulas-e-turmas/$horarioId")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    data: typeof s.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.data) ? s.data : undefined,
  }),
  loaderDeps: ({ search }) => ({ data: search.data }),
  loader: async ({ params, deps }) => {
    if (!deps.data) throw redirect({ to: "/academia/aulas-e-turmas" });
    const [sessao, alunos] = await Promise.all([apiAgenda.sessao(params.horarioId, deps.data), apiAlunos.listar()]);
    return { sessao, alunos: alunos.alunos };
  },
  component: PaginaSessao,
});

const primeiraMaiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const corStatus: Record<StatusPresenca, string> = {
  reservado: "bg-sky-500/15 text-sky-300",
  presente: "bg-emerald-500/15 text-emerald-300",
  faltou: "bg-red-500/15 text-red-300",
  cancelado: "bg-slate-500/20 text-slate-400",
};

function PaginaSessao() {
  const { sessao, alunos } = Route.useLoaderData();
  // key: ao trocar de data, a tela recomeça com os dados novos
  return <Sessao key={sessao.aula.horarioId + sessao.aula.data} inicial={sessao} alunos={alunos} />;
}

function Sessao({ inicial, alunos }: { inicial: SessaoAula; alunos: AlunoResumo[] }) {
  const { horarioId } = Route.useParams();
  const navigate = useNavigate();
  const [s, setS] = useState<SessaoAula>(inicial);
  const [novoAluno, setNovoAluno] = useState<string | null>(null);
  const [comoFixo, setComoFixo] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const a = s.aula;
  const cor = corAula[a.cor];
  const hoje = hojeIso();
  const podeChamada = a.data <= hoje;
  const ativos = alunos.filter((x) => x.situacao !== "sem_matricula");
  const naLista = new Set(s.participantes.filter((p) => p.status !== "cancelado").map((p) => p.alunoId));

  async function acao(chave: string, fazer: () => Promise<SessaoAula | void>) {
    setOcupado(chave);
    setErro(null);
    try {
      const nova = await fazer();
      if (nova) setS(nova);
      else setS(await apiAgenda.sessao(horarioId, a.data));
    } catch (e) {
      setErro(mensagemDe(e));
    }
    setOcupado(null);
  }

  const irPara = (data: string) =>
    navigate({ to: "/academia/aulas-e-turmas/$horarioId", params: { horarioId }, search: { data } });

  return (
    <div className="flex flex-col gap-5 py-4">
      <Link
        to="/academia/aulas-e-turmas"
        search={{ semana: a.data }}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-ac-muted hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Grade de aulas
      </Link>

      <div className={`flex flex-wrap items-center gap-4 rounded-2xl border p-5 ${cor.fundo} ${cor.borda}`}>
        <div className="min-w-0 flex-1">
          <h1 className={`font-poppins text-2xl font-bold ${cor.texto}`}>{a.nome}</h1>
          <p className="mt-1 text-sm text-slate-200">
            {primeiraMaiuscula(
              dataLocal(a.data).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }),
            )}
            , {a.hora} às {horaDe(a.fim)} · {a.sala} · {a.professor?.nome ?? "sem professor"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => irPara(somarDias(a.data, -7))}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-200 hover:bg-white/10"
          >
            <ChevronLeft className="size-4" />
            Semana anterior
          </button>
          <button
            type="button"
            onClick={() => irPara(somarDias(a.data, 7))}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-200 hover:bg-white/10"
          >
            Próxima
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardNumero icone={UsersRound} cor="bg-violet-500/20 text-violet-300" rotulo="Ocupação">
          <span className="font-poppins text-[26px] font-bold text-white">
            {a.ocupados}/{a.capacidade}
          </span>
        </CardNumero>
        <CardNumero icone={UserPlus} cor="bg-sky-500/15 text-sky-300" rotulo="Vagas">
          <span className="font-poppins text-[26px] font-bold text-white">{s.vagas}</span>
          {s.vagas === 0 && <span className="text-xs font-semibold text-red-300">lotada</span>}
        </CardNumero>
        <CardNumero icone={CircleCheck} cor="bg-emerald-500/15 text-emerald-300" rotulo="Presentes">
          <span className="font-poppins text-[26px] font-bold text-white">{podeChamada ? s.presentes : "—"}</span>
        </CardNumero>
        <CardNumero icone={CircleX} cor="bg-red-500/15 text-red-300" rotulo="Faltas">
          <span className="font-poppins text-[26px] font-bold text-white">{podeChamada ? s.faltas : "—"}</span>
        </CardNumero>
      </div>

      <MensagemErro texto={erro} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <Card className="!p-0">
          <div className="p-5 pb-3">
            <TituloCard icone={UsersRound} cor={cor.texto}>
              {podeChamada ? "Chamada" : "Quem vai"}
            </TituloCard>
          </div>
          {s.participantes.length === 0 ? (
            <Vazio icone={UsersRound}>Ninguém reservou ainda.</Vazio>
          ) : (
            <ul className="divide-y divide-ac-line/70 border-t border-ac-line">
              {s.participantes.map((p) => (
                <li key={p.alunoId} className={`flex flex-wrap items-center gap-3 px-5 py-2.5 ${p.status === "cancelado" ? "opacity-50" : ""}`}>
                  <AvatarAluno nome={p.nome} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/academia/alunos/$id"
                      params={{ id: p.alunoId }}
                      className="truncate text-sm font-medium text-slate-100 hover:text-violet-300"
                    >
                      {p.nome}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-ac-muted">
                      {p.tipo === "fixo" ? "Turma fixa" : "Reserva avulsa"}
                      {p.origem === "area_cliente" && (
                        <span className="inline-flex items-center gap-0.5 text-fuchsia-300">
                          <Smartphone className="size-3" /> pelo app
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${corStatus[p.status]}`}>
                    {rotuloPresenca[p.status]}
                  </span>
                  <div className="flex gap-1.5">
                    {podeChamada && p.status !== "cancelado" && (
                      <>
                        <button
                          type="button"
                          disabled={ocupado !== null}
                          onClick={() =>
                            acao(p.alunoId, () =>
                              apiAgenda.chamada(horarioId, p.alunoId, a.data, p.status === "presente" ? "reservado" : "presente"),
                            )
                          }
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                            p.status === "presente"
                              ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                              : "border-ac-line text-slate-300 hover:border-emerald-500/60"
                          }`}
                        >
                          <Check className="inline size-3.5" /> Veio
                        </button>
                        <button
                          type="button"
                          disabled={ocupado !== null}
                          onClick={() =>
                            acao(p.alunoId, () =>
                              apiAgenda.chamada(horarioId, p.alunoId, a.data, p.status === "faltou" ? "reservado" : "faltou"),
                            )
                          }
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                            p.status === "faltou"
                              ? "border-red-500 bg-red-500/20 text-red-200"
                              : "border-ac-line text-slate-300 hover:border-red-500/60"
                          }`}
                        >
                          Faltou
                        </button>
                      </>
                    )}
                    {!s.passou && p.status !== "cancelado" && (
                      <button
                        type="button"
                        disabled={ocupado !== null}
                        title={p.tipo === "fixo" ? "Não vem nesta data (libera a vaga)" : "Cancelar reserva"}
                        onClick={() => acao(p.alunoId, () => apiAgenda.cancelarReserva(horarioId, p.alunoId, a.data))}
                        className="rounded-lg border border-ac-line p-1.5 text-ac-muted hover:border-red-500/50 hover:text-red-300"
                      >
                        <CircleX className="size-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <TituloCard icone={UserPlus} cor="text-sky-400">
              Colocar aluno
            </TituloCard>
            <div className="mt-4 flex flex-col gap-3">
              <SeletorAluno
                alunos={ativos.filter((x) => !naLista.has(x.id))}
                valor={novoAluno}
                aoMudar={setNovoAluno}
              />
              <label className="flex items-start gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={comoFixo}
                  onChange={(e) => setComoFixo(e.target.checked)}
                  className="mt-1 accent-fuchsia-500"
                />
                <span>
                  Colocar na turma fixa
                  <span className="block text-xs text-ac-muted">
                    Vem toda {s.diaSemana.toLowerCase()} às {a.hora}, sem precisar reservar.
                  </span>
                </span>
              </label>
              <Botao
                variante="primario"
                disabled={!novoAluno || (s.passou && !comoFixo)}
                carregando={ocupado === "novo"}
                onClick={() =>
                  novoAluno &&
                  acao("novo", async () => {
                    if (comoFixo) {
                      await apiAgenda.adicionarFixo(horarioId, novoAluno);
                      setNovoAluno(null);
                      return;
                    }
                    const r = await apiAgenda.reservar(horarioId, novoAluno, a.data);
                    setNovoAluno(null);
                    return r;
                  })
                }
              >
                {comoFixo ? "Colocar na turma" : "Reservar nesta data"}
              </Botao>
              {s.passou && !comoFixo && <p className="text-xs text-ac-muted">Esta aula já aconteceu.</p>}
            </div>
          </Card>

          <Card>
            <TituloCard icone={UsersRound} cor="text-fuchsia-400">
              Turma fixa
            </TituloCard>
            <ul className="mt-3 flex flex-col gap-1">
              {s.participantes
                .filter((p) => p.tipo === "fixo")
                .map((p) => (
                  <li key={p.alunoId} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-slate-200">{p.nome}</span>
                    <button
                      type="button"
                      disabled={ocupado !== null}
                      title="Tirar da turma"
                      onClick={() => {
                        if (!window.confirm(`Tirar ${p.nome} da turma fixa?`)) return;
                        acao(`fixo-${p.alunoId}`, async () => {
                          await apiAgenda.removerFixo(horarioId, p.alunoId);
                        });
                      }}
                      className="rounded-lg p-1.5 text-ac-muted hover:bg-white/5 hover:text-red-300"
                    >
                      <UserMinus className="size-4" />
                    </button>
                  </li>
                ))}
            </ul>
            {!s.participantes.some((p) => p.tipo === "fixo") && (
              <p className="mt-2 text-sm text-ac-muted">Sem alunos fixos: todos reservam por data.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
