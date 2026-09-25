import { createFileRoute, Link, useBlocker, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ExternalLink,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { MiniaturaExercicio } from "../../../components/academia/MidiaExercicio";
import { ModalEscolherExercicio } from "../../../components/academia/ModalEscolherExercicio";
import { SeloFicha } from "../../../components/academia/Selos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../../components/academia/formulario";
import { Card } from "../../../components/academia/ui";
import {
  apiTreinos,
  descanso,
  rotuloGrupo,
  type DadosFicha,
  type Exercicio,
  type Ficha,
  type Profissional,
} from "../../../lib/academia-treinos";

// Editor de ficha de treino: serve para modelos e para fichas de alunos.
export const Route = createFileRoute("/academia/treinos/$fichaId")({
  loader: async ({ params }) => {
    const [ficha, profissionais, exercicios] = await Promise.all([
      apiTreinos.ficha(params.fichaId),
      apiTreinos.profissionais(),
      apiTreinos.exercicios(),
    ]);
    return { ficha, profissionais, exercicios };
  },
  component: PaginaEditor,
});

const MAX_TREINOS = 7;
const DESCANSOS = [0, 15, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

// ---------- Estado do editor ----------

let contador = 0;
const novaChave = () => `k${++contador}`;

type ItemEdicao = {
  chave: string;
  exercicio: Exercicio;
  series: number | null;
  repeticoes: string;
  carga: string;
  descansoSegundos: number | null;
  observacao: string;
};

type TreinoEdicao = { chave: string; nome: string; itens: ItemEdicao[] };

type Edicao = Omit<DadosFicha, "treinos"> & { treinos: TreinoEdicao[] };

function paraEdicao(f: Ficha): Edicao {
  return {
    nome: f.nome,
    objetivo: f.objetivo,
    observacoes: f.observacoes,
    professorId: f.professor?.id ?? null,
    inicio: f.inicio,
    validade: f.validade,
    treinos: f.treinos.map((t) => ({
      chave: novaChave(),
      nome: t.nome,
      itens: t.exercicios.map((i) => ({ ...i, chave: novaChave() })),
    })),
  };
}

function paraDados(e: Edicao): DadosFicha {
  return {
    ...e,
    treinos: e.treinos.map((t) => ({
      nome: t.nome,
      exercicios: t.itens.map((i) => ({
        exercicioId: i.exercicio.id,
        series: i.series,
        repeticoes: i.repeticoes,
        carga: i.carga,
        descansoSegundos: i.descansoSegundos,
        observacao: i.observacao,
      })),
    })),
  };
}

const letra = (indice: number) => String.fromCharCode(65 + indice);

// "2026-09-25" + 56 dias -> "2026-11-20"
function somarDias(iso: string, dias: number) {
  const [a, m, d] = iso.split("-").map(Number);
  const data = new Date(a, m - 1, d + dias);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function PaginaEditor() {
  const dados = Route.useLoaderData();
  const [salvo, setSalvo] = useState(false);
  // Depois de salvar, os dados recarregam e o editor recomeça com eles.
  return (
    <Editor
      key={`${dados.ficha.id}-${dados.ficha.atualizadaEm}`}
      {...dados}
      salvo={salvo}
      aoSalvar={() => setSalvo(true)}
      aoAlterar={() => setSalvo(false)}
    />
  );
}

function Editor({
  ficha,
  profissionais,
  exercicios,
  salvo,
  aoSalvar,
  aoAlterar,
}: {
  ficha: Ficha;
  profissionais: Profissional[];
  exercicios: Exercicio[];
  salvo: boolean;
  aoSalvar: () => void;
  aoAlterar: () => void;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const [edicao, setEdicao] = useState(() => paraEdicao(ficha));
  const [aba, setAba] = useState(0);
  const [alterado, setAlterado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [escolhendo, setEscolhendo] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Avisa antes de sair da tela com alterações não salvas.
  useBlocker({
    shouldBlockFn: () => alterado && !window.confirm("Sair sem salvar as alterações da ficha?"),
    enableBeforeUnload: () => alterado,
  });

  const mudar = (fn: (e: Edicao) => Edicao) => {
    setEdicao(fn);
    setAlterado(true);
    aoAlterar();
  };
  const mudarTreino = (indice: number, fn: (t: TreinoEdicao) => TreinoEdicao) =>
    mudar((e) => ({ ...e, treinos: e.treinos.map((t, i) => (i === indice ? fn(t) : t)) }));
  const mudarItem = (chave: string, campos: Partial<ItemEdicao>) =>
    mudarTreino(aba, (t) => ({ ...t, itens: t.itens.map((i) => (i.chave === chave ? { ...i, ...campos } : i)) }));

  function moverItem(indice: number, direcao: -1 | 1) {
    mudarTreino(aba, (t) => {
      const itens = [...t.itens];
      const destino = indice + direcao;
      if (destino < 0 || destino >= itens.length) return t;
      [itens[indice], itens[destino]] = [itens[destino], itens[indice]];
      return { ...t, itens };
    });
  }

  function adicionarTreino() {
    mudar((e) => ({ ...e, treinos: [...e.treinos, { chave: novaChave(), nome: "", itens: [] }] }));
    setAba(edicao.treinos.length);
  }

  function removerTreino(indice: number) {
    const t = edicao.treinos[indice];
    if (t.itens.length > 0 && !window.confirm(`Remover o Treino ${letra(indice)} e seus ${t.itens.length} exercícios?`)) {
      return;
    }
    mudar((e) => ({ ...e, treinos: e.treinos.filter((_, i) => i !== indice) }));
    setAba(Math.max(0, Math.min(aba, edicao.treinos.length - 2)));
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await apiTreinos.salvarFicha(ficha.id, paraDados(edicao));
      setAlterado(false);
      aoSalvar();
      await router.invalidate();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  const treino = edicao.treinos[aba];
  const professoresAtivos = profissionais.filter((p) => p.ativo || p.id === edicao.professorId);

  return (
    <div className="flex flex-col gap-5 pt-4">
      <Link
        {...(ficha.aluno
          ? { to: "/academia/alunos/$id", params: { id: ficha.aluno.id } }
          : { to: "/academia/treinos", search: { aba: "modelos" } })}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-ac-muted hover:text-white"
      >
        <ArrowLeft className="size-4" />
        {ficha.aluno ? ficha.aluno.nome : "Modelos de treino"}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-poppins text-2xl font-bold text-white">
          {ficha.modelo ? "Modelo de treino" : `Ficha de treino · ${ficha.aluno?.nome}`}
        </h1>
        {!ficha.modelo && <SeloFicha situacao={ficha.situacao} />}
        {ficha.status === "encerrada" && (
          <span className="rounded-full bg-slate-500/20 px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-300">
            Encerrada (histórico)
          </span>
        )}
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Campo rotulo="Nome da ficha *">
            <input
              className={classeInput}
              value={edicao.nome}
              onChange={(e) => mudar((x) => ({ ...x, nome: e.target.value }))}
            />
          </Campo>
          <Campo rotulo="Objetivo">
            <input
              className={classeInput}
              value={edicao.objetivo}
              onChange={(e) => mudar((x) => ({ ...x, objetivo: e.target.value }))}
              placeholder="Ex.: Ganho de massa muscular"
            />
          </Campo>
          <Campo rotulo="Professor responsável *">
            <select
              className={classeInput}
              value={edicao.professorId ?? ""}
              onChange={(e) => mudar((x) => ({ ...x, professorId: e.target.value || null }))}
            >
              <option value="">Escolha...</option>
              {professoresAtivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Campo>
          {!ficha.modelo && (
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Início *">
                <input
                  type="date"
                  className={classeInput}
                  value={edicao.inicio ?? ""}
                  onChange={(e) => mudar((x) => ({ ...x, inicio: e.target.value || null }))}
                />
              </Campo>
              <Campo rotulo="Validade *">
                <input
                  type="date"
                  className={classeInput}
                  value={edicao.validade ?? ""}
                  onChange={(e) => mudar((x) => ({ ...x, validade: e.target.value || null }))}
                />
              </Campo>
            </div>
          )}
        </div>
        {!ficha.modelo && edicao.inicio && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-xs text-ac-muted">
            Validade rápida:
            {[4, 6, 8, 12].map((semanas) => (
              <button
                key={semanas}
                type="button"
                onClick={() => mudar((x) => ({ ...x, validade: somarDias(x.inicio!, semanas * 7) }))}
                className="rounded-md border border-ac-line px-2 py-0.5 text-slate-300 hover:border-violet-500/60 hover:text-white"
              >
                {semanas} semanas
              </button>
            ))}
          </div>
        )}
        <Campo rotulo="Observações (aparecem para o aluno)" className="mt-4">
          <textarea
            rows={2}
            className={`${classeInput} h-auto py-2.5`}
            value={edicao.observacoes}
            onChange={(e) => mudar((x) => ({ ...x, observacoes: e.target.value }))}
            placeholder="Ex.: Aquecer 5 minutos antes. Beber água entre as séries."
          />
        </Campo>
      </Card>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-ac-line p-3">
          {edicao.treinos.map((t, i) => (
            <button
              key={t.chave}
              type="button"
              onClick={() => setAba(i)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                aba === i ? "bg-violet-600/30 text-white ring-1 ring-violet-500/60" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              Treino {letra(i)}
              <span className="ml-1.5 text-xs font-normal text-ac-muted">{t.itens.length}</span>
            </button>
          ))}
          {edicao.treinos.length < MAX_TREINOS && (
            <button
              type="button"
              onClick={adicionarTreino}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] text-violet-300 hover:bg-white/5"
            >
              <Plus className="size-4" />
              Treino {letra(edicao.treinos.length)}
            </button>
          )}
        </div>

        {treino && (
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-end gap-3">
              <Campo rotulo={`Nome do Treino ${letra(aba)}`} className="min-w-0 flex-1">
                <input
                  className={classeInput}
                  value={treino.nome}
                  onChange={(e) => mudarTreino(aba, (t) => ({ ...t, nome: e.target.value }))}
                  placeholder="Ex.: Peito e tríceps"
                />
              </Campo>
              {edicao.treinos.length > 1 && (
                <Botao variante="perigo" onClick={() => removerTreino(aba)}>
                  <Trash2 className="size-4" />
                  Remover treino
                </Botao>
              )}
            </div>

            <ol className="mt-4 flex flex-col gap-3">
              {treino.itens.map((item, i) => (
                <LinhaExercicio
                  key={item.chave}
                  numero={i + 1}
                  item={item}
                  primeiro={i === 0}
                  ultimo={i === treino.itens.length - 1}
                  aoMudar={(campos) => mudarItem(item.chave, campos)}
                  aoMover={(direcao) => moverItem(i, direcao)}
                  aoRemover={() =>
                    mudarTreino(aba, (t) => ({ ...t, itens: t.itens.filter((x) => x.chave !== item.chave) }))
                  }
                />
              ))}
            </ol>
            {treino.itens.length === 0 && (
              <p className="py-6 text-center text-sm text-ac-muted">Nenhum exercício neste treino ainda.</p>
            )}

            <button
              type="button"
              onClick={() => setEscolhendo(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ac-line py-3 text-sm font-medium text-violet-300 transition hover:border-violet-500/60 hover:bg-violet-500/5"
            >
              <Plus className="size-4" />
              Adicionar exercícios
            </button>
          </div>
        )}
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-ac-line bg-ac-bg/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <Botao variante="primario" carregando={salvando} onClick={salvar}>
          <Save className="size-4" />
          Salvar ficha
        </Botao>
        {alterado ? (
          <span className="text-xs text-amber-300">Alterações não salvas</span>
        ) : (
          salvo && (
            <span className="flex items-center gap-1 text-xs text-emerald-300">
              <Check className="size-4" />
              Ficha salva
            </span>
          )
        )}
        <div className="min-w-0 flex-1">
          <MensagemErro texto={erro} />
        </div>
        {ficha.aluno ? (
          <a
            href={`/cliente/${ficha.aluno.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300"
          >
            <ExternalLink className="size-4" />
            Ver como o aluno vê
          </a>
        ) : (
          <Botao variante="perigo" onClick={() => setExcluindo(true)}>
            <Trash2 className="size-4" />
            Excluir modelo
          </Botao>
        )}
      </div>

      {escolhendo && treino && (
        <ModalEscolherExercicio
          exercicios={exercicios}
          treino={`Treino ${letra(aba)}${treino.nome ? ` · ${treino.nome}` : ""}`}
          aoFechar={() => setEscolhendo(false)}
          aoAdicionar={(e) =>
            mudarTreino(aba, (t) => ({
              ...t,
              itens: [
                ...t.itens,
                {
                  chave: novaChave(),
                  exercicio: e,
                  series: e.grupoMuscular === "cardio" ? 1 : 3,
                  repeticoes: e.grupoMuscular === "cardio" ? "10 min" : "12",
                  carga: "",
                  descansoSegundos: e.grupoMuscular === "cardio" ? null : 60,
                  observacao: "",
                },
              ],
            }))
          }
        />
      )}

      {excluindo && (
        <Modal titulo="Excluir modelo?" subtitulo={ficha.nome} aoFechar={() => setExcluindo(false)}>
          <p className="text-sm text-slate-300">
            O modelo deixa de aparecer para montar novas fichas. As fichas de alunos que já foram montadas a partir dele
            continuam iguais.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Botao onClick={() => setExcluindo(false)}>Voltar</Botao>
            <Botao
              variante="perigo"
              onClick={async () => {
                await apiTreinos.excluirFicha(ficha.id);
                setAlterado(false);
                navigate({ to: "/academia/treinos", search: { aba: "modelos" } });
              }}
            >
              Sim, excluir
            </Botao>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LinhaExercicio({
  numero,
  item,
  primeiro,
  ultimo,
  aoMudar,
  aoMover,
  aoRemover,
}: {
  numero: number;
  item: ItemEdicao;
  primeiro: boolean;
  ultimo: boolean;
  aoMudar: (campos: Partial<ItemEdicao>) => void;
  aoMover: (direcao: -1 | 1) => void;
  aoRemover: () => void;
}) {
  const campoPequeno = `${classeInput} h-9 text-[13px]`;
  const opcoesDescanso =
    item.descansoSegundos !== null && !DESCANSOS.includes(item.descansoSegundos)
      ? [...DESCANSOS, item.descansoSegundos].sort((a, b) => a - b)
      : DESCANSOS;
  const botaoIcone = "rounded-lg p-1.5 text-ac-muted hover:bg-white/5 hover:text-white disabled:opacity-30";

  return (
    <li className="rounded-xl border border-ac-line bg-ac-bg/40 p-3">
      <div className="flex items-center gap-3">
        <span className="w-5 text-center text-sm font-semibold text-ac-muted">{numero}</span>
        <MiniaturaExercicio exercicio={item.exercicio} className="size-10 rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{item.exercicio.nome}</div>
          <div className="truncate text-xs text-ac-muted">
            {rotuloGrupo[item.exercicio.grupoMuscular]} · {item.exercicio.equipamento || "—"}
          </div>
        </div>
        <button type="button" aria-label="Subir" disabled={primeiro} onClick={() => aoMover(-1)} className={botaoIcone}>
          <ArrowUp className="size-4" />
        </button>
        <button type="button" aria-label="Descer" disabled={ultimo} onClick={() => aoMover(1)} className={botaoIcone}>
          <ArrowDown className="size-4" />
        </button>
        <button type="button" aria-label="Remover" onClick={aoRemover} className={`${botaoIcone} hover:text-red-300`}>
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:pl-8 xl:grid-cols-[90px_140px_140px_150px_minmax(0,1fr)] xl:items-end">
        <Campo rotulo="Séries">
          <input
            type="number"
            min={1}
            max={20}
            className={campoPequeno}
            value={item.series ?? ""}
            onChange={(e) => aoMudar({ series: e.target.value ? Number(e.target.value) : null })}
          />
        </Campo>
        <Campo rotulo="Repetições">
          <input
            className={campoPequeno}
            value={item.repeticoes}
            onChange={(e) => aoMudar({ repeticoes: e.target.value })}
            placeholder="Ex.: 10 a 12"
          />
        </Campo>
        <Campo rotulo="Carga">
          <input
            className={campoPequeno}
            value={item.carga}
            onChange={(e) => aoMudar({ carga: e.target.value })}
            placeholder="Ex.: 20 kg"
          />
        </Campo>
        <Campo rotulo="Descanso">
          <select
            className={campoPequeno}
            value={item.descansoSegundos ?? ""}
            onChange={(e) => aoMudar({ descansoSegundos: e.target.value === "" ? null : Number(e.target.value) })}
          >
            <option value="">—</option>
            {opcoesDescanso.map((s) => (
              <option key={s} value={s}>
                {s === 0 ? "Sem descanso" : descanso(s)}
              </option>
            ))}
          </select>
        </Campo>
        <input
          className={`${campoPequeno} col-span-2 sm:col-span-4 xl:col-span-1`}
          value={item.observacao}
          onChange={(e) => aoMudar({ observacao: e.target.value })}
          placeholder="Observação para o aluno (opcional)"
        />
      </div>
    </li>
  );
}
