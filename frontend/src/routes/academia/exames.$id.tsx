import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CircleCheck, ExternalLink, Pencil, Printer, Sparkles, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { SeletorAluno } from "../../components/academia/SeletorAluno";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, Interruptor, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Card, TituloCard, Vazio } from "../../components/academia/ui";
import { FaixaVisual, PontoModalidade, SeloFaixa } from "../../components/artes-marciais/Faixa";
import { textoProximo } from "../../components/artes-marciais/ModaisGraduacao";
import { apiTreinos } from "../../lib/academia-treinos";
import {
  apiLutas,
  data,
  formasPagamento,
  moeda,
  type CandidatoJson,
  type ExameDetalhe,
  type Progresso,
} from "../../lib/artes-marciais";
import { ModalExame } from "../../components/artes-marciais/ModalExame";

// Um exame de faixa: candidatos, taxas, resultado e conclusão.
export const Route = createFileRoute("/academia/exames/$id")({
  loader: async ({ params }) => {
    const [detalhe, progressos, professores] = await Promise.all([
      apiLutas.exame(params.id),
      apiLutas.alunosFaixas(),
      apiTreinos.profissionais(),
    ]);
    return { detalhe, progressos, professores: professores.filter((p) => p.ativo) };
  },
  component: PaginaExame,
});

const corTaxa = {
  paga: "text-emerald-300",
  pendente: "text-sky-300",
  atrasada: "text-red-300",
  cancelada: "text-ac-muted",
} as const;

function PaginaExame() {
  const inicial = Route.useLoaderData();
  const [d, setD] = useState<ExameDetalhe>(inicial.detalhe);
  const [erro, setErro] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState<Progresso | "buscar" | null>(null);
  const [editando, setEditando] = useState(false);
  const [concluindo, setConcluindo] = useState(false);
  const e = d.exame;
  const aberto = e.status === "agendado";
  const daModalidade = inicial.progressos.filter((p) => p.modalidade.id === e.modalidade.id && p.matriculaAtiva);

  async function acao(f: () => Promise<ExameDetalhe>) {
    setErro(null);
    try {
      setD(await f());
    } catch (x) {
      setErro(mensagemDe(x));
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <Link to="/academia/graduacoes" search={{ aba: "exames" }} className="inline-flex w-fit items-center gap-1.5 text-sm text-ac-muted hover:text-white print:hidden">
        <ArrowLeft className="size-4" />
        Exames
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-ac-muted">
            <PontoModalidade cor={e.modalidade.cor} />
            {e.modalidade.nome}
          </div>
          <h1 className="font-poppins text-[28px] font-bold text-white">{e.titulo}</h1>
          <p className="text-sm text-slate-300">
            {data(e.data)}
            {e.hora && ` às ${e.hora.slice(0, 5)}`}
            {e.local && ` · ${e.local}`}
            {e.banca && ` · Banca: ${e.banca}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Botao onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir lista
          </Botao>
          {aberto && (
            <>
              <Botao onClick={() => setEditando(true)}>
                <Pencil className="size-4" />
                Editar
              </Botao>
              <Botao
                variante="perigo"
                onClick={() => confirm("Cancelar este exame? As taxas em aberto são canceladas.") && acao(() => apiLutas.cancelarExame(e.id))}
              >
                Cancelar exame
              </Botao>
              <Botao variante="primario" onClick={() => setConcluindo(true)} disabled={d.candidatos.length === 0}>
                <CircleCheck className="size-4" />
                Concluir exame
              </Botao>
            </>
          )}
        </div>
      </div>
      <MensagemErro texto={erro} />

      {e.status !== "agendado" && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${e.status === "realizado" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-ac-line text-ac-muted"}`}>
          {e.status === "realizado"
            ? `Exame concluído: ${e.aprovados} de ${e.candidatos} aprovados. As graduações e os certificados já estão no histórico de cada aluno.`
            : "Exame cancelado."}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <Card className="!p-0">
          <div className="flex items-center justify-between gap-3 p-4">
            <TituloCard icone={UserPlus} cor="text-red-500">
              Candidatos ({d.candidatos.length})
            </TituloCard>
            {aberto && (
              <Botao className="!h-9 print:hidden" onClick={() => setAdicionando("buscar")}>
                <UserPlus className="size-4" />
                Adicionar aluno
              </Botao>
            )}
          </div>
          {d.candidatos.length === 0 ? (
            <Vazio icone={UserPlus}>Nenhum candidato. Use as sugestões ao lado ou "Adicionar aluno".</Vazio>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="text-[11px] tracking-wide text-ac-muted uppercase">
                  <tr className="border-y border-ac-line">
                    <th className="py-2 pr-3 pl-4 font-medium">Aluno</th>
                    <th className="px-3 font-medium">Hoje</th>
                    <th className="px-3 font-medium">Vai para</th>
                    <th className="px-3 font-medium">Taxa</th>
                    <th className="px-3 font-medium">Resultado</th>
                    <th className="pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {d.candidatos.map((c) => (
                    <LinhaCandidato
                      key={c.id}
                      c={c}
                      aberto={aberto}
                      aoResultado={(r) => acao(() => apiLutas.resultadoCandidato(e.id, c.id, r))}
                      aoRemover={() =>
                        confirm(`Tirar ${c.aluno.nome} do exame?`) && acao(() => apiLutas.removerCandidato(e.id, c.id))
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {aberto && (
          <Card className="print:hidden">
            <TituloCard icone={Sparkles} cor="text-amber-300">
              Prontos para a faixa ({d.sugeridos.length})
            </TituloCard>
            <p className="mt-1 text-xs text-ac-muted">Cumprem tempo e aulas da faixa atual em {e.modalidade.nome}.</p>
            {d.sugeridos.length === 0 ? (
              <p className="mt-4 text-sm text-ac-muted">Ninguém pronto agora.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {d.sugeridos.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2">
                    <AvatarAluno nome={p.aluno.nome} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{p.aluno.nome}</div>
                      <div className="truncate text-[11px] text-ac-muted">{textoProximo(p)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdicionando(p)}
                      className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                    >
                      Incluir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {adicionando && (
        <ModalCandidato
          exameId={e.id}
          progresso={adicionando === "buscar" ? null : adicionando}
          opcoes={daModalidade.filter((p) => !d.candidatos.some((c) => c.aluno.id === p.aluno.id))}
          aoFechar={() => setAdicionando(null)}
          aoSalvar={(x) => {
            setD(x);
            setAdicionando(null);
          }}
        />
      )}
      {editando && (
        <ModalExame
          modalidades={[e.modalidade]}
          exame={e}
          aoFechar={() => setEditando(false)}
          aoSalvar={async () => {
            setEditando(false);
            setD(await apiLutas.exame(e.id));
          }}
        />
      )}
      {concluindo && (
        <ModalConcluir
          detalhe={d}
          professores={inicial.professores}
          aoFechar={() => setConcluindo(false)}
          aoConcluir={(x) => {
            setD(x);
            setConcluindo(false);
          }}
        />
      )}
    </div>
  );
}

function LinhaCandidato({
  c,
  aberto,
  aoResultado,
  aoRemover,
}: {
  c: CandidatoJson;
  aberto: boolean;
  aoResultado: (r: CandidatoJson["resultado"]) => void;
  aoRemover: () => void;
}) {
  return (
    <tr className="border-b border-ac-line/60">
      <td className="py-2 pr-3 pl-4">
        <Link to="/academia/alunos/$id" params={{ id: c.aluno.id }} className="flex items-center gap-3 hover:underline">
          <AvatarAluno nome={c.aluno.nome} />
          <span className="font-medium text-white">{c.aluno.nome}</span>
        </Link>
      </td>
      <td className="px-3">{c.faixaAtual ? <SeloFaixa faixa={c.faixaAtual} grau={c.grauAtual} /> : "—"}</td>
      <td className="px-3">
        <SeloFaixa faixa={c.faixa} grau={c.grau} />
      </td>
      <td className="px-3">
        {c.taxa ? (
          <span className={`whitespace-nowrap ${corTaxa[c.taxa.situacao]}`}>
            {moeda(c.taxa.valor)} · {c.taxa.situacao}
          </span>
        ) : (
          <span className="text-ac-muted">Sem taxa</span>
        )}
        {c.taxa && c.taxa.situacao !== "paga" && c.taxa.situacao !== "cancelada" && (
          <Link to="/academia/faturamento" className="block text-[11px] whitespace-nowrap text-ac-muted underline print:hidden">
            receber
          </Link>
        )}
      </td>
      <td className="px-3">
        {aberto ? (
          <div className="flex gap-1 print:hidden">
            <button
              type="button"
              onClick={() => aoResultado(c.resultado === "aprovado" ? "pendente" : "aprovado")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                c.resultado === "aprovado" ? "bg-emerald-600 text-white" : "border border-ac-line text-slate-300 hover:bg-white/5"
              }`}
            >
              <Check className="size-3.5" />
              Aprovado
            </button>
            <button
              type="button"
              onClick={() => aoResultado(c.resultado === "reprovado" ? "pendente" : "reprovado")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                c.resultado === "reprovado" ? "bg-red-600 text-white" : "border border-ac-line text-slate-300 hover:bg-white/5"
              }`}
            >
              <X className="size-3.5" />
              Reprovado
            </button>
          </div>
        ) : (
          <span className={c.resultado === "aprovado" ? "font-semibold text-emerald-300" : "text-red-300"}>
            {c.resultado === "aprovado" ? "Aprovado" : c.resultado === "reprovado" ? "Reprovado" : "—"}
          </span>
        )}
      </td>
      <td className="pr-4 text-right">
        {c.codigoCertificado && (
          <a href={`/certificado/${c.codigoCertificado}`} target="_blank" rel="noreferrer" aria-label="Certificado" className="inline-flex rounded p-1.5 text-ac-muted hover:text-white">
            <ExternalLink className="size-4" />
          </a>
        )}
        {aberto && (
          <button type="button" aria-label={`Tirar ${c.aluno.nome}`} onClick={aoRemover} className="rounded p-1.5 text-ac-muted hover:text-red-300 print:hidden">
            <Trash2 className="size-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

function ModalCandidato({
  exameId,
  progresso,
  opcoes,
  aoFechar,
  aoSalvar,
}: {
  exameId: string;
  progresso: Progresso | null;
  opcoes: Progresso[];
  aoFechar: () => void;
  aoSalvar: (d: ExameDetalhe) => void;
}) {
  const [escolhido, setEscolhido] = useState<string | null>(progresso?.aluno.id ?? null);
  const p = progresso ?? opcoes.find((x) => x.aluno.id === escolhido) ?? null;
  const [cobrar, setCobrar] = useState(true);
  const [pago, setPago] = useState(false);
  const [forma, setForma] = useState("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!p) return;
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(
        await apiLutas.adicionarCandidato(exameId, {
          alunoModalidadeId: p.id,
          faixaId: p.proximo?.tipo === "faixa" ? p.proximo.faixa.id : undefined,
          cobrarTaxa: cobrar,
          pago,
          formaPagamento: pago ? forma : undefined,
        }),
      );
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Incluir no exame" aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        {!progresso && (
          <SeletorAluno
            alunos={opcoes.map((o) => ({ id: o.aluno.id, nome: o.aluno.nome, situacao: "ativo" as const, plano: faixaTexto(o) }))}
            valor={escolhido}
            aoMudar={setEscolhido}
            autoFocus
          />
        )}
        {p && (
          <div className="flex items-center gap-3 rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5 text-sm text-slate-300">
            <FaixaVisual faixa={p.faixa} grau={p.grau} grausMaximos={p.grausMaximos} largura={60} altura={11} />
            <span>
              {p.aluno.nome}: {textoProximo(p)}
            </span>
          </div>
        )}
        <Interruptor ligado={cobrar} aoMudar={setCobrar} titulo="Cobrar a taxa do exame" descricao="Valor da faixa pretendida (Modalidades e faixas). Vira cobrança no Financeiro." />
        {cobrar && (
          <>
            <Interruptor ligado={pago} aoMudar={setPago} titulo="Já recebi agora" />
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
          <Botao variante="primario" onClick={salvar} carregando={salvando} disabled={!p}>
            Incluir
          </Botao>
        </div>
      </div>
    </Modal>
  );
}

const faixaTexto = (p: Progresso) => `${p.faixa.nome}${p.grau ? ` · ${p.grau}º grau` : ""}`;

function ModalConcluir({
  detalhe,
  professores,
  aoFechar,
  aoConcluir,
}: {
  detalhe: ExameDetalhe;
  professores: { id: string; nome: string }[];
  aoFechar: () => void;
  aoConcluir: (d: ExameDetalhe) => void;
}) {
  const [professorId, setProfessorId] = useState(professores[0]?.id ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pendentes = detalhe.candidatos.filter((c) => c.resultado === "pendente").length;
  const aprovados = detalhe.candidatos.filter((c) => c.resultado === "aprovado").length;

  async function concluir() {
    setSalvando(true);
    setErro(null);
    try {
      aoConcluir(await apiLutas.concluirExame(detalhe.exame.id, professorId || null));
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Concluir exame" aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        {pendentes > 0 ? (
          <p className="text-sm text-amber-300">Ainda faltam {pendentes} candidatos sem resultado. Marque aprovado ou reprovado em todos.</p>
        ) : (
          <p className="text-sm text-slate-300">
            <b className="text-white">{aprovados}</b> aprovados vão receber a nova faixa com certificado, com a data do exame.
          </p>
        )}
        <Campo rotulo="Professor que assina">
          <select className={classeInput} value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
            <option value="">—</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Voltar</Botao>
          <Botao variante="primario" onClick={concluir} carregando={salvando} disabled={pendentes > 0}>
            Concluir e graduar
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
