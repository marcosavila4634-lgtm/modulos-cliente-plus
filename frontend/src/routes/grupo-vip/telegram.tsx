import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  CircleCheck,
  Hash,
  Lock,
  LockOpen,
  MessageSquareText,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CampoMidia } from "../../components/grupo-vip/CampoMidia";
import {
  Botao,
  Campo,
  classeInput,
  classeTexto,
  Interruptor,
  MensagemErro,
  Modal,
  mensagemDe,
  useAcao,
} from "../../components/grupo-vip/formulario";
import { Abas, CabecalhoPagina, Card, Dica, TituloCard, Vazio, cabecalhoTabela } from "../../components/grupo-vip/ui";
import { formatar } from "../../lib/grupo-vip";
import {
  apiTelegram,
  type DadosEnquete,
  type DadosRegras,
  type DetalhesGrupo,
  type Enquete,
  type GrupoTelegram,
  type ListaEnquetes,
  type Moderacao,
  type PainelTelegram,
} from "../../lib/grupo-vip-telegram";

type Aba = "grupos" | "enquetes" | "moderacao";
type Busca = { aba?: Aba; grupo?: string };

// Controle dos grupos do Telegram pelo robô: proteção, moderação, boas-vindas,
// travar por horário, nome/foto/descrição, tópicos e enquetes.
export const Route = createFileRoute("/grupo-vip/telegram")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    aba: s.aba === "enquetes" || s.aba === "moderacao" ? s.aba : undefined,
    grupo: typeof s.grupo === "string" ? s.grupo : undefined,
  }),
  loader: () => apiTelegram.painel(),
  component: PaginaTelegram,
});

function PaginaTelegram() {
  const painel = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const aba = busca.aba ?? "grupos";
  const mudarAba = (a: Aba) => navigate({ to: "/grupo-vip/telegram", search: { aba: a === "grupos" ? undefined : a, grupo: busca.grupo }, replace: true });

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Telegram"
        descricao="Controle seus grupos do Telegram por aqui: o robô protege os conteúdos, apaga links e palavrões, dá boas-vindas, trava o grupo no horário, organiza os tópicos e faz enquetes."
      />
      {!painel.roboConectado && (
        <Dica icone={Bot} cor="amber">
          O robô do Telegram ainda não está conectado. Conecte em{" "}
          <Link to="/grupo-vip/configuracoes" className="underline">
            Configurações
          </Link>
          , coloque o robô como <b>administrador</b> de cada grupo e informe o ID do grupo em{" "}
          <Link to="/grupo-vip/grupos" className="underline">
            Grupos e planos
          </Link>
          . Você já pode deixar as regras prontas: elas passam a valer quando o robô estiver no grupo.
        </Dica>
      )}
      <Abas
        abas={[
          { valor: "grupos" as Aba, rotulo: "Grupos", quantidade: painel.grupos.length },
          { valor: "enquetes" as Aba, rotulo: "Enquetes e quiz" },
          { valor: "moderacao" as Aba, rotulo: "Mensagens apagadas" },
        ]}
        valor={aba}
        aoMudar={mudarAba}
      />
      {aba === "grupos" && <AbaGrupos painel={painel} grupoId={busca.grupo} />}
      {aba === "enquetes" && <AbaEnquetes />}
      {aba === "moderacao" && <AbaModeracao />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grupos
// ---------------------------------------------------------------------------

function AbaGrupos({ painel, grupoId }: { painel: PainelTelegram; grupoId?: string }) {
  const navigate = useNavigate();
  const selecionado = painel.grupos.find((g) => g.id === grupoId) ?? painel.grupos[0];
  const [detalhes, setDetalhes] = useState<DetalhesGrupo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!selecionado) return;
    let ativo = true;
    setDetalhes(null);
    setErro(null);
    apiTelegram
      .detalhes(selecionado.id)
      .then((d) => ativo && setDetalhes(d))
      .catch((e) => ativo && setErro(mensagemDe(e)));
    return () => {
      ativo = false;
    };
  }, [selecionado?.id]);

  if (painel.grupos.length === 0) {
    return (
      <Card>
        <Vazio icone={Users}>
          Nenhum grupo do Telegram cadastrado.{" "}
          <Link to="/grupo-vip/grupos" search={{ novo: true }} className="text-orange-300 underline">
            Cadastrar grupo
          </Link>
        </Vazio>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
      <Card className="!p-2 self-start">
        <ul className="flex flex-col gap-1">
          {painel.grupos.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => navigate({ to: "/grupo-vip/telegram", search: { grupo: g.id }, replace: true })}
                className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                  g.id === selecionado?.id ? "bg-orange-500/15 ring-1 ring-orange-500/50" : "hover:bg-white/5"
                }`}
              >
                <div className="truncate text-sm font-semibold text-white">{g.nome}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Chip cor={g.automatico ? "emerald" : "slate"}>{g.automatico ? "Robô ativo" : "Sem robô"}</Chip>
                  {g.travado && <Chip cor="amber">Travado</Chip>}
                  {g.moderadas7Dias > 0 && <Chip cor="red">{g.moderadas7Dias} apagadas (7 dias)</Chip>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex min-w-0 flex-col gap-4">
        <MensagemErro texto={erro} />
        {!detalhes && !erro && <Card><div className="py-10 text-center text-sm text-gv-muted">Carregando...</div></Card>}
        {detalhes && <DetalhesDoGrupo key={detalhes.grupo.id} inicial={detalhes} roboConectado={painel.roboConectado} />}
      </div>
    </div>
  );
}

function Chip({ cor, children }: { cor: "emerald" | "slate" | "amber" | "red" | "sky"; children: React.ReactNode }) {
  const cores = {
    emerald: "bg-emerald-500/15 text-emerald-300",
    slate: "bg-slate-500/20 text-slate-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-red-500/15 text-red-300",
    sky: "bg-sky-500/15 text-sky-300",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${cores[cor]}`}>{children}</span>;
}

const opcoesSilenciar = [
  { valor: 0, rotulo: "Só apagar a mensagem" },
  { valor: 10, rotulo: "Apagar e silenciar 10 minutos" },
  { valor: 60, rotulo: "Apagar e silenciar 1 hora" },
  { valor: 1440, rotulo: "Apagar e silenciar 1 dia" },
  { valor: 10080, rotulo: "Apagar e silenciar 7 dias" },
];

function regrasDe(g: GrupoTelegram): DadosRegras {
  return {
    protegerConteudo: g.protegerConteudo,
    moderarLinks: g.moderarLinks,
    palavrasProibidas: g.palavrasProibidas,
    silenciarMinutos: g.silenciarMinutos,
    boasVindasGrupo: g.boasVindasGrupo ?? "",
    apagarAvisosEntrada: g.apagarAvisosEntrada,
    travaInicio: g.travaInicio ?? "",
    travaFim: g.travaFim ?? "",
  };
}

function DetalhesDoGrupo({ inicial, roboConectado }: { inicial: DetalhesGrupo; roboConectado: boolean }) {
  const [d, setD] = useState(inicial);
  const [regras, setRegras] = useState<DadosRegras>(regrasDe(inicial.grupo));
  const [salvo, setSalvo] = useState(false);
  const [editandoDados, setEditandoDados] = useState(false);
  const { carregando, erro, executar } = useAcao();
  const router = useRouter();
  // Atualiza os detalhes e a lista de grupos (selos da esquerda).
  const atualizar = (novo: DetalhesGrupo) => {
    setD(novo);
    router.invalidate();
  };
  const g = d.grupo;
  const info = d.info;
  const travado = info?.travado ?? g.travado;
  const mudou = JSON.stringify(regras) !== JSON.stringify(regrasDe(g));
  const muda = <K extends keyof DadosRegras>(campo: K, valor: DadosRegras[K]) => {
    setRegras((r) => ({ ...r, [campo]: valor }));
    setSalvo(false);
  };

  return (
    <>
      <MensagemErro texto={erro} />

      {!g.automatico && (
        <Dica icone={Bot} cor="amber">
          {roboConectado ? (
            <>
              O robô ainda não cuida deste grupo. Coloque o robô como <b>administrador</b> do grupo, escreva <code>/id</code> no grupo e
              informe o número em{" "}
              <Link to="/grupo-vip/grupos" className="underline">
                Grupos e planos
              </Link>
              .
            </>
          ) : (
            <>Conecte o robô em Configurações para controlar este grupo. As regras abaixo ficam guardadas.</>
          )}
        </Dica>
      )}

      {/* No Telegram agora */}
      <Card>
        <TituloCard
          icone={Bot}
          acao={
            g.automatico && (
              <Botao pequeno onClick={() => setEditandoDados(true)}>
                <Pencil className="size-3.5" /> Nome, foto e descrição
              </Botao>
            )
          }
        >
          {info?.titulo ?? g.nome}
        </TituloCard>
        {info?.erro && (
          <div className="mt-3">
            <MensagemErro texto={`Não deu para ler o grupo no Telegram: ${info.erro}`} />
          </div>
        )}
        {!info && (
          <p className="mt-2 text-[13px] text-gv-muted">
            Quantas pessoas estão no grupo, travar/liberar, nome, foto e tópicos aparecem aqui quando o robô estiver no grupo.
          </p>
        )}
        {info && !info.erro && (
          <>
            {info.descricao && <p className="mt-2 text-[13px] whitespace-pre-line text-gv-muted">{info.descricao}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Numero rotulo="pessoas no grupo" valor={info.membros ?? "—"} />
              <Numero rotulo="tópicos" valor={info.forum ? g.topicos.length : "desligados"} />
              <Numero rotulo="apagadas em 7 dias" valor={g.moderadas7Dias} />
            </div>
          </>
        )}
        {g.automatico && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gv-line bg-gv-bg/40 p-3">
            <span className={`grid size-9 place-items-center rounded-full ${travado ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
              {travado ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">{travado ? "Grupo travado" : "Grupo liberado"}</div>
              <div className="text-[12px] text-gv-muted">
                {travado ? "Só os administradores podem escrever." : "Todos os membros podem escrever."}
              </div>
            </div>
            <Botao
              pequeno
              variante={travado ? "sucesso" : "secundario"}
              carregando={carregando === "trava"}
              onClick={() => executar("trava", async () => atualizar(travado ? await apiTelegram.liberar(g.id) : await apiTelegram.travar(g.id)))}
            >
              {travado ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />} {travado ? "Liberar agora" : "Travar agora"}
            </Botao>
          </div>
        )}
      </Card>

      {/* Regras */}
      <Card>
        <TituloCard icone={ShieldCheck}>Proteção e boas-vindas</TituloCard>
        <div className="mt-4 flex flex-col gap-4">
          <Interruptor
            ligado={regras.protegerConteudo}
            aoMudar={(v) => muda("protegerConteudo", v)}
            titulo="Proteger os conteúdos"
            descricao="Os posts, lives e enquetes do robô não podem ser encaminhados nem salvos (fotos e vídeos não baixam). Evita que seu material pago vaze."
          />
          <Campo
            rotulo="Mensagem de boas-vindas no grupo (opcional)"
            dica={
              <>
                Enviada no grupo quando alguém entra. Use <code>{"{nome}"}</code> (marca a pessoa), <code>{"{grupo}"}</code> e{" "}
                <code>{"{negocio}"}</code>. Deixe vazio para não mandar.
              </>
            }
          >
            <textarea
              className={classeTexto}
              rows={3}
              value={regras.boasVindasGrupo}
              placeholder="Seja bem-vindo(a), {nome}! 👋 Leia a mensagem fixada com as regras do {grupo}."
              onChange={(e) => muda("boasVindasGrupo", e.target.value)}
            />
          </Campo>
          <Interruptor
            ligado={regras.apagarAvisosEntrada}
            aoMudar={(v) => muda("apagarAvisosEntrada", v)}
            titulo='Apagar os avisos "fulano entrou" e "fulano saiu"'
            descricao="Deixa o grupo mais limpo."
          />
        </div>
      </Card>

      <Card>
        <TituloCard icone={ShieldAlert}>Moderação automática</TituloCard>
        <p className="mt-1 text-[12.5px] text-gv-muted">Vale para os membros. Mensagens dos administradores nunca são apagadas.</p>
        <div className="mt-4 flex flex-col gap-4">
          <Interruptor
            ligado={regras.moderarLinks}
            aoMudar={(v) => muda("moderarLinks", v)}
            titulo="Apagar links"
            descricao="Links de sites, de outros grupos do Telegram e do WhatsApp (evita divulgação e golpes)."
          />
          <Campo rotulo="Palavras proibidas" dica="Uma por linha (ou separadas por vírgula). Não diferencia maiúscula nem acento.">
            <textarea
              className={classeTexto}
              rows={3}
              value={regras.palavrasProibidas}
              placeholder={"palavrão\npix grátis\nme chama no privado"}
              onChange={(e) => muda("palavrasProibidas", e.target.value)}
            />
          </Campo>
          <Campo rotulo="O que fazer com quem quebrar a regra">
            <select className={classeInput} value={regras.silenciarMinutos} onChange={(e) => muda("silenciarMinutos", Number(e.target.value))}>
              {opcoesSilenciar.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
              {!opcoesSilenciar.some((o) => o.valor === regras.silenciarMinutos) && (
                <option value={regras.silenciarMinutos}>Apagar e silenciar {regras.silenciarMinutos} minutos</option>
              )}
            </select>
          </Campo>
        </div>
      </Card>

      <Card>
        <TituloCard icone={Lock}>Horário do grupo</TituloCard>
        <p className="mt-1 text-[12.5px] text-gv-muted">
          Trava o grupo sozinho (só administradores escrevem) e libera na hora marcada. Ex.: travar às 22:00 e liberar às 07:00. Deixe vazio
          para não usar.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Campo rotulo="Travar às">
            <input type="time" className={classeInput} value={regras.travaInicio} onChange={(e) => muda("travaInicio", e.target.value)} />
          </Campo>
          <Campo rotulo="Liberar às">
            <input type="time" className={classeInput} value={regras.travaFim} onChange={(e) => muda("travaFim", e.target.value)} />
          </Campo>
          {(regras.travaInicio || regras.travaFim) && (
            <Botao
              onClick={() => {
                muda("travaInicio", "");
                muda("travaFim", "");
              }}
            >
              <X className="size-4" /> Sem horário
            </Botao>
          )}
        </div>
      </Card>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-gv-line bg-gv-card/95 p-3 backdrop-blur">
        {salvo && !mudou && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-300">
            <CircleCheck className="size-4" /> Regras salvas
          </span>
        )}
        {mudou && <span className="text-sm text-amber-300">Há mudanças não salvas</span>}
        <Botao
          variante="primario"
          disabled={!mudou}
          carregando={carregando === "regras"}
          onClick={() =>
            executar("regras", async () => {
              const novo = await apiTelegram.salvarRegras(g.id, regras);
              atualizar(novo);
              setRegras(regrasDe(novo.grupo));
              setSalvo(true);
            })
          }
        >
          Salvar regras
        </Botao>
      </div>

      <Topicos detalhes={d} aoMudar={atualizar} />

      {d.moderacao.length > 0 && (
        <Card className="!p-0">
          <div className="p-4 pb-2">
            <TituloCard icone={Trash2}>Últimas mensagens apagadas neste grupo</TituloCard>
          </div>
          <ListaModeracao lista={d.moderacao.slice(0, 10)} mostrarGrupo={false} />
        </Card>
      )}

      {editandoDados && (
        <ModalDadosGrupo
          detalhes={d}
          aoFechar={() => setEditandoDados(false)}
          aoSalvar={(novo) => {
            atualizar(novo);
            setEditandoDados(false);
          }}
        />
      )}
    </>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
      <div className="font-poppins text-lg font-bold text-white">{valor}</div>
      <div className="text-[11px] text-gv-muted">{rotulo}</div>
    </div>
  );
}

function Topicos({ detalhes, aoMudar }: { detalhes: DetalhesGrupo; aoMudar: (d: DetalhesGrupo) => void }) {
  const g = detalhes.grupo;
  const forum = detalhes.info?.forum ?? false;
  const [nome, setNome] = useState("");
  const [renomeando, setRenomeando] = useState<{ id: string; nome: string } | null>(null);
  const { carregando, erro, executar } = useAcao();
  const recarregar = async () => aoMudar(await apiTelegram.detalhes(g.id));

  if (!g.automatico) return null;
  return (
    <Card>
      <TituloCard icone={Hash}>Tópicos</TituloCard>
      {!forum ? (
        <p className="mt-2 text-[13px] text-gv-muted">
          Tópicos separam o grupo em assuntos (ex.: Avisos, Materiais, Dúvidas) e você escolhe em qual tópico cada conteúdo cai. Para usar: no
          Telegram, abra o grupo › <b>Editar</b> › ligue <b>Tópicos</b>. Depois volte aqui.
        </p>
      ) : (
        <>
          <p className="mt-1 text-[12.5px] text-gv-muted">
            Tópicos criados no próprio Telegram aparecem aqui sozinhos. Ao publicar um conteúdo ou enquete, escolha o tópico.
          </p>
          <div className="mt-3">
            <MensagemErro texto={erro} />
          </div>
          <ul className="mt-2 divide-y divide-gv-line/70">
            {g.topicos.map((t) => (
              <li key={t.id} className="flex items-center gap-2 py-2">
                <Hash className="size-4 shrink-0 text-gv-muted" />
                {renomeando?.id === t.id ? (
                  <>
                    <input
                      autoFocus
                      className={`${classeInput} h-8`}
                      value={renomeando.nome}
                      onChange={(e) => setRenomeando({ id: t.id, nome: e.target.value })}
                    />
                    <Botao
                      pequeno
                      variante="primario"
                      carregando={carregando === `ren:${t.id}`}
                      onClick={() =>
                        executar(`ren:${t.id}`, async () => {
                          await apiTelegram.renomearTopico(t.id, renomeando.nome);
                          setRenomeando(null);
                          await recarregar();
                        })
                      }
                    >
                      Salvar
                    </Botao>
                    <Botao pequeno onClick={() => setRenomeando(null)}>
                      Cancelar
                    </Botao>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm text-slate-200">{t.nome}</span>
                    <button
                      type="button"
                      aria-label="Renomear"
                      onClick={() => setRenomeando({ id: t.id, nome: t.nome })}
                      className="rounded-lg p-1.5 text-gv-muted hover:bg-white/5 hover:text-white"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Apagar"
                      onClick={() =>
                        executar(`del:${t.id}`, async () => {
                          if (!confirm(`Apagar o tópico "${t.nome}"? Todas as mensagens dele somem do Telegram.`)) return;
                          await apiTelegram.apagarTopico(t.id);
                          await recarregar();
                        })
                      }
                      className="rounded-lg p-1.5 text-gv-muted hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
            {g.topicos.length === 0 && <li className="py-2 text-sm text-gv-muted">Nenhum tópico ainda.</li>}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className={classeInput} placeholder="Nome do novo tópico" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Botao
              variante="primario"
              disabled={!nome.trim()}
              carregando={carregando === "novo"}
              onClick={() =>
                executar("novo", async () => {
                  aoMudar(await apiTelegram.criarTopico(g.id, nome));
                  setNome("");
                })
              }
            >
              <Plus className="size-4" /> Criar
            </Botao>
          </div>
        </>
      )}
    </Card>
  );
}

function ModalDadosGrupo({
  detalhes,
  aoFechar,
  aoSalvar,
}: {
  detalhes: DetalhesGrupo;
  aoFechar: () => void;
  aoSalvar: (d: DetalhesGrupo) => void;
}) {
  const tituloAtual = detalhes.info?.titulo ?? detalhes.grupo.nome;
  const descricaoAtual = detalhes.info?.descricao ?? "";
  const [titulo, setTitulo] = useState(tituloAtual);
  const [descricao, setDescricao] = useState(descricaoAtual);
  const [foto, setFoto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal titulo="Nome, foto e descrição do grupo" subtitulo="As mudanças aparecem na hora no Telegram." aoFechar={aoFechar}>
      <div className="grid gap-4">
        <Campo rotulo="Nome do grupo">
          <input autoFocus className={classeInput} value={titulo} maxLength={128} onChange={(e) => setTitulo(e.target.value)} />
        </Campo>
        <Campo rotulo="Descrição" dica={`${descricao.length}/255 letras`}>
          <textarea className={classeTexto} rows={3} maxLength={255} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </Campo>
        <div>
          <span className="text-xs font-medium text-slate-300">Nova foto do grupo (opcional)</span>
          <div className="mt-1.5">
            <CampoMidia url={foto} tipo={foto ? "imagem" : null} soImagem aoMudar={(url) => setFoto(url)} />
          </div>
        </div>
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
              aoSalvar(
                await apiTelegram.mudarDados(detalhes.grupo.id, {
                  titulo: titulo.trim() !== tituloAtual ? titulo : undefined,
                  descricao: descricao.trim() !== descricaoAtual.trim() ? descricao : undefined,
                  foto: foto ?? undefined,
                }),
              );
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          Salvar no Telegram
        </Botao>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Enquetes
// ---------------------------------------------------------------------------

function AbaEnquetes() {
  const [d, setD] = useState<ListaEnquetes | null>(null);
  const [nova, setNova] = useState(false);
  const { carregando, erro, setErro, executar } = useAcao();

  useEffect(() => {
    apiTelegram.enquetes().then(setD).catch((e) => setErro(mensagemDe(e)));
  }, []);

  if (!d) {
    return (
      <Card>
        <MensagemErro texto={erro} />
        {!erro && <div className="py-10 text-center text-sm text-gv-muted">Carregando...</div>}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[13px] text-gv-muted">
          O robô manda a enquete nos grupos e o resultado aparece aqui, somando todos os grupos. No <b>quiz</b> há uma resposta certa e o
          Telegram mostra quem acertou.
        </p>
        <Botao variante="primario" disabled={d.grupos.length === 0} onClick={() => setNova(true)}>
          <Plus className="size-4" /> Nova enquete
        </Botao>
      </div>
      {d.grupos.length === 0 && (
        <Dica icone={Bot} cor="amber">
          Para enviar enquetes, é preciso ter pelo menos um grupo do Telegram com o robô (robô conectado e ID do grupo informado).
        </Dica>
      )}
      <MensagemErro texto={erro} />
      {d.enquetes.length === 0 ? (
        <Card>
          <Vazio icone={BarChart3}>Nenhuma enquete ainda.</Vazio>
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {d.enquetes.map((e) => (
            <CartaoEnquete
              key={e.id}
              enquete={e}
              carregando={carregando}
              aoEncerrar={() => executar(`fim:${e.id}`, async () => setD(await apiTelegram.encerrarEnquete(e.id)))}
              aoExcluir={() =>
                executar(`del:${e.id}`, async () => {
                  if (!confirm("Excluir esta enquete? Ela também é apagada dos grupos.")) return;
                  setD(await apiTelegram.excluirEnquete(e.id));
                })
              }
            />
          ))}
        </div>
      )}
      {nova && (
        <ModalEnquete
          dados={d}
          aoFechar={() => setNova(false)}
          aoSalvar={(novo) => {
            setD(novo);
            setNova(false);
          }}
        />
      )}
    </div>
  );
}

function CartaoEnquete({
  enquete: e,
  carregando,
  aoEncerrar,
  aoExcluir,
}: {
  enquete: Enquete;
  carregando: string | null;
  aoEncerrar: () => void;
  aoExcluir: () => void;
}) {
  const maior = Math.max(1, ...e.votos);
  const somaOpcoes = e.votos.reduce((a, b) => a + b, 0);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip cor={e.tipo === "quiz" ? "sky" : "slate"}>{e.tipo === "quiz" ? "Quiz" : "Enquete"}</Chip>
            {e.encerrada ? <Chip cor="slate">Encerrada</Chip> : <Chip cor="emerald">Votação aberta</Chip>}
            <span className="text-[11.5px] text-gv-muted">{formatar.diaHora(e.createdAt)}</span>
          </div>
          <div className="mt-2 font-poppins text-[15px] font-semibold text-white">{e.pergunta}</div>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {e.opcoes.map((o, i) => {
          const pct = somaOpcoes ? Math.round((e.votos[i] / somaOpcoes) * 100) : 0;
          const certa = e.tipo === "quiz" && e.correta === i;
          return (
            <li key={i}>
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className={`truncate ${certa ? "font-semibold text-emerald-300" : "text-slate-200"}`}>
                  {certa && "✓ "}
                  {o}
                </span>
                <span className="shrink-0 text-gv-muted">
                  {e.votos[i]} · {pct}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gv-bg">
                <div
                  className={`h-full rounded-full ${certa ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
                  style={{ width: `${(e.votos[i] / maior) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 text-[12px] text-gv-muted">
        {e.total} {e.total === 1 ? "pessoa votou" : "pessoas votaram"}
        {e.anonima ? " · votos anônimos" : ""}
        {e.multipla ? " · várias respostas" : ""}
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {e.envios.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-slate-300">
              {v.grupo}
              {v.topico ? ` › ${v.topico}` : ""}
            </span>
            {v.status === "falhou" ? (
              <span className="inline-flex items-center gap-1 text-red-300">
                <TriangleAlert className="size-3.5" /> {v.erro}
              </span>
            ) : (
              <span className="text-gv-muted">{v.total} votos</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-1.5">
        {!e.encerrada && (
          <Botao pequeno carregando={carregando === `fim:${e.id}`} onClick={aoEncerrar}>
            <CircleCheck className="size-3.5" /> Encerrar votação
          </Botao>
        )}
        <Botao pequeno variante="perigo" carregando={carregando === `del:${e.id}`} onClick={aoExcluir}>
          <Trash2 className="size-3.5" />
        </Botao>
      </div>
    </Card>
  );
}

function ModalEnquete({
  dados,
  aoFechar,
  aoSalvar,
}: {
  dados: ListaEnquetes;
  aoFechar: () => void;
  aoSalvar: (d: ListaEnquetes) => void;
}) {
  const [f, setF] = useState<DadosEnquete>({
    pergunta: "",
    opcoes: ["", ""],
    tipo: "enquete",
    correta: null,
    explicacao: "",
    anonima: true,
    multipla: false,
    grupoIds: dados.grupos.map((g) => g.id),
    topicos: {},
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const quiz = f.tipo === "quiz";
  const mudaOpcao = (i: number, texto: string) => setF((v) => ({ ...v, opcoes: v.opcoes.map((o, j) => (j === i ? texto : o)) }));
  const tirarOpcao = (i: number) =>
    setF((v) => ({
      ...v,
      opcoes: v.opcoes.filter((_, j) => j !== i),
      correta: v.correta === i ? null : v.correta !== null && v.correta > i ? v.correta - 1 : v.correta,
    }));
  const alternarGrupo = (id: string) =>
    setF((v) => ({ ...v, grupoIds: v.grupoIds.includes(id) ? v.grupoIds.filter((x) => x !== id) : [...v.grupoIds, id] }));

  return (
    <Modal titulo="Nova enquete" aoFechar={aoFechar} largura="max-w-xl">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["enquete", "Enquete", "Opinião, sem resposta certa"],
              ["quiz", "Quiz", "Pergunta com resposta certa"],
            ] as const
          ).map(([valor, rotulo, dica]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setF((v) => ({ ...v, tipo: valor }))}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                f.tipo === valor ? "border-orange-500/70 bg-orange-500/10" : "border-gv-line hover:border-slate-600"
              }`}
            >
              <div className="text-sm font-semibold text-white">{rotulo}</div>
              <div className="text-[11.5px] text-gv-muted">{dica}</div>
            </button>
          ))}
        </div>
        <Campo rotulo="Pergunta *">
          <input
            autoFocus
            className={classeInput}
            maxLength={300}
            value={f.pergunta}
            placeholder="Qual o tema da próxima live?"
            onChange={(e) => setF((v) => ({ ...v, pergunta: e.target.value }))}
          />
        </Campo>
        <div>
          <span className="text-xs font-medium text-slate-300">
            Opções * {quiz && <span className="text-gv-muted">(marque a resposta certa)</span>}
          </span>
          <div className="mt-1.5 flex flex-col gap-2">
            {f.opcoes.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                {quiz && (
                  <input
                    type="radio"
                    name="correta"
                    aria-label="Resposta certa"
                    className="size-4 accent-emerald-500"
                    checked={f.correta === i}
                    onChange={() => setF((v) => ({ ...v, correta: i }))}
                  />
                )}
                <input className={classeInput} maxLength={100} value={o} placeholder={`Opção ${i + 1}`} onChange={(e) => mudaOpcao(i, e.target.value)} />
                {f.opcoes.length > 2 && (
                  <button type="button" aria-label="Tirar opção" onClick={() => tirarOpcao(i)} className="rounded-lg p-2 text-gv-muted hover:text-red-300">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {f.opcoes.length < 10 && (
              <Botao pequeno className="self-start" onClick={() => setF((v) => ({ ...v, opcoes: [...v.opcoes, ""] }))}>
                <Plus className="size-3.5" /> Opção
              </Botao>
            )}
          </div>
        </div>
        {quiz && (
          <Campo rotulo="Explicação (opcional)" dica="Aparece para quem errar.">
            <input className={classeInput} maxLength={200} value={f.explicacao} onChange={(e) => setF((v) => ({ ...v, explicacao: e.target.value }))} />
          </Campo>
        )}
        <div>
          <span className="text-xs font-medium text-slate-300">Enviar nos grupos</span>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {dados.grupos.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-gv-line px-3 py-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-slate-200">
                  <input type="checkbox" className="accent-orange-500" checked={f.grupoIds.includes(g.id)} onChange={() => alternarGrupo(g.id)} />
                  {g.nome}
                </label>
                {g.topicos.length > 0 && f.grupoIds.includes(g.id) && (
                  <select
                    className={`${classeInput} h-8 w-auto text-xs`}
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
        <div className="flex flex-col gap-3">
          <Interruptor
            ligado={f.anonima}
            aoMudar={(anonima) => setF((v) => ({ ...v, anonima }))}
            titulo="Votos anônimos"
            descricao="Ninguém vê em quem cada pessoa votou."
          />
          {!quiz && (
            <Interruptor
              ligado={f.multipla}
              aoMudar={(multipla) => setF((v) => ({ ...v, multipla }))}
              titulo="Permitir marcar várias opções"
            />
          )}
        </div>
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
              aoSalvar(await apiTelegram.criarEnquete({ ...f, topicos }));
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          <BarChart3 className="size-4" /> Enviar enquete
        </Botao>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Mensagens apagadas (moderação)
// ---------------------------------------------------------------------------

function AbaModeracao() {
  const [lista, setLista] = useState<Moderacao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    apiTelegram.moderacao().then(setLista).catch((e) => setErro(mensagemDe(e)));
  }, []);

  return (
    <Card className="!p-0">
      <div className="p-4 pb-2">
        <TituloCard icone={MessageSquareText}>Mensagens apagadas pelo robô</TituloCard>
        <p className="mt-1 text-[12.5px] text-gv-muted">
          Tudo o que a moderação automática apagou nos grupos. Configure as regras de cada grupo na aba Grupos.
        </p>
      </div>
      <MensagemErro texto={erro} />
      {lista === null ? (
        !erro && <div className="py-10 text-center text-sm text-gv-muted">Carregando...</div>
      ) : lista.length === 0 ? (
        <Vazio icone={ShieldCheck}>Nenhuma mensagem apagada até agora.</Vazio>
      ) : (
        <ListaModeracao lista={lista} mostrarGrupo />
      )}
    </Card>
  );
}

function ListaModeracao({ lista, mostrarGrupo }: { lista: Moderacao[]; mostrarGrupo: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead className={cabecalhoTabela}>
          <tr>
            <th className="px-4 py-2 font-medium">Quando</th>
            {mostrarGrupo && <th className="px-4 py-2 font-medium">Grupo</th>}
            <th className="px-4 py-2 font-medium">Quem</th>
            <th className="px-4 py-2 font-medium">Motivo</th>
            <th className="px-4 py-2 font-medium">Mensagem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gv-line/70">
          {lista.map((m) => (
            <tr key={m.id} className="align-top">
              <td className="px-4 py-2.5 whitespace-nowrap text-gv-muted">{formatar.diaHora(m.momento)}</td>
              {mostrarGrupo && <td className="px-4 py-2.5 text-slate-200">{m.grupo}</td>}
              <td className="px-4 py-2.5 text-slate-200">
                {m.nome}
                {m.silenciadoAte && <div className="text-[11.5px] text-amber-300">silenciado até {formatar.diaHora(m.silenciadoAte)}</div>}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                <Chip cor={m.motivo === "link" ? "sky" : "red"}>{m.motivo === "link" ? "Link" : `Palavra: ${m.detalhe}`}</Chip>
              </td>
              <td className="max-w-[320px] px-4 py-2.5 text-gv-muted">
                <span className="line-clamp-2 break-words">{m.texto || m.detalhe}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
