import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Pencil, Printer, Trash2, Trophy, UserPlus } from "lucide-react";
import { useState } from "react";
import { SeletorAluno } from "../../components/academia/SeletorAluno";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, Interruptor, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Card, Vazio } from "../../components/academia/ui";
import { ModalEvento } from "../../components/artes-marciais/ModalEvento";
import { apiAlunos } from "../../lib/academia-alunos";
import {
  apiLutas,
  data,
  formasPagamento,
  moeda,
  rotuloFase,
  rotuloResultado,
  rotuloTipoEvento,
  type EventoDetalhe,
  type FaseEvento,
  type InscricaoJson,
  type ResultadoEvento,
} from "../../lib/artes-marciais";

// Um evento: inscritos, pagamentos, categorias e resultados (medalhas).
export const Route = createFileRoute("/academia/eventos_/$id")({
  loader: async ({ params }) => {
    const [detalhe, alunos, modalidades] = await Promise.all([
      apiLutas.evento(params.id),
      apiAlunos.listar(),
      apiLutas.modalidades(),
    ]);
    return { detalhe, alunos: alunos.alunos, modalidades };
  },
  component: PaginaEvento,
});

const corFase: Record<FaseEvento, string> = {
  inscricoes_abertas: "bg-emerald-500/15 text-emerald-300",
  inscricoes_encerradas: "bg-amber-500/15 text-amber-300",
  realizado: "bg-white/5 text-slate-300",
  cancelado: "bg-white/5 text-ac-muted",
};

const medalha: Record<ResultadoEvento, string> = { ouro: "🥇", prata: "🥈", bronze: "🥉", participou: "🎽" };

const corCobranca = {
  paga: "text-emerald-300",
  pendente: "text-sky-300",
  atrasada: "text-red-300",
  cancelada: "text-ac-muted",
} as const;

function PaginaEvento() {
  const inicial = Route.useLoaderData();
  const [d, setD] = useState<EventoDetalhe>(inicial.detalhe);
  const [erro, setErro] = useState<string | null>(null);
  const [inscrevendo, setInscrevendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const e = d.evento;
  const aconteceu = e.fase === "realizado";
  const ativo = e.status === "ativo";

  async function acao(f: () => Promise<EventoDetalhe>) {
    setErro(null);
    try {
      setD(await f());
    } catch (x) {
      setErro(mensagemDe(x));
    }
  }

  const recebido = d.inscricoes.filter((i) => i.cobranca?.situacao === "paga").reduce((s, i) => s + (i.cobranca?.valor ?? 0), 0);

  return (
    <div className="flex flex-col gap-5 py-4">
      <Link to="/academia/eventos" className="inline-flex w-fit items-center gap-1.5 text-sm text-ac-muted hover:text-white print:hidden">
        <ArrowLeft className="size-4" />
        Eventos
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-red-400 uppercase">
            {rotuloTipoEvento[e.tipo]}
            {e.modalidade && ` · ${e.modalidade.nome}`}
          </div>
          <h1 className="font-poppins text-[28px] font-bold text-white">{e.nome}</h1>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-slate-300">
            <span>
              {data(e.data)}
              {e.hora && ` às ${e.hora.slice(0, 5)}`}
            </span>
            {e.local && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {e.local}
              </span>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${corFase[e.fase]}`}>{rotuloFase[e.fase]}</span>
          </p>
          {e.organizador && <p className="text-xs text-ac-muted">Organização: {e.organizador}</p>}
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Botao onClick={() => window.print()}>
            <Printer className="size-4" />
            Lista
          </Botao>
          {ativo && (
            <Botao onClick={() => setEditando(true)}>
              <Pencil className="size-4" />
              Editar
            </Botao>
          )}
          {ativo && !aconteceu && (
            <Botao
              variante="perigo"
              onClick={() => confirm("Cancelar o evento? As inscrições não pagas são canceladas.") && acao(() => apiLutas.cancelarEvento(e.id))}
            >
              Cancelar evento
            </Botao>
          )}
          {e.fase === "inscricoes_abertas" && (
            <Botao variante="primario" onClick={() => setInscrevendo(true)}>
              <UserPlus className="size-4" />
              Inscrever aluno
            </Botao>
          )}
        </div>
      </div>
      <MensagemErro texto={erro} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Numero rotulo="Inscritos" valor={`${e.inscritos}${e.vagas ? ` de ${e.vagas}` : ""}`} />
        <Numero rotulo="Inscrição" valor={e.valorInscricao > 0 ? moeda(e.valorInscricao) : "Gratuita"} />
        <Numero rotulo="Recebido" valor={moeda(recebido)} />
        <Numero
          rotulo={aconteceu ? "Medalhas" : "Inscrições até"}
          valor={
            aconteceu
              ? `🥇${e.medalhas.ouro} 🥈${e.medalhas.prata} 🥉${e.medalhas.bronze}`
              : e.inscricoesAte
                ? data(e.inscricoesAte)
                : "Véspera"
          }
        />
      </div>
      {e.descricao && <p className="text-sm text-slate-300">{e.descricao}</p>}

      <Card className="!p-0">
        {d.inscricoes.length === 0 ? (
          <Vazio icone={Trophy}>Nenhum inscrito ainda.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="text-[11px] tracking-wide text-ac-muted uppercase">
                <tr className="border-b border-ac-line">
                  <th className="py-2.5 pl-4 font-medium">Atleta</th>
                  <th className="px-3 font-medium">Categoria</th>
                  <th className="px-3 font-medium">Peso</th>
                  <th className="px-3 font-medium">Inscrição</th>
                  <th className="px-3 font-medium">{aconteceu ? "Resultado" : "Origem"}</th>
                  <th className="pr-4" />
                </tr>
              </thead>
              <tbody>
                {d.inscricoes.map((i) => (
                  <LinhaInscricao
                    key={i.id}
                    i={i}
                    aconteceu={aconteceu}
                    aoResultado={(r) => acao(() => apiLutas.resultado(e.id, i.id, { resultado: r }))}
                    aoCancelar={() =>
                      confirm(`Cancelar a inscrição de ${i.aluno.nome}?`) && acao(() => apiLutas.cancelarInscricao(e.id, i.id))
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {aconteceu && d.inscricoes.length > 0 && (
        <p className="text-xs text-ac-muted print:hidden">
          Marque o resultado de cada atleta: a medalha vai para o histórico dele e para o quadro de medalhas.
        </p>
      )}

      {inscrevendo && (
        <ModalInscrever
          eventoId={e.id}
          valor={e.valorInscricao}
          alunos={inicial.alunos.filter((a) => a.situacao !== "sem_matricula" && !d.inscricoes.some((i) => i.aluno.id === a.id))}
          aoFechar={() => setInscrevendo(false)}
          aoSalvar={(x) => {
            setD(x);
            setInscrevendo(false);
          }}
        />
      )}
      {editando && (
        <ModalEvento
          modalidades={inicial.modalidades}
          evento={e}
          aoFechar={() => setEditando(false)}
          aoSalvar={async () => {
            setEditando(false);
            setD(await apiLutas.evento(e.id));
          }}
        />
      )}
    </div>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Card className="!p-3.5">
      <div className="text-[11.5px] text-ac-muted">{rotulo}</div>
      <div className="mt-1 font-poppins text-lg font-semibold text-white">{valor}</div>
    </Card>
  );
}

function LinhaInscricao({
  i,
  aconteceu,
  aoResultado,
  aoCancelar,
}: {
  i: InscricaoJson;
  aconteceu: boolean;
  aoResultado: (r: ResultadoEvento | null) => void;
  aoCancelar: () => void;
}) {
  return (
    <tr className="border-b border-ac-line/60">
      <td className="py-2 pl-4">
        <Link to="/academia/alunos/$id" params={{ id: i.aluno.id }} className="flex items-center gap-3 hover:underline">
          <AvatarAluno nome={i.aluno.nome} />
          <span>
            <span className="block font-medium text-white">{i.aluno.nome}</span>
            {i.faixa && <span className="block text-[11px] text-ac-muted">{i.faixa}</span>}
          </span>
        </Link>
      </td>
      <td className="px-3 text-slate-300">{i.categoria || "—"}</td>
      <td className="px-3 text-slate-300">{i.peso ? `${i.peso.toLocaleString("pt-BR")} kg` : "—"}</td>
      <td className="px-3">
        {i.cobranca ? (
          <span className={corCobranca[i.cobranca.situacao]}>
            {moeda(i.cobranca.valor)} · {i.cobranca.situacao}
          </span>
        ) : (
          <span className="text-ac-muted">Grátis</span>
        )}
      </td>
      <td className="px-3">
        {aconteceu ? (
          <select
            className={`${classeInput} !h-8 !w-36 text-xs print:hidden`}
            value={i.resultado ?? ""}
            onChange={(e) => aoResultado((e.target.value || null) as ResultadoEvento | null)}
          >
            <option value="">—</option>
            {(Object.keys(rotuloResultado) as ResultadoEvento[]).map((r) => (
              <option key={r} value={r}>
                {medalha[r]} {rotuloResultado[r]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-ac-muted">{i.origem === "area_aluno" ? "Pelo app" : "Recepção"}</span>
        )}
        {aconteceu && i.resultado && <span className="hidden print:inline">{rotuloResultado[i.resultado]}</span>}
      </td>
      <td className="pr-4 text-right">
        {!aconteceu && (
          <button type="button" aria-label="Cancelar inscrição" onClick={aoCancelar} className="rounded p-1.5 text-ac-muted hover:text-red-300 print:hidden">
            <Trash2 className="size-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

function ModalInscrever({
  eventoId,
  valor,
  alunos,
  aoFechar,
  aoSalvar,
}: {
  eventoId: string;
  valor: number;
  alunos: import("../../lib/academia-alunos").AlunoResumo[];
  aoFechar: () => void;
  aoSalvar: (d: EventoDetalhe) => void;
}) {
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState("");
  const [peso, setPeso] = useState("");
  const [pago, setPago] = useState(false);
  const [forma, setForma] = useState("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(id: string | null) {
    setAlunoId(id);
    setCategoria("");
    if (id) {
      try {
        setCategoria((await apiLutas.categoria(eventoId, id)).categoria);
      } catch {
        // sem sugestão: o campo fica vazio
      }
    }
  }

  async function salvar() {
    if (!alunoId) return;
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(
        await apiLutas.inscrever(eventoId, {
          alunoId,
          categoria,
          peso: peso ? Number(peso.replace(",", ".")) : null,
          pago,
          formaPagamento: pago ? forma : null,
        }),
      );
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Inscrever aluno" aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        <SeletorAluno alunos={alunos} valor={alunoId} aoMudar={escolher} autoFocus />
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <Campo rotulo="Categoria (idade · faixa)">
            <input className={classeInput} value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Sugerida ao escolher o aluno" />
          </Campo>
          <Campo rotulo="Peso (kg)">
            <input className={classeInput} inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} />
          </Campo>
        </div>
        {valor > 0 && (
          <>
            <Interruptor ligado={pago} aoMudar={setPago} titulo={`Já recebi a inscrição (${moeda(valor)})`} descricao="Senão, fica a receber no Financeiro." />
            {pago && (
              <Campo rotulo="Forma de pagamento">
                <select className={classeInput} value={forma} onChange={(e) => setForma(e.target.value)}>
                  {formasPagamento.map((f) => (
                    <option key={f.valor} value={f.valor}>
                      {f.rotulo}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
          </>
        )}
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" onClick={salvar} carregando={salvando} disabled={!alunoId}>
            Inscrever
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
