import { createFileRoute } from "@tanstack/react-router";
import {
  Boxes,
  CircleDollarSign,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  Pencil,
  Plus,
  ShoppingBag,
  Shirt,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { CampoArquivo } from "../../components/academia/CampoArquivo";
import { SeletorAluno } from "../../components/academia/SeletorAluno";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, Interruptor, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, CardNumero, Vazio } from "../../components/academia/ui";
import { apiAlunos, type AlunoResumo } from "../../lib/academia-alunos";
import {
  apiLutas,
  data,
  formasPagamento,
  hojeIso,
  moeda,
  rotuloCategoriaProduto,
  type CategoriaProduto,
  type DadosProduto,
  type PainelLoja,
  type ProdutoJson,
} from "../../lib/artes-marciais";

// Uniformes e loja (Artes Marciais): produtos com tamanhos e estoque, vendas
// aos alunos (viram cobrança no Cliente Plus) e entradas de estoque.
export const Route = createFileRoute("/academia/loja")({
  loader: async () => {
    const [painel, alunos] = await Promise.all([apiLutas.loja(), apiAlunos.listar()]);
    return { painel, alunos: alunos.alunos };
  },
  component: PaginaLoja,
});

type Aba = "produtos" | "vendas";

function PaginaLoja() {
  const inicial = Route.useLoaderData();
  const [p, setP] = useState<PainelLoja>(inicial.painel);
  const [aba, setAba] = useState<Aba>("produtos");
  const [editando, setEditando] = useState<ProdutoJson | "novo" | null>(null);
  const [estoque, setEstoque] = useState<ProdutoJson | null>(null);
  const [vendendo, setVendendo] = useState<ProdutoJson | "nova" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function acao(f: () => Promise<PainelLoja>) {
    setErro(null);
    try {
      setP(await f());
    } catch (x) {
      setErro(mensagemDe(x));
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Uniformes e loja"
        descricao="Kimonos, faixas, luvas e o que mais você vende. A venda baixa o estoque e vira cobrança do aluno no Financeiro."
      >
        <Botao onClick={() => setEditando("novo")}>
          <Plus className="size-4" />
          Novo produto
        </Botao>
        <Botao variante="primario" onClick={() => setVendendo("nova")}>
          <ShoppingBag className="size-4" />
          Nova venda
        </Botao>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <CardNumero icone={CircleDollarSign} cor="bg-emerald-500/15 text-emerald-300" rotulo="Vendido no mês">
          <span className="font-poppins text-[24px] font-bold text-white">{moeda(p.vendidoMes)}</span>
        </CardNumero>
        <CardNumero icone={TrendingUp} cor="bg-sky-500/15 text-sky-300" rotulo="Lucro no mês">
          <span className="font-poppins text-[24px] font-bold text-white">{moeda(p.lucroMes)}</span>
          <span className="text-xs text-ac-muted">venda − custo</span>
        </CardNumero>
        <CardNumero icone={PackageMinus} cor="bg-amber-500/15 text-amber-300" rotulo="Estoque baixo">
          <span className="font-poppins text-[24px] font-bold text-white">{p.itensEstoqueBaixo}</span>
          <span className="text-xs text-ac-muted">produtos</span>
        </CardNumero>
        <CardNumero icone={Boxes} cor="bg-red-500/15 text-red-300" rotulo="Valor em estoque">
          <span className="font-poppins text-[24px] font-bold text-white">{moeda(p.valorEmEstoque)}</span>
          <span className="text-xs text-ac-muted">pelo custo</span>
        </CardNumero>
      </div>

      <Abas
        abas={[
          { valor: "produtos" as Aba, rotulo: "Produtos", quantidade: p.produtos.length },
          { valor: "vendas" as Aba, rotulo: "Vendas", quantidade: p.vendas.length },
        ]}
        valor={aba}
        aoMudar={setAba}
      />
      <MensagemErro texto={erro} />

      {aba === "produtos" &&
        (p.produtos.length === 0 ? (
          <Card>
            <Vazio icone={Shirt}>Nenhum produto. Toque em "Novo produto".</Vazio>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {p.produtos.map((x) => (
              <Card key={x.id} className={`flex flex-col !p-0 ${x.ativo ? "" : "opacity-55"}`}>
                <div className="relative h-36 overflow-hidden rounded-t-2xl bg-ac-card-2">
                  {x.foto ? (
                    <img src={x.foto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-ac-muted">
                      <Shirt className="size-10" />
                    </div>
                  )}
                  {x.estoqueBaixo && (
                    <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10.5px] font-bold text-black">
                      Estoque baixo
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[11px] font-semibold tracking-wide text-ac-muted uppercase">
                    {rotuloCategoriaProduto[x.categoria]}
                  </div>
                  <div className="font-semibold text-white">{x.nome}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-poppins text-lg font-bold text-white">{moeda(x.preco)}</span>
                    {x.custo > 0 && <span className="text-[11px] text-ac-muted">custo {moeda(x.custo)}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {x.tamanhos.map((t) => (
                      <span
                        key={t.id}
                        title={`${t.estoque} em estoque`}
                        className={`rounded-md border px-1.5 py-0.5 text-[11px] ${
                          t.estoque <= 0
                            ? "border-red-500/40 text-red-300 line-through"
                            : t.estoque <= t.estoqueMinimo
                              ? "border-amber-500/40 text-amber-300"
                              : "border-ac-line text-slate-300"
                        }`}
                      >
                        {t.tamanho} <b>{t.estoque}</b>
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center gap-1.5 border-t border-ac-line pt-3">
                    <span className="flex-1 text-[11.5px] text-ac-muted">
                      {x.estoqueTotal} em estoque · {x.vendidosMes} vendidos no mês
                    </span>
                    <button type="button" aria-label="Entrada de estoque" title="Entrada de estoque" onClick={() => setEstoque(x)} className="rounded-lg p-1.5 text-ac-muted hover:bg-white/5 hover:text-white">
                      <PackagePlus className="size-4" />
                    </button>
                    <button type="button" aria-label="Editar" onClick={() => setEditando(x)} className="rounded-lg p-1.5 text-ac-muted hover:bg-white/5 hover:text-white">
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!x.ativo || x.estoqueTotal === 0}
                      onClick={() => setVendendo(x)}
                      className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-40"
                    >
                      Vender
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}

      {aba === "vendas" && (
        <Card className="!p-0">
          {p.vendas.length === 0 ? (
            <Vazio icone={ShoppingBag}>Nenhuma venda ainda.</Vazio>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead className="text-[11px] tracking-wide text-ac-muted uppercase">
                  <tr className="border-b border-ac-line">
                    <th className="py-2.5 pl-4 font-medium">Data</th>
                    <th className="px-3 font-medium">Aluno</th>
                    <th className="px-3 font-medium">Itens</th>
                    <th className="px-3 font-medium">Total</th>
                    <th className="px-3 font-medium">Pagamento</th>
                    <th className="pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {p.vendas.map((v) => (
                    <tr key={v.id} className={`border-b border-ac-line/60 ${v.status === "cancelada" ? "opacity-50" : ""}`}>
                      <td className="py-2 pl-4 text-slate-300">{data(v.quando)}</td>
                      <td className="px-3">
                        <span className="flex items-center gap-2.5">
                          <AvatarAluno nome={v.aluno.nome} />
                          <span className="font-medium text-white">{v.aluno.nome}</span>
                        </span>
                      </td>
                      <td className="px-3 text-slate-300">
                        {v.itens.map((i) => `${i.quantidade > 1 ? `${i.quantidade}x ` : ""}${i.nome} (${i.tamanho})`).join(", ")}
                      </td>
                      <td className="px-3 font-semibold text-white">{moeda(v.total)}</td>
                      <td className="px-3">
                        {v.status === "cancelada" ? (
                          <span className="text-ac-muted">Cancelada</span>
                        ) : (
                          <span className={v.cobranca.situacao === "paga" ? "text-emerald-300" : v.cobranca.situacao === "atrasada" ? "text-red-300" : "text-sky-300"}>
                            {v.cobranca.situacao === "paga" ? "Paga" : v.cobranca.situacao === "atrasada" ? "Atrasada" : "A receber"}
                          </span>
                        )}
                        {!v.entregue && v.status === "ativa" && <span className="ml-2 rounded bg-amber-500/15 px-1.5 text-[11px] text-amber-300">entregar</span>}
                      </td>
                      <td className="pr-4 text-right whitespace-nowrap">
                        {!v.entregue && v.status === "ativa" && (
                          <button type="button" onClick={() => acao(() => apiLutas.entregar(v.id))} className="mr-1 inline-flex items-center gap-1 rounded-lg border border-ac-line px-2 py-1 text-xs text-slate-200 hover:bg-white/5">
                            <PackageCheck className="size-3.5" />
                            Entregue
                          </button>
                        )}
                        {v.status === "ativa" && v.cobranca.situacao !== "paga" && (
                          <button
                            type="button"
                            aria-label="Cancelar venda"
                            onClick={() => confirm("Cancelar a venda? Os produtos voltam para o estoque.") && acao(() => apiLutas.cancelarVenda(v.id))}
                            className="rounded p-1.5 text-ac-muted hover:text-red-300"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-xs text-ac-muted">Vendas a receber são pagas em Financeiro, como as mensalidades.</p>
            </div>
          )}
        </Card>
      )}

      {editando && (
        <ModalProduto
          produto={editando === "novo" ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={(x) => {
            setP(x);
            setEditando(null);
          }}
        />
      )}
      {estoque && (
        <ModalEstoque
          produto={estoque}
          aoFechar={() => setEstoque(null)}
          aoSalvar={(x) => {
            setP(x);
            setEstoque(null);
          }}
        />
      )}
      {vendendo && (
        <ModalVenda
          produtos={p.produtos.filter((x) => x.ativo)}
          inicial={vendendo === "nova" ? null : vendendo}
          alunos={inicial.alunos}
          aoFechar={() => setVendendo(null)}
          aoSalvar={(x) => {
            setP(x);
            setVendendo(null);
            setAba("vendas");
          }}
        />
      )}
    </div>
  );
}

function ModalProduto({
  produto,
  aoFechar,
  aoSalvar,
}: {
  produto: ProdutoJson | null;
  aoFechar: () => void;
  aoSalvar: (p: PainelLoja) => void;
}) {
  const [d, setD] = useState<DadosProduto>({
    nome: produto?.nome ?? "",
    categoria: produto?.categoria ?? "kimono",
    descricao: produto?.descricao ?? "",
    preco: produto?.preco ?? 0,
    custo: produto?.custo ?? 0,
    foto: produto?.foto ?? "",
    participaIndicacoes: produto?.participaIndicacoes ?? false,
    ativo: produto?.ativo ?? true,
    tamanhos: produto?.tamanhos.map((t) => ({ id: t.id, tamanho: t.tamanho, estoqueMinimo: t.estoqueMinimo })) ?? [
      { id: null, tamanho: "P", estoqueMinimo: 1 },
      { id: null, tamanho: "M", estoqueMinimo: 1 },
      { id: null, tamanho: "G", estoqueMinimo: 1 },
    ],
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = <K extends keyof DadosProduto>(k: K, v: DadosProduto[K]) => setD((x) => ({ ...x, [k]: v }));
  const gradeKimono = ["A0", "A1", "A2", "A3", "A4", "M0", "M1", "M2", "M3"];

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(await apiLutas.salvarProduto(produto?.id ?? null, d));
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={produto ? "Editar produto" : "Novo produto"} aoFechar={aoFechar} largura="max-w-xl">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
          <Campo rotulo="Nome">
            <input className={classeInput} value={d.nome} onChange={(e) => mudar("nome", e.target.value)} autoFocus />
          </Campo>
          <Campo rotulo="Categoria">
            <select className={classeInput} value={d.categoria} onChange={(e) => mudar("categoria", e.target.value as CategoriaProduto)}>
              {(Object.keys(rotuloCategoriaProduto) as CategoriaProduto[]).map((c) => (
                <option key={c} value={c}>
                  {rotuloCategoriaProduto[c]}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Preço de venda (R$)">
            <input type="number" min={0} step="0.01" className={classeInput} value={d.preco} onChange={(e) => mudar("preco", Number(e.target.value))} />
          </Campo>
          <Campo rotulo="Custo (R$, para o lucro)">
            <input type="number" min={0} step="0.01" className={classeInput} value={d.custo} onChange={(e) => mudar("custo", Number(e.target.value))} />
          </Campo>
        </div>
        <Campo rotulo="Descrição">
          <input className={classeInput} value={d.descricao} onChange={(e) => mudar("descricao", e.target.value)} />
        </Campo>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-300">Foto</span>
          <CampoArquivo tipo="imagem" url={d.foto || null} aoMudar={(url) => mudar("foto", url ?? "")} />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-300">Tamanhos e estoque mínimo (avisa quando chegar nele)</span>
            {d.categoria === "kimono" && (
              <button
                type="button"
                className="text-xs text-red-400 hover:text-red-300"
                onClick={() =>
                  mudar(
                    "tamanhos",
                    gradeKimono.map((t) => d.tamanhos.find((x) => x.tamanho === t) ?? { id: null, tamanho: t, estoqueMinimo: 2 }),
                  )
                }
              >
                Usar grade de kimono (A0–M3)
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {d.tamanhos.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`${classeInput} !w-28`}
                  value={t.tamanho}
                  placeholder="Tamanho"
                  onChange={(e) => mudar("tamanhos", d.tamanhos.map((x, j) => (j === i ? { ...x, tamanho: e.target.value } : x)))}
                />
                <input
                  type="number"
                  min={0}
                  className={`${classeInput} !w-24`}
                  value={t.estoqueMinimo}
                  title="Estoque mínimo"
                  onChange={(e) =>
                    mudar("tamanhos", d.tamanhos.map((x, j) => (j === i ? { ...x, estoqueMinimo: Number(e.target.value) } : x)))
                  }
                />
                <span className="text-xs text-ac-muted">mínimo</span>
                <button
                  type="button"
                  aria-label="Tirar tamanho"
                  onClick={() => mudar("tamanhos", d.tamanhos.filter((_, j) => j !== i))}
                  className="ml-auto rounded p-1.5 text-ac-muted hover:text-red-300"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => mudar("tamanhos", [...d.tamanhos, { id: null, tamanho: "", estoqueMinimo: 1 }])}
              className="w-fit text-xs font-semibold text-red-400 hover:text-red-300"
            >
              + tamanho
            </button>
          </div>
          {!produto && <p className="mt-1 text-[11px] text-ac-muted">O estoque começa zerado: depois use "Entrada de estoque".</p>}
        </div>
        <Interruptor
          ligado={d.participaIndicacoes}
          aoMudar={(v) => mudar("participaIndicacoes", v)}
          titulo="Venda gera comissão de indicação"
          descricao="Quem indicou o aluno ganha comissão sobre esta compra."
        />
        {produto && <Interruptor ligado={d.ativo} aoMudar={(v) => mudar("ativo", v)} titulo="À venda" />}
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            Salvar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

function ModalEstoque({
  produto,
  aoFechar,
  aoSalvar,
}: {
  produto: ProdutoJson;
  aoFechar: () => void;
  aoSalvar: (p: PainelLoja) => void;
}) {
  const [qtd, setQtd] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState<"entrada" | "ajuste">("entrada");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      let ultimo: PainelLoja | null = null;
      for (const t of produto.tamanhos) {
        const n = Number(qtd[t.id] || 0);
        if (!n) continue;
        ultimo = await apiLutas.estoque(produto.id, {
          tamanhoId: t.id,
          quantidade: n,
          motivo,
          observacao: motivo === "entrada" ? "Entrada" : "Ajuste de contagem",
        });
      }
      if (ultimo) aoSalvar(ultimo);
      else aoFechar();
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Estoque" subtitulo={produto.nome} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {(["entrada", "ajuste"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${motivo === m ? "border-red-500/70 bg-red-500/10 text-white" : "border-ac-line text-slate-300"}`}
            >
              {m === "entrada" ? "Chegou mercadoria" : "Ajuste (+ ou −)"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {produto.tamanhos.map((t) => (
            <Campo key={t.id} rotulo={`${t.tamanho} (tem ${t.estoque})`}>
              <input
                type="number"
                min={motivo === "entrada" ? 0 : undefined}
                className={classeInput}
                value={qtd[t.id] ?? ""}
                placeholder="0"
                onChange={(e) => setQtd({ ...qtd, [t.id]: e.target.value })}
              />
            </Campo>
          ))}
        </div>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            Salvar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

type Item = { produtoId: string; tamanhoId: string; quantidade: number };

function ModalVenda({
  produtos,
  inicial,
  alunos,
  aoFechar,
  aoSalvar,
}: {
  produtos: ProdutoJson[];
  inicial: ProdutoJson | null;
  alunos: AlunoResumo[];
  aoFechar: () => void;
  aoSalvar: (p: PainelLoja) => void;
}) {
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const primeiroTamanho = (p: ProdutoJson) => p.tamanhos.find((t) => t.estoque > 0)?.id ?? p.tamanhos[0]?.id ?? "";
  const [itens, setItens] = useState<Item[]>(
    inicial ? [{ produtoId: inicial.id, tamanhoId: primeiroTamanho(inicial), quantidade: 1 }] : [],
  );
  const [desconto, setDesconto] = useState(0);
  const [pago, setPago] = useState(true);
  const [forma, setForma] = useState("pix");
  const [vencimento, setVencimento] = useState(hojeIso());
  const [entregue, setEntregue] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const total = itens.reduce((s, i) => s + (produtos.find((p) => p.id === i.produtoId)?.preco ?? 0) * i.quantidade, 0);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!alunoId) return setErro("Escolha o aluno");
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(
        await apiLutas.vender({
          alunoId,
          itens,
          desconto,
          pago,
          formaPagamento: pago ? forma : null,
          vencimento: pago ? null : vencimento,
          entregue,
          observacao: "",
        }),
      );
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Nova venda" aoFechar={aoFechar} largura="max-w-xl">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <SeletorAluno alunos={alunos} valor={alunoId} aoMudar={setAlunoId} autoFocus />
        <div className="flex flex-col gap-2">
          {itens.map((it, i) => {
            const p = produtos.find((x) => x.id === it.produtoId);
            return (
              <div key={i} className="grid grid-cols-[1fr_96px_70px_auto] items-center gap-2">
                <select
                  className={classeInput}
                  value={it.produtoId}
                  onChange={(e) => {
                    const np = produtos.find((x) => x.id === e.target.value);
                    setItens(itens.map((x, j) => (j === i ? { ...x, produtoId: e.target.value, tamanhoId: np ? primeiroTamanho(np) : "" } : x)));
                  }}
                >
                  {produtos.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nome} · {moeda(x.preco)}
                    </option>
                  ))}
                </select>
                <select
                  className={classeInput}
                  value={it.tamanhoId}
                  onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, tamanhoId: e.target.value } : x)))}
                >
                  {p?.tamanhos.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.estoque <= 0}>
                      {t.tamanho} ({t.estoque})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className={classeInput}
                  value={it.quantidade}
                  onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, quantidade: Number(e.target.value) } : x)))}
                />
                <button type="button" aria-label="Tirar item" onClick={() => setItens(itens.filter((_, j) => j !== i))} className="rounded p-1.5 text-ac-muted hover:text-red-300">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => produtos[0] && setItens([...itens, { produtoId: produtos[0].id, tamanhoId: primeiroTamanho(produtos[0]), quantidade: 1 }])}
            className="w-fit text-xs font-semibold text-red-400 hover:text-red-300"
          >
            + produto
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Desconto (R$)">
            <input type="number" min={0} step="0.01" className={classeInput} value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
          </Campo>
          <div className="flex flex-col justify-end">
            <div className="text-xs text-ac-muted">Total</div>
            <div className="font-poppins text-2xl font-bold text-white">{moeda(Math.max(0, total - desconto))}</div>
          </div>
        </div>
        <Interruptor ligado={pago} aoMudar={setPago} titulo="Recebi agora" descricao="Desligado: fica a receber no Financeiro." />
        {pago ? (
          <Campo rotulo="Forma de pagamento">
            <select className={classeInput} value={forma} onChange={(e) => setForma(e.target.value)}>
              {formasPagamento.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.rotulo}
                </option>
              ))}
            </select>
          </Campo>
        ) : (
          <Campo rotulo="Vencimento">
            <input type="date" className={classeInput} value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
          </Campo>
        )}
        <Interruptor ligado={entregue} aoMudar={setEntregue} titulo="Produto já entregue ao aluno" descricao="Desligado para encomendas." />
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando} disabled={itens.length === 0}>
            Registrar venda
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
