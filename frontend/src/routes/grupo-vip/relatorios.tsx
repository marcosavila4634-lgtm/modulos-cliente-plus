import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChartColumn, CircleAlert, Download, Eye, Hourglass, MessageCircle, Printer, Split, Trophy, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Botao } from "../../components/grupo-vip/formulario";
import { SeloPlataforma, SeloSituacao } from "../../components/grupo-vip/Selos";
import { CabecalhoPagina, Card, CardNumero, cabecalhoTabela, TituloCard } from "../../components/grupo-vip/ui";
import { baixarCsv, formatar, linkWhatsapp, rotuloSituacao } from "../../lib/grupo-vip";
import { apiFinanceiro } from "../../lib/grupo-vip-financeiro";

type Busca = { meses?: number };

// Relatórios: entradas e saídas, retenção, receita por grupo, origem dos
// membros, inadimplência, conteúdos e indicações. Tudo baixa em planilha.
export const Route = createFileRoute("/grupo-vip/relatorios")({
  validateSearch: (s: Record<string, unknown>): Busca => {
    const m = Number(s.meses);
    return { meses: [6, 12, 24].includes(m) ? m : undefined };
  },
  loaderDeps: ({ search }) => ({ meses: search.meses ?? 12 }),
  loader: ({ deps }) => apiFinanceiro.relatorios(deps.meses),
  component: PaginaRelatorios,
});

const eixo = { fill: "#8a93a6", fontSize: 11 };

function PaginaRelatorios() {
  const r = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const meses = busca.meses ?? 12;
  const ultimo = r.meses[r.meses.length - 1];
  const totalOrigem = r.origens.reduce((s, o) => s + o.quantidade, 0) || 1;

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina titulo="Relatórios" descricao="Como os grupos estão crescendo, quanto tempo as pessoas ficam e de onde vêm. Cada tabela baixa como planilha.">
        <select
          value={meses}
          onChange={(e) => navigate({ to: "/grupo-vip/relatorios", search: { meses: Number(e.target.value) } })}
          className="h-10 rounded-xl border border-gv-line bg-gv-card px-3 text-sm text-slate-200 outline-none"
        >
          <option value={6}>Últimos 6 meses</option>
          <option value={12}>Últimos 12 meses</option>
          <option value={24}>Últimos 24 meses</option>
        </select>
        <Botao onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir
        </Botao>
      </CabecalhoPagina>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardNumero icone={UserPlus} cor="from-emerald-400 to-green-600" rotulo="Novos no mês" valor={ultimo?.novos ?? 0} detalhe={`${ultimo?.saidas ?? 0} saídas no mês`} />
        <CardNumero icone={Hourglass} cor="from-sky-400 to-blue-600" rotulo="Tempo médio como membro" valor={`${formatar.numero(r.retencao.mediaMeses)} meses`} />
        <CardNumero
          icone={Split}
          cor="from-red-400 to-red-600"
          rotulo="Cancelamento (mês passado)"
          valor={`${formatar.numero(r.retencao.cancelamentoMes)}%`}
          detalhe="saídas divididas pelos ativos no início do mês"
        />
        <CardNumero icone={CircleAlert} cor="from-amber-400 to-orange-600" rotulo="Inadimplentes" valor={r.inadimplencia.length} />
      </div>

      <Card>
        <TituloCard
          icone={ChartColumn}
          acao={
            <BotaoCsv
              nome="membros-por-mes"
              cabecalho={["Mês", "Novos", "Saídas", "Ativos no fim do mês", "Receita"]}
              linhas={r.meses.map((m) => [m.mes, m.novos, m.saidas, m.ativos, m.receita])}
            />
          }
        >
          Entradas, saídas e membros ativos
        </TituloCard>
        <div className="mt-3 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={r.meses} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1a2338" />
              <XAxis dataKey="rotulo" tick={eixo} axisLine={false} tickLine={false} />
              <YAxis tick={eixo} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#060a13", border: "1px solid #1a2338", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="novos" name="Novos" fill="#10b981" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Line dataKey="ativos" name="Ativos" stroke="#f97316" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <Tabela
          titulo="Receita por grupo"
          icone={ChartColumn}
          csv={{
            nome: "receita-por-grupo",
            cabecalho: ["Grupo", "Plataforma", "Receita no período", "Membros com acesso"],
            linhas: r.receitaPorGrupo.map((g) => [g.grupo, g.plataforma, g.receita, g.membros]),
          }}
          cabecalho={["Grupo", "Receita", "Membros"]}
          nota="O valor de cada plano é dividido entre os grupos que ele libera."
        >
          {r.receitaPorGrupo.map((g) => (
            <tr key={g.grupo}>
              <td className="py-2 pr-3 pl-4">
                <div className="text-slate-100">{g.grupo}</div>
                <SeloPlataforma plataforma={g.plataforma} />
              </td>
              <td className="py-2 pr-3 text-white">{formatar.moeda(g.receita)}</td>
              <td className="py-2 pr-4 text-slate-300">{g.membros}</td>
            </tr>
          ))}
        </Tabela>

        <Tabela
          titulo="Retenção por plano"
          icone={Hourglass}
          csv={{
            nome: "retencao-por-plano",
            cabecalho: ["Plano", "Assinantes com acesso", "Meses em média", "Receita total"],
            linhas: r.retencao.porPlano.map((p) => [p.plano, p.ativos, p.mediaMeses, p.receitaTotal]),
          }}
          cabecalho={["Plano", "Ativos", "Fica em média", "Receita total"]}
        >
          {r.retencao.porPlano.map((p) => (
            <tr key={p.plano}>
              <td className="py-2 pr-3 pl-4 text-slate-100">{p.plano}</td>
              <td className="py-2 pr-3 text-slate-300">{p.ativos}</td>
              <td className="py-2 pr-3 text-slate-300">{formatar.numero(p.mediaMeses)} meses</td>
              <td className="py-2 pr-4 text-white">{formatar.moeda(p.receitaTotal)}</td>
            </tr>
          ))}
        </Tabela>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] [&>*]:min-w-0">
        <Card>
          <TituloCard icone={UserPlus}>De onde vêm os membros</TituloCard>
          <ul className="mt-4 flex flex-col gap-3">
            {r.origens.map((o) => (
              <li key={o.origem}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-300">{o.origem}</span>
                  <span className="font-semibold text-white">
                    {o.quantidade} <span className="text-gv-muted">({Math.round((o.quantidade * 100) / totalOrigem)}%)</span>
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400" style={{ width: `${(o.quantidade * 100) / totalOrigem}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Tabela
          titulo="Inadimplência"
          icone={CircleAlert}
          csv={{
            nome: "inadimplencia",
            cabecalho: ["Membro", "WhatsApp", "Plano", "Valor", "Vencimento", "Dias de atraso", "Situação"],
            linhas: r.inadimplencia.map((i) => [i.nome, i.telefone, i.plano, i.valor, formatar.data(i.vencimento), i.dias, rotuloSituacao[i.situacao]]),
          }}
          cabecalho={["Membro", "Valor", "Atraso", "Situação", ""]}
        >
          {r.inadimplencia.map((i) => (
            <tr key={i.clienteId}>
              <td className="py-2 pr-3 pl-4">
                <Link to="/grupo-vip/membros/$id" params={{ id: i.clienteId }} className="text-slate-100 hover:underline">
                  {i.nome}
                </Link>
                <div className="text-[11.5px] text-gv-muted">{i.plano}</div>
              </td>
              <td className="py-2 pr-3 text-white">{formatar.moeda(i.valor)}</td>
              <td className="py-2 pr-3 text-red-300">{i.dias} dias</td>
              <td className="py-2 pr-3">
                <SeloSituacao situacao={i.situacao} />
              </td>
              <td className="py-2 pr-4 text-right">
                {i.telefone && (
                  <a
                    href={
                      linkWhatsapp(
                        i.telefone,
                        `Oi, ${i.nome.split(" ")[0]}! Sua mensalidade de ${formatar.moeda(i.valor)} venceu em ${formatar.data(i.vencimento)}. Posso te ajudar a regularizar?`,
                      ) ?? "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-green-300 hover:text-green-200"
                    aria-label="Cobrar pelo WhatsApp"
                  >
                    <MessageCircle className="size-4" />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </Tabela>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <Tabela
          titulo="Conteúdos mais vistos"
          icone={Eye}
          csv={{
            nome: "conteudos",
            cabecalho: ["Conteúdo", "Categoria", "Publicado em", "Visualizações", "Pessoas"],
            linhas: r.conteudos.map((c) => [c.titulo, c.categoria, formatar.data(c.publicadoEm), c.visualizacoes, c.pessoas]),
          }}
          cabecalho={["Conteúdo", "Visualizações", "Pessoas"]}
        >
          {r.conteudos.map((c) => (
            <tr key={c.titulo}>
              <td className="py-2 pr-3 pl-4">
                <div className="text-slate-100">{c.titulo}</div>
                <div className="text-[11.5px] text-gv-muted">
                  {c.categoria ?? "sem categoria"} · {formatar.data(c.publicadoEm)}
                </div>
              </td>
              <td className="py-2 pr-3 text-white">{c.visualizacoes}</td>
              <td className="py-2 pr-4 text-slate-300">{c.pessoas}</td>
            </tr>
          ))}
        </Tabela>

        <Tabela
          titulo="Quem mais indica"
          icone={Trophy}
          csv={{
            nome: "indicacoes",
            cabecalho: ["Membro", "Indicados", "Ativos", "Comissão do mês", "Comissão total"],
            linhas: r.indicadores.map((i) => [i.nome, i.indicados, i.indicadosAtivos, i.comissaoMes, i.comissaoTotal]),
          }}
          cabecalho={["Membro", "Indicados", "Comissão total"]}
        >
          {r.indicadores.slice(0, 15).map((i) => (
            <tr key={i.clienteId}>
              <td className="py-2 pr-3 pl-4">
                <Link to="/grupo-vip/membros/$id" params={{ id: i.clienteId }} className="text-slate-100 hover:underline">
                  {i.nome}
                </Link>
              </td>
              <td className="py-2 pr-3 text-slate-300">
                {i.indicados} <span className="text-gv-muted">({i.indicadosAtivos} ativos)</span>
              </td>
              <td className="py-2 pr-4 text-emerald-300">{formatar.moeda(i.comissaoTotal)}</td>
            </tr>
          ))}
        </Tabela>
      </div>
    </div>
  );
}

function BotaoCsv({ nome, cabecalho, linhas }: { nome: string; cabecalho: string[]; linhas: (string | number | null)[][] }) {
  return (
    <Botao pequeno onClick={() => baixarCsv(nome, cabecalho, linhas)}>
      <Download className="size-3.5" /> Planilha
    </Botao>
  );
}

function Tabela({
  titulo,
  icone,
  csv,
  cabecalho,
  nota,
  children,
}: {
  titulo: string;
  icone: typeof Eye;
  csv: { nome: string; cabecalho: string[]; linhas: (string | number | null)[][] };
  cabecalho: string[];
  nota?: string;
  children: ReactNode;
}) {
  const vazio = Array.isArray(children) && children.length === 0;
  return (
    <Card className="!p-0">
      <div className="p-4 pb-2">
        <TituloCard icone={icone} acao={<BotaoCsv {...csv} />}>
          {titulo}
        </TituloCard>
        {nota && <p className="mt-1 text-[11.5px] text-gv-muted">{nota}</p>}
      </div>
      {vazio ? (
        <p className="px-4 pb-4 text-sm text-gv-muted">Nada por aqui.</p>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-gv-card">
              <tr className={cabecalhoTabela}>
                {cabecalho.map((c, i) => (
                  <th key={c + i} className={`py-2 font-medium ${i === 0 ? "pr-3 pl-4" : i === cabecalho.length - 1 ? "pr-4" : "pr-3"}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gv-line/70">{children}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
