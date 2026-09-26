import { ChevronDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "../../lib/academia-alunos";
import { rotuloGrupo, type TreinosFeitos } from "../../lib/academia-treinos";
import { Card, TituloCard } from "./ui";

const eixo = { fill: "#8d96ab", fontSize: 11 };
const kg = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;

// Ficha do aluno: dias treinados (marcados pelo aluno no app) e a evolução
// da carga de cada exercício.
export function EvolucaoCarga({ dados }: { dados: TreinosFeitos }) {
  const [exercicioId, setExercicioId] = useState(dados.exercicios[0]?.exercicioId ?? "");
  const atual = dados.exercicios.find((e) => e.exercicioId === exercicioId);
  const serie = atual?.pontos.map((p) => ({ data: fmt.data(p.data).slice(0, 5), carga: p.cargaKg })) ?? [];
  const primeira = atual?.pontos[0]?.cargaKg;
  const ultima = atual?.pontos.at(-1)?.cargaKg;
  const ganho = primeira !== undefined && ultima !== undefined ? ultima - primeira : 0;

  return (
    <Card>
      <TituloCard icone={TrendingUp} cor="text-emerald-400">
        Treinos feitos e evolução de carga
      </TituloCard>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Numero rotulo="Dias treinados no mês" valor={String(dados.diasMes)} />
        <Numero rotulo="Nos últimos 30 dias" valor={String(dados.dias30)} />
        <Numero rotulo="Último treino marcado" valor={fmt.data(dados.ultimoTreino)} />
      </div>
      {dados.exercicios.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-ac-line p-4 text-sm text-ac-muted">
          O aluno ainda não anotou cargas. Ele marca o exercício feito e a carga em “Meu treino”, na área do cliente.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="relative">
              <select
                value={exercicioId}
                onChange={(e) => setExercicioId(e.target.value)}
                className="h-9 appearance-none rounded-lg border border-ac-line bg-ac-bg/60 pr-8 pl-3 text-sm text-slate-200 outline-none"
              >
                {dados.exercicios.map((e) => (
                  <option key={e.exercicioId} value={e.exercicioId}>
                    {e.nome} ({rotuloGrupo[e.grupoMuscular]})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ac-muted" />
            </label>
            {atual && atual.pontos.length > 1 && (
              <span className={`text-sm font-semibold ${ganho > 0 ? "text-emerald-300" : "text-slate-300"}`}>
                {ganho > 0 ? `+${kg(ganho)}` : ganho < 0 ? `−${kg(-ganho)}` : "mesma carga"} desde {fmt.data(atual.pontos[0].data)}
              </span>
            )}
          </div>
          <div className="mt-2 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#1c2640" />
                <XAxis dataKey="data" tick={eixo} axisLine={false} tickLine={false} />
                <YAxis
                  tick={eixo}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[(v: number) => Math.max(0, Math.floor(v - 4)), (v: number) => Math.ceil(v + 4)]}
                />
                <Tooltip
                  formatter={(v) => [kg(Number(v)), "Carga"]}
                  contentStyle={{ background: "#131c33", border: "1px solid #1c2640", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  dataKey="carga"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#22c55e" }}
                  type="monotone"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5">
      <div className="text-[11px] text-ac-muted">{rotulo}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{valor}</div>
    </div>
  );
}
