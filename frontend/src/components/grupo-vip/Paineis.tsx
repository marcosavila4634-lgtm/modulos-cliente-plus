import { Link, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  FileSpreadsheet,
  Gift,
  Layers,
  ListChecks,
  Mail,
  PartyPopper,
  Rocket,
  Tag,
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
import { Avatar, SeloSituacao } from "./Selos";
import { Card, LinkVerTodos, SeletorPeriodo, TituloCard } from "./ui";

const eixo = { fill: "#8a93a6", fontSize: 11 };

// ---------- Membros recentes ----------

export function MembrosRecentes({ membros }: { membros: DashboardGrupoVip["membrosRecentes"] }) {
  const navigate = useNavigate();
  return (
    <Card>
      <TituloCard icone={Users} acao={<LinkVerTodos para="/grupo-vip/membros" seta />}>
        Assinaturas recentes
      </TituloCard>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-[11.5px] [&_td]:pr-2.5 [&_th]:pr-2.5">
          <thead className="text-[11px] text-gv-muted">
            <tr>
              <th className="min-w-[136px] py-1.5 font-medium">Membro</th>
              <th className="font-medium">Plano</th>
              <th className="font-medium">Grupo</th>
              <th className="font-medium">Data</th>
              <th className="font-medium">Situação</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gv-line/70">
            {membros.map((m) => (
              <tr
                key={m.id + m.data}
                onClick={() => navigate({ to: "/grupo-vip/membros/$id", params: { id: m.id } })}
                className="cursor-pointer text-slate-200 hover:bg-white/[0.03]"
              >
                <td className="py-[7px] whitespace-nowrap">
                  <span className="inline-flex items-center gap-2.5">
                    <Avatar nome={m.nome} tamanho="sm" />
                    {m.nome}
                  </span>
                </td>
                <td>
                  <span className="rounded-md border border-slate-600/50 bg-slate-700/40 px-2 py-0.5 text-[11px] whitespace-nowrap">
                    {m.plano}
                  </span>
                </td>
                <td className="whitespace-nowrap">{m.grupo}</td>
                <td className="whitespace-nowrap">{formatar.data(m.data)}</td>
                <td>
                  <SeloSituacao situacao={m.situacao} />
                </td>
                <td className="!pr-0 text-right">
                  <ChevronRight className="ml-auto size-4 text-gv-muted" />
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

// Selo fixo acima da última barra (valor atual).
function seloUltimaBarra(ultimo: { membros: number; data?: string; mes: string } | undefined, indiceUltimo: number) {
  return function Selo(props: { x?: unknown; y?: unknown; width?: unknown; index?: number }) {
    if (!ultimo || props.index !== indiceUltimo) return null;
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
          {ultimo.data ? formatar.data(ultimo.data).slice(0, 5) : ultimo.mes}
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
            <YAxis tick={eixo} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={formatar.curto} />
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
  const maior = Math.max(1, ...conteudos.map((c) => c.acessos));
  return (
    <Card>
      <TituloCard icone={Award} acao={<LinkVerTodos para="/grupo-vip/conteudos" />}>
        Conteúdos mais acessados
      </TituloCard>
      {conteudos.length === 0 && (
        <p className="mt-3 text-sm text-gv-muted">Ainda ninguém abriu os conteúdos na área do membro.</p>
      )}
      <ol className="mt-4 flex flex-col gap-3">
        {conteudos.map((c, i) => {
          const Icone = iconesConteudo[i % iconesConteudo.length];
          return (
            <li key={c.titulo} className="flex items-center gap-2.5 text-[11.5px]">
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-gv-card-2 text-[10.5px] text-slate-300">
                {i + 1}
              </span>
              <Icone className="size-3.5 shrink-0 text-slate-400" />
              <span className="w-[118px] shrink-0 truncate text-slate-200" title={c.titulo}>
                {c.titulo}
              </span>
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

export const coresPlanos = ["#3b82f6", "#a855f7", "#f97316", "#fbbf24", "#10b981", "#ec4899"];

export function PlanosMembros({ planos, total }: { planos: DashboardGrupoVip["planosMembros"]; total: number }) {
  return (
    <Card>
      <TituloCard icone={Layers} acao={<LinkVerTodos para="/grupo-vip/grupos" />}>
        Planos dos membros
      </TituloCard>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative size-[118px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={planos.length ? planos : [{ nome: "—", quantidade: 1 }]}
                dataKey="quantidade"
                nameKey="nome"
                innerRadius={38}
                outerRadius={57}
                startAngle={90}
                endAngle={-270}
                stroke="#0b111e"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {(planos.length ? planos : [{ nome: "—" }]).map((p, i) => (
                  <Cell key={p.nome} fill={planos.length ? coresPlanos[i % coresPlanos.length] : "#1a2338"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <span className="font-poppins text-xl font-bold text-white">{formatar.numero(total)}</span>
            <span className="text-[10.5px] text-slate-300">Membros</span>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col gap-2.5 text-[12px]">
          {planos.map((p, i) => (
            <li key={p.nome} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: coresPlanos[i % coresPlanos.length] }} />
              <span className="flex-1 truncate text-slate-300">{p.nome}</span>
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
  promocao: { icone: Tag, cor: "text-emerald-400" },
};

export function UltimosAvisos({ avisos }: { avisos: DashboardGrupoVip["avisos"] }) {
  return (
    <Card>
      <TituloCard icone={Mail} acao={<LinkVerTodos para="/grupo-vip/anuncios" />}>
        Últimos avisos enviados
      </TituloCard>
      {avisos.length === 0 && <p className="mt-3 text-sm text-gv-muted">Nenhum aviso enviado ainda.</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {avisos.map((a) => {
          const { icone: Icone, cor } = estiloAviso[a.tipo];
          return (
            <li key={a.titulo + a.quando} className="flex items-center gap-3">
              <Icone className={`size-[18px] shrink-0 ${cor}`} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] text-white">{a.titulo}</div>
                <div className="text-[10.5px] text-gv-muted">{a.quando}</div>
              </div>
              <span className="rounded-md border border-emerald-600/50 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] whitespace-nowrap text-emerald-300">
                {a.destinatarios} pessoas
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
      <Link to="/" className="hover:text-slate-200">
        Conexão • Conteúdo • Evolução
      </Link>
    </footer>
  );
}
