import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, CircleAlert, Clock, Download, Gem, Receipt, Wallet } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Botao } from "../../components/grupo-vip/formulario";
import { ModalReceber } from "../../components/grupo-vip/ModaisMembro";
import { coresPlanos } from "../../components/grupo-vip/Paineis";
import { SeloCobranca } from "../../components/grupo-vip/Selos";
import { Abas, CabecalhoPagina, Card, CardNumero, cabecalhoTabela, TituloCard, Vazio } from "../../components/grupo-vip/ui";
import { baixarCsv, formatar, rotuloForma } from "../../lib/grupo-vip";
import { apiFinanceiro, nomeMes, somarMes } from "../../lib/grupo-vip-financeiro";
import { rotuloCobranca, type Cobranca } from "../../lib/grupo-vip-membros";

type Busca = { mes?: string };

// Receitas: pagamentos recebidos no mês e o que está em aberto.
export const Route = createFileRoute("/grupo-vip/receitas")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    mes: typeof s.mes === "string" && /^\d{4}-\d{2}$/.test(s.mes) ? s.mes : undefined,
  }),
  loaderDeps: ({ search }) => ({ mes: search.mes }),
  loader: ({ deps }) => apiFinanceiro.receitas(deps.mes),
  component: PaginaReceitas,
});

const eixo = { fill: "#8a93a6", fontSize: 11 };

function PaginaReceitas() {
  const r = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [aba, setAba] = useState<"recebidas" | "aberto">("recebidas");
  const [receber, setReceber] = useState<Cobranca | null>(null);
  const variacao =
    r.resumo.recebidoMesAnterior > 0
      ? Math.round(((r.resumo.recebido - r.resumo.recebidoMesAnterior) / r.resumo.recebidoMesAnterior) * 100)
      : null;
  const ir = (mes: string) => navigate({ to: "/grupo-vip/receitas", search: { mes } });
  const lista = aba === "recebidas" ? r.recebidas : r.emAberto;

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina titulo="Receitas" descricao="Pagamentos confirmados dos membros. Cada um gera as comissões de indicação no Cliente Plus.">
        <div className="flex items-center gap-1 rounded-xl border border-gv-line bg-gv-card p-1">
          <button type="button" aria-label="Mês anterior" onClick={() => ir(somarMes(r.mes, -1))} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/5">
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[150px] text-center text-sm font-medium text-white">{nomeMes(r.mes)}</span>
          <button type="button" aria-label="Próximo mês" onClick={() => ir(somarMes(r.mes, 1))} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/5">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <Botao
          onClick={() =>
            baixarCsv(
              `receitas-${r.mes}`,
              ["Data do pagamento", "Membro", "Plano", "Valor", "Forma", "Vencimento", "Origem"],
              r.recebidas.map((c) => [
                formatar.data(c.pagoEm),
                c.nome,
                c.descricao,
                c.valor,
                c.formaPagamento ? rotuloForma[c.formaPagamento] : "Cortesia",
                formatar.data(c.vencimento),
                c.origem === "pagina" ? "Página de vendas" : "Painel",
              ]),
            )
          }
        >
          <Download className="size-4" /> Planilha
        </Botao>
      </CabecalhoPagina>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardNumero
          icone={Gem}
          cor="from-amber-400 to-orange-600"
          rotulo="Recebido no mês"
          valor={formatar.moeda(r.resumo.recebido)}
          detalhe={`${r.resumo.qtdRecebido} pagamentos${variacao !== null ? ` · ${variacao >= 0 ? "+" : ""}${variacao}% vs mês anterior` : ""}`}
        />
        <CardNumero icone={Receipt} cor="from-sky-400 to-blue-600" rotulo="Ticket médio" valor={formatar.moeda(r.resumo.ticketMedio)} />
        <CardNumero
          icone={Clock}
          cor="from-violet-400 to-violet-600"
          rotulo="A receber no mês"
          valor={formatar.moeda(r.resumo.aReceber)}
          detalhe={`${r.resumo.qtdAReceber} cobranças a vencer`}
        />
        <CardNumero
          icone={CircleAlert}
          cor="from-red-400 to-red-600"
          rotulo="Em atraso (todos os meses)"
          valor={formatar.moeda(r.resumo.emAtraso)}
          detalhe={`${r.resumo.qtdEmAtraso} cobranças vencidas`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <Card>
          <TituloCard icone={Wallet}>Recebido por dia</TituloCard>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.porDia} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#1a2338" />
                <XAxis dataKey="dia" tick={eixo} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={eixo} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatar.curto(v)} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{ background: "#060a13", border: "1px solid #1a2338", borderRadius: 8 }}
                  formatter={(v) => [formatar.moeda(Number(v)), "Recebido"]}
                  labelFormatter={(d) => `Dia ${d}`}
                />
                <Bar dataKey="valor" fill="#f97316" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <TituloCard icone={Receipt}>Por plano e forma</TituloCard>
          <ul className="mt-3 flex flex-col gap-2">
            {r.porPlano.map((p, i) => (
              <li key={p.nome} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 rounded-full" style={{ background: coresPlanos[i % coresPlanos.length] }} />
                <span className="flex-1 text-slate-300">
                  {p.nome} <span className="text-gv-muted">· {p.quantidade}</span>
                </span>
                <span className="font-semibold text-white">{formatar.moeda(p.valor)}</span>
              </li>
            ))}
            {r.porPlano.length === 0 && <li className="text-sm text-gv-muted">Nada recebido neste mês.</li>}
          </ul>
          <div className="my-3 h-px bg-gv-line" />
          <ul className="flex flex-col gap-2">
            {r.porForma.map((p) => (
              <li key={p.nome} className="flex items-center gap-2 text-[13px]">
                <span className="flex-1 text-slate-300">
                  {rotuloForma[p.nome] ?? p.nome} <span className="text-gv-muted">· {p.quantidade}</span>
                </span>
                <span className="font-semibold text-white">{formatar.moeda(p.valor)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="!p-0">
        <div className="border-b border-gv-line p-4">
          <Abas
            abas={[
              { valor: "recebidas" as const, rotulo: "Recebidas no mês", quantidade: r.recebidas.length },
              { valor: "aberto" as const, rotulo: "Em aberto", quantidade: r.emAberto.length },
            ]}
            valor={aba}
            aoMudar={setAba}
          />
        </div>
        {lista.length === 0 ? (
          <Vazio icone={Wallet}>Nada por aqui.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[13px]">
              <thead>
                <tr className={cabecalhoTabela}>
                  <th className="py-2.5 pr-3 pl-4 font-medium">{aba === "recebidas" ? "Pago em" : "Vencimento"}</th>
                  <th className="py-2.5 pr-3 font-medium">Membro</th>
                  <th className="py-2.5 pr-3 font-medium">Plano</th>
                  <th className="py-2.5 pr-3 font-medium">Valor</th>
                  <th className="py-2.5 pr-3 font-medium">{aba === "recebidas" ? "Forma" : "Situação"}</th>
                  <th className="py-2.5 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gv-line/70">
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-3 pl-4 whitespace-nowrap text-slate-200">
                      {aba === "recebidas" ? formatar.diaHora(c.pagoEm) : formatar.data(c.vencimento)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Link to="/grupo-vip/membros/$id" params={{ id: c.clienteId }} className="text-slate-100 hover:underline">
                        {c.nome}
                      </Link>
                      {c.origem === "pagina" && <span className="ml-1.5 text-[11px] text-gv-muted">página</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">{c.descricao}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-white">{formatar.moeda(c.valor)}</td>
                    <td className="py-2.5 pr-3">
                      {aba === "recebidas" ? (
                        <span className="text-slate-300">{c.formaPagamento ? rotuloForma[c.formaPagamento] : "Cortesia"}</span>
                      ) : (
                        <SeloCobranca status={c.status} />
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      {aba === "aberto" && (
                        <Botao pequeno variante="sucesso" onClick={() => setReceber(c)}>
                          Receber
                        </Botao>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-[11.5px] text-gv-muted">Situações: {Object.values(rotuloCobranca).join(" · ")}.</p>

      {receber && (
        <ModalReceber
          cobranca={receber}
          aoFechar={() => setReceber(null)}
          aoSalvar={() => {
            setReceber(null);
            router.invalidate();
          }}
        />
      )}
    </div>
  );
}
