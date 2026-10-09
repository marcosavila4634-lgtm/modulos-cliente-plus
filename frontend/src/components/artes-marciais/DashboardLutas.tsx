import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Activity,
  Award,
  BadgeCheck,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  FilePlus,
  GraduationCap,
  HeartPulse,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
  Trophy,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dataPorExtenso, formatar, type DashboardAcademia } from "../../lib/academia";
import { hojeIso, type DashboardLutas as Dados } from "../../lib/artes-marciais";
import { destinoDoAlerta, estiloDoAlerta } from "../academia/TopbarAcademia";
import { Card, SeletorPeriodo, TituloCard, Variacao } from "../academia/ui";
import { PontoModalidade } from "./Faixa";

type Props = { academia: DashboardAcademia; lutas: Dados };

// Dashboard do Artes Marciais: números da Academia (alunos, matrículas,
// faturamento) + os de luta (agenda de hoje, modalidades, status das
// matrículas, presenças, atenção e atividades).
export function DashboardLutas({ academia: a, lutas: l }: Props) {
  // intercala os avisos da academia (mensalidades...) com os de luta
  const alertas: { tipo: string; titulo: string; descricao: string }[] = [];
  for (let i = 0; i < Math.max(a.alertas.length, l.alertas.length); i++) {
    if (a.alertas[i]) alertas.push(a.alertas[i]);
    if (l.alertas[i]) alertas.push(l.alertas[i]);
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] [&>*]:min-w-0">
        <div className="flex min-w-0 flex-col gap-4">
          <Saudacao nome={a.gestor.nome} frase={a.frase} />
          <Indicadores a={a} l={l} />
          <Atalhos />
        </div>
        <div className="flex flex-col gap-4">
          <Card className="flex items-center gap-3 !py-3.5">
            <span className="grid size-9 place-items-center rounded-lg border border-ac-line text-slate-300">
              <CalendarDays className="size-[18px]" />
            </span>
            <span className="text-[13px] whitespace-nowrap text-slate-200">{dataPorExtenso()}</span>
          </Card>
          <Banner />
          <PresencasHoje dados={l.presencasHoje} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.55fr_1.15fr_1fr] [&>*]:min-w-0">
        <AgendaHoje dados={l.agendaHoje} />
        <AlunosPorModalidade dados={l.modalidades} total={l.totalAlunosModalidades} />
        <RequerAtencao dados={alertas} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.4fr_1.1fr_1.05fr] [&>*]:min-w-0">
        <Faturamento dados={a.receitaDespesas} />
        <StatusMatriculas dados={l.statusMatriculas} />
        <UltimasAtividades dados={l.atividades} />
      </div>
    </div>
  );
}

// ---------- Topo ----------

function Saudacao({ nome, frase }: { nome: string; frase: string }) {
  return (
    <div className="relative min-h-[118px] overflow-hidden rounded-2xl">
      <img
        src="/artes-marciais/hero.jpg"
        alt=""
        className="pointer-events-none absolute top-0 right-0 hidden h-full w-[420px] object-cover object-[center_35%] opacity-80 grayscale md:block [mask-image:linear-gradient(to_right,transparent,black_35%,black_80%,transparent)]"
      />
      <div className="absolute inset-y-0 right-0 hidden w-[420px] bg-gradient-to-l from-red-700/10 to-transparent md:block" />
      <div className="relative py-3">
        <h1 className="font-poppins text-[32px] font-bold text-white">Olá, {nome}!</h1>
        <p className="mt-1 text-[16px] font-medium text-slate-200">Disciplina hoje, grandes conquistas amanhã.</p>
        <p className="mt-0.5 text-[13px] text-ac-muted">Aqui está o resumo da sua academia de artes marciais.</p>
      </div>
      <p className="absolute top-4 right-6 hidden max-w-[230px] text-right font-poppins text-[16px] leading-snug text-slate-100 italic lg:block">
        “{frase}”
        <span className="mt-2 ml-auto block h-0.5 w-10 bg-red-600" />
      </p>
    </div>
  );
}

function Indicadores({ a, l }: { a: DashboardAcademia; l: Dados }) {
  const i = a.indicadores;
  const cards: {
    icone: LucideIcon;
    cor: string;
    rotulo: string;
    valor: string;
    variacao: number;
    detalhe: string;
  }[] = [
    {
      icone: Users,
      cor: "bg-red-600 text-white",
      rotulo: "Alunos ativos",
      valor: String(i.alunosAtivos.valor),
      variacao: i.alunosAtivos.variacao,
      detalhe: `+ ${i.alunosAtivos.noUltimoMes} nos últimos 30 dias`,
    },
    {
      icone: GraduationCap,
      cor: "bg-blue-600 text-white",
      rotulo: "Matrículas no mês",
      valor: String(i.matriculasMes.valor),
      variacao: i.matriculasMes.variacao,
      detalhe: `Mês anterior: ${i.matriculasMes.mesAnterior}`,
    },
    {
      icone: DollarSign,
      cor: "bg-emerald-600 text-white",
      rotulo: "Faturamento mensal",
      valor: formatar.moeda(i.faturamentoMensal.valor),
      variacao: i.faturamentoMensal.variacao,
      detalhe: `Mês anterior: ${formatar.moeda(i.faturamentoMensal.mesAnterior)}`,
    },
    {
      icone: ChartColumn,
      cor: "bg-red-600 text-white",
      rotulo: "Taxa de permanência",
      valor: `${l.permanencia.valor}%`,
      variacao: l.permanencia.variacao,
      detalhe: `Dos ${l.permanencia.base} alunos de 90 dias atrás`,
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icone: Icone, ...c }) => (
        <Card key={c.rotulo} className="!p-4">
          <div className="flex items-center gap-3">
            <span className={`grid size-9 place-items-center rounded-full ${c.cor}`}>
              <Icone className="size-[18px]" />
            </span>
            <span className="text-[13px] whitespace-nowrap text-slate-300">{c.rotulo}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 pl-12">
            <span className={`font-poppins font-bold text-white ${c.valor.length > 7 ? "text-[22px]" : "text-[26px]"}`}>{c.valor}</span>
            <Variacao valor={c.variacao} />
          </div>
          <div className="mt-0.5 pl-12 text-[11.5px] text-ac-muted">{c.detalhe}</div>
        </Card>
      ))}
    </div>
  );
}

const atalhos: { rotulo: string; icone: LucideIcon; link: LinkProps }[] = [
  { rotulo: "Novo aluno", icone: UserPlus, link: { to: "/academia/alunos", search: { novo: true } } },
  { rotulo: "Nova matrícula", icone: FilePlus, link: { to: "/academia/alunos", search: { filtro: "sem_matricula" } } },
  { rotulo: "Nova aula", icone: CalendarDays, link: { to: "/academia/aulas-e-turmas", search: { nova: true } } },
  { rotulo: "Registrar presença", icone: QrCode, link: { to: "/academia/presenca" } },
  { rotulo: "Avaliação física", icone: HeartPulse, link: { to: "/academia/avaliacao-fisica", search: { nova: true } } },
  { rotulo: "Graduar aluno", icone: Award, link: { to: "/academia/graduacoes", search: { filtro: "aptos" } } },
  { rotulo: "Cobrança", icone: CreditCard, link: { to: "/academia/faturamento" } },
  { rotulo: "Relatório", icone: ChartColumn, link: { to: "/academia/relatorios" } },
];

function Atalhos() {
  return (
    <div className="grid grid-cols-4 gap-3 lg:grid-cols-8">
      {atalhos.map(({ rotulo, icone: Icone, link }) => (
        <Link
          key={rotulo}
          {...link}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ac-line bg-gradient-to-b from-ac-card-2/70 to-ac-card px-2 py-3.5 text-center transition-colors hover:border-red-500/50 hover:bg-ac-card-2"
        >
          <Icone className="size-7 text-red-500" strokeWidth={1.75} />
          <span className="text-[12px] leading-tight text-slate-200">{rotulo}</span>
        </Link>
      ))}
    </div>
  );
}

function Banner() {
  return (
    <div className="relative min-h-[150px] flex-1 overflow-hidden rounded-2xl border border-ac-line bg-black">
      <img
        src="/artes-marciais/banner.jpg"
        alt=""
        className="absolute inset-y-0 right-0 h-full w-[60%] object-cover object-[45%_center] grayscale [mask-image:linear-gradient(to_right,transparent,black_45%)]"
      />
      <div className="relative flex h-full flex-col justify-center p-4 font-impact text-[22px] leading-[1.02] tracking-wide text-white uppercase">
        <span>Mais</span>
        <span>disciplina</span>
        <span>
          mais <span className="text-red-500">respeito</span>
        </span>
        <span>mais conquistas</span>
        <span className="mt-2 font-sans text-[8.5px] font-semibold tracking-[0.2em] text-ac-muted">
          Artes marciais transformam vidas
        </span>
      </div>
    </div>
  );
}

function PresencasHoje({ dados }: { dados: Dados["presencasHoje"] }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-3">
        <CircleCheck className="size-5 text-emerald-400" />
        <span className="text-[13px] font-medium text-white">Presenças de hoje</span>
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="font-poppins text-[28px] font-bold text-white">{dados.valor}</span>
        <Variacao valor={dados.variacao} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ac-line">
          <div className="h-full rounded-full bg-red-600" style={{ width: `${Math.min(100, dados.percentual)}%` }} />
        </div>
        <span className="text-xs font-semibold text-slate-200">{dados.percentual}%</span>
      </div>
      <div className="mt-1.5 text-[11.5px] text-ac-muted">Total de alunos ativos: {dados.alunosAtivos}</div>
    </Card>
  );
}

// ---------- Agenda e modalidades ----------

const estiloStatus = {
  em_andamento: { rotulo: "Em andamento", cor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  proxima: { rotulo: "Próxima", cor: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  agendada: { rotulo: "Agendada", cor: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  concluida: { rotulo: "Concluída", cor: "border-ac-line bg-white/[0.03] text-ac-muted" },
} as const;

function AgendaHoje({ dados }: { dados: Dados["agendaHoje"] }) {
  // Mostra a partir da última aula concluída (as de antes somem quando o dia avança).
  const primeira = Math.max(0, dados.findIndex((x) => x.status !== "concluida") - 1);
  const lista = dados.slice(primeira).slice(0, 7);
  return (
    <Card>
      <TituloCard
        icone={CalendarDays}
        cor="text-red-500"
        acao={
          <Link to="/academia/presenca" className="text-xs font-medium text-red-400 hover:text-red-300">
            Ver agenda completa →
          </Link>
        }
      >
        Agenda de hoje
      </TituloCard>
      {lista.length === 0 && <p className="mt-8 text-center text-sm text-ac-muted">Nenhuma aula hoje.</p>}
      <ul className="mt-3 flex flex-col divide-y divide-ac-line/70">
        {lista.map((x) => {
          const s = estiloStatus[x.status];
          return (
            <li key={x.horarioId}>
              <Link
                to="/academia/aulas-e-turmas/$horarioId"
                params={{ horarioId: x.horarioId }}
                search={{ data: hojeIso() }}
                className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 py-2 hover:bg-white/[0.02] sm:grid-cols-[44px_minmax(0,1fr)_96px_48px]"
              >
                <span className="text-[13px] font-semibold text-slate-200">{x.hora}</span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <PontoModalidade cor={x.modalidade?.cor ?? "#71717a"} className="size-2.5" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-white">{x.aula}</span>
                    <span className="flex items-center gap-1 truncate text-[11px] text-ac-muted">
                      Prof. {x.professor?.split(" ")[0] ?? "—"}
                      <MapPin className="ml-1 size-3 shrink-0" />
                      {x.sala}
                    </span>
                  </span>
                </span>
                <span className={`hidden justify-self-start rounded-md border px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap sm:inline ${s.cor}`}>
                  {s.rotulo}
                </span>
                <span className="text-right text-[12px] text-slate-300">
                  {x.status === "concluida" || x.status === "em_andamento" ? x.presentes : x.ocupados}/{x.capacidade}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AlunosPorModalidade({ dados, total }: { dados: Dados["modalidades"]; total: number }) {
  return (
    <Card>
      <TituloCard
        icone={Trophy}
        cor="text-red-500"
        acao={
          <Link to="/academia/graduacoes" search={{ aba: "faixas" }} className="text-xs font-medium text-red-400 hover:text-red-300">
            Faixas →
          </Link>
        }
      >
        Alunos por modalidade
      </TituloCard>
      <div className="mt-3 grid grid-cols-[150px_minmax(0,1fr)] items-center gap-4">
        <div className="relative h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dados}
                dataKey="alunos"
                nameKey="nome"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={1.5}
                stroke="var(--color-ac-card)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {dados.map((m) => (
                  <Cell key={m.nome} fill={m.cor} />
                ))}
              </Pie>
              <Tooltip content={<DicaPizza sufixo="alunos" />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-poppins text-2xl font-bold text-white">{total}</div>
              <div className="text-[11px] text-ac-muted">alunos</div>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-1.5">
          {dados.map((m) => (
            <li key={m.nome} className="flex items-center gap-2 text-[12.5px]">
              <PontoModalidade cor={m.cor} className="size-2.5 rounded-[3px]" />
              <span className="min-w-0 flex-1 truncate text-slate-200">{m.nome}</span>
              <span className="text-slate-300">{m.percentual}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function DicaPizza({
  active,
  payload,
  sufixo,
}: {
  active?: boolean;
  payload?: readonly { name?: string; value?: number }[];
  sufixo: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ac-line bg-ac-card-2 px-3 py-2 text-xs text-white shadow-lg">
      {payload[0].name}: <b>{payload[0].value}</b> {sufixo}
    </div>
  );
}

function RequerAtencao({ dados }: { dados: { tipo: string; titulo: string; descricao: string }[] }) {
  return (
    <Card>
      <TituloCard icone={TriangleAlert} cor="text-red-500">
        Requer atenção
      </TituloCard>
      {dados.length === 0 && <p className="mt-6 text-center text-sm text-emerald-300">Tudo em dia por aqui.</p>}
      <ul className="mt-3 flex max-h-[290px] flex-col gap-1 overflow-y-auto pr-1">
        {dados.map((x) => {
          const estilo = estiloDoAlerta(x.tipo);
          if (!estilo) return null;
          const { icone: Icone, cor } = estilo;
          return (
            <li key={x.tipo}>
              <Link
                {...destinoDoAlerta(x.tipo)}
                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-full border ${cor}`}>
                  <Icone className="size-4" />
                </span>
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="text-[12.5px] font-medium text-white">{x.titulo}</div>
                  <div className="truncate text-[11px] text-ac-muted">{x.descricao}</div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-ac-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ---------- Financeiro, matrículas e atividades ----------

function DicaLinha({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly { dataKey?: unknown; value?: unknown }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ac-line bg-ac-card-2 px-3 py-2 text-xs leading-relaxed text-white shadow-lg">
      <div className="font-semibold">{label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${p.dataKey === "receita" ? "bg-red-600" : "bg-blue-500"}`} />
          {p.dataKey === "receita" ? "Receita" : "Despesas"}: {formatar.moeda(Number(p.value ?? 0))}
        </div>
      ))}
    </div>
  );
}

function Faturamento({ dados }: { dados: DashboardAcademia["receitaDespesas"] }) {
  const [meses, setMeses] = useState(6);
  const serie = dados.slice(-meses);
  const temDespesas = serie.some((d) => d.despesas !== null);
  return (
    <Card>
      <TituloCard icone={TrendingUp} cor="text-red-500" acao={<SeletorPeriodo valor={meses} aoMudar={setMeses} />}>
        Faturamento
      </TituloCard>
      <div className="mt-3 flex items-center gap-5 text-xs text-slate-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 rounded bg-red-600" /> Receita
        </span>
        {temDespesas && (
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-4 rounded bg-blue-500" /> Despesas
          </span>
        )}
      </div>
      <div className="mt-2 h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={serie} margin={{ top: 12, right: 12, left: -6, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-ac-line)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatar.milhar(v)}
              width={44}
            />
            <Tooltip content={<DicaLinha />} cursor={{ stroke: "#52525b" }} />
            <Line
              type="monotone"
              dataKey="receita"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 4, fill: "#dc2626", stroke: "var(--color-ac-card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {temDespesas && (
              <Line
                type="monotone"
                dataKey="despesas"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6", stroke: "var(--color-ac-card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function StatusMatriculas({ dados }: { dados: Dados["statusMatriculas"] }) {
  const fatias = [
    { nome: "Ativas", valor: dados.ativas, cor: "#16a34a", icone: BadgeCheck },
    { nome: "Renovação", valor: dados.emRenovacao, cor: "#d97706", icone: ClipboardList },
    { nome: "Em atraso", valor: dados.emAtraso, cor: "#dc2626", icone: TriangleAlert },
    { nome: "Canceladas", valor: dados.canceladas, cor: "#71717a", icone: UsersRound },
  ];
  const pct = (v: number) => (dados.total ? Math.round((v * 100) / dados.total) : 0);
  return (
    <Card>
      <TituloCard
        icone={ShieldCheck}
        cor="text-emerald-400"
        acao={
          <Link to="/academia/alunos" className="text-xs font-medium text-red-400 hover:text-red-300">
            Alunos →
          </Link>
        }
      >
        Status das matrículas
      </TituloCard>
      <div className="mt-3 grid grid-cols-[150px_minmax(0,1fr)] items-center gap-4">
        <div className="relative h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fatias}
                dataKey="valor"
                nameKey="nome"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={1.5}
                stroke="var(--color-ac-card)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {fatias.map((f) => (
                  <Cell key={f.nome} fill={f.cor} />
                ))}
              </Pie>
              <Tooltip content={<DicaPizza sufixo="matrículas" />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-poppins text-2xl font-bold text-white">{dados.total}</div>
              <div className="text-[11px] text-ac-muted">alunos</div>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-2">
          {fatias.map(({ icone: Icone, ...f }) => (
            <li key={f.nome} className="flex items-center gap-2 text-[12.5px]">
              <Icone className="size-3.5 shrink-0" style={{ color: f.cor }} />
              <span className="min-w-0 flex-1 truncate text-slate-200">{f.nome}</span>
              <span className="text-slate-300">{pct(f.valor)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

const iconeAtividade: Record<Dados["atividades"][number]["tipo"], { icone: LucideIcon; cor: string }> = {
  checkin: { icone: CircleCheck, cor: "bg-emerald-500/15 text-emerald-300" },
  matricula: { icone: UserPlus, cor: "bg-sky-500/15 text-sky-300" },
  avaliacao: { icone: Activity, cor: "bg-red-500/15 text-red-300" },
  graduacao: { icone: Award, cor: "bg-amber-500/15 text-amber-300" },
  inscricao: { icone: Trophy, cor: "bg-violet-500/15 text-violet-300" },
  venda: { icone: ShoppingBag, cor: "bg-pink-500/15 text-pink-300" },
  pagamento: { icone: DollarSign, cor: "bg-emerald-500/15 text-emerald-300" },
};

function UltimasAtividades({ dados }: { dados: Dados["atividades"] }) {
  return (
    <Card>
      <TituloCard icone={Activity} cor="text-red-500">
        Últimas atividades
      </TituloCard>
      {dados.length === 0 && <p className="mt-6 text-center text-sm text-ac-muted">Nada nos últimos 7 dias.</p>}
      <ul className="mt-3 flex flex-col gap-2.5">
        {dados.map((x, i) => {
          const { icone: Icone, cor } = iconeAtividade[x.tipo];
          return (
            <li key={i} className="flex items-center gap-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${cor}`}>
                <Icone className="size-4" />
              </span>
              <div className="min-w-0 flex-1 leading-snug">
                <div className="truncate text-[12.5px] font-medium text-white">{x.texto}</div>
                <div className="truncate text-[11px] text-ac-muted">{x.detalhe}</div>
              </div>
              <span className="shrink-0 text-[11px] text-ac-muted">{x.quando}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
