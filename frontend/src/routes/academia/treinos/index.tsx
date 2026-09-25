import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, ClipboardList, Dumbbell, FilePlus, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ModalMontarFicha } from "../../../components/academia/ModalMontarFicha";
import { AvatarAluno, SeloFicha } from "../../../components/academia/Selos";
import { Botao, classeInput, MensagemErro, mensagemDe } from "../../../components/academia/formulario";
import { Card } from "../../../components/academia/ui";
import { fmt } from "../../../lib/academia-alunos";
import { apiTreinos, type PainelTreinos, type SituacaoFicha } from "../../../lib/academia-treinos";

type Aba = "alunos" | "modelos";
type Filtro = "todos" | SituacaoFicha;

const filtros: { filtro: Filtro; rotulo: string; chave: keyof PainelTreinos["contagem"] }[] = [
  { filtro: "todos", rotulo: "Todos", chave: "todos" },
  { filtro: "sem_ficha", rotulo: "Sem ficha", chave: "semFicha" },
  { filtro: "vencida", rotulo: "Vencidas", chave: "vencidas" },
  { filtro: "vence_em_breve", rotulo: "Vencem em 7 dias", chave: "venceEmBreve" },
  { filtro: "em_dia", rotulo: "Em dia", chave: "emDia" },
];

// Fichas de treino dos alunos (com matrícula ativa) e modelos de treino.
export const Route = createFileRoute("/academia/treinos/")({
  validateSearch: (s: Record<string, unknown>): { aba?: Aba; filtro?: Filtro } => ({
    aba: s.aba === "modelos" ? "modelos" : undefined,
    filtro: filtros.some((f) => f.filtro === s.filtro) ? (s.filtro as Filtro) : undefined,
  }),
  loader: apiTreinos.painel,
  component: PaginaTreinos,
});

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function PaginaTreinos() {
  const painel = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const aba: Aba = busca.aba ?? "alunos";

  const [criandoModelo, setCriandoModelo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function novoModelo() {
    setCriandoModelo(true);
    setErro(null);
    try {
      const ficha = await apiTreinos.criarFicha({});
      navigate({ to: "/academia/treinos/$fichaId", params: { fichaId: ficha.id } });
    } catch (e) {
      setErro(mensagemDe(e));
      setCriandoModelo(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-poppins text-[28px] font-bold text-white">Treinos</h1>
          <p className="mt-1 text-sm text-ac-muted">
            Fichas de treino dos alunos ativos e modelos para montar fichas mais rápido.
          </p>
        </div>
        {aba === "modelos" && (
          <Botao variante="primario" carregando={criandoModelo} onClick={novoModelo}>
            <Plus className="size-4" />
            Novo modelo
          </Botao>
        )}
      </div>

      <div className="flex gap-1 border-b border-ac-line">
        {(
          [
            ["alunos", "Fichas dos alunos", Users],
            ["modelos", "Modelos de treino", ClipboardList],
          ] as const
        ).map(([valor, rotulo, Icone]) => (
          <Link
            key={valor}
            to="/academia/treinos"
            search={valor === "modelos" ? { aba: "modelos" } : {}}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              aba === valor
                ? "border-fuchsia-500 text-white"
                : "border-transparent text-ac-muted hover:text-slate-200"
            }`}
          >
            <Icone className="size-4" />
            {rotulo}
          </Link>
        ))}
      </div>

      <MensagemErro texto={erro} />

      {aba === "alunos" ? (
        <AbaAlunos painel={painel} filtroInicial={busca.filtro ?? "todos"} />
      ) : (
        <AbaModelos painel={painel} />
      )}
    </div>
  );
}

function AbaAlunos({ painel, filtroInicial }: { painel: PainelTreinos; filtroInicial: Filtro }) {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [professor, setProfessor] = useState("todos");
  const [busca, setBusca] = useState("");
  const [montando, setMontando] = useState<{ id: string; nome: string; temFicha: boolean } | null>(null);

  const professores = useMemo(
    () => [...new Set(painel.alunos.map((a) => a.ficha?.professor).filter((p): p is string => !!p))].sort(),
    [painel],
  );

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return painel.alunos.filter(
      (a) =>
        (filtro === "todos" || a.situacao === filtro) &&
        (professor === "todos" || a.ficha?.professor === professor) &&
        (!termo || normalizar(a.nome).includes(termo)),
    );
  }, [painel, filtro, professor, busca]);

  return (
    <Card className="!p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-ac-line p-4">
        <div className="flex flex-wrap gap-1.5">
          {filtros.map((f) => (
            <button
              key={f.filtro}
              type="button"
              onClick={() => setFiltro(f.filtro)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                filtro === f.filtro
                  ? "bg-violet-600/25 text-white ring-1 ring-violet-500/60"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {f.rotulo}
              <span className="ml-1.5 text-xs text-ac-muted">{painel.contagem[f.chave]}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex w-full flex-wrap gap-3 sm:w-auto">
          <select value={professor} onChange={(e) => setProfessor(e.target.value)} className={`${classeInput} !w-auto`}>
            <option value="todos">Todos os professores</option>
            {professores.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <label className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno"
              className={`${classeInput} pl-9`}
            />
          </label>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="py-14 text-center text-sm text-ac-muted">Nenhum aluno encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                <th className="py-2.5 pr-3 pl-5 font-medium">Aluno</th>
                <th className="py-2.5 pr-3 font-medium">Ficha</th>
                <th className="py-2.5 pr-3 font-medium">Professor</th>
                <th className="py-2.5 pr-3 font-medium">Validade</th>
                <th className="py-2.5 pr-3 font-medium">Situação</th>
                <th className="py-2.5 pr-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ac-line/70">
              {lista.map((a) => (
                <tr key={a.alunoId} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-3 pl-5">
                    <Link
                      to="/academia/alunos/$id"
                      params={{ id: a.alunoId }}
                      className="flex items-center gap-2.5 font-medium text-slate-100 hover:text-violet-300"
                    >
                      <AvatarAluno nome={a.nome} />
                      {a.nome}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3">
                    {a.ficha ? (
                      <>
                        <div className="text-slate-200">{a.ficha.nome}</div>
                        <div className="text-[11px] text-ac-muted">Treinos {a.ficha.divisoes}</div>
                      </>
                    ) : (
                      <span className="text-ac-muted">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{a.ficha?.professor ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{a.ficha ? fmt.data(a.ficha.validade) : "—"}</td>
                  <td className="py-2.5 pr-3">
                    <SeloFicha situacao={a.situacao} />
                  </td>
                  <td className="py-2.5 pr-5 text-right whitespace-nowrap">
                    {a.ficha && (
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/academia/treinos/$fichaId", params: { fichaId: a.ficha!.id } })}
                        className="mr-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                      >
                        Abrir
                      </button>
                    )}
                    {a.situacao !== "em_dia" && (
                      <button
                        type="button"
                        onClick={() => setMontando({ id: a.alunoId, nome: a.nome, temFicha: !!a.ficha })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
                      >
                        <FilePlus className="size-3.5" />
                        {a.ficha ? "Renovar" : "Montar ficha"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {montando && (
        <ModalMontarFicha
          aluno={montando}
          temFichaAtual={montando.temFicha}
          modelos={painel.modelos}
          aoFechar={() => setMontando(null)}
        />
      )}
    </Card>
  );
}

function AbaModelos({ painel }: { painel: PainelTreinos }) {
  if (painel.modelos.length === 0) {
    return (
      <p className="py-14 text-center text-sm text-ac-muted">
        Nenhum modelo ainda. Crie um para montar fichas de alunos mais rápido.
      </p>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {painel.modelos.map((m) => (
        <Link
          key={m.id}
          to="/academia/treinos/$fichaId"
          params={{ fichaId: m.id }}
          className="group rounded-2xl border border-ac-line bg-gradient-to-b from-ac-card-2/70 to-ac-card p-5 transition hover:border-violet-500/50"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/20 text-violet-300">
              <Dumbbell className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-poppins font-semibold text-white">{m.nome}</div>
              <div className="text-xs text-ac-muted">{m.objetivo || "Sem objetivo definido"}</div>
            </div>
            <ChevronRight className="size-4 text-ac-muted group-hover:text-white" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["Treinos", m.divisoes],
              ["Exercícios", String(m.exercicios)],
              ["Alunos", String(m.alunos)],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="rounded-lg border border-ac-line bg-ac-bg/40 py-2">
                <div className="text-[11px] text-ac-muted">{rotulo}</div>
                <div className="text-sm font-semibold text-white">{valor}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-400">Professor: {m.professor ?? "—"}</div>
        </Link>
      ))}
    </div>
  );
}
