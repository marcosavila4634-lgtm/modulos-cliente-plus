import { ArrowDown, ArrowUp, BookOpen, Pencil, Plus, Settings2, Trash2, Video } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  apiLutas,
  moeda,
  type ConfigLutas,
  type DadosFaixa,
  type FaixaJson,
  type ModalidadeJson,
  type ModeloFaixas,
  type Publico,
  type TecnicaJson,
} from "../../lib/artes-marciais";
import { Botao, Campo, classeInput, Interruptor, MensagemErro, mensagemDe, Modal } from "../academia/formulario";
import { Card, TituloCard, Vazio } from "../academia/ui";
import { FaixaVisual, PontoModalidade } from "./Faixa";

const rotuloPublico: Record<Publico, string> = { adulto: "Adulto", infantil: "Kids", todos: "Todas as idades" };

const modelos: { valor: ModeloFaixas; rotulo: string }[] = [
  { valor: "jiu-jitsu", rotulo: "Jiu-Jitsu (IBJJF: adulto e kids, com graus)" },
  { valor: "judo", rotulo: "Judô (branca à preta)" },
  { valor: "karate", rotulo: "Karatê (branca à preta)" },
  { valor: "taekwondo", rotulo: "Taekwondo (gubs com pontas)" },
  { valor: "muay-thai", rotulo: "Muay Thai (prajieds)" },
  { valor: "niveis", rotulo: "Níveis: iniciante, intermediário, avançado (boxe, MMA...)" },
  { valor: "", rotulo: "Sem faixas (cadastro manual)" },
];

// ---------- Modalidades e faixas ----------

export function AbaFaixas({
  modalidades: inicial,
  config: configInicial,
}: {
  modalidades: ModalidadeJson[];
  config: ConfigLutas;
}) {
  const [modalidades, setModalidades] = useState(inicial);
  const [config, setConfig] = useState(configInicial);
  const [editandoModalidade, setEditandoModalidade] = useState<ModalidadeJson | "nova" | null>(null);
  const [editandoFaixa, setEditandoFaixa] = useState<{ modalidade: ModalidadeJson; faixa: FaixaJson | null } | null>(null);
  const [ajustes, setAjustes] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => setModalidades(inicial), [inicial]);

  async function mover(m: ModalidadeJson, f: FaixaJson, direcao: -1 | 1) {
    const lista = [...m.faixas];
    const i = lista.findIndex((x) => x.id === f.id);
    const j = i + direcao;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    try {
      setModalidades(await apiLutas.ordenarFaixas(m.id, lista.map((x) => x.id)));
    } catch (x) {
      setErro(mensagemDe(x));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ac-muted">
          Cada faixa tem os requisitos para <b className="text-slate-200">sair dela</b>: tempo mínimo, aulas e aulas por grau.
          A idade mínima vale para <b className="text-slate-200">receber</b> a faixa. As aulas contam{" "}
          {config.contarAulasPor === "aulas" ? "pela presença nas aulas da modalidade" : "pelos dias com check-in"}.
        </p>
        <div className="flex gap-2">
          <Botao onClick={() => setAjustes(true)}>
            <Settings2 className="size-4" />
            Como contar as aulas
          </Botao>
          <Botao variante="primario" onClick={() => setEditandoModalidade("nova")}>
            <Plus className="size-4" />
            Nova modalidade
          </Botao>
        </div>
      </div>
      <MensagemErro texto={erro} />

      {modalidades.map((m) => (
        <Card key={m.id} className={m.ativo ? "" : "opacity-60"}>
          <TituloCard
            icone={BookOpen}
            cor="text-red-500"
            acao={
              <div className="flex gap-2">
                <Botao className="!h-8 !px-3 text-xs" onClick={() => setEditandoModalidade(m)}>
                  <Pencil className="size-3.5" />
                  Editar
                </Botao>
                <Botao className="!h-8 !px-3 text-xs" onClick={() => setEditandoFaixa({ modalidade: m, faixa: null })}>
                  <Plus className="size-3.5" />
                  Faixa
                </Botao>
              </div>
            }
          >
            <span className="flex items-center gap-2">
              <PontoModalidade cor={m.cor} />
              {m.nome}
              <span className="text-xs font-normal text-ac-muted">
                {m.alunos} alunos · {m.aulas.length} {m.aulas.length === 1 ? "aula" : "aulas"} na grade
                {!m.ativo && " · desativada"}
              </span>
            </span>
          </TituloCard>
          {m.faixas.length === 0 ? (
            <Vazio icone={BookOpen}>Nenhuma faixa. Toque em "+ Faixa".</Vazio>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead className="text-[11px] tracking-wide text-ac-muted uppercase">
                  <tr className="border-b border-ac-line">
                    <th className="py-2 pr-3 font-medium">Faixa</th>
                    <th className="px-3 font-medium">Público</th>
                    <th className="px-3 font-medium">Graus</th>
                    <th className="px-3 font-medium">Para a próxima</th>
                    <th className="px-3 font-medium">Por grau</th>
                    <th className="px-3 font-medium">Idade mín.</th>
                    <th className="px-3 font-medium">Taxa do exame</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {m.faixas.map((f, i) => (
                    <tr key={f.id} className={`border-b border-ac-line/60 ${f.ativo ? "" : "opacity-50"}`}>
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-3">
                          <FaixaVisual faixa={f} grausMaximos={f.grausMaximos} largura={64} altura={11} />
                          <span className="font-medium text-white">{f.nome}</span>
                        </span>
                      </td>
                      <td className="px-3 text-slate-300">{rotuloPublico[f.publico]}</td>
                      <td className="px-3 text-slate-300">{f.grausMaximos || "—"}</td>
                      <td className="px-3 text-slate-300">
                        {f.mesesMinimos || f.aulasMinimas
                          ? [f.mesesMinimos ? `${f.mesesMinimos} meses` : null, f.aulasMinimas ? `${f.aulasMinimas} aulas` : null]
                              .filter(Boolean)
                              .join(" e ")
                          : "—"}
                      </td>
                      <td className="px-3 text-slate-300">{f.aulasPorGrau ? `${f.aulasPorGrau} aulas` : "—"}</td>
                      <td className="px-3 text-slate-300">{f.idadeMinima ? `${f.idadeMinima} anos` : "—"}</td>
                      <td className="px-3 text-slate-300">{f.taxaExame ? moeda(f.taxaExame) : "Sem taxa"}</td>
                      <td className="py-1 text-right whitespace-nowrap">
                        <button type="button" aria-label="Subir" onClick={() => mover(m, f, -1)} disabled={i === 0} className="rounded p-1 text-ac-muted hover:text-white disabled:opacity-30">
                          <ArrowUp className="size-4" />
                        </button>
                        <button type="button" aria-label="Descer" onClick={() => mover(m, f, 1)} disabled={i === m.faixas.length - 1} className="rounded p-1 text-ac-muted hover:text-white disabled:opacity-30">
                          <ArrowDown className="size-4" />
                        </button>
                        <button type="button" aria-label={`Editar ${f.nome}`} onClick={() => setEditandoFaixa({ modalidade: m, faixa: f })} className="rounded p-1 text-ac-muted hover:text-white">
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
      ))}

      {editandoModalidade && (
        <ModalModalidade
          modalidade={editandoModalidade === "nova" ? null : editandoModalidade}
          aoFechar={() => setEditandoModalidade(null)}
          aoSalvar={(lista) => {
            setModalidades(lista);
            setEditandoModalidade(null);
          }}
        />
      )}
      {editandoFaixa && (
        <ModalFaixa
          {...editandoFaixa}
          aoFechar={() => setEditandoFaixa(null)}
          aoSalvar={(lista) => {
            setModalidades(lista);
            setEditandoFaixa(null);
          }}
        />
      )}
      {ajustes && (
        <ModalAjustes
          config={config}
          aoFechar={() => setAjustes(false)}
          aoSalvar={(c) => {
            setConfig(c);
            setAjustes(false);
          }}
        />
      )}
    </div>
  );
}

function ModalModalidade({
  modalidade,
  aoFechar,
  aoSalvar,
}: {
  modalidade: ModalidadeJson | null;
  aoFechar: () => void;
  aoSalvar: (lista: ModalidadeJson[]) => void;
}) {
  const [nome, setNome] = useState(modalidade?.nome ?? "");
  const [cor, setCor] = useState(modalidade?.cor ?? "#ef4444");
  const [modelo, setModelo] = useState<ModeloFaixas>("jiu-jitsu");
  const [ativo, setAtivo] = useState(modalidade?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(
        modalidade
          ? await apiLutas.salvarModalidade(modalidade.id, { nome, cor, ativo })
          : await apiLutas.criarModalidade({ nome, cor, modelo }),
      );
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={modalidade ? "Editar modalidade" : "Nova modalidade"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_90px] gap-3">
          <Campo rotulo="Nome">
            <input className={classeInput} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Jiu-Jitsu" autoFocus />
          </Campo>
          <Campo rotulo="Cor">
            <input type="color" className={`${classeInput} !p-1`} value={cor} onChange={(e) => setCor(e.target.value)} />
          </Campo>
        </div>
        {!modalidade && (
          <Campo rotulo="Sistema de faixas (dá para mudar tudo depois)">
            <select className={classeInput} value={modelo} onChange={(e) => setModelo(e.target.value as ModeloFaixas)}>
              {modelos.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.rotulo}
                </option>
              ))}
            </select>
          </Campo>
        )}
        {modalidade && (
          <Interruptor ligado={ativo} aoMudar={setAtivo} titulo="Modalidade ativa" descricao="Desativada não aparece nos gráficos nem para novos alunos." />
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

function ModalFaixa({
  modalidade,
  faixa,
  aoFechar,
  aoSalvar,
}: {
  modalidade: ModalidadeJson;
  faixa: FaixaJson | null;
  aoFechar: () => void;
  aoSalvar: (lista: ModalidadeJson[]) => void;
}) {
  const [d, setD] = useState<DadosFaixa>({
    nome: faixa?.nome ?? "",
    cor: faixa?.cor ?? "#2563eb",
    corPonta: faixa?.corPonta ?? null,
    publico: faixa?.publico ?? "todos",
    grausMaximos: faixa?.grausMaximos ?? 4,
    mesesMinimos: faixa?.mesesMinimos ?? 6,
    aulasMinimas: faixa?.aulasMinimas ?? 48,
    aulasPorGrau: faixa?.aulasPorGrau ?? 12,
    idadeMinima: faixa?.idadeMinima ?? null,
    taxaExame: faixa?.taxaExame ?? 0,
    ativo: faixa?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = <K extends keyof DadosFaixa>(k: K, v: DadosFaixa[K]) => setD((x) => ({ ...x, [k]: v }));
  const numero = (v: string) => (v === "" ? 0 : Number(v));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(faixa ? await apiLutas.salvarFaixa(faixa.id, d) : await apiLutas.criarFaixa(modalidade.id, d));
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!faixa || !confirm(`Tirar a faixa ${faixa.nome}? Se alguém já usou, ela só é desativada.`)) return;
    try {
      aoSalvar(await apiLutas.excluirFaixa(faixa.id));
    } catch (x) {
      setErro(mensagemDe(x));
    }
  }

  return (
    <Modal titulo={faixa ? `Faixa ${faixa.nome}` : "Nova faixa"} subtitulo={modalidade.nome} aoFechar={aoFechar} largura="max-w-xl">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="flex justify-center rounded-xl border border-ac-line bg-ac-bg/40 py-4">
          <FaixaVisual faixa={d} grau={d.grausMaximos} grausMaximos={d.grausMaximos} largura={220} altura={26} />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_80px_130px]">
          <Campo rotulo="Nome">
            <input className={classeInput} value={d.nome} onChange={(e) => mudar("nome", e.target.value)} placeholder="Ex.: Azul" />
          </Campo>
          <Campo rotulo="Cor">
            <input type="color" className={`${classeInput} !p-1`} value={d.cor} onChange={(e) => mudar("cor", e.target.value)} />
          </Campo>
          <Campo rotulo="Listra (opcional)">
            <div className="flex gap-2">
              <input
                type="color"
                className={`${classeInput} !p-1`}
                value={d.corPonta ?? "#ffffff"}
                onChange={(e) => mudar("corPonta", e.target.value)}
              />
              {d.corPonta && (
                <button type="button" onClick={() => mudar("corPonta", null)} className="text-xs text-ac-muted hover:text-white">
                  tirar
                </button>
              )}
            </div>
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Público">
            <select className={classeInput} value={d.publico} onChange={(e) => mudar("publico", e.target.value as Publico)}>
              <option value="todos">Todas as idades</option>
              <option value="adulto">Adulto</option>
              <option value="infantil">Kids</option>
            </select>
          </Campo>
          <Campo rotulo="Graus (0 = sem graus)">
            <input type="number" min={0} max={10} className={classeInput} value={d.grausMaximos} onChange={(e) => mudar("grausMaximos", numero(e.target.value))} />
          </Campo>
          <Campo rotulo="Idade mínima">
            <input
              type="number"
              min={0}
              max={99}
              className={classeInput}
              value={d.idadeMinima ?? ""}
              placeholder="—"
              onChange={(e) => mudar("idadeMinima", e.target.value === "" ? null : Number(e.target.value))}
            />
          </Campo>
        </div>
        <div className="rounded-xl border border-ac-line p-3">
          <div className="text-xs font-semibold text-slate-200">Para sair desta faixa (0 = não exige)</div>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Campo rotulo="Meses na faixa">
              <input type="number" min={0} className={classeInput} value={d.mesesMinimos} onChange={(e) => mudar("mesesMinimos", numero(e.target.value))} />
            </Campo>
            <Campo rotulo="Aulas na faixa">
              <input type="number" min={0} className={classeInput} value={d.aulasMinimas} onChange={(e) => mudar("aulasMinimas", numero(e.target.value))} />
            </Campo>
            <Campo rotulo="Aulas por grau">
              <input type="number" min={0} className={classeInput} value={d.aulasPorGrau} onChange={(e) => mudar("aulasPorGrau", numero(e.target.value))} />
            </Campo>
          </div>
        </div>
        <Campo rotulo="Taxa do exame para RECEBER esta faixa (R$)">
          <input type="number" min={0} step="0.01" className={classeInput} value={d.taxaExame} onChange={(e) => mudar("taxaExame", numero(e.target.value))} />
        </Campo>
        <Interruptor ligado={d.ativo} aoMudar={(v) => mudar("ativo", v)} titulo="Faixa em uso" />
        <MensagemErro texto={erro} />
        <div className="flex flex-wrap justify-between gap-2">
          {faixa ? (
            <Botao variante="perigo" onClick={excluir}>
              <Trash2 className="size-4" />
              Tirar faixa
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

function ModalAjustes({
  config,
  aoFechar,
  aoSalvar,
}: {
  config: ConfigLutas;
  aoFechar: () => void;
  aoSalvar: (c: ConfigLutas) => void;
}) {
  const [contar, setContar] = useState(config.contarAulasPor);
  const [idade, setIdade] = useState(config.idadeAdulto);
  const [lema, setLema] = useState(config.lema);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      aoSalvar(await apiLutas.salvarConfig({ contarAulasPor: contar, idadeAdulto: idade, lema }));
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }
  return (
    <Modal titulo="Como contar as aulas" aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {(
          [
            ["aulas", "Presença nas aulas", "Conta a chamada (ou o QR Code) das aulas de cada modalidade. Mais justo para quem treina mais de uma."],
            ["checkins", "Dias com check-in", "Cada dia com entrada na academia conta uma aula, em todas as modalidades do aluno."],
          ] as const
        ).map(([valor, titulo, texto]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setContar(valor)}
            className={`rounded-xl border px-3 py-2.5 text-left ${contar === valor ? "border-red-500/70 bg-red-500/10" : "border-ac-line hover:bg-white/5"}`}
          >
            <div className="text-sm font-semibold text-white">{titulo}</div>
            <div className="text-xs text-ac-muted">{texto}</div>
          </button>
        ))}
        <Campo rotulo="Até que idade o aluno usa as faixas kids">
          <input type="number" min={4} max={21} className={classeInput} value={idade} onChange={(e) => setIdade(Number(e.target.value))} />
        </Campo>
        <Campo rotulo="Lema da academia (rodapé do painel)">
          <input className={classeInput} value={lema} onChange={(e) => setLema(e.target.value)} />
        </Campo>
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

// ---------- Currículo ----------

export function AbaCurriculo({ modalidades }: { modalidades: ModalidadeJson[] }) {
  const ativas = modalidades.filter((m) => m.ativo);
  const [modalidadeId, setModalidadeId] = useState(ativas[0]?.id ?? "");
  const [tecnicas, setTecnicas] = useState<TecnicaJson[] | null>(null);
  const [editando, setEditando] = useState<TecnicaJson | "nova" | null>(null);
  const modalidade = ativas.find((m) => m.id === modalidadeId);

  useEffect(() => {
    if (!modalidadeId) return;
    setTecnicas(null);
    apiLutas.curriculo(modalidadeId).then(setTecnicas);
  }, [modalidadeId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ativas.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModalidadeId(m.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                m.id === modalidadeId ? "bg-violet-600/25 text-white ring-1 ring-violet-500/60" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <PontoModalidade cor={m.cor} />
              {m.nome}
            </button>
          ))}
        </div>
        <Botao variante="primario" onClick={() => setEditando("nova")} disabled={!modalidade}>
          <Plus className="size-4" />
          Nova técnica
        </Botao>
      </div>
      <p className="text-sm text-ac-muted">
        O que o aluno precisa aprender em cada faixa. Aparece na área do aluno ("O que estudar") e ajuda a banca no exame.
      </p>
      {!tecnicas ? (
        <Card>
          <p className="text-sm text-ac-muted">Carregando...</p>
        </Card>
      ) : (
        (modalidade?.faixas ?? []).map((f) => {
          const lista = tecnicas.filter((t) => t.faixaId === f.id);
          if (lista.length === 0) return null;
          return (
            <Card key={f.id}>
              <div className="flex items-center gap-3">
                <FaixaVisual faixa={f} grausMaximos={f.grausMaximos} largura={56} altura={11} />
                <h3 className="font-poppins text-[15px] font-semibold text-white">Faixa {f.nome}</h3>
                <span className="text-xs text-ac-muted">{lista.length} técnicas</span>
              </div>
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {lista.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold tracking-wide text-red-400 uppercase">{t.categoria || "Técnica"}</div>
                      <div className="text-sm font-medium text-white">{t.nome}</div>
                      {t.descricao && <div className="text-xs text-ac-muted">{t.descricao}</div>}
                    </div>
                    {t.videoUrl && (
                      <a href={t.videoUrl} target="_blank" rel="noreferrer" aria-label="Ver vídeo" className="rounded p-1 text-ac-muted hover:text-white">
                        <Video className="size-4" />
                      </a>
                    )}
                    <button type="button" aria-label={`Editar ${t.nome}`} onClick={() => setEditando(t)} className="rounded p-1 text-ac-muted hover:text-white">
                      <Pencil className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}
      {tecnicas && tecnicas.length === 0 && (
        <Card>
          <Vazio icone={BookOpen}>Nenhuma técnica no currículo de {modalidade?.nome}. Toque em "Nova técnica".</Vazio>
        </Card>
      )}
      {editando && modalidade && (
        <ModalTecnica
          modalidade={modalidade}
          tecnica={editando === "nova" ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={(lista) => {
            setTecnicas(lista);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function ModalTecnica({
  modalidade,
  tecnica,
  aoFechar,
  aoSalvar,
}: {
  modalidade: ModalidadeJson;
  tecnica: TecnicaJson | null;
  aoFechar: () => void;
  aoSalvar: (lista: TecnicaJson[]) => void;
}) {
  const [d, setD] = useState({
    faixaId: tecnica?.faixaId ?? modalidade.faixas[0]?.id ?? "",
    categoria: tecnica?.categoria ?? "",
    nome: tecnica?.nome ?? "",
    descricao: tecnica?.descricao ?? "",
    videoUrl: tecnica?.videoUrl ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(await apiLutas.salvarTecnica(modalidade.id, tecnica?.id ?? null, d));
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={tecnica ? "Editar técnica" : "Nova técnica"} subtitulo={modalidade.nome} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Faixa">
            <select className={classeInput} value={d.faixaId} onChange={(e) => setD({ ...d, faixaId: e.target.value })}>
              {modalidade.faixas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Grupo (ex.: Quedas, Guarda)">
            <input className={classeInput} value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })} />
          </Campo>
        </div>
        <Campo rotulo="Técnica">
          <input className={classeInput} value={d.nome} onChange={(e) => setD({ ...d, nome: e.target.value })} autoFocus />
        </Campo>
        <Campo rotulo="Detalhes">
          <input className={classeInput} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} />
        </Campo>
        <Campo rotulo="Link de vídeo (YouTube, opcional)">
          <input className={classeInput} value={d.videoUrl} onChange={(e) => setD({ ...d, videoUrl: e.target.value })} placeholder="https://" />
        </Campo>
        <MensagemErro texto={erro} />
        <div className="flex flex-wrap justify-between gap-2">
          {tecnica ? (
            <Botao
              variante="perigo"
              onClick={async () => {
                try {
                  aoSalvar(await apiLutas.excluirTecnica(modalidade.id, tecnica.id));
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
