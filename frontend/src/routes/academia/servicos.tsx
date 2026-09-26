import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  BadgePercent,
  Check,
  CircleCheck,
  Clock,
  HandCoins,
  Pencil,
  Plus,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { ModalReceber } from "../../components/academia/ModalReceber";
import { SeletorAluno } from "../../components/academia/SeletorAluno";
import { AvatarAluno, SeloCobranca } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { CabecalhoPagina, Card, CardNumero, TituloCard, Vazio } from "../../components/academia/ui";
import {
  apiAgenda,
  rotuloCategoria,
  type CategoriaServico,
  type DadosServico,
  type Servico,
  type Venda,
} from "../../lib/academia-agenda";
import {
  apiAlunos,
  fmt,
  hojeIso,
  rotuloForma,
  type AlunoResumo,
  type Cobranca,
  type FormaPagamento,
} from "../../lib/academia-alunos";
import { apiTreinos, type Profissional } from "../../lib/academia-treinos";

// Serviços vendidos à parte da mensalidade (personal, nutricionista, day use...).
export const Route = createFileRoute("/academia/servicos")({
  loader: async () => {
    const [painel, alunos, profissionais] = await Promise.all([
      apiAgenda.servicos(),
      apiAlunos.listar(),
      apiTreinos.profissionais(),
    ]);
    return { painel, alunos: alunos.alunos, profissionais };
  },
  component: PaginaServicos,
});

type Janela = "novo" | { editar: Servico } | { vender: Servico | null } | { receber: Cobranca } | null;

// A cobrança (pagamento do Cliente Plus) de uma venda, no formato do Faturamento.
const cobrancaDa = (v: Venda): Cobranca => ({
  id: v.cobrancaId,
  alunoId: v.aluno.id,
  aluno: v.aluno.nome,
  plano: v.servico.nome,
  valor: v.valor,
  vencimento: v.vencimento,
  status: v.status,
  pagoEm: v.pagoEm,
  formaPagamento: v.formaPagamento,
  tipo: "avulso",
});

function PaginaServicos() {
  const { painel, alunos, profissionais } = Route.useLoaderData();
  const router = useRouter();
  const [janela, setJanela] = useState<Janela>(null);
  const recarregar = async () => {
    await router.invalidate();
    setJanela(null);
  };
  const ativos = painel.servicos.filter((s) => s.ativo);
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Serviços"
        descricao="Vendidos à parte da mensalidade. Cada venda vira uma cobrança no Faturamento."
      >
        <Botao onClick={() => setJanela("novo")}>
          <Plus className="size-4" />
          Novo serviço
        </Botao>
        <Botao variante="primario" onClick={() => setJanela({ vender: null })} disabled={ativos.length === 0}>
          <ShoppingBag className="size-4" />
          Vender serviço
        </Botao>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CardNumero icone={ShoppingBag} cor="bg-violet-500/20 text-violet-300" rotulo={`Vendido em ${mes}`}>
          <span className="font-poppins text-[26px] font-bold text-white">{fmt.moeda(painel.vendidoMes)}</span>
        </CardNumero>
        <CardNumero icone={CircleCheck} cor="bg-emerald-500/15 text-emerald-300" rotulo={`Recebido em ${mes}`}>
          <span className="font-poppins text-[26px] font-bold text-white">{fmt.moeda(painel.recebidoMes)}</span>
        </CardNumero>
        <CardNumero icone={Wrench} cor="bg-sky-500/15 text-sky-300" rotulo="Serviços ativos" className="col-span-2 xl:col-span-1">
          <span className="font-poppins text-[26px] font-bold text-white">{ativos.length}</span>
        </CardNumero>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {painel.servicos.map((s) => (
          <Card key={s.id} className={s.ativo ? "" : "opacity-55"}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold tracking-wide text-violet-300 uppercase">
                  {rotuloCategoria[s.categoria]}
                </div>
                <div className="mt-0.5 font-semibold text-white">{s.nome}</div>
                {s.descricao && <p className="mt-1 line-clamp-2 text-xs text-ac-muted">{s.descricao}</p>}
              </div>
              <button
                type="button"
                onClick={() => setJanela({ editar: s })}
                aria-label={`Editar ${s.nome}`}
                className="rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-white"
              >
                <Pencil className="size-4" />
              </button>
            </div>
            <div className="mt-3 font-poppins text-2xl font-bold text-white">{fmt.moeda(s.preco)}</div>
            <div className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-slate-300">
              <span className="flex items-center gap-2">
                <UserRound className="size-3.5 text-ac-muted" />
                {s.profissional?.nome ?? "Qualquer profissional"}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="size-3.5 text-ac-muted" />
                {s.duracaoMinutos ? `${s.duracaoMinutos} min (aparece na Agenda)` : "Sem horário marcado"}
              </span>
              <span className="flex items-center gap-2">
                <BadgePercent className="size-3.5 text-ac-muted" />
                {s.comissaoPct > 0 ? `${s.comissaoPct}% para o profissional` : "Sem comissão de profissional"}
              </span>
              {s.participaIndicacoes && (
                <span className="flex items-center gap-2 text-fuchsia-300">
                  <Sparkles className="size-3.5" />
                  Gera comissão de indicação no Cliente Plus
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ac-line pt-3">
              <span className="text-xs text-ac-muted">
                {s.vendasMes} {s.vendasMes === 1 ? "venda" : "vendas"} no mês · {fmt.moeda(s.receitaMes)}
              </span>
              {s.ativo ? (
                <button
                  type="button"
                  onClick={() => setJanela({ vender: s })}
                  className="rounded-lg bg-violet-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
                >
                  Vender
                </button>
              ) : (
                <span className="text-xs text-ac-muted">Desativado</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="!p-0">
        <div className="p-5 pb-3">
          <TituloCard icone={ReceiptText} cor="text-emerald-400">
            Últimas vendas
          </TituloCard>
        </div>
        {painel.vendas.length === 0 ? (
          <Vazio icone={ShoppingBag}>Nenhuma venda ainda.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                  <th className="py-2.5 pr-3 pl-5 font-medium">Data</th>
                  <th className="py-2.5 pr-3 font-medium">Aluno</th>
                  <th className="py-2.5 pr-3 font-medium">Serviço</th>
                  <th className="py-2.5 pr-3 font-medium">Profissional</th>
                  <th className="py-2.5 pr-3 font-medium">Valor</th>
                  <th className="py-2.5 pr-3 font-medium">Situação</th>
                  <th className="py-2.5 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ac-line/70">
                {painel.vendas.map((v) => {
                  const emAberto = v.status === "pendente" || v.status === "atrasada";
                  return (
                    <tr key={v.id} className={v.status === "cancelada" ? "opacity-50" : ""}>
                      <td className="py-2.5 pr-3 pl-5 text-slate-300">{fmt.data(v.criadaEm)}</td>
                      <td className="py-2.5 pr-3">
                        <Link
                          to="/academia/alunos/$id"
                          params={{ id: v.aluno.id }}
                          className="flex items-center gap-2.5 font-medium text-slate-100 hover:text-violet-300"
                        >
                          <AvatarAluno nome={v.aluno.nome} />
                          {v.aluno.nome}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-200">
                        {v.servico.nome}
                        {v.quantidade > 1 && <span className="text-ac-muted"> ×{v.quantidade}</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">
                        {v.profissional?.nome ?? "—"}
                        {v.profissional && v.comissaoPct > 0 && (
                          <div className="text-[11px] text-ac-muted">
                            comissão {fmt.moeda((v.valor * v.comissaoPct) / 100)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-white">{fmt.moeda(v.valor)}</td>
                      <td className="py-2.5 pr-3">
                        <SeloCobranca status={v.status} />
                        {v.pagoEm && v.formaPagamento && (
                          <div className="mt-0.5 text-[11px] text-ac-muted">{rotuloForma[v.formaPagamento]}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-5 text-right whitespace-nowrap">
                        {emAberto && (
                          <div className="flex justify-end gap-2">
                            <BotaoCancelarVenda id={v.id} aoCancelar={() => router.invalidate()} />
                            <button
                              type="button"
                              onClick={() => setJanela({ receber: cobrancaDa(v) })}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              <HandCoins className="size-3.5" />
                              Receber
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

      {janela === "novo" && <ModalServico profissionais={profissionais} aoFechar={() => setJanela(null)} aoSalvar={recarregar} />}
      {janela && typeof janela === "object" && "editar" in janela && (
        <ModalServico
          servico={janela.editar}
          profissionais={profissionais}
          aoFechar={() => setJanela(null)}
          aoSalvar={recarregar}
        />
      )}
      {janela && typeof janela === "object" && "vender" in janela && (
        <ModalVender
          servicos={ativos}
          inicial={janela.vender}
          alunos={alunos}
          profissionais={profissionais}
          aoFechar={() => setJanela(null)}
          aoSalvar={recarregar}
        />
      )}
      {janela && typeof janela === "object" && "receber" in janela && (
        <ModalReceber cobranca={janela.receber} aoFechar={() => setJanela(null)} aoReceber={recarregar} />
      )}
    </div>
  );
}

function BotaoCancelarVenda({ id, aoCancelar }: { id: string; aoCancelar: () => void }) {
  const [salvando, setSalvando] = useState(false);
  return (
    <button
      type="button"
      disabled={salvando}
      title="Cancelar venda"
      onClick={async () => {
        if (!window.confirm("Cancelar esta venda? A cobrança some do Faturamento.")) return;
        setSalvando(true);
        await apiAgenda.cancelarVenda(id).catch((e) => window.alert(mensagemDe(e)));
        aoCancelar();
      }}
      className="rounded-lg border border-ac-line p-1.5 text-ac-muted hover:border-red-500/50 hover:text-red-300"
    >
      <X className="size-3.5" />
    </button>
  );
}

// "129,90" -> 129.9
const lerNumero = (t: string) => {
  const n = Number(t.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
  return t.trim() && Number.isFinite(n) ? n : null;
};
const mostrarNumero = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));

function ModalServico({
  servico,
  profissionais,
  aoSalvar,
  aoFechar,
}: {
  servico?: Servico;
  profissionais: Profissional[];
  aoSalvar: () => void;
  aoFechar: () => void;
}) {
  const [d, setD] = useState<DadosServico>({
    nome: servico?.nome ?? "",
    descricao: servico?.descricao ?? "",
    categoria: servico?.categoria ?? "personal",
    preco: servico?.preco ?? null,
    duracaoMinutos: servico ? servico.duracaoMinutos : 60,
    profissionalId: servico?.profissional?.id ?? null,
    comissaoPct: servico?.comissaoPct ?? 0,
    participaIndicacoes: servico?.participaIndicacoes ?? false,
    ativo: servico?.ativo ?? true,
  });
  const [preco, setPreco] = useState(mostrarNumero(d.preco));
  const [agendado, setAgendado] = useState(d.duracaoMinutos !== null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const dados = { ...d, preco: lerNumero(preco), duracaoMinutos: agendado ? d.duracaoMinutos : null };
    try {
      if (servico) await apiAgenda.atualizarServico(servico.id, dados);
      else await apiAgenda.cadastrarServico(dados);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={servico ? "Editar serviço" : "Novo serviço"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Campo rotulo="Nome *">
          <input
            autoFocus
            className={classeInput}
            value={d.nome}
            onChange={(e) => setD({ ...d, nome: e.target.value })}
            placeholder="Ex.: Personal trainer (sessão)"
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Categoria *">
            <select
              className={classeInput}
              value={d.categoria}
              onChange={(e) => setD({ ...d, categoria: e.target.value as CategoriaServico })}
            >
              {(Object.keys(rotuloCategoria) as CategoriaServico[]).map((c) => (
                <option key={c} value={c}>
                  {rotuloCategoria[c]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Preço (R$) *">
            <input
              className={classeInput}
              inputMode="decimal"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="90,00"
            />
          </Campo>
        </div>
        <Campo rotulo="Descrição">
          <input className={classeInput} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Profissional que costuma atender">
            <select
              className={classeInput}
              value={d.profissionalId ?? ""}
              onChange={(e) => setD({ ...d, profissionalId: e.target.value || null })}
            >
              <option value="">Qualquer um</option>
              {profissionais
                .filter((p) => p.ativo)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
            </select>
          </Campo>
          <Campo rotulo="Comissão do profissional (%)">
            <input
              type="number"
              min={0}
              max={100}
              className={classeInput}
              value={d.comissaoPct ?? 0}
              onChange={(e) => setD({ ...d, comissaoPct: Number(e.target.value) })}
            />
          </Campo>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={agendado}
            onChange={(e) => setAgendado(e.target.checked)}
            className="accent-fuchsia-500"
          />
          Tem horário marcado na Agenda, com duração de
          <input
            type="number"
            min={5}
            max={480}
            disabled={!agendado}
            className={`${classeInput} !h-8 !w-20`}
            value={d.duracaoMinutos ?? 60}
            onChange={(e) => setD({ ...d, duracaoMinutos: Number(e.target.value) })}
          />
          min
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={d.participaIndicacoes}
            onChange={(e) => setD({ ...d, participaIndicacoes: e.target.checked })}
            className="mt-1 accent-fuchsia-500"
          />
          <span>
            Gera comissão de indicação no Cliente Plus
            <span className="block text-xs text-ac-muted">
              Quem indicou o aluno ganha comissão quando este serviço é pago.
            </span>
          </span>
        </label>
        {servico && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={d.ativo ?? true}
              onChange={(e) => setD({ ...d, ativo: e.target.checked })}
              className="accent-fuchsia-500"
            />
            Ativo (desmarque para parar de vender)
          </label>
        )}
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

const formas: FormaPagamento[] = ["pix", "dinheiro", "cartao_credito", "cartao_debito", "boleto"];

function ModalVender({
  servicos,
  inicial,
  alunos,
  profissionais,
  alunoFixo,
  aoSalvar,
  aoFechar,
}: {
  servicos: Servico[];
  inicial: Servico | null;
  alunos: AlunoResumo[];
  profissionais: Profissional[];
  alunoFixo?: string;
  aoSalvar: () => void;
  aoFechar: () => void;
}) {
  const [alunoId, setAlunoId] = useState<string | null>(alunoFixo ?? null);
  const [servicoId, setServicoId] = useState(inicial?.id ?? servicos[0]?.id ?? "");
  const servico = servicos.find((s) => s.id === servicoId);
  const [profissionalId, setProfissionalId] = useState<string | null>(inicial?.profissional?.id ?? servicos[0]?.profissional?.id ?? null);
  const [quantidade, setQuantidade] = useState(1);
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(hojeIso());
  const [receberAgora, setReceberAgora] = useState(true);
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const total = lerNumero(valor) ?? (servico ? servico.preco * quantidade : 0);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!alunoId) return setErro("Escolha o aluno");
    setSalvando(true);
    setErro(null);
    try {
      await apiAgenda.vender({
        alunoId,
        servicoId,
        profissionalId,
        quantidade,
        valor: lerNumero(valor),
        vencimento,
        receberAgora,
        formaPagamento: receberAgora ? forma : null,
      });
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Vender serviço" aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {!alunoFixo && (
          <Campo rotulo="Aluno *">
            <SeletorAluno alunos={alunos} valor={alunoId} aoMudar={setAlunoId} autoFocus />
          </Campo>
        )}
        <Campo rotulo="Serviço *">
          <select
            className={classeInput}
            value={servicoId}
            onChange={(e) => {
              setServicoId(e.target.value);
              setProfissionalId(servicos.find((s) => s.id === e.target.value)?.profissional?.id ?? null);
              setValor("");
            }}
          >
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} · {fmt.moeda(s.preco)}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Quantidade">
            <input
              type="number"
              min={1}
              max={100}
              className={classeInput}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
            />
          </Campo>
          <Campo rotulo="Valor total (R$)">
            <input
              className={classeInput}
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={servico ? mostrarNumero(servico.preco * quantidade) : ""}
            />
          </Campo>
          <Campo rotulo="Vencimento">
            <input type="date" className={classeInput} value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
          </Campo>
        </div>
        <Campo rotulo="Profissional que atende">
          <select
            className={classeInput}
            value={profissionalId ?? ""}
            onChange={(e) => setProfissionalId(e.target.value || null)}
          >
            <option value="">—</option>
            {profissionais
              .filter((p) => p.ativo)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </select>
        </Campo>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={receberAgora}
            onChange={(e) => setReceberAgora(e.target.checked)}
            className="accent-fuchsia-500"
          />
          Já recebi o pagamento
        </label>
        {receberAgora && (
          <div className="flex flex-wrap gap-2">
            {formas.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setForma(f)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  forma === f ? "border-violet-500 bg-violet-600/25 text-white" : "border-ac-line text-slate-300"
                }`}
              >
                {rotuloForma[f]}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between rounded-xl border border-ac-line bg-ac-bg/40 px-4 py-3">
          <span className="text-sm text-slate-300">Total</span>
          <span className="font-poppins text-xl font-bold text-emerald-300">{fmt.moeda(total)}</span>
        </div>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <Check className="size-4" />
            {receberAgora ? "Vender e receber" : "Vender (a receber)"}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
