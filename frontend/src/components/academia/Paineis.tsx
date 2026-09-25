import { Link, type LinkProps } from "@tanstack/react-router";
import {
  CalendarClock,
  CalendarX,
  ChartLine,
  ChevronRight,
  Clock,
  Dumbbell,
  FileText,
  HandCoins,
  ListChecks,
  TriangleAlert,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatar, type DashboardAcademia } from "../../lib/academia";
import { Card, Legenda, SeletorPeriodo, TituloCard } from "./ui";

const eixo = { fill: "#8d96ab", fontSize: 11 };
const grade = "#1c2640";

// ---------- Evolução de alunos ----------

function TooltipAlunos({ active, payload }: { active?: boolean; payload?: readonly { payload?: unknown }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { ativos: number; novos: number };
  return (
    <div className="rounded-lg border border-ac-line bg-ac-card-2 px-3 py-2 text-xs leading-relaxed text-white shadow-lg">
      <div>{d.ativos} ativos</div>
      <div>{d.novos} novos</div>
    </div>
  );
}

export function EvolucaoAlunos({ dados }: { dados: DashboardAcademia["evolucaoAlunos"] }) {
  const [meses, setMeses] = useState(6);
  const serie = dados.slice(-meses);

  return (
    <Card>
      <TituloCard icone={Users} cor="text-violet-400" acao={<SeletorPeriodo valor={meses} aoMudar={setMeses} />}>
        Evolução de alunos
      </TituloCard>
      <div className="mt-3">
        <Legenda
          itens={[
            { cor: "#8b5cf6", rotulo: "Alunos ativos" },
            { cor: "#3b82f6", rotulo: "Novas matrículas" },
          ]}
        />
      </div>
      <div className="mt-2 h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} barGap={14} barCategoryGap="22%" margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gp-ativos" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="gp-novos" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#60a5fa" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={grade} />
            <XAxis dataKey="mes" tick={eixo} axisLine={false} tickLine={false} />
            <YAxis tick={eixo} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              content={(p) => <TooltipAlunos active={p.active} payload={p.payload} />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              defaultIndex={serie.length - 1}
            />
            <Bar dataKey="ativos" fill="url(#gp-ativos)" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
            <Bar dataKey="novos" fill="url(#gp-novos)" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------- Horários de pico ----------

export function HorariosPico({ dados }: { dados: DashboardAcademia["horariosPico"] }) {
  return (
    <Card>
      <TituloCard icone={Clock} cor="text-violet-400">
        Horários de pico hoje
      </TituloCard>
      {dados.length === 0 && (
        <div className="mt-5 grid min-h-[190px] place-content-center rounded-xl border border-dashed border-ac-line p-6 text-center">
          <Clock className="mx-auto size-8 text-ac-muted" />
          <p className="mt-2 text-sm text-slate-300">Em breve</p>
          <p className="mt-1 text-xs text-ac-muted">Calculado a partir dos check-ins dos alunos.</p>
        </div>
      )}
      <ul className="mt-5 flex flex-col gap-[15px]">
        {dados.map(({ hora, ocupacao }) => {
          const cheio = ocupacao >= 85;
          return (
            <li key={hora} className="flex items-center gap-3 text-xs">
              <span className="w-8 text-slate-300">{hora}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r ${
                    cheio ? "from-red-600 to-red-400" : "from-orange-600 to-orange-400"
                  }`}
                  style={{ width: `${ocupacao}%` }}
                />
              </span>
              <span className="w-9 text-right font-semibold text-white">{ocupacao}%</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ---------- Requer atenção ----------

const estiloAlerta: Record<
  DashboardAcademia["alertas"][number]["tipo"],
  { icone: LucideIcon; cor: string }
> = {
  mensalidades_atrasadas: { icone: CalendarX, cor: "bg-red-500/15 text-red-400 border-red-500/30" },
  vencem_em_breve: { icone: CalendarClock, cor: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  sem_matricula: { icone: UserX, cor: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  fichas_treino: { icone: Dumbbell, cor: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30" },
  cancelamentos: { icone: UserMinus, cor: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

// Para onde cada alerta leva ao clicar.
const destinoAlerta: Record<DashboardAcademia["alertas"][number]["tipo"], LinkProps> = {
  mensalidades_atrasadas: { to: "/academia/faturamento" },
  vencem_em_breve: { to: "/academia/faturamento" },
  sem_matricula: { to: "/academia/alunos", search: { filtro: "sem_matricula" } },
  fichas_treino: { to: "/academia/treinos", search: { filtro: "vencida" } },
  cancelamentos: { to: "/academia/alunos", search: { filtro: "sem_matricula" } },
};

export function RequerAtencao({ dados }: { dados: DashboardAcademia["alertas"] }) {
  return (
    <Card>
      <TituloCard icone={TriangleAlert} cor="text-red-500">
        Requer atenção
      </TituloCard>
      {dados.length === 0 && (
        <p className="mt-6 text-center text-sm text-emerald-300">Tudo em dia por aqui.</p>
      )}
      <ul className="mt-4 flex flex-col gap-1.5">
        {dados.map((a) => {
          const { icone: Icone, cor } = estiloAlerta[a.tipo];
          return (
            <li key={a.tipo}>
              <Link
                {...destinoAlerta[a.tipo]}
                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-white/[0.04]"
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl border ${cor}`}>
                  <Icone className="size-5" />
                </span>
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="text-[13px] font-medium text-white">{a.titulo}</div>
                  <div className="text-[11.5px] text-ac-muted">{a.descricao}</div>
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

// ---------- Receita x Despesas ----------

export function ReceitaDespesas({ dados }: { dados: DashboardAcademia["receitaDespesas"] }) {
  const [meses, setMeses] = useState(6);
  const serie = dados.slice(-meses);
  // Enquanto não existe lançamento de despesas, o gráfico mostra só a receita.
  const temDespesas = serie.some((d) => d.despesas !== null);

  return (
    <Card>
      <TituloCard icone={ChartLine} cor="text-blue-400" acao={<SeletorPeriodo valor={meses} aoMudar={setMeses} />}>
        {temDespesas ? "Receita x Despesas" : "Receita mensal"}
      </TituloCard>
      <div className="mt-3 flex">
        <Legenda
          itens={
            temDespesas
              ? [
                  { cor: "#22c55e", rotulo: "Receita" },
                  { cor: "#ef4444", rotulo: "Despesas" },
                ]
              : [{ cor: "#22c55e", rotulo: "Mensalidades recebidas" }]
          }
        />
      </div>
      <div className="mt-2 h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={serie} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={grade} />
            <XAxis dataKey="mes" tick={eixo} axisLine={false} tickLine={false} />
            <YAxis
              tick={eixo}
              axisLine={false}
              tickLine={false}
              domain={[0, "auto"]}
              tickFormatter={formatar.milhar}
            />
            <Tooltip
              formatter={(v) => formatar.moeda(Number(v))}
              contentStyle={{ background: "#131c33", border: "1px solid #1c2640", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#fff" }}
            />
            <Line
              isAnimationActive={false}
              type="linear"
              dataKey="receita"
              name="Receita"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3.5, fill: "#22c55e", strokeWidth: 0 }}
            />
            {temDespesas && (
              <Line
                isAnimationActive={false}
                type="linear"
                dataKey="despesas"
                name="Despesas"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3.5, fill: "#ef4444", strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------- Tipos de planos ----------

const coresPlanos = ["#7c3aed", "#3b82f6", "#22d3ee", "#22c55e", "#e5e7eb"];

export function TiposPlanos({ dados, total }: { dados: DashboardAcademia["tiposPlanos"]; total: number }) {
  return (
    <Card>
      <h2 className="font-poppins text-[15px] font-semibold text-white">Tipos de planos</h2>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative size-[150px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                isAnimationActive={false}
                data={dados}
                dataKey="percentual"
                nameKey="nome"
                innerRadius={48}
                outerRadius={72}
                startAngle={90}
                endAngle={-270}
                stroke="#0e1527"
                strokeWidth={2}
              >
                {dados.map((p, i) => (
                  <Cell key={p.nome} fill={coresPlanos[i % coresPlanos.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <span className="font-poppins text-2xl font-bold text-white">{total}</span>
            <span className="text-[11px] text-slate-300">alunos</span>
          </div>
        </div>
        <ul className="flex flex-1 flex-col gap-2.5 text-xs">
          {dados.map((p, i) => (
            <li key={p.nome} className="flex items-center gap-2.5">
              <span className="size-3 rounded-[3px]" style={{ background: coresPlanos[i % coresPlanos.length] }} />
              <span className="flex-1 text-slate-300">{p.nome}</span>
              <span className="font-semibold text-white">{p.percentual}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

// ---------- Últimas atividades ----------

const estiloAtividade: Record<
  DashboardAcademia["atividades"][number]["tipo"],
  { icone: LucideIcon; cor: string }
> = {
  matricula: { icone: FileText, cor: "bg-violet-500/20 text-violet-300" },
  pagamento: { icone: HandCoins, cor: "bg-emerald-500/15 text-emerald-400" },
  cancelamento: { icone: UserMinus, cor: "bg-rose-500/15 text-rose-400" },
  novo_aluno: { icone: UserPlus, cor: "bg-sky-500/15 text-sky-400" },
};

export function UltimasAtividades({ dados }: { dados: DashboardAcademia["atividades"] }) {
  return (
    <Card>
      <TituloCard icone={ListChecks} cor="text-violet-400">
        Últimas atividades
      </TituloCard>
      {dados.length === 0 && <p className="mt-6 text-center text-sm text-ac-muted">Nenhuma atividade ainda.</p>}
      <ul className="mt-3 divide-y divide-ac-line">
        {dados.map((a, i) => {
          const { icone: Icone, cor } = estiloAtividade[a.tipo];
          return (
            <li key={`${i}-${a.texto}`} className="flex items-center gap-3 py-2.5">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${cor}`}>
                <Icone className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">{a.texto}</span>
              <span className="shrink-0 text-[11px] text-ac-muted">{a.quando}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
