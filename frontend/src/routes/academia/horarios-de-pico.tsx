import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, ChartColumn, ChevronDown, Clock, Flame, Moon, UsersRound } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CabecalhoPagina, Card, CardNumero, Legenda, TituloCard } from "../../components/academia/ui";
import { apiAcesso } from "../../lib/academia-acesso";

type Busca = { semanas?: number };

// Movimento da academia por dia da semana e hora, a partir dos check-ins.
export const Route = createFileRoute("/academia/horarios-de-pico")({
  validateSearch: (s: Record<string, unknown>): Busca => {
    const n = Number(s.semanas);
    return { semanas: [2, 4, 8, 12].includes(n) ? n : undefined };
  },
  loaderDeps: ({ search }) => ({ semanas: search.semanas ?? 4 }),
  loader: ({ deps }) => apiAcesso.pico(deps.semanas),
  component: PaginaPico,
});

const eixo = { fill: "#8d96ab", fontSize: 11 };

// Cor da célula conforme a ocupação.
function corOcupacao(o: number) {
  if (o <= 0) return "rgba(255,255,255,0.03)";
  if (o < 20) return "rgba(139,92,246,0.22)";
  if (o < 40) return "rgba(139,92,246,0.45)";
  if (o < 60) return "rgba(168,85,247,0.7)";
  if (o < 80) return "rgba(217,70,239,0.85)";
  return "rgba(239,68,68,0.9)";
}

const numero = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function PaginaPico() {
  const p = Route.useLoaderData();
  const navigate = useNavigate();
  const horas = p.mapa[0]?.horas.map((h) => h.hora) ?? [];
  const serieHoje = p.hoje.map((h) => ({ hora: `${String(h.hora).padStart(2, "0")}h`, hoje: h.hoje, media: h.media }));
  const diaHoje = p.mapa.find((d) => d.diaSemana === p.diaHoje)?.dia ?? "";

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Horários de pico"
        descricao={
          <>
            Calculado pelos check-ins. Capacidade considerada: <b className="text-slate-200">{p.capacidade} pessoas</b> ao
            mesmo tempo (
            <Link to="/academia/configuracoes" className="text-violet-300 hover:text-violet-200">
              alterar
            </Link>
            ).
          </>
        }
      >
        <label className="relative">
          <select
            value={p.semanas}
            onChange={(e) => navigate({ to: "/academia/horarios-de-pico", search: { semanas: Number(e.target.value) } })}
            className="h-10 appearance-none rounded-xl border border-ac-line bg-ac-card pr-9 pl-3 text-sm text-slate-200 outline-none"
          >
            <option value={2}>Últimas 2 semanas</option>
            <option value={4}>Últimas 4 semanas</option>
            <option value={8}>Últimas 8 semanas</option>
            <option value={12}>Últimas 12 semanas</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ac-muted" />
        </label>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardNumero icone={UsersRound} cor="bg-emerald-500/15 text-emerald-300" rotulo="Na academia agora">
          <span className="font-poppins text-[26px] font-bold text-white">{p.agora}</span>
          <span className="text-sm text-slate-300">{p.ocupacaoAgora}% da capacidade</span>
          <span className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{ width: `${p.ocupacaoAgora}%` }}
            />
          </span>
        </CardNumero>
        <CardNumero icone={Flame} cor="bg-red-500/15 text-red-300" rotulo="Horário mais cheio">
          <span className="font-poppins text-[26px] font-bold text-white">{p.destaques.horaMaisCheia}</span>
          <span className="text-sm text-slate-300">até {p.destaques.ocupacaoMaisCheia}% de ocupação</span>
        </CardNumero>
        <CardNumero icone={Moon} cor="bg-sky-500/15 text-sky-300" rotulo="Horário mais tranquilo">
          <span className="font-poppins text-[26px] font-bold text-white">{p.destaques.horaMaisVazia}</span>
          <span className="text-sm text-slate-300">de segunda a sexta</span>
        </CardNumero>
        <CardNumero icone={CalendarDays} cor="bg-violet-500/20 text-violet-300" rotulo="Dia mais movimentado">
          <span className="font-poppins text-[26px] font-bold text-white">{p.destaques.diaMaisMovimentado}</span>
          <span className="text-sm text-slate-300">{numero(p.destaques.mediaDiaria)} entradas/dia em média</span>
        </CardNumero>
      </div>

      <Card>
        <TituloCard icone={Clock} cor="text-violet-400">
          Ocupação média por dia e horário
        </TituloCard>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1 text-center text-[11px]">
            <thead>
              <tr>
                <th className="w-20" />
                {horas.map((h) => (
                  <th key={h} className="font-medium text-ac-muted">
                    {String(h).padStart(2, "0")}h
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.mapa.map((d) => (
                <tr key={d.diaSemana}>
                  <th
                    className={`pr-2 text-left text-xs font-medium whitespace-nowrap ${
                      d.diaSemana === p.diaHoje ? "text-fuchsia-300" : "text-slate-300"
                    }`}
                  >
                    {d.dia}
                    {d.diaSemana === p.diaHoje && <span className="ml-1 text-[10px] text-ac-muted">(hoje)</span>}
                  </th>
                  {d.horas.map((h) => (
                    <td
                      key={h.hora}
                      title={`${d.dia}, ${h.hora}h: ${numero(h.media)} entradas em média (${h.ocupacao}%)`}
                      className="h-9 rounded-md font-semibold text-white/90"
                      style={{ background: corOcupacao(h.ocupacao) }}
                    >
                      {h.ocupacao > 0 ? `${h.ocupacao}%` : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ac-muted">
          <span>Ocupação:</span>
          {[
            [10, "até 20%"],
            [30, "20–40%"],
            [50, "40–60%"],
            [70, "60–80%"],
            [90, "acima de 80%"],
          ].map(([o, rotulo]) => (
            <span key={rotulo} className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[3px]" style={{ background: corOcupacao(Number(o)) }} />
              {rotulo}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <TituloCard icone={ChartColumn} cor="text-emerald-400">
          Hoje x média de {diaHoje.toLowerCase()}
        </TituloCard>
        <div className="mt-3">
          <Legenda
            itens={[
              { cor: "#8b5cf6", rotulo: "Entradas hoje" },
              { cor: "#22d3ee", rotulo: `Média de ${diaHoje.toLowerCase()}` },
            ]}
          />
        </div>
        <div className="mt-2 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={serieHoje} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1c2640" />
              <XAxis dataKey="hora" tick={eixo} axisLine={false} tickLine={false} />
              <YAxis tick={eixo} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#131c33", border: "1px solid #1c2640", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#fff" }}
                formatter={(v, nome) => [numero(Number(v)), nome === "hoje" ? "Hoje" : "Média"]}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="hoje" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
              <Line
                dataKey="media"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22d3ee", strokeWidth: 0 }}
                type="monotone"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
