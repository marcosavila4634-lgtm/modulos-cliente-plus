import { createFileRoute } from "@tanstack/react-router";
import { Check, Megaphone, MessageCircle, Newspaper, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Botao, Campo, classeInput, Interruptor, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { CabecalhoPagina, Card, CardNumero, Vazio } from "../../components/academia/ui";
import { apiAgenda } from "../../lib/academia-agenda";
import {
  apiLutas,
  data,
  linkWhatsapp,
  rotuloPublico,
  type ComunicadoDetalhe,
  type ComunicadoJson,
  type DadosComunicado,
  type ModalidadeJson,
  type PublicoComunicado,
} from "../../lib/artes-marciais";

// Comunicação (Artes Marciais): avisos para um público (todos, modalidade,
// faixa, turma, inadimplentes, aniversariantes, kids...). No WhatsApp cada
// um recebe com o próprio nome (a recepção toca "Enviar"); no mural aparece
// na área do aluno.
export const Route = createFileRoute("/academia/comunicacao")({
  loader: async () => {
    const [comunicados, modalidades, aulas] = await Promise.all([
      apiLutas.comunicados(),
      apiLutas.modalidades(),
      apiAgenda.grade(),
    ]);
    return { comunicados, modalidades, aulas: aulas.aulas.filter((a) => a.ativo).map((a) => ({ id: a.id, nome: a.nome })) };
  },
  component: PaginaComunicacao,
});

function PaginaComunicacao() {
  const inicial = Route.useLoaderData();
  const [lista, setLista] = useState<ComunicadoJson[]>(inicial.comunicados);
  const [novo, setNovo] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);
  const enviados = lista.reduce((s, c) => s + c.enviados, 0);
  const pendentes = lista.reduce((s, c) => s + (c.destinatarios - c.enviados), 0);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Comunicação"
        descricao="Avisos para os alunos por WhatsApp (com o nome de cada um) e no mural da área do aluno. Os kids recebem pelo responsável."
      >
        <Botao variante="primario" onClick={() => setNovo(true)}>
          <Plus className="size-4" />
          Novo aviso
        </Botao>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CardNumero icone={Megaphone} cor="bg-red-500/15 text-red-300" rotulo="Avisos">
          <span className="font-poppins text-[26px] font-bold text-white">{lista.length}</span>
        </CardNumero>
        <CardNumero icone={Send} cor="bg-emerald-500/15 text-emerald-300" rotulo="Mensagens enviadas">
          <span className="font-poppins text-[26px] font-bold text-white">{enviados}</span>
        </CardNumero>
        <CardNumero icone={MessageCircle} cor="bg-amber-500/15 text-amber-300" rotulo="Falta enviar" className="col-span-2 xl:col-span-1">
          <span className="font-poppins text-[26px] font-bold text-white">{pendentes}</span>
        </CardNumero>
      </div>

      {lista.length === 0 ? (
        <Card>
          <Vazio icone={Megaphone}>Nenhum aviso ainda.</Vazio>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((c) => (
            <Card key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ac-muted">
                    <span>{data(c.criadoEm)}</span>
                    <span>·</span>
                    <span>
                      {rotuloPublico[c.publico]}
                      {c.filtro && `: ${c.filtro}`}
                    </span>
                    {c.mural && (
                      <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-1.5 text-sky-300">
                        <Newspaper className="size-3" />
                        mural{c.muralAte && ` até ${data(c.muralAte)}`}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-semibold text-white">{c.titulo}</div>
                  <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-slate-300">{c.texto}</p>
                </div>
                {c.whatsapp && (
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-ac-muted">
                      <b className="text-white">{c.enviados}</b> de {c.destinatarios} enviados
                    </div>
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-ac-line">
                      <div className="h-full bg-emerald-500" style={{ width: `${c.destinatarios ? (c.enviados * 100) / c.destinatarios : 0}%` }} />
                    </div>
                    <Botao className="!h-8 !px-3 text-xs" onClick={() => setAberto(c.id)}>
                      <MessageCircle className="size-3.5" />
                      Enviar pelo WhatsApp
                    </Botao>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {novo && (
        <ModalNovo
          modalidades={inicial.modalidades}
          aulas={inicial.aulas}
          aoFechar={() => setNovo(false)}
          aoCriar={async (d) => {
            setNovo(false);
            setLista(await apiLutas.comunicados());
            if (d.comunicado.whatsapp) setAberto(d.comunicado.id);
          }}
        />
      )}
      {aberto && (
        <ModalEnvios
          id={aberto}
          aoFechar={async () => {
            setAberto(null);
            setLista(await apiLutas.comunicados());
          }}
          aoExcluir={(l) => {
            setAberto(null);
            setLista(l);
          }}
        />
      )}
    </div>
  );
}

const variaveis = ["{nome}", "{responsavel}", "{faixa}", "{academia}"];

function ModalNovo({
  modalidades,
  aulas,
  aoFechar,
  aoCriar,
}: {
  modalidades: ModalidadeJson[];
  aulas: { id: string; nome: string }[];
  aoFechar: () => void;
  aoCriar: (d: ComunicadoDetalhe) => void;
}) {
  const [d, setD] = useState<DadosComunicado>({
    titulo: "",
    texto: "Olá, {nome}! ",
    publico: "todos",
    filtroId: null,
    whatsapp: true,
    mural: true,
    muralAte: null,
  });
  const [previa, setPrevia] = useState<{ destinatarios: number; exemplos: string[]; semTelefone: number } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = <K extends keyof DadosComunicado>(k: K, v: DadosComunicado[K]) => setD((x) => ({ ...x, [k]: v }));
  const faixas = modalidades.flatMap((m) => m.faixas.filter((f) => f.ativo).map((f) => ({ id: f.id, nome: `${m.nome} · ${f.nome}` })));
  const opcoesFiltro =
    d.publico === "modalidade" ? modalidades.map((m) => ({ id: m.id, nome: m.nome })) : d.publico === "faixa" ? faixas : d.publico === "aula" ? aulas : null;

  useEffect(() => {
    if (opcoesFiltro && !d.filtroId) return setPrevia(null);
    const t = setTimeout(() => {
      apiLutas.previa(d).then(setPrevia).catch(() => setPrevia(null));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.publico, d.filtroId, d.texto]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoCriar(await apiLutas.criarComunicado(d));
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Novo aviso" aoFechar={aoFechar} largura="max-w-2xl">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Para quem">
            <select
              className={classeInput}
              value={d.publico}
              onChange={(e) => setD({ ...d, publico: e.target.value as PublicoComunicado, filtroId: null })}
            >
              {(Object.keys(rotuloPublico) as PublicoComunicado[]).map((p) => (
                <option key={p} value={p}>
                  {rotuloPublico[p]}
                </option>
              ))}
            </select>
          </Campo>
          {opcoesFiltro && (
            <Campo rotulo="Qual">
              <select className={classeInput} value={d.filtroId ?? ""} onChange={(e) => mudar("filtroId", e.target.value || null)}>
                <option value="">Escolha</option>
                {opcoesFiltro.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </Campo>
          )}
        </div>
        <Campo rotulo="Título (aparece no mural)">
          <input className={classeInput} value={d.titulo} onChange={(e) => mudar("titulo", e.target.value)} placeholder="Ex.: Exame de faixa no sábado" />
        </Campo>
        <Campo rotulo="Mensagem">
          <textarea rows={5} className={`${classeInput} h-auto py-2`} value={d.texto} onChange={(e) => mudar("texto", e.target.value)} />
        </Campo>
        <div className="-mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ac-muted">
          Tocar para inserir:
          {variaveis.map((v) => (
            <button key={v} type="button" onClick={() => mudar("texto", `${d.texto}${v}`)} className="rounded bg-ac-card-2 px-1.5 py-0.5 text-slate-200 hover:bg-white/10">
              {v}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Interruptor ligado={d.whatsapp} aoMudar={(v) => mudar("whatsapp", v)} titulo="WhatsApp" descricao="Uma mensagem para cada pessoa, com o nome dela." />
          <Interruptor ligado={d.mural} aoMudar={(v) => mudar("mural", v)} titulo="Mural da área do aluno" />
        </div>
        {d.mural && (
          <Campo rotulo="Mostrar no mural até (opcional)">
            <input type="date" className={classeInput} value={d.muralAte ?? ""} onChange={(e) => mudar("muralAte", e.target.value || null)} />
          </Campo>
        )}
        {previa && (
          <div className="rounded-xl border border-ac-line bg-ac-bg/40 p-3 text-sm">
            <div className="font-semibold text-white">
              {previa.destinatarios} {previa.destinatarios === 1 ? "pessoa" : "pessoas"}
              {previa.semTelefone > 0 && <span className="ml-2 text-xs font-normal text-amber-300">{previa.semTelefone} sem WhatsApp</span>}
            </div>
            {previa.exemplos[0] && (
              <div className="mt-2 rounded-lg bg-emerald-900/30 px-3 py-2 text-[13px] whitespace-pre-line text-emerald-50">{previa.exemplos[0]}</div>
            )}
          </div>
        )}
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            Criar aviso
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

function ModalEnvios({
  id,
  aoFechar,
  aoExcluir,
}: {
  id: string;
  aoFechar: () => void;
  aoExcluir: (l: ComunicadoJson[]) => void;
}) {
  const [d, setD] = useState<ComunicadoDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    apiLutas.comunicado(id).then(setD).catch((x) => setErro(mensagemDe(x)));
  }, [id]);

  async function marcar(envioId: string, desfazer = false) {
    try {
      setD(await apiLutas.marcarEnviado(id, envioId, desfazer));
    } catch (x) {
      setErro(mensagemDe(x));
    }
  }

  const faltam = d?.envios.filter((e) => !e.enviadoEm) ?? [];
  return (
    <Modal titulo={d?.comunicado.titulo ?? "Aviso"} subtitulo="Toque em Enviar: o WhatsApp abre com a mensagem pronta. Depois volte aqui." aoFechar={aoFechar} largura="max-w-2xl">
      <MensagemErro texto={erro} />
      {!d ? (
        <p className="text-sm text-ac-muted">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-slate-300">
            <b className="text-white">{d.envios.length - faltam.length}</b> de {d.envios.length} enviados
          </div>
          <ul className="flex max-h-[55vh] flex-col gap-1.5 overflow-y-auto pr-1">
            {[...faltam, ...d.envios.filter((e) => e.enviadoEm)].map((e) => (
              <li key={e.id} className={`flex items-center gap-3 rounded-xl border border-ac-line px-3 py-2 ${e.enviadoEm ? "opacity-55" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {e.nome}
                    {e.nome !== e.aluno && <span className="ml-1 text-xs font-normal text-ac-muted">(responsável de {e.aluno.split(" ")[0]})</span>}
                  </div>
                  <div className="truncate text-xs text-ac-muted">{e.texto}</div>
                </div>
                {e.enviadoEm ? (
                  <button type="button" onClick={() => marcar(e.id, true)} className="inline-flex items-center gap-1 text-xs text-ac-muted hover:text-white">
                    <Undo2 className="size-3.5" />
                    desfazer
                  </button>
                ) : e.telefone ? (
                  <a
                    href={linkWhatsapp(e.telefone, e.texto)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => marcar(e.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    <Send className="size-3.5" />
                    Enviar
                  </a>
                ) : (
                  <button type="button" onClick={() => marcar(e.id)} className="inline-flex items-center gap-1 rounded-lg border border-ac-line px-2.5 py-1.5 text-xs text-slate-300">
                    <Check className="size-3.5" />
                    Sem WhatsApp: ok
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-2">
            <Botao
              variante="perigo"
              onClick={async () => {
                if (!confirm("Excluir este aviso (e tirar do mural)?")) return;
                try {
                  aoExcluir(await apiLutas.excluirComunicado(id));
                } catch (x) {
                  setErro(mensagemDe(x));
                }
              }}
            >
              <Trash2 className="size-4" />
              Excluir aviso
            </Botao>
            <Botao onClick={aoFechar}>Fechar</Botao>
          </div>
        </div>
      )}
    </Modal>
  );
}
