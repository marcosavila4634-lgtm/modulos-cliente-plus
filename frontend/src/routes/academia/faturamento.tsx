import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  Pencil,
  Plus,
  Repeat,
  Scale,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ModalReceber } from "../../components/academia/ModalReceber";
import { TabelaCobrancas } from "../../components/academia/TabelaCobrancas";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Abas, Card, Legenda, TituloCard, Vazio } from "../../components/academia/ui";
import { formatar } from "../../lib/academia";
import { apiAlunos, fmt, hojeIso, prazo, rotuloForma, type Cobranca, type FormaPagamento } from "../../lib/academia-alunos";
import {
  apiFinanceiro,
  categoriasDespesa,
  rotuloCategoriaDespesa,
  rotuloFormaDespesa,
  type DadosDespesa,
  type Despesa,
  type FormaDespesa,
  type PainelDespesas,
  type Resultado,
} from "../../lib/academia-financeiro";

type Secao = "receitas" | "despesas" | "resultado";

// Faturamento: receitas (mensalidades e serviços, que são pagamentos do
// Cliente Plus), despesas da academia e o resultado do mês.
export const Route = createFileRoute("/academia/faturamento")({
  validateSearch: (s: Record<string, unknown>): { secao?: Secao } => ({
    secao: s.secao === "despesas" || s.secao === "resultado" ? s.secao : undefined,
  }),
  loader: async () => {
    const [receitas, despesas, resultado] = await Promise.all([
      apiAlunos.faturamento(),
      apiFinanceiro.despesas(),
      apiFinanceiro.resultado(6),
    ]);
    return { receitas, despesas, resultado };
  },
  component: PaginaFaturamento,
});

function PaginaFaturamento() {
  const { receitas, despesas, resultado } = Route.useLoaderData();
  const secao = Route.useSearch().secao ?? "receitas";
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-poppins text-[28px] font-bold text-white">Faturamento</h1>
          <p className="mt-1 text-sm text-ac-muted">
            {secao === "receitas"
              ? "Mensalidades e serviços. Cada pagamento confirmado aqui gera as comissões de indicação no Cliente Plus."
              : secao === "despesas"
                ? "Contas da academia: aluguel, salários, energia, equipamentos..."
                : "Quanto entrou, quanto saiu e quanto sobrou em cada mês."}
          </p>
        </div>
        <div className="flex rounded-xl border border-ac-line bg-ac-card p-1">
          {(
            [
              ["receitas", "Receitas", ArrowDownCircle],
              ["despesas", "Despesas", ArrowUpCircle],
              ["resultado", "Resultado", Scale],
            ] as const
          ).map(([valor, rotulo, Icone]) => (
            <button
              key={valor}
              type="button"
              onClick={() => navigate({ to: "/academia/faturamento", search: valor === "receitas" ? {} : { secao: valor } })}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                secao === valor
                  ? "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Icone className="size-4" />
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      {secao === "receitas" && <Receitas dados={receitas} />}
      {secao === "despesas" && <Despesas dados={despesas} />}
      {secao === "resultado" && <SecaoResultado dados={resultado} />}
    </div>
  );
}

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const nomeDoMes = () => new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());

function CardResumo({
  icone: Icone,
  cor,
  rotulo,
  valor,
  detalhe,
  aoClicar,
}: {
  icone: LucideIcon;
  cor: string;
  rotulo: string;
  valor: number;
  detalhe: string;
  aoClicar?: () => void;
}) {
  return (
    <button type="button" onClick={aoClicar} className="text-left">
      <Card className="!p-4 transition-colors hover:border-violet-500/50">
        <div className="flex items-center gap-3">
          <span className={`grid size-9 place-items-center rounded-full ${cor}`}>
            <Icone className="size-[18px]" />
          </span>
          <span className="text-[13px] text-slate-300">{rotulo}</span>
        </div>
        <div className="mt-3 font-poppins text-[26px] font-bold text-white">{fmt.moeda(valor)}</div>
        <div className="mt-0.5 text-[11.5px] text-ac-muted">{detalhe}</div>
      </Card>
    </button>
  );
}

// ---------- Receitas ----------

type AbaReceita = "a_receber" | "atrasadas" | "pagas" | "todas";

function daAba(cobrancas: Cobranca[], aba: AbaReceita) {
  const porVencimento = (a: Cobranca, b: Cobranca) => a.vencimento.localeCompare(b.vencimento);
  switch (aba) {
    case "a_receber":
      return cobrancas.filter((c) => c.status === "pendente").sort(porVencimento);
    case "atrasadas":
      return cobrancas.filter((c) => c.status === "atrasada").sort(porVencimento);
    case "pagas":
      return cobrancas.filter((c) => c.status === "paga").sort((a, b) => (b.pagoEm ?? "").localeCompare(a.pagoEm ?? ""));
    case "todas":
      return cobrancas;
  }
}

function Receitas({ dados }: { dados: Awaited<ReturnType<typeof apiAlunos.faturamento>> }) {
  const { resumo, cobrancas } = dados;
  const router = useRouter();
  const [aba, setAba] = useState<AbaReceita>(resumo.qtdEmAtraso > 0 ? "atrasadas" : "a_receber");
  const [tipo, setTipo] = useState<"todos" | "mensalidade" | "avulso">("todos");
  const [busca, setBusca] = useState("");
  const [receber, setReceber] = useState<Cobranca | null>(null);
  const mes = nomeDoMes();

  const doTipo = useMemo(() => cobrancas.filter((c) => tipo === "todos" || c.tipo === tipo), [cobrancas, tipo]);
  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return daAba(doTipo, aba).filter((c) => !termo || normalizar(c.aluno).includes(termo));
  }, [doTipo, aba, busca]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <CardResumo
          icone={CircleCheck}
          cor="bg-emerald-500/15 text-emerald-300"
          rotulo={`Recebido em ${mes}`}
          valor={resumo.recebidoMes}
          detalhe={`${resumo.qtdRecebidoMes} pagamentos recebidos`}
          aoClicar={() => setAba("pagas")}
        />
        <CardResumo
          icone={Clock}
          cor="bg-sky-500/15 text-sky-300"
          rotulo={`A receber em ${mes}`}
          valor={resumo.aReceberMes}
          detalhe={`${resumo.qtdAReceberMes} a vencer`}
          aoClicar={() => setAba("a_receber")}
        />
        <CardResumo
          icone={CircleAlert}
          cor="bg-red-500/15 text-red-300"
          rotulo="Em atraso"
          valor={resumo.emAtraso}
          detalhe={`${resumo.qtdEmAtraso} atrasadas`}
          aoClicar={() => setAba("atrasadas")}
        />
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-ac-line p-4">
          <Abas
            abas={[
              { valor: "a_receber", rotulo: "A receber", quantidade: daAba(doTipo, "a_receber").length },
              { valor: "atrasadas", rotulo: "Em atraso", quantidade: daAba(doTipo, "atrasadas").length },
              { valor: "pagas", rotulo: "Pagas", quantidade: daAba(doTipo, "pagas").length },
              { valor: "todas", rotulo: "Todas", quantidade: doTipo.length },
            ]}
            valor={aba}
            aoMudar={setAba}
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="h-9 rounded-lg border border-ac-line bg-ac-bg/60 px-2 text-sm text-slate-200 outline-none"
          >
            <option value="todos">Mensalidades e serviços</option>
            <option value="mensalidade">Só mensalidades</option>
            <option value="avulso">Só serviços</option>
          </select>
          <label className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno"
              className={`${classeInput} pl-9`}
            />
          </label>
        </div>
        <div className="px-5 pb-2">
          <TabelaCobrancas cobrancas={lista} mostrarAluno aoReceber={setReceber} />
        </div>
      </Card>

      {receber && (
        <ModalReceber
          cobranca={receber}
          aoFechar={() => setReceber(null)}
          aoReceber={async () => {
            await router.invalidate();
            setReceber(null);
          }}
        />
      )}
    </>
  );
}

// ---------- Despesas ----------

type AbaDespesa = "a_pagar" | "pagas" | "todas";

const corStatusDespesa: Record<Despesa["status"], string> = {
  pendente: "bg-sky-500/15 text-sky-300",
  atrasada: "bg-red-500/15 text-red-300",
  paga: "bg-emerald-500/15 text-emerald-300",
  cancelada: "bg-slate-500/20 text-slate-400",
};
const rotuloStatusDespesa: Record<Despesa["status"], string> = {
  pendente: "A pagar",
  atrasada: "Atrasada",
  paga: "Paga",
  cancelada: "Cancelada",
};

function Despesas({ dados }: { dados: PainelDespesas }) {
  const router = useRouter();
  const { resumo, despesas } = dados;
  const [aba, setAba] = useState<AbaDespesa>("a_pagar");
  const [busca, setBusca] = useState("");
  const [janela, setJanela] = useState<"nova" | { editar: Despesa } | { pagar: Despesa } | null>(null);
  const mes = nomeDoMes();
  const recarregar = async () => {
    await router.invalidate();
    setJanela(null);
  };

  const daAbaDespesa = (a: AbaDespesa) =>
    a === "a_pagar"
      ? despesas
          .filter((d) => d.status === "pendente" || d.status === "atrasada")
          .sort((x, y) => x.vencimento.localeCompare(y.vencimento))
      : a === "pagas"
        ? despesas.filter((d) => d.status === "paga").sort((x, y) => (y.pagoEm ?? "").localeCompare(x.pagoEm ?? ""))
        : despesas;

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return daAbaDespesa(aba).filter(
      (d) => !termo || normalizar(d.descricao).includes(termo) || normalizar(d.fornecedor).includes(termo),
    );
  }, [despesas, aba, busca]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <CardResumo
          icone={CircleCheck}
          cor="bg-emerald-500/15 text-emerald-300"
          rotulo={`Pago em ${mes}`}
          valor={resumo.pagoMes}
          detalhe={`${resumo.qtdPagoMes} contas pagas`}
          aoClicar={() => setAba("pagas")}
        />
        <CardResumo
          icone={Clock}
          cor="bg-sky-500/15 text-sky-300"
          rotulo={`A pagar em ${mes}`}
          valor={resumo.aPagarMes}
          detalhe={`${resumo.qtdAPagarMes} contas a vencer`}
          aoClicar={() => setAba("a_pagar")}
        />
        <CardResumo
          icone={CircleAlert}
          cor="bg-red-500/15 text-red-300"
          rotulo="Contas atrasadas"
          valor={resumo.atrasadas}
          detalhe={`${resumo.qtdAtrasadas} vencidas e não pagas`}
          aoClicar={() => setAba("a_pagar")}
        />
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-ac-line p-4">
          <Abas
            abas={[
              { valor: "a_pagar", rotulo: "A pagar", quantidade: daAbaDespesa("a_pagar").length },
              { valor: "pagas", rotulo: "Pagas", quantidade: daAbaDespesa("pagas").length },
              { valor: "todas", rotulo: "Todas", quantidade: despesas.length },
            ]}
            valor={aba}
            aoMudar={setAba}
          />
          <label className="relative ml-auto w-full sm:w-60">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar despesa"
              className={`${classeInput} pl-9`}
            />
          </label>
          <Botao variante="primario" onClick={() => setJanela("nova")}>
            <Plus className="size-4" />
            Nova despesa
          </Botao>
        </div>
        {lista.length === 0 ? (
          <Vazio icone={CircleCheck}>Nenhuma despesa por aqui.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                  <th className="py-2.5 pr-3 pl-5 font-medium">Despesa</th>
                  <th className="py-2.5 pr-3 font-medium">Categoria</th>
                  <th className="py-2.5 pr-3 font-medium">Vencimento</th>
                  <th className="py-2.5 pr-3 font-medium">Valor</th>
                  <th className="py-2.5 pr-3 font-medium">Situação</th>
                  <th className="py-2.5 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ac-line/70">
                {lista.map((d) => {
                  const aberta = d.status === "pendente" || d.status === "atrasada";
                  return (
                    <tr key={d.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-3 pl-5">
                        <div className="flex items-center gap-2 font-medium text-slate-100">
                          {d.descricao}
                          {d.recorrente && (
                            <span title="Todo mês" className="text-violet-300">
                              <Repeat className="size-3.5" />
                            </span>
                          )}
                        </div>
                        {d.fornecedor && <div className="text-[11.5px] text-ac-muted">{d.fornecedor}</div>}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">{rotuloCategoriaDespesa[d.categoria]}</td>
                      <td className="py-2.5 pr-3">
                        <div className="text-slate-200">{fmt.data(d.vencimento)}</div>
                        {aberta && (
                          <div className={`text-[11px] ${d.status === "atrasada" ? "text-red-400" : "text-ac-muted"}`}>
                            {prazo(d.vencimento)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-white">{fmt.moeda(d.valor)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${corStatusDespesa[d.status]}`}>
                          {rotuloStatusDespesa[d.status]}
                        </span>
                        {d.pagoEm && (
                          <div className="mt-0.5 text-[11px] text-ac-muted">
                            {fmt.data(d.pagoEm)} · {d.formaPagamento ? rotuloFormaDespesa[d.formaPagamento] : ""}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-5 text-right whitespace-nowrap">
                        {aberta && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              aria-label="Editar"
                              onClick={() => setJanela({ editar: d })}
                              className="rounded-lg border border-ac-line p-1.5 text-ac-muted hover:text-white"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Cancelar despesa"
                              onClick={async () => {
                                if (!window.confirm(`Cancelar "${d.descricao}"?`)) return;
                                await apiFinanceiro.cancelarDespesa(d.id).catch((e) => window.alert(mensagemDe(e)));
                                await router.invalidate();
                              }}
                              className="rounded-lg border border-ac-line p-1.5 text-ac-muted hover:border-red-500/50 hover:text-red-300"
                            >
                              <X className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setJanela({ pagar: d })}
                              className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              Pagar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {janela === "nova" && <ModalDespesa aoFechar={() => setJanela(null)} aoSalvar={recarregar} />}
      {janela && typeof janela === "object" && "editar" in janela && (
        <ModalDespesa despesa={janela.editar} aoFechar={() => setJanela(null)} aoSalvar={recarregar} />
      )}
      {janela && typeof janela === "object" && "pagar" in janela && (
        <ModalPagarDespesa despesa={janela.pagar} aoFechar={() => setJanela(null)} aoPagar={recarregar} />
      )}
    </>
  );
}

const lerValor = (t: string) => {
  const n = Number(t.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return t.trim() && Number.isFinite(n) ? n : null;
};

function ModalDespesa({ despesa, aoSalvar, aoFechar }: { despesa?: Despesa; aoSalvar: () => void; aoFechar: () => void }) {
  const [d, setD] = useState<DadosDespesa>({
    descricao: despesa?.descricao ?? "",
    categoria: despesa?.categoria ?? "outros",
    fornecedor: despesa?.fornecedor ?? "",
    valor: despesa?.valor ?? null,
    vencimento: despesa?.vencimento ?? hojeIso(),
    recorrente: despesa?.recorrente ?? false,
    observacao: despesa?.observacao ?? "",
  });
  const [valor, setValor] = useState(despesa ? String(despesa.valor).replace(".", ",") : "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const dados = { ...d, valor: lerValor(valor) };
      if (despesa) await apiFinanceiro.atualizarDespesa(despesa.id, dados);
      else await apiFinanceiro.cadastrarDespesa(dados);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={despesa ? "Editar despesa" : "Nova despesa"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Campo rotulo="Descrição *">
          <input
            autoFocus
            className={classeInput}
            value={d.descricao}
            onChange={(e) => setD({ ...d, descricao: e.target.value })}
            placeholder="Ex.: Conta de energia"
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Categoria *">
            <select
              className={classeInput}
              value={d.categoria}
              onChange={(e) => setD({ ...d, categoria: e.target.value as DadosDespesa["categoria"] })}
            >
              {categoriasDespesa.map((c) => (
                <option key={c} value={c}>
                  {rotuloCategoriaDespesa[c]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Fornecedor">
            <input className={classeInput} value={d.fornecedor} onChange={(e) => setD({ ...d, fornecedor: e.target.value })} />
          </Campo>
          <Campo rotulo="Valor (R$) *">
            <input
              className={classeInput}
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </Campo>
          <Campo rotulo="Vencimento *">
            <input
              type="date"
              className={classeInput}
              value={d.vencimento}
              onChange={(e) => setD({ ...d, vencimento: e.target.value })}
            />
          </Campo>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={d.recorrente}
            onChange={(e) => setD({ ...d, recorrente: e.target.checked })}
            className="mt-1 accent-fuchsia-500"
          />
          <span>
            Repete todo mês
            <span className="block text-xs text-ac-muted">Ao pagar, a conta do mês seguinte já é criada.</span>
          </span>
        </label>
        <Campo rotulo="Observação">
          <input className={classeInput} value={d.observacao} onChange={(e) => setD({ ...d, observacao: e.target.value })} />
        </Campo>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <Check className="size-4" />
            Salvar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

function ModalPagarDespesa({ despesa, aoPagar, aoFechar }: { despesa: Despesa; aoPagar: () => void; aoFechar: () => void }) {
  const [forma, setForma] = useState<FormaDespesa>("pix");
  const [data, setData] = useState(hojeIso());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function pagar() {
    setSalvando(true);
    setErro(null);
    try {
      await apiFinanceiro.pagarDespesa(despesa.id, forma, data);
      aoPagar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Pagar despesa" subtitulo={despesa.descricao} aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-ac-line bg-ac-bg/40 px-4 py-3">
          <span className="text-sm text-slate-300">Vence em {fmt.data(despesa.vencimento)}</span>
          <span className="font-poppins text-xl font-bold text-red-300">{fmt.moeda(despesa.valor)}</span>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-300">Forma de pagamento</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(rotuloFormaDespesa) as FormaDespesa[]).map((f) => (
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
        </div>
        <Campo rotulo="Data do pagamento" className="max-w-48">
          <input type="date" max={hojeIso()} className={classeInput} value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        {despesa.recorrente && (
          <p className="flex items-center gap-1.5 text-xs text-violet-300">
            <Repeat className="size-3.5" />A conta do mês que vem será criada automaticamente.
          </p>
        )}
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="sucesso" carregando={salvando} onClick={pagar}>
            <Check className="size-4" />
            Confirmar pagamento
          </Botao>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Resultado ----------

const eixo = { fill: "#8d96ab", fontSize: 11 };

function SecaoResultado({ dados }: { dados: Resultado }) {
  const atual = dados.meses[dados.meses.length - 1];
  const margem = atual.receita > 0 ? Math.round((atual.resultado * 100) / atual.receita) : 0;
  const lucro = atual.resultado >= 0;
  const totalDespesas = dados.despesasPorCategoria.reduce((s, c) => s + c.valor, 0);
  const totalReceita = dados.receitaPorForma.reduce((s, c) => s + c.valor, 0);
  const mes = nomeDoMes();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <CardResumo
          icone={ArrowDownCircle}
          cor="bg-emerald-500/15 text-emerald-300"
          rotulo={`Entrou em ${mes}`}
          valor={atual.receita}
          detalhe={`${fmt.moeda(atual.mensalidades)} mensalidades · ${fmt.moeda(atual.servicos)} serviços`}
        />
        <CardResumo
          icone={ArrowUpCircle}
          cor="bg-red-500/15 text-red-300"
          rotulo={`Saiu em ${mes}`}
          valor={atual.despesas}
          detalhe="despesas pagas no mês"
        />
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <span className={`grid size-9 place-items-center rounded-full ${lucro ? "bg-violet-500/20 text-violet-300" : "bg-red-500/15 text-red-300"}`}>
              <Scale className="size-[18px]" />
            </span>
            <span className="text-[13px] text-slate-300">{lucro ? "Sobrou (lucro)" : "Faltou (prejuízo)"}</span>
          </div>
          <div className={`mt-3 font-poppins text-[26px] font-bold ${lucro ? "text-white" : "text-red-300"}`}>
            {fmt.moeda(atual.resultado)}
          </div>
          <div className="mt-0.5 text-[11.5px] text-ac-muted">margem de {margem}% sobre o que entrou</div>
        </Card>
      </div>

      <Card>
        <TituloCard icone={Scale} cor="text-violet-400">
          Últimos 6 meses
        </TituloCard>
        <div className="mt-3">
          <Legenda
            itens={[
              { cor: "#22c55e", rotulo: "Receita" },
              { cor: "#ef4444", rotulo: "Despesas" },
              { cor: "#a78bfa", rotulo: "Resultado" },
            ]}
          />
        </div>
        <div className="mt-2 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados.meses} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1c2640" />
              <XAxis dataKey="mes" tick={eixo} axisLine={false} tickLine={false} />
              <YAxis tick={eixo} axisLine={false} tickLine={false} tickFormatter={formatar.milhar} />
              <Tooltip
                formatter={(v, n) => [fmt.moeda(Number(v)), n === "receita" ? "Receita" : n === "despesas" ? "Despesas" : "Resultado"]}
                contentStyle={{ background: "#131c33", border: "1px solid #1c2640", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#fff" }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
              <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
              <Line dataKey="resultado" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4, fill: "#a78bfa" }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-right text-[13px]">
            <thead>
              <tr className="border-y border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                <th className="py-2 pl-1 text-left font-medium">Mês</th>
                <th className="py-2 font-medium">Mensalidades</th>
                <th className="py-2 font-medium">Serviços</th>
                <th className="py-2 font-medium">Despesas</th>
                <th className="py-2 pr-1 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ac-line/60">
              {dados.meses.map((m) => (
                <tr key={`${m.ano}-${m.numeroMes}`}>
                  <td className="py-2 pl-1 text-left text-slate-200">
                    {m.mes}/{String(m.ano).slice(2)}
                  </td>
                  <td className="py-2 text-slate-300">{fmt.moeda(m.mensalidades)}</td>
                  <td className="py-2 text-slate-300">{fmt.moeda(m.servicos)}</td>
                  <td className="py-2 text-red-300">{fmt.moeda(m.despesas)}</td>
                  <td className={`py-2 pr-1 font-semibold ${m.resultado >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {fmt.moeda(m.resultado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <TituloCard icone={ArrowUpCircle} cor="text-red-400">
            Para onde foi o dinheiro em {mes}
          </TituloCard>
          <Barras
            itens={dados.despesasPorCategoria.map((c) => ({ rotulo: rotuloCategoriaDespesa[c.categoria], valor: c.valor }))}
            total={totalDespesas}
            cor="from-red-600 to-rose-400"
          />
        </Card>
        <Card>
          <TituloCard icone={ArrowDownCircle} cor="text-emerald-400">
            Como os alunos pagaram em {mes}
          </TituloCard>
          <Barras
            itens={dados.receitaPorForma.map((c) => ({
              rotulo: rotuloForma[c.categoria as FormaPagamento] ?? "Outros",
              valor: c.valor,
            }))}
            total={totalReceita}
            cor="from-emerald-600 to-teal-400"
          />
        </Card>
      </div>
    </>
  );
}

function Barras({ itens, total, cor }: { itens: { rotulo: string; valor: number }[]; total: number; cor: string }) {
  if (itens.length === 0) return <p className="mt-4 text-sm text-ac-muted">Nada neste mês.</p>;
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {itens.map((i) => {
        const pct = total > 0 ? Math.round((i.valor * 100) / total) : 0;
        return (
          <li key={i.rotulo}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-200">{i.rotulo}</span>
              <span className="text-slate-300">
                <b className="text-white">{fmt.moeda(i.valor)}</b> <span className="text-ac-muted">({pct}%)</span>
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className={`h-full rounded-full bg-gradient-to-r ${cor}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
