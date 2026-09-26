import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Cake,
  CalendarClock,
  ChevronDown,
  CircleAlert,
  Clock,
  Download,
  DoorClosed,
  Flame,
  MessageCircle,
  Printer,
  TrendingDown,
  UserCog,
  UserMinus,
  UserPlus,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao } from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, CardNumero, Legenda, TituloCard, Vazio } from "../../components/academia/ui";
import { diaHora } from "../../lib/academia-acesso";
import { fmt } from "../../lib/academia-alunos";
import {
  apiRelatorios,
  baixarCsv,
  rotuloFaixa,
  whatsapp,
  type FaixaSumido,
  type Relatorios,
} from "../../lib/academia-relatorios";

type Aba = "alunos" | "frequencia" | "inadimplencia" | "aulas" | "profissionais";
type Busca = { aba?: Aba; dias?: number };

const abas: Aba[] = ["alunos", "frequencia", "inadimplencia", "aulas", "profissionais"];

// Relatórios: alunos (entradas e saídas), frequência e risco de cancelamento,
// inadimplência, aulas e profissionais. Tudo exporta para planilha (CSV).
export const Route = createFileRoute("/academia/relatorios")({
  validateSearch: (s: Record<string, unknown>): Busca => {
    const dias = Number(s.dias);
    return {
      aba: abas.includes(s.aba as Aba) ? (s.aba as Aba) : undefined,
      dias: [7, 30, 90, 180, 365].includes(dias) ? dias : undefined,
    };
  },
  loaderDeps: ({ search }) => ({ dias: search.dias ?? 30 }),
  loader: ({ deps }) => apiRelatorios.montar(deps.dias),
  component: PaginaRelatorios,
});

function PaginaRelatorios() {
  const r = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const aba = busca.aba ?? "alunos";
  const ir = (b: Busca) => navigate({ to: "/academia/relatorios", search: { ...busca, ...b } });

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Relatórios"
        descricao={`Período: ${fmt.data(r.de)} a ${fmt.data(r.ate)}. Cada tabela pode ser baixada como planilha.`}
      >
        <label className="relative print:hidden">
          <select
            value={r.dias}
            onChange={(e) => ir({ dias: Number(e.target.value) })}
            className="h-10 appearance-none rounded-xl border border-ac-line bg-ac-card pr-9 pl-3 text-sm text-slate-200 outline-none"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={180}>Últimos 6 meses</option>
            <option value={365}>Último ano</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ac-muted" />
        </label>
        <Botao onClick={() => window.print()} className="print:hidden">
          <Printer className="size-4" />
          Imprimir
        </Botao>
      </CabecalhoPagina>

      <div className="print:hidden">
        <Abas
          abas={[
            { valor: "alunos", rotulo: "Alunos" },
            { valor: "frequencia", rotulo: "Frequência", quantidade: r.frequencia.sumidos.length },
            { valor: "inadimplencia", rotulo: "Inadimplência", quantidade: r.inadimplencia.alunos },
            { valor: "aulas", rotulo: "Aulas" },
            { valor: "profissionais", rotulo: "Profissionais" },
          ]}
          valor={aba}
          aoMudar={(a) => ir({ aba: a === "alunos" ? undefined : a })}
        />
      </div>

      {aba === "alunos" && <RelAlunos r={r} />}
      {aba === "frequencia" && <RelFrequencia r={r} />}
      {aba === "inadimplencia" && <RelInadimplencia r={r} />}
      {aba === "aulas" && <RelAulas r={r} />}
      {aba === "profissionais" && <RelProfissionais r={r} />}
    </div>
  );
}

function BotaoCsv({ aoBaixar }: { aoBaixar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoBaixar}
      className="inline-flex items-center gap-1.5 rounded-lg border border-ac-line px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-violet-500/60 hover:text-white print:hidden"
    >
      <Download className="size-3.5" />
      Baixar planilha
    </button>
  );
}

function Tabela({ cabecalho, children, minimo = 640 }: { cabecalho: ReactNode[]; children: ReactNode; minimo?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]" style={{ minWidth: minimo }}>
        <thead>
          <tr className="border-y border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
            {cabecalho.map((c, i) => (
              <th key={i} className={`py-2.5 pr-3 font-medium ${i === 0 ? "pl-5" : ""} ${i === cabecalho.length - 1 ? "pr-5" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ac-line/70">{children}</tbody>
      </table>
    </div>
  );
}

function BotaoWhats({ link }: { link: string | null }) {
  if (!link) return <span className="text-xs text-ac-muted">sem telefone</span>;
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 print:hidden"
    >
      <MessageCircle className="size-3.5" />
      WhatsApp
    </a>
  );
}

const eixo = { fill: "#8d96ab", fontSize: 11 };

// ---------- Alunos ----------

function RelAlunos({ r }: { r: Relatorios }) {
  const { resumo, meses, aniversariantes } = r.alunos;
  const mesAtual = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <CardNumero icone={UsersRound} cor="bg-violet-500/20 text-violet-300" rotulo="Alunos ativos">
          <span className="font-poppins text-[26px] font-bold text-white">{resumo.ativos}</span>
        </CardNumero>
        <CardNumero icone={UserPlus} cor="bg-emerald-500/15 text-emerald-300" rotulo="Novas matrículas">
          <span className="font-poppins text-[26px] font-bold text-white">{resumo.novosPeriodo}</span>
          <span className="text-xs text-ac-muted">no período</span>
        </CardNumero>
        <CardNumero icone={UserMinus} cor="bg-red-500/15 text-red-300" rotulo="Cancelamentos">
          <span className="font-poppins text-[26px] font-bold text-white">{resumo.canceladosPeriodo}</span>
          <span className="text-xs text-ac-muted">no período</span>
        </CardNumero>
        <CardNumero icone={TrendingDown} cor="bg-amber-500/15 text-amber-300" rotulo="Churn médio">
          <span className="font-poppins text-[26px] font-bold text-white">{resumo.churnMedio.toLocaleString("pt-BR")}%</span>
          <span className="text-xs text-ac-muted">ao mês</span>
        </CardNumero>
        <CardNumero icone={Wallet} cor="bg-sky-500/15 text-sky-300" rotulo="Ticket médio">
          <span className="font-poppins text-[22px] font-bold text-white">{fmt.moeda(resumo.ticketMedio)}</span>
          <span className="text-xs text-ac-muted">por aluno no mês passado</span>
        </CardNumero>
        <CardNumero icone={Clock} cor="bg-fuchsia-500/15 text-fuchsia-300" rotulo="Tempo médio de casa">
          <span className="font-poppins text-[26px] font-bold text-white">{resumo.tempoMedioMeses.toLocaleString("pt-BR")}</span>
          <span className="text-xs text-ac-muted">meses</span>
        </CardNumero>
      </div>

      <Card>
        <TituloCard
          icone={UsersRound}
          cor="text-violet-400"
          acao={
            <BotaoCsv
              aoBaixar={() =>
                baixarCsv(
                  "alunos-por-mes",
                  ["Mês", "Ano", "Ativos no fim do mês", "Novas matrículas", "Cancelamentos", "Churn (%)"],
                  meses.map((m) => [m.mes, m.ano, m.ativosFim, m.novos, m.cancelados, m.churn]),
                )
              }
            />
          }
        >
          Entradas e saídas por mês
        </TituloCard>
        <p className="mt-1 text-xs text-ac-muted">
          Churn = quantos cancelaram no mês, em % de quem estava ativo no começo do mês. Quanto menor, melhor.
        </p>
        <div className="mt-3">
          <Legenda
            itens={[
              { cor: "#8b5cf6", rotulo: "Ativos" },
              { cor: "#22c55e", rotulo: "Novas matrículas" },
              { cor: "#ef4444", rotulo: "Cancelamentos" },
            ]}
          />
        </div>
        <div className="mt-2 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={meses} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1c2640" />
              <XAxis dataKey="mes" tick={eixo} axisLine={false} tickLine={false} />
              <YAxis tick={eixo} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#131c33", border: "1px solid #1c2640", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#fff" }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="ativosFim" name="Ativos" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
              <Bar dataKey="novos" name="Novas matrículas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              <Line dataKey="cancelados" name="Cancelamentos" stroke="#ef4444" strokeWidth={2} dot={{ r: 3.5, fill: "#ef4444" }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="-mx-5 mt-4">
          <Tabela cabecalho={["Mês", "Ativos no fim", "Novas matrículas", "Cancelamentos", "Churn"]} minimo={520}>
            {meses.map((m) => (
              <tr key={`${m.ano}-${m.mes}`}>
                <td className="py-2 pr-3 pl-5 text-slate-200">
                  {m.mes}/{String(m.ano).slice(2)}
                </td>
                <td className="py-2 pr-3 font-semibold text-white">{m.ativosFim}</td>
                <td className="py-2 pr-3 text-emerald-300">+{m.novos}</td>
                <td className="py-2 pr-3 text-red-300">−{m.cancelados}</td>
                <td className="py-2 pr-5 text-slate-300">{m.churn.toLocaleString("pt-BR")}%</td>
              </tr>
            ))}
          </Tabela>
        </div>
      </Card>

      <Card className="!p-0">
        <div className="p-5 pb-3">
          <TituloCard
            icone={Cake}
            cor="text-pink-400"
            acao={
              <BotaoCsv
                aoBaixar={() =>
                  baixarCsv(
                    "aniversariantes",
                    ["Dia", "Aluno", "Idade", "Telefone"],
                    aniversariantes.map((a) => [a.dia, a.nome, a.idade, fmt.telefone(a.telefone)]),
                  )
                }
              />
            }
          >
            Aniversariantes de {mesAtual}
          </TituloCard>
        </div>
        {aniversariantes.length === 0 ? (
          <Vazio icone={Cake}>Nenhum aniversariante entre os alunos ativos.</Vazio>
        ) : (
          <Tabela cabecalho={["Dia", "Aluno", "Faz", ""]} minimo={480}>
            {aniversariantes.map((a) => (
              <tr key={a.alunoId}>
                <td className="py-2 pr-3 pl-5 font-semibold text-white">{String(a.dia).padStart(2, "0")}</td>
                <td className="py-2 pr-3">
                  <Link to="/academia/alunos/$id" params={{ id: a.alunoId }} className="text-slate-100 hover:text-violet-300">
                    {a.nome}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-slate-300">{a.idade ? `${a.idade} anos` : "—"}</td>
                <td className="py-2 pr-5 text-right">
                  <BotaoWhats
                    link={whatsapp(a.telefone, `Parabéns, ${a.nome.split(" ")[0]}! 🎉 A equipe da academia deseja um feliz aniversário!`)}
                  />
                </td>
              </tr>
            ))}
          </Tabela>
        )}
      </Card>
    </>
  );
}

// ---------- Frequência ----------

function RelFrequencia({ r }: { r: Relatorios }) {
  const f = r.frequencia;
  const [faixa, setFaixa] = useState<"todas" | FaixaSumido>("todas");
  const lista = f.sumidos.filter((s) => faixa === "todas" || s.faixa === faixa);
  const conta = (x: FaixaSumido) => f.sumidos.filter((s) => s.faixa === x).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CardNumero icone={Flame} cor="bg-orange-500/15 text-orange-300" rotulo="Treinos por semana">
          <span className="font-poppins text-[26px] font-bold text-white">{f.mediaSemanalPorAluno.toLocaleString("pt-BR")}</span>
          <span className="text-xs text-ac-muted">em média, por aluno ativo (30 dias)</span>
        </CardNumero>
        <CardNumero icone={UsersRound} cor="bg-emerald-500/15 text-emerald-300" rotulo="Vieram nos últimos 30 dias">
          <span className="font-poppins text-[26px] font-bold text-white">{f.alunosQueVieram}</span>
          <span className="text-xs text-ac-muted">de {f.ativos} ativos</span>
        </CardNumero>
        <CardNumero icone={DoorClosed} cor="bg-red-500/15 text-red-300" rotulo="Sumidos (7+ dias)" className="col-span-2 xl:col-span-1">
          <span className="font-poppins text-[26px] font-bold text-white">{f.sumidos.length}</span>
          <span className="text-xs text-ac-muted">risco de cancelamento</span>
        </CardNumero>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <Card className="!p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
            <TituloCard icone={DoorClosed} cor="text-red-400">
              Alunos ativos que não estão vindo
            </TituloCard>
            <BotaoCsv
              aoBaixar={() =>
                baixarCsv(
                  "alunos-sumidos",
                  ["Aluno", "Telefone", "Plano", "Última entrada", "Dias sem vir"],
                  f.sumidos.map((s) => [s.nome, fmt.telefone(s.telefone), s.plano, s.ultimaEntrada ? diaHora(s.ultimaEntrada) : "nunca", s.diasSemVir]),
                )
              }
            />
          </div>
          <div className="px-5 pb-3">
            <Abas
              abas={[
                { valor: "todas", rotulo: "Todos", quantidade: f.sumidos.length },
                { valor: "7_dias", rotulo: rotuloFaixa["7_dias"], quantidade: conta("7_dias") },
                { valor: "14_dias", rotulo: rotuloFaixa["14_dias"], quantidade: conta("14_dias") },
                { valor: "30_dias", rotulo: rotuloFaixa["30_dias"], quantidade: conta("30_dias") },
                { valor: "nunca", rotulo: rotuloFaixa.nunca, quantidade: conta("nunca") },
              ]}
              valor={faixa}
              aoMudar={setFaixa}
            />
          </div>
          {lista.length === 0 ? (
            <Vazio icone={UsersRound}>Todos os alunos ativos vieram na última semana. 💪</Vazio>
          ) : (
            <Tabela cabecalho={["Aluno", "Plano", "Última entrada", "Sem vir há", ""]}>
              {lista.map((s) => (
                <tr key={s.alunoId}>
                  <td className="py-2.5 pr-3 pl-5">
                    <Link
                      to="/academia/alunos/$id"
                      params={{ id: s.alunoId }}
                      className="flex items-center gap-2.5 font-medium text-slate-100 hover:text-violet-300"
                    >
                      <AvatarAluno nome={s.nome} />
                      {s.nome}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{s.plano}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{s.ultimaEntrada ? diaHora(s.ultimaEntrada) : "nunca veio"}</td>
                  <td className={`py-2.5 pr-3 font-semibold ${s.diasSemVir === null || s.diasSemVir >= 14 ? "text-red-300" : "text-amber-300"}`}>
                    {s.diasSemVir === null ? "—" : `${s.diasSemVir} dias`}
                  </td>
                  <td className="py-2.5 pr-5 text-right">
                    <BotaoWhats
                      link={whatsapp(s.telefone, `Oi, ${s.nome.split(" ")[0]}! Sentimos sua falta na academia. Está tudo bem? Bora voltar a treinar? 💪`)}
                    />
                  </td>
                </tr>
              ))}
            </Tabela>
          )}
        </Card>

        <Card className="h-fit">
          <TituloCard icone={Flame} cor="text-orange-400">
            Mais frequentes (30 dias)
          </TituloCard>
          <ol className="mt-3 flex flex-col divide-y divide-ac-line">
            {f.maisFrequentes.map((a, i) => (
              <li key={a.alunoId} className="flex items-center gap-3 py-2">
                <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-orange-300" : "text-ac-muted"}`}>{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-slate-100">{a.nome}</span>
                <span className="text-sm font-semibold text-white">{a.entradas}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}

// ---------- Inadimplência ----------

function RelInadimplencia({ r }: { r: Relatorios }) {
  const i = r.inadimplencia;
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <CardNumero icone={CircleAlert} cor="bg-red-500/15 text-red-300" rotulo="Total em atraso">
          <span className="font-poppins text-[26px] font-bold text-white">{fmt.moeda(i.total)}</span>
        </CardNumero>
        <CardNumero icone={UserRound} cor="bg-amber-500/15 text-amber-300" rotulo="Alunos devendo">
          <span className="font-poppins text-[26px] font-bold text-white">{i.alunos}</span>
        </CardNumero>
      </div>
      <Card className="!p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <TituloCard icone={CalendarClock} cor="text-red-400">
            Quem está em atraso
          </TituloCard>
          <BotaoCsv
            aoBaixar={() =>
              baixarCsv(
                "inadimplencia",
                ["Aluno", "Telefone", "Plano/serviço", "Vencimento mais antigo", "Dias de atraso", "Cobranças em atraso", "Valor (R$)"],
                i.devedores.map((d) => [d.nome, fmt.telefone(d.telefone), d.plano, fmt.data(d.vencimentoMaisAntigo), d.diasAtraso, d.mensalidades, d.valor]),
              )
            }
          />
        </div>
        {i.devedores.length === 0 ? (
          <Vazio icone={Wallet}>Ninguém em atraso. 🎉</Vazio>
        ) : (
          <Tabela cabecalho={["Aluno", "Plano", "Venceu em", "Atraso", "Valor", ""]} minimo={720}>
            {i.devedores.map((d) => (
              <tr key={d.alunoId}>
                <td className="py-2.5 pr-3 pl-5">
                  <Link
                    to="/academia/alunos/$id"
                    params={{ id: d.alunoId }}
                    className="flex items-center gap-2.5 font-medium text-slate-100 hover:text-violet-300"
                  >
                    <AvatarAluno nome={d.nome} />
                    {d.nome}
                  </Link>
                </td>
                <td className="py-2.5 pr-3 text-slate-300">{d.plano}</td>
                <td className="py-2.5 pr-3 text-slate-300">{fmt.data(d.vencimentoMaisAntigo)}</td>
                <td className="py-2.5 pr-3 font-semibold text-red-300">
                  {d.diasAtraso} dias
                  {d.mensalidades > 1 && <div className="text-[11px] font-normal text-ac-muted">{d.mensalidades} cobranças</div>}
                </td>
                <td className="py-2.5 pr-3 font-semibold text-white">{fmt.moeda(d.valor)}</td>
                <td className="py-2.5 pr-5 text-right">
                  <BotaoWhats
                    link={whatsapp(
                      d.telefone,
                      `Oi, ${d.nome.split(" ")[0]}! Tudo bem? Consta em aberto na academia ${fmt.moeda(d.valor)} (vencimento ${fmt.data(d.vencimentoMaisAntigo)}). Pode acertar pelo Pix ou na recepção. Obrigado!`,
                    )}
                  />
                </td>
              </tr>
            ))}
          </Tabela>
        )}
      </Card>
    </>
  );
}

// ---------- Aulas ----------

function RelAulas({ r }: { r: Relatorios }) {
  return (
    <Card className="!p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
        <TituloCard icone={UsersRound} cor="text-violet-400">
          Aulas coletivas no período
        </TituloCard>
        <BotaoCsv
          aoBaixar={() =>
            baixarCsv(
              "aulas",
              ["Aula", "Professor", "Aulas dadas", "Vagas", "Média de alunos", "Ocupação (%)", "Presença (%)", "Faltas"],
              r.aulas.map((a) => [a.aula, a.professor, a.sessoes, a.capacidade, a.mediaAlunos, a.ocupacao, a.presenca, a.faltas]),
            )
          }
        />
      </div>
      <p className="px-5 pb-3 text-xs text-ac-muted">
        Ocupação = média de alunos por aula em % das vagas. Presença = quem veio, entre os que tiveram a chamada feita.
      </p>
      {r.aulas.length === 0 ? (
        <Vazio icone={UsersRound}>Nenhuma aula aconteceu no período.</Vazio>
      ) : (
        <Tabela cabecalho={["Aula", "Professor", "Aulas dadas", "Média de alunos", "Ocupação", "Presença", "Faltas"]} minimo={760}>
          {r.aulas.map((a) => (
            <tr key={a.aula}>
              <td className="py-2.5 pr-3 pl-5 font-medium text-white">{a.aula}</td>
              <td className="py-2.5 pr-3 text-slate-300">{a.professor}</td>
              <td className="py-2.5 pr-3 text-slate-300">{a.sessoes}</td>
              <td className="py-2.5 pr-3 text-slate-300">
                {a.mediaAlunos.toLocaleString("pt-BR")} <span className="text-ac-muted">/ {a.capacidade}</span>
              </td>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                    <span className="block h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400" style={{ width: `${a.ocupacao}%` }} />
                  </span>
                  <span className="font-semibold text-white">{a.ocupacao}%</span>
                </div>
              </td>
              <td className="py-2.5 pr-3 text-slate-300">{a.presenca !== null ? `${a.presenca}%` : "—"}</td>
              <td className="py-2.5 pr-5 text-red-300">{a.faltas}</td>
            </tr>
          ))}
        </Tabela>
      )}
    </Card>
  );
}

// ---------- Profissionais ----------

function RelProfissionais({ r }: { r: Relatorios }) {
  return (
    <Card className="!p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
        <TituloCard icone={UserCog} cor="text-sky-400">
          O que cada profissional fez no período
        </TituloCard>
        <BotaoCsv
          aoBaixar={() =>
            baixarCsv(
              "profissionais",
              ["Profissional", "Especialidade", "Alunos com ficha", "Fichas montadas", "Avaliações", "Atendimentos", "Aulas dadas", "Comissão (R$)"],
              r.profissionais.map((p) => [p.nome, p.especialidade, p.alunosComFicha, p.fichasMontadas, p.avaliacoes, p.atendimentos, p.aulasDadas, p.comissao]),
            )
          }
        />
      </div>
      <Tabela
        cabecalho={["Profissional", "Alunos com ficha", "Fichas montadas", "Avaliações", "Atendimentos", "Aulas dadas", "Comissão"]}
        minimo={820}
      >
        {r.profissionais.map((p) => (
          <tr key={p.id}>
            <td className="py-2.5 pr-3 pl-5">
              <div className="flex items-center gap-2.5">
                <AvatarAluno nome={p.nome} />
                <div>
                  <div className="font-medium text-white">{p.nome}</div>
                  <div className="text-[11px] text-ac-muted">{p.especialidade}</div>
                </div>
              </div>
            </td>
            <td className="py-2.5 pr-3 text-slate-300">{p.alunosComFicha}</td>
            <td className="py-2.5 pr-3 text-slate-300">{p.fichasMontadas}</td>
            <td className="py-2.5 pr-3 text-slate-300">{p.avaliacoes}</td>
            <td className="py-2.5 pr-3 text-slate-300">{p.atendimentos}</td>
            <td className="py-2.5 pr-3 text-slate-300">{p.aulasDadas}</td>
            <td className="py-2.5 pr-5 font-semibold text-emerald-300">{fmt.moeda(p.comissao)}</td>
          </tr>
        ))}
      </Tabela>
    </Card>
  );
}
