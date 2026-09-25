import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChartLine,
  ClipboardList,
  FilePlus,
  HeartPulse,
  Pencil,
  Printer,
  Table2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AvatarAluno } from "../../../components/academia/Selos";
import { Botao, MensagemErro, mensagemDe, Modal } from "../../../components/academia/formulario";
import { Card, Legenda, TituloCard, Vazio } from "../../../components/academia/ui";
import { fmt } from "../../../lib/academia-alunos";
import {
  apiAvaliacoes,
  camposMedidas,
  corImc,
  diferenca,
  num,
  rotuloImc,
  rotuloMetodo,
  rotuloSituacaoAvaliacao,
  type Avaliacao,
} from "../../../lib/academia-avaliacoes";

// Histórico e evolução das avaliações físicas de um aluno.
export const Route = createFileRoute("/academia/avaliacao-fisica/$alunoId")({
  loader: ({ params }) => apiAvaliacoes.historico(params.alunoId),
  component: HistoricoAluno,
});

const eixo = { fill: "#8d96ab", fontSize: 11 };

function HistoricoAluno() {
  const h = Route.useLoaderData();
  const router = useRouter();
  const [excluir, setExcluir] = useState<Avaliacao | null>(null);
  const [atual, anterior] = h.avaliacoes;
  const restricao = h.avaliacoes.find((a) => a.restricoes)?.restricoes;
  const serie = [...h.avaliacoes]
    .reverse()
    .map((a) => ({ data: fmt.data(a.data).slice(0, 5) + "/" + a.data.slice(2, 4), peso: a.peso, gordura: a.gorduraPct }));
  const colunas = h.avaliacoes.slice(0, 6);

  const cor =
    h.situacao === "em_dia" ? "bg-emerald-500/15 text-emerald-300" : h.situacao === "pendente" ? "bg-amber-500/15 text-amber-300" : "bg-slate-500/20 text-slate-300";

  return (
    <div className="flex flex-col gap-5 py-4 print:bg-white">
      <Link
        to="/academia/avaliacao-fisica"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-ac-muted hover:text-white print:hidden"
      >
        <ArrowLeft className="size-4" />
        Avaliação física
      </Link>

      <Card className="flex flex-wrap items-center gap-5">
        <AvatarAluno nome={h.aluno.nome} grande />
        <div className="min-w-48 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-poppins text-2xl font-bold text-white">{h.aluno.nome}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${cor}`}>
              {rotuloSituacaoAvaliacao[h.situacao]}
            </span>
          </div>
          <p className="mt-1 text-sm text-ac-muted">
            {h.avaliacoes.length} {h.avaliacoes.length === 1 ? "avaliação" : "avaliações"}
            {h.proxima && ` · próxima reavaliação em ${fmt.data(h.proxima)}`}
            {" · "}
            <Link to="/academia/alunos/$id" params={{ id: h.aluno.id }} className="text-violet-300 hover:text-violet-200">
              ficha do aluno
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          {atual && (
            <Botao onClick={() => window.print()}>
              <Printer className="size-4" />
              Imprimir
            </Botao>
          )}
          <Link
            to="/academia/avaliacao-fisica/nova"
            search={{ aluno: h.aluno.id }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 px-4 text-sm font-semibold text-white shadow-[0_6px_20px_-8px_rgba(217,70,239,0.7)] hover:brightness-110"
          >
            <FilePlus className="size-4" />
            Nova avaliação
          </Link>
        </div>
      </Card>

      {restricao && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <b>Atenção:</b> {restricao}
          </div>
        </div>
      )}

      {!atual ? (
        <Card>
          <Vazio icone={ClipboardList}>Este aluno ainda não fez avaliação física.</Vazio>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Indicador rotulo="Peso" valor={`${num(atual.peso)} kg`} dif={diferenca(atual.peso, anterior?.peso)} unidade="kg" />
            <Indicador rotulo="IMC" valor={num(atual.imc)} dif={diferenca(atual.imc, anterior?.imc)}>
              <span className={`text-xs font-medium ${corImc[atual.classificacaoImc]}`}>
                {rotuloImc[atual.classificacaoImc]}
              </span>
            </Indicador>
            <Indicador
              rotulo="% de gordura"
              valor={atual.gorduraPct !== null ? `${num(atual.gorduraPct)}%` : "—"}
              dif={diferenca(atual.gorduraPct, anterior?.gorduraPct)}
              unidade="pontos"
            />
            <Indicador
              rotulo="Massa magra"
              valor={atual.massaMagraKg !== null ? `${num(atual.massaMagraKg)} kg` : "—"}
              dif={diferenca(atual.massaMagraKg, anterior?.massaMagraKg)}
              unidade="kg"
              melhorQuandoSobe
            />
            <Indicador
              rotulo="Cintura"
              valor={atual.medidas.cintura !== null ? `${num(atual.medidas.cintura)} cm` : "—"}
              dif={diferenca(atual.medidas.cintura, anterior?.medidas.cintura)}
              unidade="cm"
            />
          </div>

          {serie.length > 1 && (
            <Card>
              <TituloCard icone={ChartLine} cor="text-violet-400">
                Evolução
              </TituloCard>
              <div className="mt-3">
                <Legenda
                  itens={[
                    { cor: "#8b5cf6", rotulo: "Peso (kg)" },
                    { cor: "#f472b6", rotulo: "% de gordura" },
                  ]}
                />
              </div>
              <div className="mt-2 h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 10, right: 0, left: -14, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#1c2640" />
                    <XAxis dataKey="data" tick={eixo} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="peso" tick={eixo} axisLine={false} tickLine={false} domain={[(v: number) => Math.floor(v - 2), (v: number) => Math.ceil(v + 2)]}
                      allowDecimals={false} />
                    <YAxis
                      yAxisId="gordura"
                      orientation="right"
                      tick={eixo}
                      axisLine={false}
                      tickLine={false}
                      domain={[(v: number) => Math.floor(v - 2), (v: number) => Math.ceil(v + 2)]}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "#131c33", border: "1px solid #1c2640", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(v, n) => [num(Number(v)), n === "peso" ? "Peso (kg)" : "% gordura"]}
                    />
                    <Line yAxisId="peso" dataKey="peso" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: "#8b5cf6" }} isAnimationActive={false} />
                    <Line yAxisId="gordura" dataKey="gordura" stroke="#f472b6" strokeWidth={2.5} dot={{ r: 4, fill: "#f472b6" }} isAnimationActive={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card className="!p-0">
            <div className="p-5 pb-3">
              <TituloCard icone={Table2} cor="text-emerald-400">
                Comparativo das avaliações
              </TituloCard>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-y border-ac-line text-[11.5px] text-ac-muted">
                    <th className="py-2.5 pr-3 pl-5 font-medium">Medida</th>
                    {colunas.map((a) => (
                      <th key={a.id} className="py-2.5 pr-3 text-right font-medium">
                        <div className="text-slate-200">{fmt.data(a.data)}</div>
                        <div className="mt-1 flex justify-end gap-2 print:hidden">
                          <Link
                            to="/academia/avaliacao-fisica/editar/$id"
                            params={{ id: a.id }}
                            aria-label="Editar avaliação"
                            className="text-ac-muted hover:text-white"
                          >
                            <Pencil className="size-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setExcluir(a)}
                            aria-label="Excluir avaliação"
                            className="text-ac-muted hover:text-red-300"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="w-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ac-line/60">
                  <Linha rotulo="Peso (kg)" valores={colunas.map((a) => a.peso)} />
                  <Linha rotulo="IMC" valores={colunas.map((a) => a.imc)} />
                  <Linha rotulo="% de gordura" valores={colunas.map((a) => a.gorduraPct)} />
                  <Linha rotulo="Massa gorda (kg)" valores={colunas.map((a) => a.massaGordaKg)} />
                  <Linha rotulo="Massa magra (kg)" valores={colunas.map((a) => a.massaMagraKg)} />
                  {camposMedidas.map((c) => (
                    <Linha key={c.campo} rotulo={`${c.rotulo} (cm)`} valores={colunas.map((a) => a.medidas[c.campo])} />
                  ))}
                  <Linha rotulo="Relação cintura/quadril" valores={colunas.map((a) => a.relacaoCinturaQuadril)} casas={2} />
                  <tr>
                    <td className="py-2 pr-3 pl-5 text-slate-300">Pressão arterial</td>
                    {colunas.map((a) => (
                      <td key={a.id} className="py-2 pr-3 text-right text-slate-100">
                        {a.pressaoSistolica && a.pressaoDiastolica ? `${a.pressaoSistolica}/${a.pressaoDiastolica}` : "—"}
                      </td>
                    ))}
                    <td />
                  </tr>
                  <Linha rotulo="FC em repouso (bpm)" valores={colunas.map((a) => a.fcRepouso)} />
                  <tr>
                    <td className="py-2 pr-3 pl-5 text-slate-300">Método do % de gordura</td>
                    {colunas.map((a) => (
                      <td key={a.id} className="py-2 pr-3 text-right text-xs text-ac-muted">
                        {rotuloMetodo[a.metodoGordura]}
                      </td>
                    ))}
                    <td />
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 pl-5 text-slate-300">Avaliador</td>
                    {colunas.map((a) => (
                      <td key={a.id} className="py-2 pr-3 text-right text-xs text-ac-muted">
                        {a.profissional?.nome ?? "—"}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {(atual.objetivo || atual.observacoes) && (
            <Card>
              <TituloCard icone={HeartPulse} cor="text-red-400">
                Última avaliação ({fmt.data(atual.data)})
              </TituloCard>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                {atual.objetivo && (
                  <div>
                    <dt className="text-xs text-ac-muted">Objetivo</dt>
                    <dd className="text-slate-100">{atual.objetivo}</dd>
                  </div>
                )}
                {atual.observacoes && (
                  <div>
                    <dt className="text-xs text-ac-muted">Observações</dt>
                    <dd className="whitespace-pre-line text-slate-100">{atual.observacoes}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}
        </>
      )}

      {excluir && (
        <ModalExcluir
          avaliacao={excluir}
          aoFechar={() => setExcluir(null)}
          aoExcluir={async () => {
            await router.invalidate();
            setExcluir(null);
          }}
        />
      )}
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  dif,
  unidade = "",
  melhorQuandoSobe = false,
  children,
}: {
  rotulo: string;
  valor: string;
  dif: number | null;
  unidade?: string;
  melhorQuandoSobe?: boolean;
  children?: ReactNode;
}) {
  const bom = dif === null || dif === 0 ? null : melhorQuandoSobe ? dif > 0 : dif < 0;
  const Seta = dif !== null && dif > 0 ? ArrowUp : ArrowDown;
  return (
    <Card className="!p-4">
      <div className="text-[13px] text-slate-300">{rotulo}</div>
      <div className="mt-2 font-poppins text-[24px] font-bold text-white">{valor}</div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        {children}
        {dif !== null && dif !== 0 && (
          <span className={`inline-flex items-center gap-0.5 font-semibold ${bom ? "text-emerald-400" : "text-red-400"}`}>
            <Seta className="size-3" strokeWidth={2.5} />
            {num(Math.abs(dif))} {unidade}
          </span>
        )}
        {dif === 0 && <span className="text-ac-muted">sem mudança</span>}
      </div>
    </Card>
  );
}

function Linha({ rotulo, valores, casas = 1 }: { rotulo: string; valores: (number | null)[]; casas?: number }) {
  if (valores.every((v) => v === null)) return null;
  return (
    <tr>
      <td className="py-2 pr-3 pl-5 text-slate-300">{rotulo}</td>
      {valores.map((v, i) => (
        <td key={i} className={`py-2 pr-3 text-right ${i === 0 ? "font-semibold text-white" : "text-slate-300"}`}>
          {num(v, casas)}
        </td>
      ))}
      <td />
    </tr>
  );
}

function ModalExcluir({
  avaliacao,
  aoExcluir,
  aoFechar,
}: {
  avaliacao: Avaliacao;
  aoExcluir: () => void;
  aoFechar: () => void;
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Modal titulo="Excluir avaliação?" subtitulo={`Avaliação de ${fmt.data(avaliacao.data)}`} aoFechar={aoFechar}>
      <p className="text-sm text-slate-300">A avaliação sai do histórico do aluno. Isso não pode ser desfeito.</p>
      <div className="mt-4">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Botao onClick={aoFechar}>Voltar</Botao>
        <Botao
          variante="perigo"
          carregando={salvando}
          onClick={async () => {
            setSalvando(true);
            try {
              await apiAvaliacoes.excluir(avaliacao.id);
              aoExcluir();
            } catch (e) {
              setErro(mensagemDe(e));
              setSalvando(false);
            }
          }}
        >
          Excluir
        </Botao>
      </div>
    </Modal>
  );
}
