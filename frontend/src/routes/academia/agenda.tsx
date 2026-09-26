import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  CalendarCheck,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  ClipboardList,
  Clock,
  Pencil,
  UserRound,
  UserX,
  UsersRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { SeletorAluno } from "../../components/academia/SeletorAluno";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card } from "../../components/academia/ui";
import {
  apiAgenda,
  corAula,
  corStatusAgendamento,
  dataLocal,
  diaCurto,
  horaDe,
  isoDe,
  rotuloStatusAgendamento,
  segundaDa,
  somarDias,
  type Agendamento,
  type AulaNaData,
  type DadosAgendamento,
  type Servico,
  type StatusAgendamento,
  type TipoAgendamento,
} from "../../lib/academia-agenda";
import { apiAlunos, fmt, hojeIso, type AlunoResumo } from "../../lib/academia-alunos";

type Busca = { semana?: string; profissional?: string; novo?: boolean };

// Agenda da semana: horários marcados com os profissionais e aulas da grade.
export const Route = createFileRoute("/academia/agenda")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    semana: typeof s.semana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.semana) ? s.semana : undefined,
    profissional: typeof s.profissional === "string" ? s.profissional : undefined,
    novo: s.novo === true || s.novo === "true" ? true : undefined,
  }),
  loaderDeps: ({ search }) => ({ semana: search.semana, profissional: search.profissional }),
  loader: async ({ deps }) => {
    const inicio = segundaDa(deps.semana ?? hojeIso());
    const [agenda, alunos, servicos] = await Promise.all([
      apiAgenda.agenda(inicio, 7, deps.profissional),
      apiAlunos.listar(),
      apiAgenda.servicos(),
    ]);
    return { agenda, alunos: alunos.alunos, servicos: servicos.servicos.filter((s) => s.ativo) };
  },
  component: PaginaAgenda,
});

type Item = { tipo: "horario"; a: Agendamento } | { tipo: "aula"; a: AulaNaData };

type Janela = { novo: string | null } | { ver: Agendamento } | { editar: Agendamento } | null;

function PaginaAgenda() {
  const { agenda, alunos, servicos } = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [janela, setJanela] = useState<Janela>(busca.novo ? { novo: null } : null);
  const [mostrarAulas, setMostrarAulas] = useState(true);
  const hoje = hojeIso();
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(agenda.inicio, i));

  const irPara = (semana: string | undefined) =>
    navigate({ to: "/academia/agenda", search: { semana, profissional: busca.profissional } });
  const recarregar = async () => {
    await router.invalidate();
    setJanela(null);
  };

  const itensDo = (dia: string): Item[] => {
    const horarios: Item[] = agenda.agendamentos
      .filter((a) => isoDe(new Date(a.inicio)) === dia)
      .map((a) => ({ tipo: "horario", a }));
    const aulas: Item[] = mostrarAulas ? agenda.aulas.filter((a) => a.data === dia).map((a) => ({ tipo: "aula", a })) : [];
    return [...horarios, ...aulas].sort((x, y) => x.a.inicio.localeCompare(y.a.inicio));
  };

  const ativos = agenda.agendamentos.filter((a) => a.status !== "cancelado");
  const fimSemana = dataLocal(dias[6]);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Agenda"
        descricao={`${ativos.length} horários marcados e ${agenda.aulas.length} aulas nesta semana.`}
      >
        <Botao variante="primario" onClick={() => setJanela({ novo: null })}>
          <CalendarPlus className="size-4" />
          Marcar horário
        </Botao>
      </CabecalhoPagina>

      <Card className="flex flex-wrap items-center gap-3 !p-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Semana anterior"
            onClick={() => irPara(somarDias(agenda.inicio, -7))}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="min-w-44 text-center text-sm font-semibold text-white">
            {dataLocal(agenda.inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} a{" "}
            {fimSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <button
            type="button"
            aria-label="Próxima semana"
            onClick={() => irPara(somarDias(agenda.inicio, 7))}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <ChevronRight className="size-5" />
          </button>
          {!dias.includes(hoje) && (
            <button
              type="button"
              onClick={() => irPara(undefined)}
              className="ml-1 rounded-lg border border-ac-line px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white"
            >
              Hoje
            </button>
          )}
        </div>
        <label className="relative ml-auto">
          <select
            value={busca.profissional ?? ""}
            onChange={(e) =>
              navigate({ to: "/academia/agenda", search: { semana: busca.semana, profissional: e.target.value || undefined } })
            }
            className="h-9 appearance-none rounded-lg border border-ac-line bg-ac-bg/60 pr-8 pl-3 text-sm text-slate-200 outline-none"
          >
            <option value="">Todos os profissionais</option>
            {agenda.profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ac-muted" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={mostrarAulas}
            onChange={(e) => setMostrarAulas(e.target.checked)}
            className="accent-fuchsia-500"
          />
          Mostrar aulas
        </label>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {dias.map((dia) => {
          const itens = itensDo(dia);
          const ehHoje = dia === hoje;
          const passou = dia < hoje;
          return (
            <div
              key={dia}
              className={`flex min-h-40 flex-col rounded-2xl border bg-ac-card ${
                ehHoje ? "border-fuchsia-500/60" : "border-ac-line"
              } ${passou ? "opacity-75" : ""}`}
            >
              <div className="flex items-center justify-between border-b border-ac-line px-3 py-2">
                <span className={`text-sm font-semibold capitalize ${ehHoje ? "text-fuchsia-300" : "text-white"}`}>
                  {diaCurto(dia)}
                </span>
                {!passou && (
                  <button
                    type="button"
                    aria-label="Marcar neste dia"
                    onClick={() => setJanela({ novo: dia })}
                    className="rounded-md p-1 text-ac-muted hover:bg-white/5 hover:text-white"
                  >
                    <CalendarPlus className="size-4" />
                  </button>
                )}
              </div>
              <ul className="flex flex-1 flex-col gap-1.5 p-2">
                {itens.map((item) =>
                  item.tipo === "horario" ? (
                    <li key={item.a.id}>
                      <CartaoHorario a={item.a} aoAbrir={() => setJanela({ ver: item.a })} />
                    </li>
                  ) : (
                    <li key={`${item.a.horarioId}-${item.a.data}`}>
                      <CartaoAula a={item.a} />
                    </li>
                  ),
                )}
                {itens.length === 0 && <li className="py-6 text-center text-xs text-ac-muted">Livre</li>}
              </ul>
            </div>
          );
        })}
      </div>

      {janela && "novo" in janela && (
        <ModalHorario
          dataInicial={janela.novo ?? (dias.includes(hoje) ? hoje : agenda.inicio)}
          alunos={alunos}
          servicos={servicos}
          profissionais={agenda.profissionais}
          profissionalInicial={busca.profissional ?? null}
          aoFechar={() => setJanela(null)}
          aoSalvar={recarregar}
        />
      )}
      {janela && "editar" in janela && (
        <ModalHorario
          agendamento={janela.editar}
          dataInicial={isoDe(new Date(janela.editar.inicio))}
          alunos={alunos}
          servicos={servicos}
          profissionais={agenda.profissionais}
          profissionalInicial={janela.editar.profissional.id}
          aoFechar={() => setJanela(null)}
          aoSalvar={recarregar}
        />
      )}
      {janela && "ver" in janela && (
        <ModalDetalhe
          a={janela.ver}
          aoFechar={() => setJanela(null)}
          aoEditar={() => setJanela({ editar: janela.ver })}
          aoMudar={recarregar}
        />
      )}
    </div>
  );
}

function CartaoHorario({ a, aoAbrir }: { a: Agendamento; aoAbrir: () => void }) {
  const titulo = a.tipo === "outro" ? a.titulo : a.aluno?.nome ?? "—";
  const subtitulo = a.tipo === "avaliacao" ? "Avaliação física" : a.servico?.nome ?? "Compromisso";
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className={`w-full rounded-xl border border-ac-line bg-ac-card-2 px-2.5 py-2 text-left transition hover:border-violet-500/60 ${
        a.status === "cancelado" ? "opacity-45 line-through" : ""
      }`}
    >
      <div className="text-xs font-semibold whitespace-nowrap text-white">
        {horaDe(a.inicio)}–{horaDe(a.fim)}
      </div>
      <div className="mt-1 truncate text-[12.5px] font-medium text-slate-100">{titulo}</div>
      <div className="truncate text-[11px] text-ac-muted">
        {subtitulo} · {a.profissional.nome.split(" ")[0]}
      </div>
      <span className={`mt-1.5 inline-block rounded-full px-1.5 py-px text-[10px] font-semibold ${corStatusAgendamento[a.status]}`}>
        {rotuloStatusAgendamento[a.status]}
      </span>
    </button>
  );
}

function CartaoAula({ a }: { a: AulaNaData }) {
  const cor = corAula[a.cor];
  const lotada = a.ocupados >= a.capacidade;
  return (
    <Link
      to="/academia/aulas-e-turmas/$horarioId"
      params={{ horarioId: a.horarioId }}
      search={{ data: a.data }}
      className={`block rounded-xl border px-2.5 py-2 transition hover:brightness-125 ${cor.fundo} ${cor.borda}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-white">
          {a.hora}–{horaDe(a.fim)}
        </span>
        <span className={`text-[10.5px] font-semibold ${lotada ? "text-red-300" : cor.texto}`}>
          {a.ocupados}/{a.capacidade}
        </span>
      </div>
      <div className={`mt-1 flex items-center gap-1.5 truncate text-[12.5px] font-medium ${cor.texto}`}>
        <UsersRound className="size-3.5 shrink-0" />
        {a.nome}
      </div>
      <div className="truncate text-[11px] text-ac-muted">
        {a.sala} · {a.professor?.nome.split(" ")[0] ?? "—"}
      </div>
    </Link>
  );
}

// ---------- Detalhe e mudança de situação ----------

function ModalDetalhe({
  a,
  aoFechar,
  aoEditar,
  aoMudar,
}: {
  a: Agendamento;
  aoFechar: () => void;
  aoEditar: () => void;
  aoMudar: () => void;
}) {
  const [cobrar, setCobrar] = useState(!!a.preco && a.preco > 0 && !a.vendaId);
  const [salvando, setSalvando] = useState<StatusAgendamento | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const aberto = a.status === "agendado" || a.status === "confirmado";

  async function mudar(status: StatusAgendamento) {
    setSalvando(status);
    setErro(null);
    try {
      await apiAgenda.mudarStatus(a.id, status, status === "concluido" && cobrar);
      aoMudar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(null);
    }
  }

  const titulo = a.tipo === "outro" ? a.titulo : a.tipo === "avaliacao" ? "Avaliação física" : a.servico?.nome ?? "";

  return (
    <Modal titulo={titulo} subtitulo={`${diaCurto(isoDe(new Date(a.inicio)))}, ${horaDe(a.inicio)} às ${horaDe(a.fim)}`} aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5">
            <dt className="text-[11px] text-ac-muted">Aluno</dt>
            <dd className="font-semibold text-white">
              {a.aluno ? (
                <Link to="/academia/alunos/$id" params={{ id: a.aluno.id }} className="hover:text-violet-300">
                  {a.aluno.nome}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5">
            <dt className="text-[11px] text-ac-muted">Profissional</dt>
            <dd className="font-semibold text-white">{a.profissional.nome}</dd>
          </div>
          <div className="rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5">
            <dt className="text-[11px] text-ac-muted">Situação</dt>
            <dd>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${corStatusAgendamento[a.status]}`}>
                {rotuloStatusAgendamento[a.status]}
              </span>
            </dd>
          </div>
          <div className="rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5">
            <dt className="text-[11px] text-ac-muted">Valor</dt>
            <dd className="font-semibold text-white">
              {a.preco ? fmt.moeda(a.preco) : "—"}
              {a.vendaId && <span className="ml-1 text-xs font-normal text-emerald-300">(cobrança gerada)</span>}
            </dd>
          </div>
        </dl>
        {a.observacao && <p className="text-sm whitespace-pre-line text-slate-300">{a.observacao}</p>}

        {a.tipo === "avaliacao" && a.aluno && (
          <Link
            to="/academia/avaliacao-fisica/nova"
            search={{ aluno: a.aluno.id }}
            className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-2.5 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
          >
            <ClipboardList className="size-4" />
            Registrar a avaliação física deste aluno
          </Link>
        )}

        {aberto && a.preco !== null && a.preco > 0 && !a.vendaId && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={cobrar} onChange={(e) => setCobrar(e.target.checked)} className="accent-fuchsia-500" />
            Ao concluir, gerar a cobrança de {fmt.moeda(a.preco)} no Faturamento
          </label>
        )}

        <MensagemErro texto={erro} />

        {aberto ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Botao onClick={aoEditar}>
              <Pencil className="size-4" />
              Alterar
            </Botao>
            <Botao variante="perigo" carregando={salvando === "cancelado"} onClick={() => mudar("cancelado")}>
              <CircleX className="size-4" />
              Cancelar
            </Botao>
            <Botao carregando={salvando === "faltou"} onClick={() => mudar("faltou")}>
              <UserX className="size-4" />
              Faltou
            </Botao>
            {a.status === "agendado" && (
              <Botao carregando={salvando === "confirmado"} onClick={() => mudar("confirmado")}>
                <CalendarCheck className="size-4" />
                Confirmar
              </Botao>
            )}
            <Botao variante="sucesso" carregando={salvando === "concluido"} onClick={() => mudar("concluido")}>
              <Check className="size-4" />
              Concluir
            </Botao>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            {a.status !== "concluido" || !a.vendaId ? (
              <Botao carregando={salvando === "agendado"} onClick={() => mudar("agendado")}>
                Reabrir
              </Botao>
            ) : null}
            <Botao variante="primario" onClick={aoFechar}>
              OK
            </Botao>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------- Marcar / alterar ----------

function ModalHorario({
  agendamento,
  dataInicial,
  alunos,
  servicos,
  profissionais,
  profissionalInicial,
  aoSalvar,
  aoFechar,
}: {
  agendamento?: Agendamento;
  dataInicial: string;
  alunos: AlunoResumo[];
  servicos: Servico[];
  profissionais: { id: string; nome: string }[];
  profissionalInicial: string | null;
  aoSalvar: () => void;
  aoFechar: () => void;
}) {
  const agendaveis = servicos.filter((s) => s.duracaoMinutos !== null);
  const primeiro = agendaveis[0];
  const [d, setD] = useState<DadosAgendamento>(() =>
    agendamento
      ? {
          alunoId: agendamento.aluno?.id ?? null,
          profissionalId: agendamento.profissional.id,
          servicoId: agendamento.servico?.id ?? null,
          tipo: agendamento.tipo,
          titulo: agendamento.titulo,
          data: dataInicial,
          hora: horaDe(agendamento.inicio),
          duracaoMinutos: Math.round((new Date(agendamento.fim).getTime() - new Date(agendamento.inicio).getTime()) / 60000),
          observacao: agendamento.observacao,
        }
      : {
          alunoId: null,
          profissionalId: profissionalInicial ?? primeiro?.profissional?.id ?? profissionais[0]?.id ?? null,
          servicoId: primeiro?.id ?? null,
          tipo: "servico",
          titulo: "",
          data: dataInicial,
          hora: "08:00",
          duracaoMinutos: primeiro?.duracaoMinutos ?? 60,
          observacao: "",
        },
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = <K extends keyof DadosAgendamento>(k: K, v: DadosAgendamento[K]) => setD((x) => ({ ...x, [k]: v }));

  function escolherServico(id: string) {
    const s = agendaveis.find((x) => x.id === id);
    setD((x) => ({
      ...x,
      servicoId: id,
      duracaoMinutos: s?.duracaoMinutos ?? x.duracaoMinutos,
      profissionalId: s?.profissional?.id ?? x.profissionalId,
    }));
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const dados = { ...d, servicoId: d.tipo === "servico" ? d.servicoId : null, alunoId: d.tipo === "outro" ? d.alunoId : d.alunoId };
    try {
      if (agendamento) await apiAgenda.alterar(agendamento.id, dados);
      else await apiAgenda.marcar(dados);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={agendamento ? "Alterar horário" : "Marcar horário"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Abas<TipoAgendamento>
          abas={[
            { valor: "servico", rotulo: "Serviço" },
            { valor: "avaliacao", rotulo: "Avaliação física" },
            { valor: "outro", rotulo: "Compromisso" },
          ]}
          valor={d.tipo}
          aoMudar={(t) => mudar("tipo", t)}
        />
        {d.tipo === "servico" && (
          <Campo rotulo="Serviço *">
            <select className={classeInput} value={d.servicoId ?? ""} onChange={(e) => escolherServico(e.target.value)}>
              {agendaveis.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} · {fmt.moeda(s.preco)}
                </option>
              ))}
            </select>
          </Campo>
        )}
        {d.tipo === "outro" && (
          <Campo rotulo="Título *">
            <input
              autoFocus
              className={classeInput}
              value={d.titulo}
              onChange={(e) => mudar("titulo", e.target.value)}
              placeholder="Ex.: Reunião de equipe"
            />
          </Campo>
        )}
        <Campo rotulo={d.tipo === "outro" ? "Aluno (opcional)" : "Aluno *"}>
          <SeletorAluno alunos={alunos} valor={d.alunoId} aoMudar={(v) => mudar("alunoId", v)} autoFocus={d.tipo !== "outro"} />
        </Campo>
        <Campo rotulo="Profissional *">
          <select
            className={classeInput}
            value={d.profissionalId ?? ""}
            onChange={(e) => mudar("profissionalId", e.target.value || null)}
          >
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid grid-cols-3 gap-3">
          <Campo rotulo="Data *">
            <input type="date" className={classeInput} value={d.data} onChange={(e) => mudar("data", e.target.value)} />
          </Campo>
          <Campo rotulo="Hora *">
            <input type="time" className={classeInput} value={d.hora} onChange={(e) => mudar("hora", e.target.value)} />
          </Campo>
          <Campo rotulo="Duração (min)">
            <input
              type="number"
              min={5}
              max={480}
              className={classeInput}
              value={d.duracaoMinutos ?? 60}
              onChange={(e) => mudar("duracaoMinutos", Number(e.target.value))}
            />
          </Campo>
        </div>
        <Campo rotulo="Observação">
          <input className={classeInput} value={d.observacao} onChange={(e) => mudar("observacao", e.target.value)} />
        </Campo>
        <p className="flex items-center gap-1.5 text-xs text-ac-muted">
          <Clock className="size-3.5" />O sistema avisa se o profissional já tiver horário ou aula nesse momento.
        </p>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <UserRound className="size-4" />
            {agendamento ? "Salvar" : "Marcar"}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
