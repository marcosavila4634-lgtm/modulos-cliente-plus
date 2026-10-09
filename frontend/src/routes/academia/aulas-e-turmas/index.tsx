import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Clock, MapPin, Pencil, Plus, Trash2, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { apiLutas, type ModalidadeJson, type Publico } from "../../../lib/artes-marciais";
import { ehArtesMarciais } from "../../../lib/modulo-atual";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, Vazio } from "../../../components/academia/ui";
import {
  apiAgenda,
  corAula,
  coresAula,
  dataLocal,
  diaCurto,
  diasSemana,
  horaDe,
  segundaDa,
  somarDias,
  type Aula,
  type AulaNaData,
  type CorAula,
  type DadosAula,
} from "../../../lib/academia-agenda";
import { hojeIso } from "../../../lib/academia-alunos";
import { apiTreinos, type Profissional } from "../../../lib/academia-treinos";

type Busca = { semana?: string; aba?: "grade" | "aulas"; nova?: boolean };

// Aulas coletivas: grade da semana (com lotação) e cadastro das aulas.
export const Route = createFileRoute("/academia/aulas-e-turmas/")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    semana: typeof s.semana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.semana) ? s.semana : undefined,
    aba: s.aba === "aulas" ? "aulas" : undefined,
    nova: s.nova === true || s.nova === "true" ? true : undefined,
  }),
  loaderDeps: ({ search }) => ({ semana: search.semana }),
  loader: async ({ deps }) => {
    const [grade, profissionais] = await Promise.all([apiAgenda.grade(deps.semana), apiTreinos.profissionais()]);
    return { grade, profissionais };
  },
  component: PaginaAulas,
});

function PaginaAulas() {
  const { grade, profissionais } = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [aba, setAba] = useState<"grade" | "aulas">(busca.aba ?? "grade");
  const [editando, setEditando] = useState<Aula | "nova" | null>(busca.nova ? "nova" : null);

  const ativas = grade.aulas.filter((a) => a.ativo);
  const semana = grade.semana;
  const vagasSemana = semana.reduce((s, a) => s + a.capacidade, 0);
  const ocupadasSemana = semana.reduce((s, a) => s + Math.min(a.ocupados, a.capacidade), 0);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Aulas e turmas"
        descricao={`${ativas.length} aulas na grade · ${semana.length} horários nesta semana · ${
          vagasSemana ? Math.round((ocupadasSemana * 100) / vagasSemana) : 0
        }% das vagas ocupadas`}
      >
        <Botao variante="primario" onClick={() => setEditando("nova")}>
          <Plus className="size-4" />
          Nova aula
        </Botao>
      </CabecalhoPagina>

      <Abas
        abas={[
          { valor: "grade", rotulo: "Grade da semana" },
          { valor: "aulas", rotulo: "Aulas cadastradas", quantidade: grade.aulas.length },
        ]}
        valor={aba}
        aoMudar={setAba}
      />

      {aba === "grade" ? (
        <GradeSemana
          inicio={grade.inicio}
          semana={semana}
          aoMudarSemana={(s) => navigate({ to: "/academia/aulas-e-turmas", search: { semana: s } })}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grade.aulas.map((a) => (
            <CartaoAula key={a.id} aula={a} aoEditar={() => setEditando(a)} />
          ))}
          {grade.aulas.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <Vazio icone={UsersRound}>Nenhuma aula cadastrada.</Vazio>
            </Card>
          )}
        </div>
      )}

      {editando && (
        <ModalAula
          aula={editando === "nova" ? undefined : editando}
          profissionais={profissionais}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => {
            await router.invalidate();
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function GradeSemana({
  inicio,
  semana,
  aoMudarSemana,
}: {
  inicio: string;
  semana: AulaNaData[];
  aoMudarSemana: (s: string | undefined) => void;
}) {
  const hoje = hojeIso();
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(inicio, i));
  const agora = Date.now();

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => aoMudarSemana(somarDias(inicio, -7))}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-44 text-center text-sm font-semibold text-white">
          {dataLocal(inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} a{" "}
          {dataLocal(dias[6]).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
        <button
          type="button"
          aria-label="Próxima semana"
          onClick={() => aoMudarSemana(somarDias(inicio, 7))}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ChevronRight className="size-5" />
        </button>
        {segundaDa(hoje) !== inicio && (
          <button
            type="button"
            onClick={() => aoMudarSemana(undefined)}
            className="ml-1 rounded-lg border border-ac-line px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white"
          >
            Esta semana
          </button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {dias.map((dia) => {
          const aulas = semana.filter((a) => a.data === dia);
          const ehHoje = dia === hoje;
          return (
            <div
              key={dia}
              className={`flex min-h-32 flex-col rounded-2xl border bg-ac-card ${ehHoje ? "border-fuchsia-500/60" : "border-ac-line"}`}
            >
              <div className={`border-b border-ac-line px-3 py-2 text-sm font-semibold capitalize ${ehHoje ? "text-fuchsia-300" : "text-white"}`}>
                {diaCurto(dia)}
              </div>
              <ul className="flex flex-col gap-1.5 p-2">
                {aulas.map((a) => {
                  const cor = corAula[a.cor];
                  const pct = Math.min(100, Math.round((a.ocupados * 100) / a.capacidade));
                  const passou = new Date(a.fim).getTime() < agora;
                  return (
                    <li key={a.horarioId}>
                      <Link
                        to="/academia/aulas-e-turmas/$horarioId"
                        params={{ horarioId: a.horarioId }}
                        search={{ data: a.data }}
                        className={`block rounded-xl border px-2.5 py-2 transition hover:brightness-125 ${cor.fundo} ${cor.borda} ${
                          passou ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-white">
                            {a.hora}–{horaDe(a.fim)}
                          </span>
                          <span className={pct >= 100 ? "font-semibold text-red-300" : cor.texto}>
                            {a.ocupados}/{a.capacidade}
                          </span>
                        </div>
                        <div className={`mt-1 truncate text-[13px] font-semibold ${cor.texto}`}>{a.nome}</div>
                        <div className="truncate text-[11px] text-ac-muted">
                          {a.professor?.nome.split(" ")[0] ?? "—"} · {a.sala}
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/30">
                          <div className={`h-full rounded-full ${pct >= 100 ? "bg-red-400" : cor.ponto}`} style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {aulas.length === 0 && <li className="py-6 text-center text-xs text-ac-muted">Sem aulas</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}

function CartaoAula({ aula: a, aoEditar }: { aula: Aula; aoEditar: () => void }) {
  const cor = corAula[a.cor];
  return (
    <Card className={a.ativo ? "" : "opacity-55"}>
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 size-3 shrink-0 rounded-full ${cor.ponto}`} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white">{a.nome}</div>
          {a.descricao && <p className="mt-0.5 line-clamp-2 text-xs text-ac-muted">{a.descricao}</p>}
        </div>
        <button
          type="button"
          onClick={aoEditar}
          aria-label={`Editar ${a.nome}`}
          className="rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-white"
        >
          <Pencil className="size-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px] text-slate-300">
        <span className="flex items-center gap-2">
          <UserRound className="size-3.5 text-ac-muted" />
          {a.professor?.nome ?? "—"}
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="size-3.5 text-ac-muted" />
          {a.sala || "—"}
        </span>
        <span className="flex items-center gap-2">
          <UsersRound className="size-3.5 text-ac-muted" />
          {a.capacidade} vagas
        </span>
        <span className="flex items-center gap-2">
          <Clock className="size-3.5 text-ac-muted" />
          {a.duracaoMinutos} min
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ac-line pt-3">
        {a.horarios.map((h) => (
          <span key={h.id} className={`rounded-lg border px-2 py-1 text-[11.5px] ${cor.borda} ${cor.texto}`}>
            {h.dia.slice(0, 3)} {h.hora}
            {h.fixos > 0 && <span className="ml-1 text-ac-muted">· {h.fixos} fixos</span>}
          </span>
        ))}
        {!a.ativo && <span className="text-xs text-ac-muted">Fora da grade</span>}
      </div>
    </Card>
  );
}

function ModalAula({
  aula,
  profissionais,
  aoSalvar,
  aoFechar,
}: {
  aula?: Aula;
  profissionais: Profissional[];
  aoSalvar: () => void;
  aoFechar: () => void;
}) {
  const [d, setD] = useState<DadosAula>({
    nome: aula?.nome ?? "",
    descricao: aula?.descricao ?? "",
    professorId: aula?.professor?.id ?? null,
    sala: aula?.sala ?? "",
    capacidade: aula?.capacidade ?? 15,
    duracaoMinutos: aula?.duracaoMinutos ?? 60,
    cor: aula?.cor ?? "violeta",
    ativo: aula?.ativo ?? true,
    horarios: aula?.horarios.map((h) => ({ diaSemana: h.diaSemana, hora: h.hora })) ?? [{ diaSemana: 1, hora: "07:00" }],
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Artes Marciais: modalidade e público da aula (as presenças contam para a faixa)
  const lutas = ehArtesMarciais();
  const [modalidades, setModalidades] = useState<ModalidadeJson[]>([]);
  const [daModalidade, setDaModalidade] = useState<{ modalidadeId: string; publico: Publico }>({
    modalidadeId: "",
    publico: "todos",
  });
  useEffect(() => {
    if (!lutas) return;
    Promise.all([apiLutas.modalidades(), apiLutas.aulasModalidades()]).then(([m, am]) => {
      setModalidades(m.filter((x) => x.ativo));
      const atual = am.find((x) => x.aulaId === aula?.id);
      setDaModalidade({ modalidadeId: atual?.modalidadeId ?? "", publico: atual?.publico ?? "todos" });
    });
  }, [lutas, aula?.id]);
  const mudar = <K extends keyof DadosAula>(k: K, v: DadosAula[K]) => setD((x) => ({ ...x, [k]: v }));
  const mudarHorario = (i: number, campos: Partial<DadosAula["horarios"][number]>) =>
    mudar(
      "horarios",
      d.horarios.map((h, j) => (i === j ? { ...h, ...campos } : h)),
    );

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const salva = aula ? await apiAgenda.atualizarAula(aula.id, d) : await apiAgenda.cadastrarAula(d);
      if (lutas) await apiLutas.modalidadeDaAula(salva.id, daModalidade.modalidadeId || null, daModalidade.publico);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={aula ? "Editar aula" : "Nova aula"} aoFechar={aoFechar} largura="max-w-xl">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome *">
            <input
              autoFocus
              className={classeInput}
              value={d.nome}
              onChange={(e) => mudar("nome", e.target.value)}
              placeholder={lutas ? "Ex.: Jiu-Jitsu (Adulto)" : "Ex.: Spinning"}
            />
          </Campo>
          <Campo rotulo="Professor">
            <select
              className={classeInput}
              value={d.professorId ?? ""}
              onChange={(e) => mudar("professorId", e.target.value || null)}
            >
              <option value="">—</option>
              {profissionais
                .filter((p) => p.ativo || p.id === d.professorId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
            </select>
          </Campo>
        </div>
        <Campo rotulo="Descrição">
          <input className={classeInput} value={d.descricao} onChange={(e) => mudar("descricao", e.target.value)} />
        </Campo>
        <div className="grid grid-cols-3 gap-3">
          <Campo rotulo="Sala">
            <input className={classeInput} value={d.sala} onChange={(e) => mudar("sala", e.target.value)} />
          </Campo>
          <Campo rotulo="Vagas *">
            <input
              type="number"
              min={1}
              className={classeInput}
              value={d.capacidade ?? ""}
              onChange={(e) => mudar("capacidade", Number(e.target.value))}
            />
          </Campo>
          <Campo rotulo="Duração (min) *">
            <input
              type="number"
              min={10}
              className={classeInput}
              value={d.duracaoMinutos ?? ""}
              onChange={(e) => mudar("duracaoMinutos", Number(e.target.value))}
            />
          </Campo>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-300">Cor na grade</div>
          <div className="flex gap-2">
            {coresAula.map((c: CorAula) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => mudar("cor", c)}
                className={`size-8 rounded-full ${corAula[c].ponto} ${d.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-ac-card" : ""}`}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-300">Horários na semana *</div>
          <ul className="flex flex-col gap-2">
            {d.horarios.map((h, i) => (
              <li key={i} className="flex items-center gap-2">
                <select
                  className={`${classeInput} !w-40`}
                  value={h.diaSemana}
                  onChange={(e) => mudarHorario(i, { diaSemana: Number(e.target.value) })}
                >
                  {diasSemana.map((nome, j) => (
                    <option key={nome} value={j + 1}>
                      {nome}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  className={`${classeInput} !w-32`}
                  value={h.hora}
                  onChange={(e) => mudarHorario(i, { hora: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="Tirar horário"
                  onClick={() => mudar("horarios", d.horarios.filter((_, j) => j !== i))}
                  className="rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-red-300"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => mudar("horarios", [...d.horarios, { diaSemana: d.horarios.at(-1)?.diaSemana ?? 1, hora: d.horarios.at(-1)?.hora ?? "07:00" }])}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            <Plus className="size-4" />
            Adicionar horário
          </button>
          {aula && (
            <p className="mt-2 text-xs text-ac-muted">
              Tirar um horário não apaga o histórico de presenças; os alunos fixos dele saem da grade junto.
            </p>
          )}
        </div>
        {lutas && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Modalidade (a presença conta para a faixa)">
              <select
                className={classeInput}
                value={daModalidade.modalidadeId}
                onChange={(e) => setDaModalidade({ ...daModalidade, modalidadeId: e.target.value })}
              >
                <option value="">Nenhuma</option>
                {modalidades.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Público">
              <select
                className={classeInput}
                value={daModalidade.publico}
                onChange={(e) => setDaModalidade({ ...daModalidade, publico: e.target.value as Publico })}
              >
                <option value="todos">Todas as idades</option>
                <option value="adulto">Adulto</option>
                <option value="infantil">Kids</option>
              </select>
            </Campo>
          </div>
        )}
        {aula && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={d.ativo ?? true}
              onChange={(e) => mudar("ativo", e.target.checked)}
              className="accent-fuchsia-500"
            />
            Na grade (desmarque para tirar a aula toda)
          </label>
        )}
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <Check className="size-4" />
            Salvar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
