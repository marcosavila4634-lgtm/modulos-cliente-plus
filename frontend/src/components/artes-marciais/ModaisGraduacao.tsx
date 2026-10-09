import { Award, ExternalLink } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  apiLutas,
  faixaComGrau,
  hojeIso,
  type FaixaJson,
  type GraduacaoJson,
  type ModalidadeJson,
  type Progresso,
} from "../../lib/artes-marciais";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../academia/formulario";
import { FaixaVisual } from "./Faixa";

// Barra de progresso até o próximo grau ou faixa.
export function BarraProgresso({ p, detalhe = true }: { p: Progresso; detalhe?: boolean }) {
  const cor =
    p.situacao === "apto_faixa" || p.situacao === "apto_grau"
      ? "bg-emerald-500"
      : p.percentual >= 75
        ? "bg-amber-500"
        : "bg-red-600";
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ac-line">
          <div className={`h-full rounded-full ${cor}`} style={{ width: `${p.percentual}%` }} />
        </div>
        <span className="w-9 text-right text-[11px] font-semibold text-slate-300">{p.percentual}%</span>
      </div>
      {detalhe && <div className="mt-0.5 truncate text-[11px] text-ac-muted">{textoProximo(p)}</div>}
    </div>
  );
}

// "Faltam 12 aulas para o 3º grau" / "Pronto para a faixa Azul"
export function textoProximo(p: Progresso) {
  if (p.situacao === "apto_faixa" && p.proximo) return `Pronto para a faixa ${p.proximo.faixa.nome}`;
  if (p.situacao === "apto_grau") return `Pronto para o ${p.grau + 1}º grau`;
  if (p.situacao === "ultima_faixa") return "Última faixa da modalidade";
  if (!p.proximo) return "Sem requisitos cadastrados";
  if (p.proximo.tipo === "grau") {
    const faltam = Math.max(0, p.aulasPorGrau - p.aulasNoGrau);
    return `Faltam ${faltam} ${faltam === 1 ? "aula" : "aulas"} para o ${p.proximo.grau}º grau`;
  }
  const pendente = p.requisitos.find((r) => !r.ok);
  if (!pendente) return `Próxima: ${p.proximo.faixa.nome}`;
  const falta = pendente.meta - pendente.atual;
  if (pendente.rotulo.startsWith("Aulas")) return `Faltam ${falta} aulas para a ${p.proximo.faixa.nome}`;
  if (pendente.rotulo.startsWith("Tempo")) return `Faltam ${falta} ${falta === 1 ? "mês" : "meses"} para a ${p.proximo.faixa.nome}`;
  return `Idade mínima ${pendente.meta} anos para a ${p.proximo.faixa.nome}`;
}

export function ModalGraduar({
  progresso: p,
  modalidades,
  professores,
  aoFechar,
  aoGraduar,
}: {
  progresso: Progresso;
  modalidades: ModalidadeJson[];
  professores: { id: string; nome: string }[];
  aoFechar: () => void;
  aoGraduar: () => void;
}) {
  const faixas = (modalidades.find((m) => m.id === p.modalidade.id)?.faixas ?? []).filter((f) => f.ativo);
  const atual = faixas.find((f) => f.id === p.faixa.id);
  const podeGrau = !!atual && p.grau < atual.grausMaximos;
  const sugerido = p.proximo?.tipo === "grau" && podeGrau ? "grau" : "faixa";
  const [tipo, setTipo] = useState<"faixa" | "grau">(podeGrau ? sugerido : "faixa");
  const [faixaId, setFaixaId] = useState(
    p.proximo?.tipo === "faixa" ? p.proximo.faixa.id : (faixas.find((f) => f.ordem > (atual?.ordem ?? 0))?.id ?? ""),
  );
  const [grau, setGrau] = useState(p.grau + 1);
  const [dataGrad, setDataGrad] = useState(hojeIso());
  const [professorId, setProfessorId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<GraduacaoJson | null>(null);
  const alvo: FaixaJson | undefined = tipo === "faixa" ? faixas.find((f) => f.id === faixaId) : atual;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const g = await apiLutas.graduar({
        alunoModalidadeId: p.id,
        tipo,
        faixaId: tipo === "faixa" ? faixaId : undefined,
        grau: tipo === "grau" ? grau : 0,
        data: dataGrad,
        professorId: professorId || null,
        observacao,
      });
      setFeito(g);
      aoGraduar();
    } catch (x) {
      setErro(mensagemDe(x));
    } finally {
      setSalvando(false);
    }
  }

  if (feito) {
    return (
      <Modal titulo="Graduação registrada" aoFechar={aoFechar}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-amber-500/15 text-amber-300">
            <Award className="size-7" />
          </span>
          <div className="text-lg font-semibold text-white">{feito.aluno.nome}</div>
          <FaixaVisual faixa={feito.faixa} grau={feito.grau} grausMaximos={alvo?.grausMaximos ?? 0} largura={160} altura={22} />
          <div className="text-sm text-slate-300">
            {feito.modalidade.nome} · {faixaComGrau(feito.faixa, feito.grau)}
          </div>
          <p className="text-xs text-ac-muted">Oss! O certificado já está pronto para imprimir ou mandar ao aluno.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <a
              href={`/certificado/${feito.codigo}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 px-4 text-sm font-semibold text-white"
            >
              <ExternalLink className="size-4" />
              Abrir certificado
            </a>
            <Botao onClick={aoFechar}>Fechar</Botao>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal titulo="Graduar aluno" subtitulo={`${p.aluno.nome} · ${p.modalidade.nome}`} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5 text-sm text-slate-300">
          <FaixaVisual faixa={p.faixa} grau={p.grau} grausMaximos={p.grausMaximos} largura={70} altura={12} />
          Hoje: <b className="text-white">{faixaComGrau(p.faixa, p.grau)}</b>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["grau", "faixa"] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={t === "grau" && !podeGrau}
              onClick={() => setTipo(t)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                tipo === t ? "border-red-500/70 bg-red-500/10 text-white" : "border-ac-line text-slate-300 hover:bg-white/5"
              }`}
            >
              {t === "grau" ? "Novo grau" : "Nova faixa"}
            </button>
          ))}
        </div>

        {tipo === "grau" ? (
          <Campo rotulo={`Grau (a ${atual?.nome ?? "faixa"} vai até ${atual?.grausMaximos ?? 0})`}>
            <input
              type="number"
              min={1}
              max={atual?.grausMaximos ?? 1}
              className={classeInput}
              value={grau}
              onChange={(e) => setGrau(Number(e.target.value))}
            />
          </Campo>
        ) : (
          <Campo rotulo="Nova faixa">
            <select className={classeInput} value={faixaId} onChange={(e) => setFaixaId(e.target.value)} required>
              <option value="">Escolha</option>
              {faixas
                .filter((f) => f.id !== p.faixa.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                    {f.publico === "infantil" ? " (kids)" : ""}
                    {f.id === p.proximo?.faixa.id ? " · sugerida" : ""}
                  </option>
                ))}
            </select>
          </Campo>
        )}

        {alvo && (
          <div className="flex justify-center py-1">
            <FaixaVisual
              faixa={alvo}
              grau={tipo === "grau" ? grau : 0}
              grausMaximos={alvo.grausMaximos}
              largura={200}
              altura={24}
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Data">
            <input type="date" className={classeInput} value={dataGrad} max={hojeIso()} onChange={(e) => setDataGrad(e.target.value)} />
          </Campo>
          <Campo rotulo="Professor que graduou">
            <select className={classeInput} value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
              <option value="">—</option>
              {professores.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo rotulo="Observação (opcional, sai no histórico)">
          <input className={classeInput} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Campo>

        {p.requisitos.length > 0 && tipo === "faixa" && (
          <ul className="flex flex-col gap-1 rounded-xl border border-ac-line px-3 py-2 text-xs">
            {p.requisitos.map((r) => (
              <li key={r.rotulo} className="flex justify-between gap-3">
                <span className="text-slate-300">{r.rotulo}</span>
                <span className={r.ok ? "text-emerald-300" : "text-amber-300"}>
                  {r.atual} de {r.meta} {r.ok ? "✓" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <Award className="size-4" />
            Registrar graduação
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

// Coloca um aluno numa modalidade, com a faixa que ele já tem.
export function ModalNovaModalidade({
  alunoId,
  modalidades,
  jaTreina,
  aoFechar,
  aoSalvar,
}: {
  alunoId: string;
  modalidades: ModalidadeJson[];
  jaTreina: string[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const livres = modalidades.filter((m) => m.ativo && !jaTreina.includes(m.id));
  const [modalidadeId, setModalidadeId] = useState(livres[0]?.id ?? "");
  const faixas = (modalidades.find((m) => m.id === modalidadeId)?.faixas ?? []).filter((f) => f.ativo);
  const [faixaId, setFaixaId] = useState("");
  const [grau, setGrau] = useState(0);
  const [inicio, setInicio] = useState(hojeIso());
  const [faixaDesde, setFaixaDesde] = useState(hojeIso());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const faixa = faixas.find((f) => f.id === faixaId) ?? faixas[0];

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!faixa) return;
    setSalvando(true);
    setErro(null);
    try {
      await apiLutas.adicionarModalidade(alunoId, { modalidadeId, faixaId: faixa.id, grau, inicio, faixaDesde });
      aoSalvar();
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Adicionar modalidade" subtitulo="Aluno que já chega graduado: escolha a faixa que ele tem." aoFechar={aoFechar}>
      {livres.length === 0 ? (
        <p className="text-sm text-ac-muted">O aluno já treina todas as modalidades cadastradas.</p>
      ) : (
        <form onSubmit={salvar} className="flex flex-col gap-4">
          <Campo rotulo="Modalidade">
            <select
              className={classeInput}
              value={modalidadeId}
              onChange={(e) => {
                setModalidadeId(e.target.value);
                setFaixaId("");
                setGrau(0);
              }}
            >
              {livres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Campo>
          <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
            <Campo rotulo="Faixa atual">
              <select className={classeInput} value={faixa?.id ?? ""} onChange={(e) => setFaixaId(e.target.value)}>
                {faixas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                    {f.publico === "infantil" ? " (kids)" : ""}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Grau">
              <input
                type="number"
                min={0}
                max={faixa?.grausMaximos ?? 0}
                className={classeInput}
                value={grau}
                onChange={(e) => setGrau(Number(e.target.value))}
              />
            </Campo>
          </div>
          {faixa && (
            <div className="flex justify-center">
              <FaixaVisual faixa={faixa} grau={grau} grausMaximos={faixa.grausMaximos} largura={180} altura={22} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Começou a treinar aqui em">
              <input type="date" className={classeInput} value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </Campo>
            <Campo rotulo="Recebeu esta faixa em">
              <input type="date" className={classeInput} value={faixaDesde} onChange={(e) => setFaixaDesde(e.target.value)} />
            </Campo>
          </div>
          <MensagemErro texto={erro} />
          <div className="flex justify-end gap-2">
            <Botao onClick={aoFechar}>Cancelar</Botao>
            <Botao type="submit" variante="primario" carregando={salvando}>
              Adicionar
            </Botao>
          </div>
        </form>
      )}
    </Modal>
  );
}
