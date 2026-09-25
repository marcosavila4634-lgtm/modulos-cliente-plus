import {
  Award,
  BookOpen,
  CalendarDays,
  ChartColumn,
  Ellipsis,
  FileSpreadsheet,
  Gift,
  Layers,
  ListChecks,
  Mail,
  PartyPopper,
  Rocket,
  TriangleAlert,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatar, type DashboardGrupoVip } from "../../lib/grupo-vip";
import { AviaoPapel } from "./Marcas";
import { Card, LinkVerTodos, SeletorPeriodo, TituloCard } from "./ui";

const eixo = { fill: "#8a93a6", fontSize: 11 };

// ---------- Membros recentes ----------

const estiloPlano: Record<DashboardGrupoVip["membrosRecentes"][number]["plano"], string> = {
  Premium: "bg-amber-900/50 text-amber-200 border-amber-700/50",
  VIP: "bg-slate-700/50 text-slate-200 border-slate-600/50",
  Básico: "bg-slate-800/70 text-slate-300 border-slate-700/60",
  Cortesia: "bg-sky-900/40 text-sky-200 border-sky-800/60",
};

export function MembrosRecentes({ membros }: { membros: DashboardGrupoVip["membrosRecentes"] }) {
  return (
    <Card>
      <TituloCard icone={Users} acao={<LinkVerTodos seta />}>
        Membros recentes
      </TituloCard>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-[11.5px] [&_td]:pr-2.5 [&_th]:pr-2.5">
          <thead className="text-[11px] text-gv-muted">
            <tr>
              <th className="min-w-[136px] py-1.5 font-medium">Membro</th>
              <th className="font-medium">Plano</th>
              <th className="font-medium">Grupo</th>
              <th className="font-medium">Data</th>
              <th className="font-medium">Status</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gv-line/70">
            {membros.map((m) => (
              <tr key={m.nome} className="text-slate-200">
                <td className="py-[7px] whitespace-nowrap">
                  <img
                    src={`/grupo-vip/${m.foto}.jpg`}
                    alt=""
                    className="mr-2.5 inline-block size-6 rounded-full object-cover align-middle"
                  />
                  <span className="align-middle">{m.nome}</span>
                </td>
                <td>
                  <span className={`rounded-md border px-2 py-0.5 text-[11px] ${estiloPlano[m.plano]}`}>{m.plano}</span>
                </td>
                <td>{m.grupo}</td>
                <td className="whitespace-nowrap">{formatar.data(m.data)}</td>
                <td>
                  {m.status === "ativo" ? (
                    <span className="rounded-md border border-emerald-600/50 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] text-emerald-300">
                      Ativo
                    </span>
                  ) : (
                    <span className="rounded-md bg-amber-400 px-2.5 py-0.5 text-[11px] font-medium text-slate-950">
                      Pendente
                    </span>
                  )}
                </td>
                <td className="!pr-0 text-right">
                  <button
                    type="button"
                    aria-label={`Ações de ${m.nome}`}
                    className="rounded-md border border-gv-line bg-gv-card-2 px-1.5 py-0.5 text-slate-300 hover:text-white"
                  >
                    <Ellipsis className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------- Crescimento de membros ----------

function TooltipCrescimento({ active, payload }: { active?: boolean; payload?: readonly { payload?: unknown }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { membros: number; data?: string; mes: string };
  return (
    <div className="rounded-lg border border-gv-line bg-gv-bg px-3 py-1.5 text-center leading-tight shadow-lg">
      <div className="font-poppins text-[13px] font-bold text-white">{formatar.numero(d.membros)}</div>
      <div className="text-[10.5px] text-slate-300">{d.data ? formatar.data(d.data) : d.mes}</div>
    </div>
  );
}

// Selo fixo acima da última barra (valor atual), como no layout original.
function seloUltimaBarra(ultimo: { membros: number; data?: string; mes: string }, indiceUltimo: number) {
  return function Selo(props: { x?: unknown; y?: unknown; width?: unknown; index?: number }) {
    if (props.index !== indiceUltimo) return null;
    const cx = Number(props.x) + Number(props.width) / 2;
    const topo = Number(props.y);
    const largura = 64;
    const x = cx - largura + 14; // a caixa cresce para a esquerda para não sair do gráfico
    return (
      <g>
        <rect x={x} y={topo - 40} width={largura} height={32} rx={6} fill="#060a13" stroke="#1a2338" />
        <text x={x + largura / 2} y={topo - 26} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={700}>
          {formatar.numero(ultimo.membros)}
        </text>
        <text x={x + largura / 2} y={topo - 13} textAnchor="middle" fill="#cbd5e1" fontSize={9.5}>
          {ultimo.data ? formatar.data(ultimo.data) : ultimo.mes}
        </text>
        <circle cx={cx} cy={topo} r={3} fill="#fff" />
      </g>
    );
  };
}

export function CrescimentoMembros({
  serie,
  indicadores,
}: {
  serie: DashboardGrupoVip["crescimentoMembros"];
  indicadores: DashboardGrupoVip["indicadores"];
}) {
  const [meses, setMeses] = useState(7);
  const dados = serie.slice(-meses);

  return (
    <Card>
      <TituloCard icone={ChartColumn} acao={<SeletorPeriodo valor={meses} aoMudar={setMeses} />}>
        Crescimento de membros
      </TituloCard>
      <div className="mt-2 h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 44, right: 4, left: -16, bottom: 0 }} barCategoryGap="26%">
            <defs>
              <linearGradient id="gv-barra" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#fb923c" />
                <stop offset="1" stopColor="#c2410c" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#1a2338" />
            <XAxis dataKey="mes" tick={eixo} axisLine={false} tickLine={false} />
            <YAxis
              tick={eixo}
              axisLine={false}
              tickLine={false}
              domain={[0, 2000]}
              ticks={[0, 500, 1000, 1500, 2000]}
              tickFormatter={formatar.curto}
            />
            <Tooltip
              content={(p) => <TooltipCrescimento active={p.active} payload={p.payload} />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="membros" fill="url(#gv-barra)" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="membros" content={seloUltimaBarra(dados[dados.length - 1], dados.length - 1)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { valor: formatar.numero(indicadores.membrosAtivos.valor), rotulo: "Membros ativos" },
          { valor: formatar.numero(indicadores.novosEsteMes), rotulo: "Novos este mês" },
          { valor: formatar.moeda(indicadores.ticketMedio), rotulo: "Ticket médio" },
        ].map((s) => (
          <div key={s.rotulo} className="rounded-xl border border-gv-line bg-gv-card-2/60 px-3 py-2">
            <div className="font-poppins text-[15px] font-bold whitespace-nowrap text-white">{s.valor}</div>
            <div className="text-[10.5px] text-gv-muted">{s.rotulo}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------- Conteúdos mais acessados ----------

const iconesConteudo: LucideIcon[] = [BookOpen, Rocket, FileSpreadsheet, Video, ListChecks];

export function ConteudosMaisAcessados({ conteudos }: { conteudos: DashboardGrupoVip["conteudosMaisAcessados"] }) {
  const maior = Math.max(...conteudos.map((c) => c.acessos));
  return (
    <Card>
      <TituloCard icone={Award} acao={<LinkVerTodos />}>
        Conteúdos mais acessados
      </TituloCard>
      <ol className="mt-4 flex flex-col gap-3">
        {conteudos.map((c, i) => {
          const Icone = iconesConteudo[i % iconesConteudo.length];
          return (
            <li key={c.titulo} className="flex items-center gap-2.5 text-[11.5px]">
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-gv-card-2 text-[10.5px] text-slate-300">
                {i + 1}
              </span>
              <Icone className="size-3.5 shrink-0 text-slate-400" />
              <span className="w-[118px] shrink-0 truncate text-slate-200">{c.titulo}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400"
                  style={{ width: `${(c.acessos / maior) * 100}%` }}
                />
              </span>
              <span className="w-10 text-right font-semibold text-white">{formatar.numero(c.acessos)}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ---------- Planos de membros ----------

const coresPlanos = ["#3b82f6", "#a855f7", "#f97316", "#fbbf24"];

export function PlanosMembros({ planos, total }: { planos: DashboardGrupoVip["planosMembros"]; total: number }) {
  return (
    <Card>
      <TituloCard icone={Layers}>Planos de membros</TituloCard>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative size-[118px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={planos}
                dataKey="percentual"
                nameKey="nome"
                innerRadius={38}
                outerRadius={57}
                startAngle={90}
                endAngle={-270}
                stroke="#0b111e"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {planos.map((p, i) => (
                  <Cell key={p.nome} fill={coresPlanos[i % coresPlanos.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <span className="font-poppins text-xl font-bold text-white">{formatar.numero(total)}</span>
            <span className="text-[10.5px] text-slate-300">Membros</span>
          </div>
        </div>
        <ul className="flex flex-1 flex-col gap-2.5 text-[12px]">
          {planos.map((p, i) => (
            <li key={p.nome} className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: coresPlanos[i % coresPlanos.length] }} />
              <span className="flex-1 text-slate-300">{p.nome}</span>
              <span className="font-semibold text-white">{p.percentual}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

// ---------- Últimos avisos ----------

const estiloAviso: Record<DashboardGrupoVip["avisos"][number]["tipo"], { icone: LucideIcon; cor: string }> = {
  conteudo: { icone: PartyPopper, cor: "text-orange-400" },
  manutencao: { icone: TriangleAlert, cor: "text-amber-400" },
  live: { icone: CalendarDays, cor: "text-red-400" },
  material: { icone: Gift, cor: "text-orange-400" },
};

export function UltimosAvisos({ avisos }: { avisos: DashboardGrupoVip["avisos"] }) {
  return (
    <Card>
      <TituloCard icone={Mail} acao={<LinkVerTodos />}>
        Últimos avisos enviados
      </TituloCard>
      <ul className="mt-3 flex flex-col gap-3">
        {avisos.map((a) => {
          const { icone: Icone, cor } = estiloAviso[a.tipo];
          return (
            <li key={a.titulo} className="flex items-center gap-3">
              <Icone className={`size-[18px] shrink-0 ${cor}`} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] text-white">{a.titulo}</div>
                <div className="text-[10.5px] text-gv-muted">{a.quando}</div>
              </div>
              <span className="rounded-md border border-emerald-600/50 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] text-emerald-300">
                Enviado
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ---------- Rodapé ----------

export function RodapeGrupoVip() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gv-line pt-4 text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase">
      <div className="flex flex-wrap items-center gap-3">
        <AviaoPapel className="size-5" />
        <span className="text-slate-200">Gestão Plus</span>
        <span className="text-gv-line">|</span>
        <span>Grupos VIP</span>
        <span className="text-gv-line">|</span>
        <span>Conteúdo que gera oportunidades</span>
      </div>
      <div>Conexão • Conteúdo • Evolução</div>
    </footer>
  );
}
