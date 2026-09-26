import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  BadgePercent,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Crown,
  Network,
  Receipt,
  Sparkles,
  UserCog,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, CardNumero, TituloCard, Vazio } from "../../components/academia/ui";
import { fmt } from "../../lib/academia-alunos";
import {
  apiFinanceiro,
  mesAtual,
  nomeMes,
  rotuloFormaDespesa,
  somarMeses,
  type ComissoesIndicacoes,
  type ComissoesProfissionais,
  type FormaDespesa,
} from "../../lib/academia-financeiro";

type Aba = "profissionais" | "indicacoes";
type Busca = { aba?: Aba; mes?: string };

// Comissões: dos profissionais (serviços atendidos) e de indicações (Cliente Plus).
export const Route = createFileRoute("/academia/comissao")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    aba: s.aba === "indicacoes" ? "indicacoes" : undefined,
    mes: typeof s.mes === "string" && /^\d{4}-\d{2}$/.test(s.mes) ? s.mes : undefined,
  }),
  loaderDeps: ({ search }) => ({ mes: search.mes ?? mesAtual() }),
  loader: async ({ deps }) => {
    const [profissionais, indicacoes] = await Promise.all([
      apiFinanceiro.comissoesProfissionais(deps.mes),
      apiFinanceiro.comissoesIndicacoes(deps.mes),
    ]);
    return { mes: deps.mes, profissionais, indicacoes };
  },
  component: PaginaComissao,
});

function PaginaComissao() {
  const { mes, profissionais, indicacoes } = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const aba = busca.aba ?? "profissionais";
  const ir = (m: string, a: Aba = aba) =>
    navigate({
      to: "/academia/comissao",
      search: { aba: a === "profissionais" ? undefined : a, mes: m === mesAtual() ? undefined : m },
    });

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Comissão"
        descricao="O que os profissionais ganham pelos serviços e o que os alunos ganham indicando amigos."
      >
        <div className="flex items-center gap-1 rounded-xl border border-ac-line bg-ac-card px-1 py-1">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => ir(somarMeses(mes, -1))}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-36 text-center text-sm font-semibold text-white">
            {nomeMes(mes).charAt(0).toUpperCase() + nomeMes(mes).slice(1)}
          </span>
          <button
            type="button"
            aria-label="Próximo mês"
            disabled={mes >= mesAtual()}
            onClick={() => ir(somarMeses(mes, 1))}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </CabecalhoPagina>

      <Abas
        abas={[
          { valor: "profissionais", rotulo: "Profissionais", quantidade: profissionais.profissionais.length },
          { valor: "indicacoes", rotulo: "Indicações (Cliente Plus)", quantidade: indicacoes.indicadores },
        ]}
        valor={aba}
        aoMudar={(a) => ir(mes, a)}
      />

      {aba === "profissionais" ? <Profissionais dados={profissionais} mes={mes} /> : <Indicacoes dados={indicacoes} />}
    </div>
  );
}

// ---------- Profissionais ----------

function Profissionais({ dados, mes }: { dados: ComissoesProfissionais; mes: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState<string | null>(null);
  const [pagar, setPagar] = useState<ComissoesProfissionais["profissionais"][number] | null>(null);
  const aPagar = dados.total - dados.pago;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CardNumero icone={BadgePercent} cor="bg-violet-500/20 text-violet-300" rotulo="Comissões do mês">
          <span className="font-poppins text-[26px] font-bold text-white">{fmt.moeda(dados.total)}</span>
        </CardNumero>
        <CardNumero icone={CircleCheck} cor="bg-emerald-500/15 text-emerald-300" rotulo="Já pago">
          <span className="font-poppins text-[26px] font-bold text-white">{fmt.moeda(dados.pago)}</span>
        </CardNumero>
        <CardNumero icone={Clock} cor="bg-amber-500/15 text-amber-300" rotulo="A pagar" className="col-span-2 xl:col-span-1">
          <span className="font-poppins text-[26px] font-bold text-white">{fmt.moeda(aPagar)}</span>
        </CardNumero>
      </div>

      <p className="text-xs text-ac-muted">
        A comissão é o % definido em cada serviço (em{" "}
        <Link to="/academia/servicos" className="text-violet-300 hover:text-violet-200">
          Serviços
        </Link>
        ), sobre os atendimentos pagos no mês. Ao pagar, ela vira uma despesa no Faturamento.
      </p>

      {dados.profissionais.length === 0 ? (
        <Card>
          <Vazio icone={UserCog}>Nenhum serviço com comissão foi pago neste mês.</Vazio>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {dados.profissionais.map((p) => {
            const expandido = aberto === p.profissional.id;
            return (
              <Card key={p.profissional.id} className="!p-0">
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <button
                    type="button"
                    onClick={() => setAberto(expandido ? null : p.profissional.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <AvatarAluno nome={p.profissional.nome} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-white">{p.profissional.nome}</div>
                      <div className="text-xs text-ac-muted">
                        {p.atendimentos} {p.atendimentos === 1 ? "atendimento pago" : "atendimentos pagos"} ·{" "}
                        {fmt.moeda(p.vendido)} vendidos
                      </div>
                    </div>
                    <ChevronDown className={`ml-1 size-4 shrink-0 text-ac-muted transition ${expandido ? "rotate-180" : ""}`} />
                  </button>
                  <div className="text-right">
                    <div className="font-poppins text-xl font-bold text-white">{fmt.moeda(p.comissao)}</div>
                    {p.paga ? (
                      <div className="flex items-center justify-end gap-1 text-xs font-semibold text-emerald-300">
                        <Check className="size-3.5" /> Paga em {fmt.data(p.pagaEm)}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-300">A pagar</div>
                    )}
                  </div>
                  {!p.paga && p.comissao > 0 && (
                    <Botao variante="sucesso" onClick={() => setPagar(p)}>
                      <Wallet className="size-4" />
                      Pagar
                    </Botao>
                  )}
                </div>
                {expandido && (
                  <div className="overflow-x-auto border-t border-ac-line">
                    <table className="w-full min-w-[600px] text-left text-[13px]">
                      <thead>
                        <tr className="text-[11.5px] tracking-wide text-ac-muted uppercase">
                          <th className="py-2 pr-3 pl-5 font-medium">Pago em</th>
                          <th className="py-2 pr-3 font-medium">Aluno</th>
                          <th className="py-2 pr-3 font-medium">Serviço</th>
                          <th className="py-2 pr-3 text-right font-medium">Valor</th>
                          <th className="py-2 pr-5 text-right font-medium">Comissão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ac-line/60">
                        {p.itens.map((i) => (
                          <tr key={i.vendaId}>
                            <td className="py-2 pr-3 pl-5 text-slate-300">{fmt.data(i.pagoEm)}</td>
                            <td className="py-2 pr-3 text-slate-100">{i.aluno}</td>
                            <td className="py-2 pr-3 text-slate-300">{i.servico}</td>
                            <td className="py-2 pr-3 text-right text-slate-300">{fmt.moeda(i.valor)}</td>
                            <td className="py-2 pr-5 text-right font-semibold text-white">
                              {fmt.moeda(i.comissao)} <span className="text-xs font-normal text-ac-muted">({i.pct}%)</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {pagar && (
        <ModalPagarComissao
          nome={pagar.profissional.nome}
          profissionalId={pagar.profissional.id}
          valor={pagar.comissao}
          mes={mes}
          aoFechar={() => setPagar(null)}
          aoPagar={async () => {
            await router.invalidate();
            setPagar(null);
          }}
        />
      )}
    </>
  );
}

function ModalPagarComissao({
  nome,
  profissionalId,
  valor,
  mes,
  aoPagar,
  aoFechar,
}: {
  nome: string;
  profissionalId: string;
  valor: number;
  mes: string;
  aoPagar: () => void;
  aoFechar: () => void;
}) {
  const [forma, setForma] = useState<FormaDespesa>("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal titulo="Pagar comissão" subtitulo={`${nome} · ${nomeMes(mes)}`} aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-ac-line bg-ac-bg/40 px-4 py-3">
          <span className="text-sm text-slate-300">Valor da comissão</span>
          <span className="font-poppins text-xl font-bold text-emerald-300">{fmt.moeda(valor)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["pix", "transferencia", "dinheiro"] as FormaDespesa[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setForma(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                forma === f ? "border-violet-500 bg-violet-600/25 text-white" : "border-ac-line text-slate-300"
              }`}
            >
              {rotuloFormaDespesa[f]}
            </button>
          ))}
        </div>
        <p className="text-xs text-ac-muted">O pagamento entra como despesa (categoria Comissões) no Faturamento.</p>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="sucesso"
            carregando={salvando}
            onClick={async () => {
              setSalvando(true);
              setErro(null);
              try {
                await apiFinanceiro.pagarComissao(profissionalId, mes, forma);
                aoPagar();
              } catch (e) {
                setErro(mensagemDe(e));
                setSalvando(false);
              }
            }}
          >
            <Check className="size-4" />
            Confirmar pagamento
          </Botao>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Indicações (Cliente Plus) ----------

function Indicacoes({ dados }: { dados: ComissoesIndicacoes }) {
  const [todas, setTodas] = useState(false);
  const linhas = todas ? dados.linhas : dados.linhas.slice(0, 15);
  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-violet-500/10 to-pink-500/10 px-4 py-3 text-sm text-slate-200">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-fuchsia-300" />
        <div>
          Cada mensalidade ou serviço pago na academia gera comissão para quem indicou o aluno, subindo até 3 níveis:{" "}
          <b className="text-white">
            nível 1: {dados.percentuais[0]}% · nível 2: {dados.percentuais[1]}% · nível 3: {dados.percentuais[2]}%
          </b>
          .
          <span className="block text-xs text-ac-muted">
            Laboratório: aqui o cálculo é uma simulação. No Cliente Plus, os números vêm do motor de comissões, com os
            percentuais que o lojista definiu em Produtos/Planos.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CardNumero icone={BadgePercent} cor="bg-fuchsia-500/15 text-fuchsia-300" rotulo="Comissões geradas">
          <span className="font-poppins text-[26px] font-bold text-white">{fmt.moeda(dados.total)}</span>
        </CardNumero>
        <CardNumero icone={Receipt} cor="bg-emerald-500/15 text-emerald-300" rotulo="Pagamentos que geraram">
          <span className="font-poppins text-[26px] font-bold text-white">{dados.pagamentosComComissao}</span>
        </CardNumero>
        <CardNumero icone={Crown} cor="bg-amber-500/15 text-amber-300" rotulo="Alunos que ganharam" className="col-span-2 xl:col-span-1">
          <span className="font-poppins text-[26px] font-bold text-white">{dados.indicadores}</span>
        </CardNumero>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)] [&>*]:min-w-0">
        <Card className="h-fit">
          <TituloCard icone={Crown} cor="text-amber-400">
            Quem mais ganhou
          </TituloCard>
          {dados.ranking.length === 0 ? (
            <p className="mt-4 text-sm text-ac-muted">Nenhum aluno indicou alguém ainda.</p>
          ) : (
            <ol className="mt-3 flex flex-col divide-y divide-ac-line">
              {dados.ranking.slice(0, 10).map((r, i) => (
                <li key={r.aluno.id} className="flex items-center gap-3 py-2.5">
                  <span className={`w-5 text-center text-sm font-bold ${i < 3 ? "text-amber-300" : "text-ac-muted"}`}>{i + 1}</span>
                  <AvatarAluno nome={r.aluno.nome} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/academia/alunos/$id"
                      params={{ id: r.aluno.id }}
                      className="block truncate text-[13px] font-medium text-white hover:text-violet-300"
                    >
                      {r.aluno.nome}
                    </Link>
                    <div className="flex items-center gap-1 text-[11.5px] text-ac-muted">
                      <Network className="size-3" />
                      {r.indicadosAtivos} {r.indicadosAtivos === 1 ? "indicado ativo" : "indicados ativos"} · rede de {r.rede}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-300">{fmt.moeda(r.comissaoMes)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="!p-0">
          <div className="p-5 pb-3">
            <TituloCard icone={Receipt} cor="text-emerald-400">
              Comissões do mês
            </TituloCard>
          </div>
          {dados.linhas.length === 0 ? (
            <Vazio icone={Receipt}>Nenhuma comissão neste mês.</Vazio>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead>
                  <tr className="border-y border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                    <th className="py-2.5 pr-3 pl-5 font-medium">Data</th>
                    <th className="py-2.5 pr-3 font-medium">Quem pagou</th>
                    <th className="py-2.5 pr-3 font-medium">Quem ganhou</th>
                    <th className="py-2.5 pr-3 font-medium">Nível</th>
                    <th className="py-2.5 pr-5 text-right font-medium">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ac-line/70">
                  {linhas.map((l, i) => (
                    <tr key={i}>
                      <td className="py-2.5 pr-3 pl-5 text-slate-300">{fmt.data(l.data)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="text-slate-100">{l.pagante.nome}</div>
                        <div className="text-[11px] text-ac-muted">
                          {l.origem} · {fmt.moeda(l.base)}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-white">{l.beneficiario.nome}</td>
                      <td className="py-2.5 pr-3">
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-semibold text-violet-200">
                          {l.nivel}º · {l.pct}%
                        </span>
                      </td>
                      <td className="py-2.5 pr-5 text-right font-semibold text-emerald-300">{fmt.moeda(l.comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dados.linhas.length > 15 && (
                <div className="border-t border-ac-line p-3 text-center">
                  <button type="button" onClick={() => setTodas(!todas)} className="text-sm font-medium text-violet-300 hover:text-violet-200">
                    {todas ? "Mostrar menos" : `Ver todas (${dados.linhas.length})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
