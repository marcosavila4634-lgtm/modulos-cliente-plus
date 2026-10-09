import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, IdCard, MapPin, Medal, Pencil, Plus, Trash2, Trophy, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SeletorAluno } from "../../components/academia/SeletorAluno";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, CardNumero, Vazio } from "../../components/academia/ui";
import { ModalEvento } from "../../components/artes-marciais/ModalEvento";
import { apiAlunos } from "../../lib/academia-alunos";
import {
  apiLutas,
  data,
  diasAte,
  hojeIso,
  moeda,
  rotuloFase,
  rotuloTipoEvento,
  type EventoResumo,
  type FaseEvento,
  type FiliacaoJson,
} from "../../lib/artes-marciais";

type Aba = "proximos" | "realizados" | "ranking" | "filiacoes";
const abasValidas: Aba[] = ["proximos", "realizados", "ranking", "filiacoes"];

// Eventos e campeonatos (Artes Marciais): inscrições com pagamento,
// resultados e medalhas, quadro de medalhas do ano e filiações às federações.
export const Route = createFileRoute("/academia/eventos")({
  validateSearch: (s: Record<string, unknown>): { aba?: Aba } => ({
    aba: abasValidas.includes(s.aba as Aba) ? (s.aba as Aba) : undefined,
  }),
  loader: async () => {
    const [eventos, modalidades, ranking, filiacoes, alunos] = await Promise.all([
      apiLutas.eventos(),
      apiLutas.modalidades(),
      apiLutas.ranking(new Date().getFullYear()),
      apiLutas.filiacoes(),
      apiAlunos.listar(),
    ]);
    return { eventos, modalidades, ranking, filiacoes, alunos: alunos.alunos };
  },
  component: PaginaEventos,
});

const corFase: Record<FaseEvento, string> = {
  inscricoes_abertas: "bg-emerald-500/15 text-emerald-300",
  inscricoes_encerradas: "bg-amber-500/15 text-amber-300",
  realizado: "bg-white/5 text-slate-300",
  cancelado: "bg-white/5 text-ac-muted line-through",
};

function PaginaEventos() {
  const { eventos, modalidades, ranking, filiacoes, alunos } = Route.useLoaderData();
  const aba = Route.useSearch().aba ?? "proximos";
  const navigate = useNavigate({ from: Route.fullPath });
  const [novo, setNovo] = useState(false);
  const hoje = hojeIso();
  const proximos = eventos.filter((e) => e.data >= hoje && e.status === "ativo").sort((a, b) => a.data.localeCompare(b.data));
  const realizados = eventos.filter((e) => e.data < hoje || e.status === "cancelado");
  const abertos = proximos.filter((e) => e.fase === "inscricoes_abertas");

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Eventos e campeonatos"
        descricao="Campeonatos (seus ou de fora), seminários e aulões. Inscrição com pagamento, categoria, resultado e medalha no histórico do aluno."
      >
        <Botao variante="primario" onClick={() => setNovo(true)}>
          <Plus className="size-4" />
          Novo evento
        </Botao>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <CardNumero icone={CalendarDays} cor="bg-sky-500/15 text-sky-300" rotulo="Próximos eventos">
          <span className="font-poppins text-[26px] font-bold text-white">{proximos.length}</span>
        </CardNumero>
        <CardNumero icone={Users} cor="bg-emerald-500/15 text-emerald-300" rotulo="Com inscrições abertas">
          <span className="font-poppins text-[26px] font-bold text-white">{abertos.length}</span>
          <span className="text-xs text-ac-muted">{abertos.reduce((s, e) => s + e.inscritos, 0)} inscritos</span>
        </CardNumero>
        <CardNumero icone={Medal} cor="bg-amber-500/15 text-amber-300" rotulo={`Medalhas em ${new Date().getFullYear()}`}>
          <span className="font-poppins text-[26px] font-bold text-white">
            {ranking.total.ouro + ranking.total.prata + ranking.total.bronze}
          </span>
          <span className="text-xs text-ac-muted">
            🥇{ranking.total.ouro} 🥈{ranking.total.prata} 🥉{ranking.total.bronze}
          </span>
        </CardNumero>
        <CardNumero icone={IdCard} cor="bg-red-500/15 text-red-300" rotulo="Filiações vencendo">
          <span className="font-poppins text-[26px] font-bold text-white">
            {filiacoes.filter((f) => f.situacao !== "valida").length}
          </span>
          <span className="text-xs text-ac-muted">de {filiacoes.length}</span>
        </CardNumero>
      </div>

      <Abas
        abas={[
          { valor: "proximos" as Aba, rotulo: "Próximos", quantidade: proximos.length },
          { valor: "realizados" as Aba, rotulo: "Realizados", quantidade: realizados.length },
          { valor: "ranking" as Aba, rotulo: "Quadro de medalhas" },
          { valor: "filiacoes" as Aba, rotulo: "Filiações", quantidade: filiacoes.length },
        ]}
        valor={aba}
        aoMudar={(v) => navigate({ search: { aba: v } })}
      />

      {aba === "proximos" && <ListaEventos eventos={proximos} vazio="Nenhum evento marcado." />}
      {aba === "realizados" && <ListaEventos eventos={realizados} vazio="Nenhum evento realizado ainda." />}
      {aba === "ranking" && <QuadroMedalhas ranking={ranking.atletas} />}
      {aba === "filiacoes" && <Filiacoes inicial={filiacoes} alunos={alunos} />}

      {novo && (
        <ModalEvento
          modalidades={modalidades}
          aoFechar={() => setNovo(false)}
          aoSalvar={(id) => navigate({ to: "/academia/eventos/$id", params: { id } })}
        />
      )}
    </div>
  );
}

function ListaEventos({ eventos, vazio }: { eventos: EventoResumo[]; vazio: string }) {
  if (eventos.length === 0) {
    return (
      <Card>
        <Vazio icone={Trophy}>{vazio}</Vazio>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {eventos.map((e) => {
        const dias = diasAte(e.data);
        const medalhas = e.medalhas.ouro + e.medalhas.prata + e.medalhas.bronze;
        return (
          <Link key={e.id} to="/academia/eventos/$id" params={{ id: e.id }} className="block">
            <Card className="flex h-full flex-col transition hover:border-red-500/50">
              <div className="flex items-start gap-3">
                <div className="grid w-14 shrink-0 place-items-center rounded-xl border border-ac-line bg-ac-bg/50 py-1.5 text-center">
                  <span className="text-[10px] font-semibold text-red-400 uppercase">
                    {new Date(`${e.data}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                  </span>
                  <span className="font-poppins text-xl leading-none font-bold text-white">{e.data.slice(8, 10)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold tracking-wide text-ac-muted uppercase">
                    {rotuloTipoEvento[e.tipo]}
                    {e.modalidade && ` · ${e.modalidade.nome}`}
                  </div>
                  <div className="font-semibold text-white">{e.nome}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
                <MapPin className="size-3.5 shrink-0 text-ac-muted" />
                <span className="truncate">{e.local || "Local a definir"}</span>
              </div>
              {e.organizador && <div className="mt-0.5 text-xs text-ac-muted">Organização: {e.organizador}</div>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${corFase[e.fase]}`}>{rotuloFase[e.fase]}</span>
                {e.fase !== "realizado" && e.fase !== "cancelado" && (
                  <span className="text-[11px] text-ac-muted">{dias === 0 ? "hoje" : `em ${dias} dias`}</span>
                )}
              </div>
              <div className="mt-auto flex gap-4 border-t border-ac-line pt-3 text-xs text-slate-300">
                <span>{e.valorInscricao > 0 ? moeda(e.valorInscricao) : "Gratuito"}</span>
                <span>
                  <b className="text-white">{e.inscritos}</b>
                  {e.vagas ? `/${e.vagas}` : ""} inscritos
                </span>
                {medalhas > 0 && (
                  <span>
                    🥇{e.medalhas.ouro} 🥈{e.medalhas.prata} 🥉{e.medalhas.bronze}
                  </span>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function QuadroMedalhas({ ranking }: { ranking: import("../../lib/artes-marciais").LinhaRanking[] }) {
  return (
    <Card className="!p-0">
      {ranking.length === 0 ? (
        <Vazio icone={Medal}>Nenhuma medalha no ano ainda. Os resultados entram na página de cada campeonato.</Vazio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="text-[11px] tracking-wide text-ac-muted uppercase">
              <tr className="border-b border-ac-line">
                <th className="py-2.5 pl-4 font-medium">#</th>
                <th className="px-3 font-medium">Atleta</th>
                <th className="px-3 text-center font-medium">🥇 Ouro</th>
                <th className="px-3 text-center font-medium">🥈 Prata</th>
                <th className="px-3 text-center font-medium">🥉 Bronze</th>
                <th className="px-3 text-center font-medium">Lutas</th>
                <th className="pr-4 text-right font-medium">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((l, i) => (
                <tr key={l.aluno.id} className="border-b border-ac-line/60">
                  <td className="py-2 pl-4 font-semibold text-slate-300">{i + 1}º</td>
                  <td className="px-3">
                    <Link to="/academia/alunos/$id" params={{ id: l.aluno.id }} className="flex items-center gap-3 hover:underline">
                      <AvatarAluno nome={l.aluno.nome} />
                      <span className="font-medium text-white">{l.aluno.nome}</span>
                    </Link>
                  </td>
                  <td className="px-3 text-center text-white">{l.ouro}</td>
                  <td className="px-3 text-center text-white">{l.prata}</td>
                  <td className="px-3 text-center text-white">{l.bronze}</td>
                  <td className="px-3 text-center text-slate-300">{l.participacoes}</td>
                  <td className="pr-4 text-right font-semibold text-white">{l.pontos}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-ac-muted">Pontos: ouro 3, prata 2, bronze 1. Só campeonatos do ano.</p>
        </div>
      )}
    </Card>
  );
}

const corFiliacao = {
  valida: "bg-emerald-500/15 text-emerald-300",
  vence_em_breve: "bg-amber-500/15 text-amber-300",
  vencida: "bg-red-500/15 text-red-300",
} as const;
const rotuloFiliacao = { valida: "Em dia", vence_em_breve: "Vence em até 30 dias", vencida: "Vencida" } as const;

function Filiacoes({
  inicial,
  alunos,
}: {
  inicial: FiliacaoJson[];
  alunos: import("../../lib/academia-alunos").AlunoResumo[];
}) {
  const [lista, setLista] = useState(inicial);
  const [editando, setEditando] = useState<FiliacaoJson | "nova" | null>(null);
  const ordenada = [...lista].sort((a, b) => {
    const peso = (f: FiliacaoJson) => (f.situacao === "vencida" ? 0 : f.situacao === "vence_em_breve" ? 1 : 2);
    return peso(a) - peso(b) || a.validade.localeCompare(b.validade);
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ac-muted">
          Carteirinha da federação (CBJJ, FPJJ, CBJ...) de quem compete. O painel avisa 30 dias antes de vencer.
        </p>
        <Botao variante="primario" onClick={() => setEditando("nova")}>
          <Plus className="size-4" />
          Nova filiação
        </Botao>
      </div>
      <Card className="!p-0">
        {ordenada.length === 0 ? (
          <Vazio icone={IdCard}>Nenhuma filiação cadastrada.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[13px]">
              <thead className="text-[11px] tracking-wide text-ac-muted uppercase">
                <tr className="border-b border-ac-line">
                  <th className="py-2.5 pl-4 font-medium">Aluno</th>
                  <th className="px-3 font-medium">Entidade</th>
                  <th className="px-3 font-medium">Número</th>
                  <th className="px-3 font-medium">Validade</th>
                  <th className="px-3 font-medium">Situação</th>
                  <th className="pr-4" />
                </tr>
              </thead>
              <tbody>
                {ordenada.map((f) => (
                  <tr key={f.id} className="border-b border-ac-line/60">
                    <td className="py-2 pl-4">
                      <Link to="/academia/alunos/$id" params={{ id: f.aluno.id }} className="font-medium text-white hover:underline">
                        {f.aluno.nome}
                      </Link>
                    </td>
                    <td className="px-3 text-slate-200">{f.entidade}</td>
                    <td className="px-3 text-slate-300">{f.numero || "—"}</td>
                    <td className="px-3 text-slate-300">{data(f.validade)}</td>
                    <td className="px-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${corFiliacao[f.situacao]}`}>
                        {rotuloFiliacao[f.situacao]}
                      </span>
                    </td>
                    <td className="pr-4 text-right">
                      <button type="button" aria-label="Editar" onClick={() => setEditando(f)} className="rounded p-1.5 text-ac-muted hover:text-white">
                        <Pencil className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editando && (
        <ModalFiliacao
          filiacao={editando === "nova" ? null : editando}
          alunos={alunos}
          aoFechar={() => setEditando(null)}
          aoSalvar={(l) => {
            setLista(l);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function ModalFiliacao({
  filiacao,
  alunos,
  aoFechar,
  aoSalvar,
}: {
  filiacao: FiliacaoJson | null;
  alunos: import("../../lib/academia-alunos").AlunoResumo[];
  aoFechar: () => void;
  aoSalvar: (l: FiliacaoJson[]) => void;
}) {
  const [alunoId, setAlunoId] = useState<string | null>(filiacao?.aluno.id ?? null);
  const [entidade, setEntidade] = useState(filiacao?.entidade ?? "CBJJ");
  const [numero, setNumero] = useState(filiacao?.numero ?? "");
  const [validade, setValidade] = useState(filiacao?.validade ?? `${new Date().getFullYear()}-12-31`);
  const [observacao, setObservacao] = useState(filiacao?.observacao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!alunoId) return setErro("Escolha o aluno");
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(await apiLutas.salvarFiliacao(filiacao?.id ?? null, { alunoId, entidade, numero, validade, observacao }));
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={filiacao ? "Editar filiação" : "Nova filiação"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {filiacao ? (
          <div className="text-sm font-medium text-white">{filiacao.aluno.nome}</div>
        ) : (
          <SeletorAluno alunos={alunos} valor={alunoId} aoMudar={setAlunoId} autoFocus />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Federação / confederação">
            <input className={classeInput} value={entidade} list="entidades" onChange={(e) => setEntidade(e.target.value)} />
            <datalist id="entidades">
              {["CBJJ", "FPJJ", "IBJJF", "CBJ", "FPJ", "CBK", "CBTKD", "CBMT", "FPMT", "CBBoxe"].map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Campo>
          <Campo rotulo="Número da carteirinha">
            <input className={classeInput} value={numero} onChange={(e) => setNumero(e.target.value)} />
          </Campo>
        </div>
        <Campo rotulo="Válida até">
          <input type="date" className={classeInput} value={validade} onChange={(e) => setValidade(e.target.value)} />
        </Campo>
        <Campo rotulo="Observação">
          <input className={classeInput} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Campo>
        <MensagemErro texto={erro} />
        <div className="flex flex-wrap justify-between gap-2">
          {filiacao ? (
            <Botao
              variante="perigo"
              onClick={async () => {
                try {
                  aoSalvar(await apiLutas.excluirFiliacao(filiacao.id));
                } catch (x) {
                  setErro(mensagemDe(x));
                }
              }}
            >
              <Trash2 className="size-4" />
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
