import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  Award,
  CalendarCheck,
  ExternalLink,
  GraduationCap,
  Medal,
  Plus,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, CardNumero, Vazio } from "../../components/academia/ui";
import { FaixaVisual, PontoModalidade, SeloFaixa } from "../../components/artes-marciais/Faixa";
import { AbaCurriculo, AbaFaixas } from "../../components/artes-marciais/FaixasECurriculo";
import { BarraProgresso, ModalGraduar } from "../../components/artes-marciais/ModaisGraduacao";
import { ModalExame } from "../../components/artes-marciais/ModalExame";
import { apiTreinos } from "../../lib/academia-treinos";
import {
  apiLutas,
  data,
  diasAte,
  faixaComGrau,
  hojeIso,
  rotuloSituacao,
  type DadosExame,
  type ExameResumo,
  type ModalidadeJson,
  type Progresso,
  type SituacaoProgresso,
} from "../../lib/artes-marciais";

type Aba = "alunos" | "exames" | "faixas" | "curriculo" | "historico";
type Filtro = "todos" | "aptos" | "apto_faixa" | "apto_grau" | "em_progresso";
type Busca = { aba?: Aba; filtro?: Filtro; modalidade?: string };

const abas: Aba[] = ["alunos", "exames", "faixas", "curriculo", "historico"];
const filtros: Filtro[] = ["todos", "aptos", "apto_faixa", "apto_grau", "em_progresso"];

// Graduações (Artes Marciais): progresso de cada aluno até o próximo grau ou
// faixa, exames, faixas de cada modalidade, currículo e histórico.
export const Route = createFileRoute("/academia/graduacoes")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    aba: abas.includes(s.aba as Aba) ? (s.aba as Aba) : undefined,
    filtro: filtros.includes(s.filtro as Filtro) ? (s.filtro as Filtro) : undefined,
    modalidade: typeof s.modalidade === "string" ? s.modalidade : undefined,
  }),
  loader: async () => {
    const [painel, modalidades, exames, config, professores] = await Promise.all([
      apiLutas.graduacoes(),
      apiLutas.modalidades(),
      apiLutas.exames(),
      apiLutas.config(),
      apiTreinos.profissionais(),
    ]);
    return { painel, modalidades, exames, config, professores: professores.filter((p) => p.ativo) };
  },
  component: PaginaGraduacoes,
});

function PaginaGraduacoes() {
  const { painel, modalidades, exames, config, professores } = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const aba = busca.aba ?? "alunos";

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Graduações"
        descricao="Quem está pronto para o próximo grau ou faixa, os exames, as faixas de cada modalidade e o que ensinar em cada uma."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <CardNumero icone={Award} cor="bg-amber-500/15 text-amber-300" rotulo="Prontos para nova faixa">
          <span className="font-poppins text-[26px] font-bold text-white">{painel.aptosFaixa}</span>
        </CardNumero>
        <CardNumero icone={Sparkles} cor="bg-emerald-500/15 text-emerald-300" rotulo="Prontos para novo grau">
          <span className="font-poppins text-[26px] font-bold text-white">{painel.aptosGrau}</span>
        </CardNumero>
        <CardNumero icone={Medal} cor="bg-red-500/15 text-red-300" rotulo="Graduações no mês">
          <span className="font-poppins text-[26px] font-bold text-white">{painel.graduacoesNoMes}</span>
        </CardNumero>
        <CardNumero icone={CalendarCheck} cor="bg-sky-500/15 text-sky-300" rotulo="Próximo exame">
          <ProximoExame exames={exames} />
        </CardNumero>
      </div>

      <Abas
        abas={[
          { valor: "alunos", rotulo: "Alunos e progresso", quantidade: painel.alunos.length },
          { valor: "exames", rotulo: "Exames", quantidade: exames.filter((e) => e.status === "agendado").length },
          { valor: "faixas", rotulo: "Modalidades e faixas", quantidade: modalidades.length },
          { valor: "curriculo", rotulo: "Currículo" },
          { valor: "historico", rotulo: "Histórico" },
        ]}
        valor={aba}
        aoMudar={(v) => navigate({ search: { aba: v } })}
      />

      {aba === "alunos" && (
        <AbaAlunos
          alunos={painel.alunos}
          modalidades={modalidades}
          professores={professores}
          filtroInicial={busca.filtro ?? "todos"}
          modalidadeInicial={busca.modalidade ?? ""}
        />
      )}
      {aba === "exames" && <AbaExames exames={exames} modalidades={modalidades} professores={professores} />}
      {aba === "faixas" && <AbaFaixas modalidades={modalidades} config={config} />}
      {aba === "curriculo" && <AbaCurriculo modalidades={modalidades} />}
      {aba === "historico" && <AbaHistorico recentes={painel.recentes} />}
    </div>
  );
}

function ProximoExame({ exames }: { exames: ExameResumo[] }) {
  const prox = exames
    .filter((e) => e.status === "agendado" && e.data >= hojeIso())
    .sort((a, b) => a.data.localeCompare(b.data))[0];
  if (!prox) return <span className="text-sm text-ac-muted">Nenhum marcado</span>;
  const dias = diasAte(prox.data);
  return (
    <Link to="/academia/exames/$id" params={{ id: prox.id }} className="leading-tight hover:underline">
      <span className="font-poppins text-[22px] font-bold text-white">{dias === 0 ? "Hoje" : `${dias} dias`}</span>
      <span className="block text-xs text-ac-muted">
        {prox.modalidade.nome} · {prox.candidatos} candidatos
      </span>
    </Link>
  );
}

// ---------- Alunos e progresso ----------

const corSituacao: Record<SituacaoProgresso, string> = {
  apto_faixa: "bg-amber-500/15 text-amber-300",
  apto_grau: "bg-emerald-500/15 text-emerald-300",
  em_progresso: "bg-sky-500/10 text-sky-300",
  ultima_faixa: "bg-white/5 text-slate-300",
  livre: "bg-white/5 text-ac-muted",
};

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function AbaAlunos({
  alunos,
  modalidades,
  professores,
  filtroInicial,
  modalidadeInicial,
}: {
  alunos: Progresso[];
  modalidades: ModalidadeJson[];
  professores: { id: string; nome: string }[];
  filtroInicial: Filtro;
  modalidadeInicial: string;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [modalidade, setModalidade] = useState(modalidadeInicial);
  const [texto, setTexto] = useState("");
  const [graduando, setGraduando] = useState<Progresso | null>(null);
  const [limite, setLimite] = useState(60);

  const daModalidade = alunos.filter((p) => !modalidade || p.modalidade.id === modalidade);
  const lista = useMemo(() => {
    const termo = normalizar(texto.trim());
    return daModalidade
      .filter((p) =>
        filtro === "todos"
          ? true
          : filtro === "aptos"
            ? p.situacao === "apto_faixa" || p.situacao === "apto_grau"
            : p.situacao === filtro,
      )
      .filter((p) => !termo || normalizar(p.aluno.nome).includes(termo))
      .sort((a, b) => {
        const peso = (p: Progresso) => (p.situacao === "apto_faixa" ? 0 : p.situacao === "apto_grau" ? 1 : 2);
        return peso(a) - peso(b) || b.percentual - a.percentual;
      });
  }, [daModalidade, filtro, texto]);
  const conta = (f: Filtro) =>
    daModalidade.filter((p) =>
      f === "todos" ? true : f === "aptos" ? p.situacao.startsWith("apto") : p.situacao === f,
    ).length;

  return (
    <Card className="!p-0">
      <div className="flex flex-col gap-3 border-b border-ac-line p-4 lg:flex-row lg:items-center lg:justify-between">
        <Abas
          abas={[
            { valor: "todos" as Filtro, rotulo: "Todos", quantidade: conta("todos") },
            { valor: "aptos" as Filtro, rotulo: "Prontos", quantidade: conta("aptos") },
            { valor: "apto_faixa" as Filtro, rotulo: "Nova faixa", quantidade: conta("apto_faixa") },
            { valor: "apto_grau" as Filtro, rotulo: "Novo grau", quantidade: conta("apto_grau") },
            { valor: "em_progresso" as Filtro, rotulo: "Em progresso", quantidade: conta("em_progresso") },
          ]}
          valor={filtro}
          aoMudar={setFiltro}
        />
        <div className="flex flex-wrap gap-2">
          <select className={`${classeInput} !w-auto`} value={modalidade} onChange={(e) => setModalidade(e.target.value)}>
            <option value="">Todas as modalidades</option>
            {modalidades.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          <label className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input className={`${classeInput} !w-56 pl-9`} placeholder="Buscar aluno" value={texto} onChange={(e) => setTexto(e.target.value)} />
          </label>
        </div>
      </div>
      {lista.length === 0 ? (
        <Vazio icone={Users}>Ninguém nesse filtro.</Vazio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-[13px]">
            <thead className="text-[11px] tracking-wide text-ac-muted uppercase">
              <tr className="border-b border-ac-line">
                <th className="py-2.5 pr-3 pl-4 font-medium">Aluno</th>
                <th className="px-3 font-medium">Modalidade</th>
                <th className="px-3 font-medium">Faixa</th>
                <th className="px-3 font-medium">Na faixa desde</th>
                <th className="px-3 font-medium">Progresso</th>
                <th className="px-3 font-medium">Situação</th>
                <th className="pr-4" />
              </tr>
            </thead>
            <tbody>
              {lista.slice(0, limite).map((p) => (
                <tr key={p.id} className="border-b border-ac-line/60 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 pl-4">
                    <Link to="/academia/alunos/$id" params={{ id: p.aluno.id }} className="flex items-center gap-3 hover:underline">
                      <AvatarAluno nome={p.aluno.nome} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-white">{p.aluno.nome}</span>
                        <span className="block text-[11px] text-ac-muted">
                          {p.aluno.idade != null ? `${p.aluno.idade} anos` : "—"}
                          {p.infantil && <span className="ml-1.5 rounded bg-pink-500/15 px-1.5 text-pink-300">kids</span>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3">
                    <span className="flex items-center gap-2 text-slate-200">
                      <PontoModalidade cor={p.modalidade.cor} />
                      {p.modalidade.nome}
                    </span>
                  </td>
                  <td className="px-3">
                    <SeloFaixa faixa={p.faixa} grau={p.grau} grausMaximos={p.grausMaximos} />
                  </td>
                  <td className="px-3 text-slate-300">
                    {data(p.faixaDesde)}
                    <span className="block text-[11px] text-ac-muted">{p.aulasNaFaixa} aulas</span>
                  </td>
                  <td className="px-3">
                    <BarraProgresso p={p} />
                  </td>
                  <td className="px-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap ${corSituacao[p.situacao]}`}>
                      {rotuloSituacao[p.situacao]}
                    </span>
                  </td>
                  <td className="pr-4 text-right">
                    <button
                      type="button"
                      onClick={() => setGraduando(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                        p.situacao.startsWith("apto")
                          ? "bg-red-600 text-white hover:bg-red-500"
                          : "border border-ac-line text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      Graduar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length > limite && (
            <div className="p-3 text-center">
              <button type="button" onClick={() => setLimite((l) => l + 60)} className="text-sm font-semibold text-red-400 hover:text-red-300">
                Mostrar mais ({lista.length - limite} restantes)
              </button>
            </div>
          )}
        </div>
      )}
      {graduando && (
        <ModalGraduar
          progresso={graduando}
          modalidades={modalidades}
          professores={professores}
          aoFechar={() => setGraduando(null)}
          aoGraduar={() => router.invalidate()}
        />
      )}
    </Card>
  );
}

// ---------- Exames ----------

const corStatusExame = {
  agendado: "bg-sky-500/15 text-sky-300",
  realizado: "bg-emerald-500/15 text-emerald-300",
  cancelado: "bg-white/5 text-ac-muted",
} as const;

function AbaExames({
  exames,
  modalidades,
}: {
  exames: ExameResumo[];
  modalidades: ModalidadeJson[];
  professores: { id: string; nome: string }[];
}) {
  const navigate = useNavigate();
  const [novo, setNovo] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ac-muted">
          Marque o exame, coloque os candidatos (o sistema sugere quem está pronto) e cobre a taxa. No dia, marque aprovado ou
          reprovado e conclua: cada aprovado recebe a faixa e o certificado.
        </p>
        <Botao variante="primario" onClick={() => setNovo(true)}>
          <Plus className="size-4" />
          Novo exame
        </Botao>
      </div>
      {exames.length === 0 ? (
        <Card>
          <Vazio icone={GraduationCap}>Nenhum exame ainda.</Vazio>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exames.map((e) => (
            <Link key={e.id} to="/academia/exames/$id" params={{ id: e.id }} className="block">
              <Card className="h-full transition hover:border-red-500/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-ac-muted">
                      <PontoModalidade cor={e.modalidade.cor} />
                      {e.modalidade.nome}
                    </div>
                    <div className="mt-1 font-semibold text-white">{e.titulo}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${corStatusExame[e.status]}`}>
                    {e.status}
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  {data(e.data)}
                  {e.hora && ` às ${e.hora.slice(0, 5)}`}
                  {e.local && ` · ${e.local}`}
                </div>
                {e.banca && <div className="text-xs text-ac-muted">Banca: {e.banca}</div>}
                <div className="mt-3 flex gap-4 border-t border-ac-line pt-3 text-xs text-slate-300">
                  <span>
                    <b className="text-white">{e.candidatos}</b> candidatos
                  </span>
                  <span>
                    <b className="text-white">{e.pagos}</b> taxas pagas
                  </span>
                  {e.status === "realizado" && (
                    <span>
                      <b className="text-emerald-300">{e.aprovados}</b> aprovados
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {novo && (
        <ModalExame
          modalidades={modalidades}
          aoFechar={() => setNovo(false)}
          aoSalvar={(id) => navigate({ to: "/academia/exames/$id", params: { id } })}
        />
      )}
    </div>
  );
}

// ---------- Histórico ----------

function AbaHistorico({ recentes }: { recentes: import("../../lib/artes-marciais").GraduacaoJson[] }) {
  return (
    <Card className="!p-0">
      {recentes.length === 0 ? (
        <Vazio icone={Award}>Nenhuma graduação registrada ainda.</Vazio>
      ) : (
        <ul className="divide-y divide-ac-line">
          {recentes.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <FaixaVisual faixa={g.faixa} grau={g.grau} grausMaximos={g.grau > 0 ? Math.max(4, g.grau) : 0} largura={70} altura={12} />
              <div className="min-w-0 flex-1">
                <Link to="/academia/alunos/$id" params={{ id: g.aluno.id }} className="font-medium text-white hover:underline">
                  {g.aluno.nome}
                </Link>
                <div className="text-xs text-ac-muted">
                  {g.modalidade.nome} · {g.tipo === "grau" ? `${g.grau}º grau na ${g.faixa.nome}` : `Faixa ${faixaComGrau(g.faixa, g.grau)}`}
                  {g.professor && ` · Prof. ${g.professor}`}
                  {g.exame && ` · ${g.exame}`}
                </div>
              </div>
              <span className="text-sm text-slate-300">{data(g.data)}</span>
              <a
                href={`/certificado/${g.codigo}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ac-line px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
              >
                <ExternalLink className="size-3.5" />
                Certificado
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
