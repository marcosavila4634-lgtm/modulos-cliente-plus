import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CircleCheck, Hammer, Pencil, Plus, TriangleAlert, Wrench } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Botao, Campo, classeInput, Interruptor, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, CardNumero, Vazio } from "../../components/academia/ui";
import {
  apiLutas,
  data,
  formasPagamento,
  hojeIso,
  moeda,
  rotuloCategoriaEquipamento,
  rotuloEstado,
  type CategoriaEquipamento,
  type DadosEquipamento,
  type EquipamentoJson,
  type EstadoEquipamento,
} from "../../lib/artes-marciais";

// Equipamentos (Artes Marciais): tatames, sacos, luvas coletivas... com a
// próxima revisão e o histórico de manutenções (com custo = despesa).
export const Route = createFileRoute("/academia/equipamentos")({
  loader: () => apiLutas.equipamentos(),
  component: PaginaEquipamentos,
});

const corEstado: Record<EstadoEquipamento, string> = {
  bom: "bg-emerald-500/15 text-emerald-300",
  atencao: "bg-amber-500/15 text-amber-300",
  manutencao: "bg-red-500/15 text-red-300",
  inativo: "bg-white/5 text-ac-muted",
};

type Filtro = "todos" | "atencao";

function PaginaEquipamentos() {
  const [lista, setLista] = useState<EquipamentoJson[]>(Route.useLoaderData());
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [editando, setEditando] = useState<EquipamentoJson | "novo" | null>(null);
  const [manutencao, setManutencao] = useState<EquipamentoJson | null>(null);
  const precisa = (e: EquipamentoJson) => e.estado === "manutencao" || e.estado === "atencao" || e.manutencaoVencida;
  const visiveis = lista.filter((e) => filtro === "todos" || precisa(e));
  const locais = [...new Set(visiveis.map((e) => e.local || "Sem local"))];
  const investido = lista.reduce((s, e) => s + (e.valor ?? 0), 0);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Equipamentos"
        descricao="Tudo o que a academia usa no treino. Marque de quantos em quantos dias precisa de revisão e o painel avisa quando vencer."
      >
        <Botao variante="primario" onClick={() => setEditando("novo")}>
          <Plus className="size-4" />
          Novo equipamento
        </Botao>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <CardNumero icone={Wrench} cor="bg-sky-500/15 text-sky-300" rotulo="Itens cadastrados">
          <span className="font-poppins text-[26px] font-bold text-white">{lista.length}</span>
        </CardNumero>
        <CardNumero icone={TriangleAlert} cor="bg-red-500/15 text-red-300" rotulo="Precisam de atenção">
          <span className="font-poppins text-[26px] font-bold text-white">{lista.filter(precisa).length}</span>
        </CardNumero>
        <CardNumero icone={CalendarClock} cor="bg-amber-500/15 text-amber-300" rotulo="Revisão vencida">
          <span className="font-poppins text-[26px] font-bold text-white">{lista.filter((e) => e.manutencaoVencida).length}</span>
        </CardNumero>
        <CardNumero icone={CircleCheck} cor="bg-emerald-500/15 text-emerald-300" rotulo="Valor investido">
          <span className="font-poppins text-[22px] font-bold text-white">{moeda(investido)}</span>
        </CardNumero>
      </div>

      <Abas
        abas={[
          { valor: "todos" as Filtro, rotulo: "Todos", quantidade: lista.length },
          { valor: "atencao" as Filtro, rotulo: "Precisam de atenção", quantidade: lista.filter(precisa).length },
        ]}
        valor={filtro}
        aoMudar={setFiltro}
      />

      {visiveis.length === 0 ? (
        <Card>
          <Vazio icone={Wrench}>{filtro === "todos" ? "Nenhum equipamento cadastrado." : "Tudo em ordem."}</Vazio>
        </Card>
      ) : (
        locais.map((local) => (
          <Card key={local} className="!p-0">
            <div className="border-b border-ac-line px-4 py-3 font-poppins text-[15px] font-semibold text-white">{local}</div>
            <ul className="divide-y divide-ac-line/70">
              {visiveis
                .filter((e) => (e.local || "Sem local") === local)
                .map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                    <div className="min-w-[200px] flex-1">
                      <div className="font-medium text-white">
                        {e.quantidade > 1 && <span className="text-ac-muted">{e.quantidade}× </span>}
                        {e.nome}
                      </div>
                      <div className="text-xs text-ac-muted">
                        {rotuloCategoriaEquipamento[e.categoria]}
                        {e.observacao && ` · ${e.observacao}`}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${corEstado[e.estado]}`}>
                      {rotuloEstado[e.estado]}
                    </span>
                    <div className="w-44 text-xs">
                      {e.proximaManutencao ? (
                        <span className={e.manutencaoVencida ? "font-semibold text-red-300" : "text-slate-300"}>
                          {e.manutencaoVencida ? "Revisão vencida em " : "Próxima revisão "}
                          {data(e.proximaManutencao)}
                        </span>
                      ) : (
                        <span className="text-ac-muted">Sem revisão programada</span>
                      )}
                      {e.ultimaManutencao && <span className="block text-ac-muted">Última: {data(e.ultimaManutencao)}</span>}
                    </div>
                    <div className="flex gap-1.5">
                      <Botao className="!h-8 !px-3 text-xs" onClick={() => setManutencao(e)}>
                        <Hammer className="size-3.5" />
                        Manutenção
                      </Botao>
                      <button type="button" aria-label={`Editar ${e.nome}`} onClick={() => setEditando(e)} className="rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-white">
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </Card>
        ))
      )}

      {editando && (
        <ModalEquipamento
          equipamento={editando === "novo" ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={(l) => {
            setLista(l);
            setEditando(null);
          }}
        />
      )}
      {manutencao && (
        <ModalManutencao
          equipamento={manutencao}
          aoFechar={() => setManutencao(null)}
          aoSalvar={(l) => {
            setLista(l);
            setManutencao(null);
          }}
        />
      )}
    </div>
  );
}

function ModalEquipamento({
  equipamento: e,
  aoFechar,
  aoSalvar,
}: {
  equipamento: EquipamentoJson | null;
  aoFechar: () => void;
  aoSalvar: (l: EquipamentoJson[]) => void;
}) {
  const [d, setD] = useState<DadosEquipamento>({
    nome: e?.nome ?? "",
    categoria: e?.categoria ?? "tatame",
    quantidade: e?.quantidade ?? 1,
    local: e?.local ?? "",
    estado: e?.estado ?? "bom",
    intervaloManutencaoDias: e?.intervaloManutencaoDias ?? null,
    ultimaManutencao: e?.ultimaManutencao ?? null,
    aquisicao: e?.aquisicao ?? null,
    valor: e?.valor ?? null,
    observacao: e?.observacao ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = <K extends keyof DadosEquipamento>(k: K, v: DadosEquipamento[K]) => setD((x) => ({ ...x, [k]: v }));

  async function salvar(ev: FormEvent) {
    ev.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(await apiLutas.salvarEquipamento(e?.id ?? null, d));
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={e ? "Editar equipamento" : "Novo equipamento"} aoFechar={aoFechar} largura="max-w-xl">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
          <Campo rotulo="Nome">
            <input className={classeInput} value={d.nome} onChange={(x) => mudar("nome", x.target.value)} autoFocus />
          </Campo>
          <Campo rotulo="Quantidade">
            <input type="number" min={0} className={classeInput} value={d.quantidade} onChange={(x) => mudar("quantidade", Number(x.target.value))} />
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Tipo">
            <select className={classeInput} value={d.categoria} onChange={(x) => mudar("categoria", x.target.value as CategoriaEquipamento)}>
              {(Object.keys(rotuloCategoriaEquipamento) as CategoriaEquipamento[]).map((c) => (
                <option key={c} value={c}>
                  {rotuloCategoriaEquipamento[c]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Onde fica">
            <input className={classeInput} value={d.local} placeholder="Tatame 1" onChange={(x) => mudar("local", x.target.value)} />
          </Campo>
          <Campo rotulo="Estado">
            <select className={classeInput} value={d.estado} onChange={(x) => mudar("estado", x.target.value as EstadoEquipamento)}>
              {(Object.keys(rotuloEstado) as EstadoEquipamento[]).map((s) => (
                <option key={s} value={s}>
                  {rotuloEstado[s]}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Revisão a cada (dias, vazio = não controla)">
            <input
              type="number"
              min={1}
              className={classeInput}
              value={d.intervaloManutencaoDias ?? ""}
              onChange={(x) => mudar("intervaloManutencaoDias", x.target.value ? Number(x.target.value) : null)}
            />
          </Campo>
          <Campo rotulo="Última revisão">
            <input type="date" className={classeInput} value={d.ultimaManutencao ?? ""} onChange={(x) => mudar("ultimaManutencao", x.target.value || null)} />
          </Campo>
          <Campo rotulo="Comprado em">
            <input type="date" className={classeInput} value={d.aquisicao ?? ""} onChange={(x) => mudar("aquisicao", x.target.value || null)} />
          </Campo>
          <Campo rotulo="Valor pago (R$)">
            <input
              type="number"
              min={0}
              step="0.01"
              className={classeInput}
              value={d.valor ?? ""}
              onChange={(x) => mudar("valor", x.target.value ? Number(x.target.value) : null)}
            />
          </Campo>
        </div>
        <Campo rotulo="Observação">
          <input className={classeInput} value={d.observacao} onChange={(x) => mudar("observacao", x.target.value)} />
        </Campo>
        {e && e.manutencoes.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-300">Manutenções</div>
            <ul className="mt-1 flex flex-col gap-1 text-xs text-slate-300">
              {e.manutencoes.map((m) => (
                <li key={m.id} className="flex justify-between gap-3 rounded-lg bg-ac-bg/40 px-3 py-1.5">
                  <span>
                    {data(m.data)} · {m.descricao}
                  </span>
                  {m.custo != null && <span>{moeda(m.custo)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <MensagemErro texto={erro} />
        <div className="flex flex-wrap justify-between gap-2">
          {e ? (
            <Botao
              variante="perigo"
              onClick={async () => {
                if (!confirm(`Excluir ${e.nome}?`)) return;
                try {
                  aoSalvar(await apiLutas.excluirEquipamento(e.id));
                } catch (x) {
                  setErro(mensagemDe(x));
                }
              }}
            >
              Excluir
            </Botao>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Botao onClick={aoFechar}>Cancelar</Botao>
            <Botao type="submit" variante="primario" carregando={salvando}>
              Salvar
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function ModalManutencao({
  equipamento: e,
  aoFechar,
  aoSalvar,
}: {
  equipamento: EquipamentoJson;
  aoFechar: () => void;
  aoSalvar: (l: EquipamentoJson[]) => void;
}) {
  const [dia, setDia] = useState(hojeIso());
  const [descricao, setDescricao] = useState("");
  const [custo, setCusto] = useState("");
  const [estado, setEstado] = useState<EstadoEquipamento>("bom");
  const [despesa, setDespesa] = useState(true);
  const [forma, setForma] = useState("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(ev: FormEvent) {
    ev.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(
        await apiLutas.manutencao(e.id, {
          data: dia,
          descricao,
          custo: custo ? Number(custo.replace(",", ".")) : null,
          estado,
          lancarDespesa: despesa,
          formaPagamento: forma,
        }),
      );
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Registrar manutenção" subtitulo={e.nome} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Data">
            <input type="date" className={classeInput} value={dia} max={hojeIso()} onChange={(x) => setDia(x.target.value)} />
          </Campo>
          <Campo rotulo="Custo (R$, opcional)">
            <input className={classeInput} inputMode="decimal" value={custo} onChange={(x) => setCusto(x.target.value)} />
          </Campo>
        </div>
        <Campo rotulo="O que foi feito">
          <input className={classeInput} value={descricao} onChange={(x) => setDescricao(x.target.value)} autoFocus placeholder="Ex.: troca de 4 placas" />
        </Campo>
        <Campo rotulo="Como ficou">
          <select className={classeInput} value={estado} onChange={(x) => setEstado(x.target.value as EstadoEquipamento)}>
            {(Object.keys(rotuloEstado) as EstadoEquipamento[]).map((s) => (
              <option key={s} value={s}>
                {rotuloEstado[s]}
              </option>
            ))}
          </select>
        </Campo>
        {custo && (
          <>
            <Interruptor ligado={despesa} aoMudar={setDespesa} titulo="Lançar o custo nas despesas (já pago)" descricao="Entra no Financeiro > Despesas, categoria Manutenção." />
            {despesa && (
              <Campo rotulo="Forma de pagamento">
                <select className={classeInput} value={forma} onChange={(x) => setForma(x.target.value)}>
                  {formasPagamento.map((f) => (
                    <option key={f.valor} value={f.valor}>
                      {f.rotulo}
                    </option>
                  ))}
                  <option value="transferencia">Transferência</option>
                </select>
              </Campo>
            )}
          </>
        )}
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
