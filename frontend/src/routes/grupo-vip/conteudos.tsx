import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import {
  CalendarClock,
  CircleCheck,
  Eye,
  FileText,
  Link2,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RotateCw,
  Search,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CampoMidia } from "../../components/grupo-vip/CampoMidia";
import {
  Botao,
  BotaoCopiar,
  Campo,
  classeInput,
  classeTexto,
  Interruptor,
  MensagemErro,
  Modal,
  mensagemDe,
  useAcao,
} from "../../components/grupo-vip/formulario";
import { SeloPlataforma } from "../../components/grupo-vip/Selos";
import { Abas, CabecalhoPagina, Card, Vazio } from "../../components/grupo-vip/ui";
import { formatar, normalizar } from "../../lib/grupo-vip";
import {
  apiConteudos,
  corCategoria,
  paraCampoDataHora,
  type Conteudo,
  type DadosConteudo,
  type ListaConteudos,
} from "../../lib/grupo-vip-conteudos";
import { BotaoGuia } from "../../components/grupo-vip/Ajuda";

type Filtro = "todos" | "publicado" | "agendado" | "rascunho" | "manual";
type Busca = { novo?: boolean };

// Conteúdos: publicados nos grupos (robô no Telegram; no WhatsApp você posta
// e marca) e guardados na biblioteca da área do membro.
export const Route = createFileRoute("/grupo-vip/conteudos")({
  validateSearch: (s: Record<string, unknown>): Busca => ({ novo: s.novo === true || s.novo === "true" ? true : undefined }),
  loader: () => apiConteudos.listar(),
  component: PaginaConteudos,
});

// Texto do post, para copiar e colar no grupo do WhatsApp.
function textoDoPost(c: Conteudo) {
  return [`*${c.titulo}*`, c.texto, c.link].filter(Boolean).join("\n\n");
}

function PaginaConteudos() {
  const inicial = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [d, setD] = useState<ListaConteudos>(inicial);
  const [filtro, setFiltro] = useState<Filtro>(() =>
    inicial.conteudos.some((c) => c.grupos.some((g) => g.status === "manual")) ? "manual" : "todos",
  );
  const [termo, setTermo] = useState("");
  const [editando, setEditando] = useState<Conteudo | "novo" | null>(busca.novo ? "novo" : null);
  const { carregando, erro, executar } = useAcao();

  const recarregar = async () => {
    setD(await apiConteudos.listar());
    router.invalidate();
  };
  const fechar = () => {
    setEditando(null);
    if (busca.novo) navigate({ to: "/grupo-vip/conteudos", search: {}, replace: true });
  };

  const conta = (f: Filtro) =>
    f === "todos"
      ? d.conteudos.length
      : f === "manual"
        ? d.conteudos.filter((c) => c.grupos.some((g) => g.status === "manual" || g.status === "falhou")).length
        : d.conteudos.filter((c) => c.status === f).length;

  const lista = useMemo(() => {
    const t = normalizar(termo.trim());
    return d.conteudos.filter(
      (c) =>
        (filtro === "todos" ||
          (filtro === "manual" ? c.grupos.some((g) => g.status === "manual" || g.status === "falhou") : c.status === filtro)) &&
        (!t || normalizar(c.titulo).includes(t) || normalizar(c.categoria ?? "").includes(t)),
    );
  }, [d, filtro, termo]);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        guia={<BotaoGuia id="conteudos" />}
        titulo="Conteúdos"
        descricao="Publique nos grupos agora ou agende. Nos grupos do Telegram com o robô a postagem é automática; no WhatsApp você copia o texto, posta e marca como publicado."
      >
        <Botao variante="primario" onClick={() => setEditando("novo")}>
          <Plus className="size-4" /> Novo conteúdo
        </Botao>
      </CabecalhoPagina>

      <Card className="!p-0">
        <div className="flex flex-col gap-3 border-b border-gv-line p-4">
          <label className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gv-muted" />
            <input className={`${classeInput} pl-9`} type="search" placeholder="Buscar conteúdo" value={termo} onChange={(e) => setTermo(e.target.value)} />
          </label>
          <Abas
            abas={[
              { valor: "todos" as Filtro, rotulo: "Todos", quantidade: conta("todos") },
              { valor: "manual" as Filtro, rotulo: "Falta postar no WhatsApp", quantidade: conta("manual") },
              { valor: "publicado" as Filtro, rotulo: "Publicados", quantidade: conta("publicado") },
              { valor: "agendado" as Filtro, rotulo: "Agendados", quantidade: conta("agendado") },
              { valor: "rascunho" as Filtro, rotulo: "Rascunhos", quantidade: conta("rascunho") },
            ]}
            valor={filtro}
            aoMudar={setFiltro}
          />
        </div>
        {erro && (
          <div className="p-4">
            <MensagemErro texto={erro} />
          </div>
        )}
        {lista.length === 0 ? (
          <Vazio icone={FileText}>Nenhum conteúdo aqui.</Vazio>
        ) : (
          <ul className="divide-y divide-gv-line/70">
            {lista.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row">
                {c.midiaUrl &&
                  (c.midiaTipo === "video" ? (
                    <video src={c.midiaUrl} className="h-24 w-full shrink-0 rounded-xl bg-black object-cover md:w-40" preload="metadata" />
                  ) : (
                    <img src={c.midiaUrl} alt="" className="h-24 w-full shrink-0 rounded-xl object-cover md:w-40" />
                  ))}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-poppins text-[15px] font-semibold text-white">{c.titulo}</span>
                    {c.categoria && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${corCategoria[c.cor ?? "orange"]}`}>{c.categoria}</span>
                    )}
                    {c.status === "agendado" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                        <CalendarClock className="size-3" /> {formatar.diaHora(c.agendadoPara)}
                      </span>
                    )}
                    {c.status === "rascunho" && (
                      <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-[11px] font-semibold text-slate-300">Rascunho</span>
                    )}
                  </div>
                  {c.texto && <p className="mt-1 line-clamp-2 text-[13px] text-gv-muted">{c.texto}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gv-muted">
                    {c.publicadoEm && <span>Publicado {formatar.diaHora(c.publicadoEm)}</span>}
                    {c.naAreaMembro && (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" /> {c.visualizacoes} visualizações · {c.pessoas} pessoas
                      </span>
                    )}
                    {c.link && (
                      <a href={c.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-orange-300 hover:underline">
                        <Link2 className="size-3.5" /> link
                      </a>
                    )}
                    {!c.naAreaMembro && <span>só nos grupos</span>}
                  </div>
                  {c.grupos.length > 0 && (
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      {c.grupos.map((g) => (
                        <div key={g.id} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                          <SeloPlataforma plataforma={g.plataforma} />
                          <span className="text-slate-200">
                            {g.grupo}
                            {g.topico && <span className="text-gv-muted"> › {g.topico}</span>}
                          </span>
                          {g.fixado && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
                              <Pin className="size-3" /> fixado
                            </span>
                          )}
                          {g.status === "enviado" && (
                            <span className="inline-flex items-center gap-1 text-emerald-300">
                              <CircleCheck className="size-3.5" /> publicado {g.enviadoEm ? formatar.diaHora(g.enviadoEm) : ""}
                            </span>
                          )}
                          {g.status === "enviado" && g.erro && (
                            <span className="inline-flex items-center gap-1 text-amber-300">
                              <TriangleAlert className="size-3.5" /> {g.erro}
                            </span>
                          )}
                          {g.status === "apagado" && <span className="text-gv-muted">apagado do grupo</span>}
                          {g.status === "pendente" && <span className="text-gv-muted">aguardando publicação</span>}
                          {g.status === "falhou" && (
                            <span className="inline-flex items-center gap-1 text-red-300">
                              <TriangleAlert className="size-3.5" /> {g.erro}
                            </span>
                          )}
                          {g.status === "manual" && <span className="text-amber-300">falta você postar no grupo</span>}
                          {g.status === "manual" && <BotaoCopiar texto={textoDoPost(c)} rotulo="Copiar texto" />}
                          {(g.status === "manual" || g.status === "falhou") && (
                            <Botao
                              pequeno
                              variante="sucesso"
                              carregando={carregando === `pub:${g.id}`}
                              onClick={() => executar(`pub:${g.id}`, async () => {
                                await apiConteudos.marcarPublicado(g.id);
                                await recarregar();
                              })}
                            >
                              Já postei
                            </Botao>
                          )}
                          {g.noTelegram && (
                            <Botao
                              pequeno
                              carregando={carregando === `fixar:${g.id}`}
                              onClick={() => executar(`fixar:${g.id}`, async () => {
                                if (g.fixado) await apiConteudos.desafixar(g.id);
                                else await apiConteudos.fixar(g.id);
                                await recarregar();
                              })}
                            >
                              {g.fixado ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />} {g.fixado ? "Desafixar" : "Fixar"}
                            </Botao>
                          )}
                          {g.noTelegram && (
                            <Botao
                              pequeno
                              variante="perigo"
                              carregando={carregando === `apagar:${g.id}`}
                              onClick={() => executar(`apagar:${g.id}`, async () => {
                                if (!confirm(`Apagar este post do grupo ${g.grupo}? O conteúdo continua na área do membro.`)) return;
                                await apiConteudos.apagarDoGrupo(g.id);
                                await recarregar();
                              })}
                            >
                              <Trash2 className="size-3.5" /> Apagar do grupo
                            </Botao>
                          )}
                          {g.status === "falhou" && (
                            <Botao
                              pequeno
                              carregando={carregando === `tentar:${g.id}`}
                              onClick={() => executar(`tentar:${g.id}`, async () => {
                                await apiConteudos.tentarDeNovo(g.id);
                                await recarregar();
                              })}
                            >
                              <RotateCw className="size-3.5" /> Tentar de novo
                            </Botao>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5 md:flex-col">
                  {c.status !== "publicado" && (
                    <Botao
                      pequeno
                      variante="primario"
                      carregando={carregando === `publicar:${c.id}`}
                      onClick={() => executar(`publicar:${c.id}`, async () => {
                        await apiConteudos.publicar(c.id);
                        await recarregar();
                      })}
                    >
                      <Send className="size-3.5" /> Publicar agora
                    </Botao>
                  )}
                  <Botao pequeno onClick={() => setEditando(c)}>
                    <Pencil className="size-3.5" /> Editar
                  </Botao>
                  <Botao
                    pequeno
                    variante="perigo"
                    carregando={carregando === `excluir:${c.id}`}
                    onClick={() =>
                      executar(`excluir:${c.id}`, async () => {
                        if (!confirm(`Excluir "${c.titulo}"? Ele sai da área do membro (posts já feitos nos grupos continuam lá).`)) return;
                        await apiConteudos.excluir(c.id);
                        await recarregar();
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Botao>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editando && (
        <ModalConteudo
          conteudo={editando === "novo" ? null : editando}
          dados={d}
          aoFechar={fechar}
          aoSalvar={async () => {
            fechar();
            await recarregar();
          }}
        />
      )}
    </div>
  );
}

function ModalConteudo({
  conteudo,
  dados,
  aoFechar,
  aoSalvar,
}: {
  conteudo: Conteudo | null;
  dados: ListaConteudos;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const publicado = conteudo?.status === "publicado";
  const postadoPeloRobo = conteudo?.grupos.some((g) => g.noTelegram) ?? false;
  const [f, setF] = useState<DadosConteudo>({
    titulo: conteudo?.titulo ?? "",
    texto: conteudo?.texto ?? "",
    categoriaId: conteudo?.categoriaId ?? null,
    midiaUrl: conteudo?.midiaUrl ?? null,
    midiaTipo: conteudo?.midiaTipo ?? null,
    link: conteudo?.link ?? "",
    botaoTexto: conteudo?.botaoTexto ?? "",
    fixar: conteudo?.fixar ?? false,
    grupoIds: conteudo?.grupos.map((g) => g.grupoId) ?? dados.grupos.map((g) => g.id),
    topicos: Object.fromEntries((conteudo?.grupos ?? []).filter((g) => g.topicoId).map((g) => [g.grupoId, g.topicoId as string])),
    naAreaMembro: conteudo?.naAreaMembro ?? true,
    quando: conteudo?.status === "agendado" ? "agendar" : conteudo?.status === "rascunho" ? "rascunho" : "agora",
    agendadoPara: paraCampoDataHora(conteudo?.agendadoPara ?? null) || null,
    atualizarNosGrupos: true,
  });
  const algumRobo = dados.grupos.some((g) => g.automatico && f.grupoIds.includes(g.id));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const alternar = (id: string) =>
    setF((v) => ({ ...v, grupoIds: v.grupoIds.includes(id) ? v.grupoIds.filter((x) => x !== id) : [...v.grupoIds, id] }));

  return (
    <Modal titulo={conteudo ? "Editar conteúdo" : "Novo conteúdo"} aoFechar={aoFechar} largura="max-w-2xl">
      <div className="grid gap-4">
        <Campo rotulo="Título *">
          <input autoFocus className={classeInput} value={f.titulo} onChange={(e) => setF((v) => ({ ...v, titulo: e.target.value }))} />
        </Campo>
        <Campo rotulo="Texto">
          <textarea className={classeTexto} rows={5} value={f.texto} onChange={(e) => setF((v) => ({ ...v, texto: e.target.value }))} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Categoria">
            <select
              className={classeInput}
              value={f.categoriaId ?? ""}
              onChange={(e) => setF((v) => ({ ...v, categoriaId: e.target.value || null }))}
            >
              <option value="">Sem categoria</option>
              {dados.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Link (opcional)" dica="Aula, vídeo, planilha...">
            <input className={classeInput} value={f.link} onChange={(e) => setF((v) => ({ ...v, link: e.target.value }))} placeholder="https://" />
          </Campo>
        </div>
        {f.link.trim() && (
          <Campo
            rotulo="Texto do botão no Telegram (opcional)"
            dica="Preenchido: o link vira um botão embaixo do post (ex.: Assistir aula). Vazio: o link vai no texto."
          >
            <input
              className={classeInput}
              maxLength={40}
              value={f.botaoTexto}
              placeholder="▶️ Assistir aula"
              onChange={(e) => setF((v) => ({ ...v, botaoTexto: e.target.value }))}
            />
          </Campo>
        )}
        <div>
          <span className="text-xs font-medium text-slate-300">Foto ou vídeo (opcional)</span>
          <div className="mt-1.5">
            <CampoMidia url={f.midiaUrl} tipo={f.midiaTipo} aoMudar={(midiaUrl, midiaTipo) => setF((v) => ({ ...v, midiaUrl, midiaTipo }))} />
          </div>
        </div>

        {!publicado && (
          <>
            <div>
              <span className="text-xs font-medium text-slate-300">Publicar nos grupos</span>
              <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {dados.grupos.map((g) => (
                  <div key={g.id} className="flex flex-col gap-2 rounded-xl border border-gv-line px-3 py-2 hover:border-slate-600">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                      <input type="checkbox" className="accent-orange-500" checked={f.grupoIds.includes(g.id)} onChange={() => alternar(g.id)} />
                      <span className="flex-1 truncate">{g.nome}</span>
                      <SeloPlataforma plataforma={g.plataforma} automatico={g.automatico} />
                    </label>
                    {g.topicos.length > 0 && f.grupoIds.includes(g.id) && (
                      <select
                        className={`${classeInput} h-8 text-xs`}
                        aria-label="Tópico"
                        value={f.topicos[g.id] ?? ""}
                        onChange={(e) => setF((v) => ({ ...v, topicos: { ...v.topicos, [g.id]: e.target.value } }))}
                      >
                        <option value="">Tópico geral</option>
                        {g.topicos.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-300">Quando</span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    ["agora", "Publicar agora"],
                    ["agendar", "Agendar"],
                    ["rascunho", "Rascunho"],
                  ] as const
                ).map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setF((v) => ({ ...v, quando: valor }))}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      f.quando === valor ? "border-orange-500/70 bg-orange-500/10 text-white" : "border-gv-line text-slate-300"
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
              {f.quando === "agendar" && (
                <input
                  type="datetime-local"
                  className={`${classeInput} mt-2`}
                  value={f.agendadoPara ?? ""}
                  onChange={(e) => setF((v) => ({ ...v, agendadoPara: e.target.value || null }))}
                />
              )}
            </div>
          </>
        )}
        {!publicado && algumRobo && (
          <Interruptor
            ligado={f.fixar}
            aoMudar={(fixar) => setF((v) => ({ ...v, fixar }))}
            titulo="Fixar no topo do grupo"
            descricao="O robô fixa o post nos grupos do Telegram (bom para regras e avisos importantes)."
          />
        )}
        {publicado && postadoPeloRobo && (
          <Interruptor
            ligado={f.atualizarNosGrupos}
            aoMudar={(atualizarNosGrupos) => setF((v) => ({ ...v, atualizarNosGrupos }))}
            titulo="Atualizar também nos grupos do Telegram"
            descricao="Troca o texto (e o botão) dos posts que o robô já fez. A foto ou o vídeo não mudam."
          />
        )}
        <Interruptor
          ligado={f.naAreaMembro}
          aoMudar={(naAreaMembro) => setF((v) => ({ ...v, naAreaMembro }))}
          titulo="Guardar na área do membro"
          descricao="Fica na biblioteca de conteúdos de quem tem acesso (e conta as visualizações)."
        />
      </div>
      <div className="mt-4">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Botao onClick={aoFechar}>Cancelar</Botao>
        <Botao
          variante="primario"
          carregando={salvando}
          onClick={async () => {
            setSalvando(true);
            setErro(null);
            try {
              const topicos = Object.fromEntries(Object.entries(f.topicos).filter(([gid, t]) => t && f.grupoIds.includes(gid)));
              const envio = { ...f, topicos };
              if (conteudo) await apiConteudos.atualizar(conteudo.id, envio);
              else await apiConteudos.criar(envio);
              aoSalvar();
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          <Send className="size-4" />
          {publicado ? "Salvar" : f.quando === "agora" ? "Publicar" : f.quando === "agendar" ? "Agendar" : "Salvar rascunho"}
        </Botao>
      </div>
    </Modal>
  );
}
