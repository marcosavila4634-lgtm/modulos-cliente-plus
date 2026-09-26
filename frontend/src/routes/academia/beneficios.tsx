import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Cake,
  CalendarCheck,
  Check,
  Gift,
  Handshake,
  PackageCheck,
  Pencil,
  Plus,
  Smartphone,
  Tag,
  Trophy,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, CardNumero, Vazio } from "../../components/academia/ui";
import { fmt } from "../../lib/academia-alunos";
import {
  apiFinanceiro,
  regraBeneficio,
  rotuloTipoBeneficio,
  type Beneficio,
  type DadosBeneficio,
  type DetalheBeneficio,
  type TipoBeneficio,
} from "../../lib/academia-financeiro";

// Benefícios para os alunos: quem tem direito, resgates e entregas.
// O aluno vê e resgata pela área do cliente do Cliente Plus.
export const Route = createFileRoute("/academia/beneficios")({
  loader: apiFinanceiro.beneficios,
  component: PaginaBeneficios,
});

const iconeTipo: Record<TipoBeneficio, { icone: LucideIcon; cor: string }> = {
  indicacao: { icone: UsersRound, cor: "bg-fuchsia-500/15 text-fuchsia-300" },
  fidelidade: { icone: Trophy, cor: "bg-amber-500/15 text-amber-300" },
  frequencia: { icone: CalendarCheck, cor: "bg-emerald-500/15 text-emerald-300" },
  aniversario: { icone: Cake, cor: "bg-pink-500/15 text-pink-300" },
  parceiro: { icone: Handshake, cor: "bg-sky-500/15 text-sky-300" },
};

function PaginaBeneficios() {
  const beneficios = Route.useLoaderData();
  const router = useRouter();
  const [editando, setEditando] = useState<Beneficio | "novo" | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const ativos = beneficios.filter((b) => b.ativo);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Benefícios"
        descricao="Vantagens para quem indica, treina bastante ou está há tempo na academia. O aluno vê e resgata pelo app."
      >
        <Botao variante="primario" onClick={() => setEditando("novo")}>
          <Plus className="size-4" />
          Novo benefício
        </Botao>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CardNumero icone={Gift} cor="bg-violet-500/20 text-violet-300" rotulo="Benefícios ativos">
          <span className="font-poppins text-[26px] font-bold text-white">{ativos.length}</span>
        </CardNumero>
        <CardNumero icone={Tag} cor="bg-sky-500/15 text-sky-300" rotulo="Resgates no período">
          <span className="font-poppins text-[26px] font-bold text-white">
            {beneficios.reduce((s, b) => s + b.resgatados, 0)}
          </span>
        </CardNumero>
        <CardNumero icone={PackageCheck} cor="bg-amber-500/15 text-amber-300" rotulo="Para entregar" className="col-span-2 xl:col-span-1">
          <span className="font-poppins text-[26px] font-bold text-white">{beneficios.reduce((s, b) => s + b.aEntregar, 0)}</span>
          <span className="text-xs text-ac-muted">resgatados, falta entregar ao aluno</span>
        </CardNumero>
      </div>

      {beneficios.length === 0 ? (
        <Card>
          <Vazio icone={Gift}>Nenhum benefício cadastrado.</Vazio>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {beneficios.map((b) => {
            const { icone: Icone, cor } = iconeTipo[b.tipo];
            const vencido = !!b.validade && b.validade < new Date().toISOString().slice(0, 10);
            return (
              <Card key={b.id} className={`flex flex-col ${b.ativo && !vencido ? "" : "opacity-55"}`}>
                <div className="flex items-start gap-3">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${cor}`}>
                    <Icone className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold tracking-wide text-ac-muted uppercase">
                      {rotuloTipoBeneficio[b.tipo]}
                    </div>
                    <div className="font-semibold text-white">{b.titulo}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditando(b)}
                    aria-label={`Editar ${b.titulo}`}
                    className="rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-white"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
                <div className="mt-3 rounded-xl bg-gradient-to-r from-violet-600/20 to-pink-500/15 px-3 py-2 font-poppins text-[15px] font-semibold text-white">
                  {b.recompensa}
                </div>
                <div className="mt-2 text-[12.5px] text-slate-300">{regraBeneficio(b)}</div>
                {b.codigo && (
                  <div className="mt-1 text-[12.5px] text-slate-300">
                    Cupom <code className="rounded bg-ac-card-2 px-1.5 py-0.5 text-violet-200">{b.codigo}</code>
                  </div>
                )}
                {b.validade && (
                  <div className={`mt-1 text-xs ${vencido ? "text-red-300" : "text-ac-muted"}`}>
                    {vencido ? "Venceu em" : "Válido até"} {fmt.data(b.validade)}
                  </div>
                )}
                {!b.ativo && <div className="mt-1 text-xs text-ac-muted">Desativado</div>}
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-ac-line pt-3 text-xs">
                  <span className="text-slate-300">
                    <b className="text-white">{b.elegiveis}</b> com direito · <b className="text-white">{b.resgatados}</b> resgates
                    {b.aEntregar > 0 && <span className="text-amber-300"> · {b.aEntregar} a entregar</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAberto(b.id)}
                    className="shrink-0 rounded-lg bg-violet-600/80 px-3 py-1.5 font-semibold text-white hover:bg-violet-500"
                  >
                    Ver alunos
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editando && (
        <ModalBeneficio
          beneficio={editando === "novo" ? undefined : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => {
            await router.invalidate();
            setEditando(null);
          }}
        />
      )}
      {aberto && (
        <ModalAlunosBeneficio
          id={aberto}
          aoFechar={async () => {
            setAberto(null);
            await router.invalidate();
          }}
        />
      )}
    </div>
  );
}

// ---------- Quem tem direito ----------

function ModalAlunosBeneficio({ id, aoFechar }: { id: string; aoFechar: () => void }) {
  const [detalhe, setDetalhe] = useState<DetalheBeneficio | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "disponivel" | "resgatado" | "entregue">("todos");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    apiFinanceiro.beneficio(id).then(setDetalhe).catch((e) => setErro(mensagemDe(e)));
  }, [id]);

  async function acao(chave: string, fazer: () => Promise<DetalheBeneficio>) {
    setOcupado(chave);
    setErro(null);
    try {
      setDetalhe(await fazer());
    } catch (e) {
      setErro(mensagemDe(e));
    }
    setOcupado(null);
  }

  const b = detalhe?.beneficio;
  const lista = detalhe?.alunos.filter((a) => filtro === "todos" || a.situacao === filtro) ?? [];
  const conta = (s: string) => detalhe?.alunos.filter((a) => a.situacao === s).length ?? 0;

  return (
    <Modal titulo={b?.titulo ?? "Carregando..."} subtitulo={b ? `${b.recompensa} · ${regraBeneficio(b)}` : ""} aoFechar={aoFechar} largura="max-w-2xl">
      <div className="flex flex-col gap-4">
        {detalhe?.referencia && (
          <p className="text-xs text-ac-muted">
            Vale uma vez por {detalhe.referencia.length === 4 ? "ano" : "mês"} (período atual: {detalhe.referencia}).
          </p>
        )}
        <Abas
          abas={[
            { valor: "todos", rotulo: "Todos", quantidade: detalhe?.alunos.length ?? 0 },
            { valor: "disponivel", rotulo: "Podem resgatar", quantidade: conta("disponivel") },
            { valor: "resgatado", rotulo: "A entregar", quantidade: conta("resgatado") },
            { valor: "entregue", rotulo: "Entregues", quantidade: conta("entregue") },
          ]}
          valor={filtro}
          aoMudar={setFiltro}
        />
        <MensagemErro texto={erro} />
        <ul className="max-h-[420px] divide-y divide-ac-line/70 overflow-auto rounded-xl border border-ac-line">
          {lista.map((a) => (
            <li key={a.alunoId} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <AvatarAluno nome={a.nome} />
              <div className="min-w-0 flex-1">
                <Link
                  to="/academia/alunos/$id"
                  params={{ id: a.alunoId }}
                  className="truncate text-sm font-medium text-slate-100 hover:text-violet-300"
                >
                  {a.nome}
                </Link>
                <div className="flex items-center gap-1.5 text-[11.5px] text-ac-muted">
                  {a.motivo}
                  {a.origem === "area_cliente" && (
                    <span className="inline-flex items-center gap-0.5 text-fuchsia-300">
                      <Smartphone className="size-3" /> resgatou pelo app
                    </span>
                  )}
                </div>
              </div>
              {a.situacao === "disponivel" && (
                <Botao
                  className="!h-8 !px-3 !text-xs"
                  carregando={ocupado === a.alunoId}
                  disabled={ocupado !== null}
                  onClick={() => acao(a.alunoId, () => apiFinanceiro.resgatar(id, a.alunoId))}
                >
                  Registrar resgate
                </Botao>
              )}
              {a.situacao === "resgatado" && a.resgateId && (
                <Botao
                  variante="sucesso"
                  className="!h-8 !px-3 !text-xs"
                  carregando={ocupado === a.alunoId}
                  disabled={ocupado !== null}
                  onClick={() => acao(a.alunoId, () => apiFinanceiro.entregar(id, a.resgateId!))}
                >
                  <PackageCheck className="size-3.5" />
                  Marcar entregue
                </Botao>
              )}
              {a.situacao === "entregue" && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  <Check className="size-3.5" /> Entregue
                </span>
              )}
            </li>
          ))}
          {detalhe && lista.length === 0 && <li className="px-3 py-8 text-center text-sm text-ac-muted">Ninguém por aqui.</li>}
        </ul>
      </div>
    </Modal>
  );
}

// ---------- Cadastro ----------

const explicacao: Record<TipoBeneficio, string> = {
  indicacao: "Quem tiver a quantidade de indicados com matrícula ativa. Vale uma vez.",
  fidelidade: "Quem estiver na academia há pelo menos esse número de meses. Vale uma vez.",
  frequencia: "Quem fizer pelo menos esse número de check-ins no mês. Vale uma vez por mês.",
  aniversario: "Todo aluno ativo no mês do aniversário. Vale uma vez por ano.",
  parceiro: "Todo aluno ativo vê o cupom de desconto da loja parceira.",
};

function ModalBeneficio({ beneficio, aoSalvar, aoFechar }: { beneficio?: Beneficio; aoSalvar: () => void; aoFechar: () => void }) {
  const [d, setD] = useState<DadosBeneficio>({
    titulo: beneficio?.titulo ?? "",
    descricao: beneficio?.descricao ?? "",
    tipo: beneficio?.tipo ?? "indicacao",
    regra: beneficio?.regra ?? 3,
    recompensa: beneficio?.recompensa ?? "",
    parceiro: beneficio?.parceiro ?? "",
    codigo: beneficio?.codigo ?? "",
    validade: beneficio?.validade ?? null,
    ativo: beneficio?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const precisaRegra = d.tipo === "indicacao" || d.tipo === "fidelidade" || d.tipo === "frequencia";
  const rotuloRegra = d.tipo === "indicacao" ? "Indicados ativos" : d.tipo === "fidelidade" ? "Meses de academia" : "Check-ins no mês";

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      if (beneficio) await apiFinanceiro.atualizarBeneficio(beneficio.id, d);
      else await apiFinanceiro.cadastrarBeneficio(d);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={beneficio ? "Editar benefício" : "Novo benefício"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Campo rotulo="Quem tem direito *">
          <select
            className={classeInput}
            value={d.tipo}
            onChange={(e) => setD({ ...d, tipo: e.target.value as TipoBeneficio })}
          >
            {(Object.keys(rotuloTipoBeneficio) as TipoBeneficio[]).map((t) => (
              <option key={t} value={t}>
                {rotuloTipoBeneficio[t]}
              </option>
            ))}
          </select>
          <span className="text-xs text-ac-muted">{explicacao[d.tipo]}</span>
        </Campo>
        {precisaRegra && (
          <Campo rotulo={`${rotuloRegra} *`} className="max-w-48">
            <input
              type="number"
              min={1}
              className={classeInput}
              value={d.regra ?? ""}
              onChange={(e) => setD({ ...d, regra: Number(e.target.value) })}
            />
          </Campo>
        )}
        <Campo rotulo="Título *">
          <input
            autoFocus
            className={classeInput}
            value={d.titulo}
            onChange={(e) => setD({ ...d, titulo: e.target.value })}
            placeholder="Ex.: Trio de amigos"
          />
        </Campo>
        <Campo rotulo="O que o aluno ganha *">
          <input
            className={classeInput}
            value={d.recompensa}
            onChange={(e) => setD({ ...d, recompensa: e.target.value })}
            placeholder="Ex.: 1 mensalidade grátis"
          />
        </Campo>
        <Campo rotulo="Descrição">
          <input className={classeInput} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} />
        </Campo>
        {d.tipo === "parceiro" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Loja parceira *">
              <input className={classeInput} value={d.parceiro} onChange={(e) => setD({ ...d, parceiro: e.target.value })} />
            </Campo>
            <Campo rotulo="Cupom">
              <input
                className={classeInput}
                value={d.codigo}
                onChange={(e) => setD({ ...d, codigo: e.target.value })}
                placeholder="Ex.: PRIME15"
              />
            </Campo>
          </div>
        )}
        <Campo rotulo="Válido até (vazio = sem prazo)" className="max-w-56">
          <input
            type="date"
            className={classeInput}
            value={d.validade ?? ""}
            onChange={(e) => setD({ ...d, validade: e.target.value || null })}
          />
        </Campo>
        {beneficio && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={d.ativo ?? true}
              onChange={(e) => setD({ ...d, ativo: e.target.checked })}
              className="accent-fuchsia-500"
            />
            Ativo (desmarque para esconder dos alunos)
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
