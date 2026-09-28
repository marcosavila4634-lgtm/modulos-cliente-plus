import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  BookOpen,
  Bot,
  CircleCheck,
  CloudDownload,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  HardDrive,
  KeyRound,
  Lightbulb,
  List,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Abas, CabecalhoPagina, Card, CardNumero, Dica, TituloCard, Vazio, cabecalhoTabela } from "../../components/grupo-vip/ui";
import { formatar } from "../../lib/grupo-vip";
import {
  apiBiblioteca,
  enviarLivro,
  extensao,
  palavras,
  rotuloStatusImportacao,
  rotuloStatusItem,
  tamanho,
  type DadosImportacao,
  type DadosLivro,
  type Importacao,
  type ItemImportacao,
  type ListaLivros,
  type Livro,
  type PainelBiblioteca,
  type Palavras,
  type StatusItem,
  type Sugestao,
  type TipoBiblioteca,
} from "../../lib/grupo-vip-biblioteca";
import { BotaoGuia } from "../../components/grupo-vip/Ajuda";

type Aba = "envios" | "livros" | "sugestoes" | "pedidos" | "google";
type Busca = { aba?: Aba };

// Biblioteca: envio em massa de livros (Google Drive, computador ou o acervo
// de outro grupo seu) para os grupos do Telegram e robô bibliotecário (/livro
// no privado do robô).
export const Route = createFileRoute("/grupo-vip/biblioteca")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    aba: s.aba === "livros" || s.aba === "sugestoes" || s.aba === "pedidos" || s.aba === "google" ? s.aba : undefined,
  }),
  loader: () => apiBiblioteca.painel(),
  component: PaginaBiblioteca,
});

// validade dos links de livro (LinksDeLivro.HORAS)
const LINK_HORAS = 24;

const ativos = new Set(["listando", "enviando", "recebendo"]);

function PaginaBiblioteca() {
  const inicial = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [p, setP] = useState<PainelBiblioteca>(inicial);
  const [novo, setNovo] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const aba = busca.aba ?? "envios";
  const mudarAba = (a: Aba) => navigate({ to: "/grupo-vip/biblioteca", search: { aba: a === "envios" ? undefined : a }, replace: true });
  const recarregar = async () => {
    setP(await apiBiblioteca.painel());
    router.invalidate();
  };

  // Enquanto há envio em andamento, atualiza o progresso a cada 3 segundos.
  const andamento = p.importacoes.some((i) => ativos.has(i.status));
  useEffect(() => {
    if (!andamento) return;
    const t = setInterval(() => apiBiblioteca.painel().then(setP).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [andamento]);

  const totalLivros = p.resumo.reduce((s, r) => s + r.livros, 0);
  const v = palavras(p.tipo);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        guia={<BotaoGuia id="envio-massa" />}
        titulo="Biblioteca"
        descricao={
          p.tipo === "materiais"
            ? "Envie uma pasta inteira de materiais (apostilas, vídeos, áudios, planilhas... do Google Drive, do computador ou de outro grupo seu): o robô posta um por um no grupo do Telegram. No privado do robô, os membros procuram qualquer material pelo menu: por nome ou categoria."
            : "Envie uma pasta inteira de livros (do Google Drive, do computador ou de outro grupo seu): o robô posta um por um no grupo do Telegram. No privado do robô, os membros procuram qualquer livro pelo menu: por nome, autor, categoria ou gênero."
        }
      >
        <Botao onClick={() => setAjuda(true)}>
          <Download className="size-4" /> Como baixar todos os arquivos de um grupo do Telegram
        </Botao>
        <Botao variante="primario" disabled={!p.roboConectado || p.grupos.length === 0} onClick={() => setNovo(true)}>
          <Plus className="size-4" /> Novo envio em massa
        </Botao>
      </CabecalhoPagina>

      {(!p.roboConectado || p.grupos.length === 0) && (
        <Dica icone={Bot} cor="amber">
          A Biblioteca usa o robô do Telegram. Conecte o robô em{" "}
          <Link to="/grupo-vip/configuracoes" className="underline">
            Configurações
          </Link>
          , coloque o robô como administrador do grupo e informe o ID do grupo em{" "}
          <Link to="/grupo-vip/grupos" className="underline">
            Grupos e planos
          </Link>
          .
        </Dica>
      )}

      <SeletorTipo painel={p} aoSalvar={setP} />

      <div className="grid gap-3 sm:grid-cols-3">
        <CardNumero icone={BookOpen} cor="from-orange-400 to-orange-600" rotulo={`${v.Uns} na biblioteca`} valor={formatar.numero(totalLivros)} />
        <CardNumero icone={Send} cor="from-sky-400 to-sky-600" rotulo={`${v.Uns} pedidos ao robô hoje`} valor={p.pedidosHoje} detalhe={`limite de ${p.limitePorDia} por membro por dia`} />
        <CardNumero
          icone={CloudDownload}
          cor="from-violet-400 to-violet-600"
          rotulo="Envios em andamento"
          valor={p.importacoes.filter((i) => ativos.has(i.status)).length}
        />
      </div>

      <Abas
        abas={[
          { valor: "envios" as Aba, rotulo: "Envios em massa", quantidade: p.importacoes.length },
          { valor: "livros" as Aba, rotulo: v.Uns, quantidade: totalLivros },
          { valor: "sugestoes" as Aba, rotulo: "Sugestões", quantidade: p.sugestoesPendentes },
          { valor: "pedidos" as Aba, rotulo: "Robô e mais pedidos" },
          { valor: "google" as Aba, rotulo: p.contaServicoEmail ? "Google ✓" : "Google" },
        ]}
        valor={aba}
        aoMudar={mudarAba}
      />

      {aba === "envios" && <AbaEnvios painel={p} aoMudar={recarregar} aoConfigurarGoogle={() => mudarAba("google")} />}
      {aba === "livros" && <AbaLivros painel={p} aoMudar={recarregar} />}
      {aba === "sugestoes" && <AbaSugestoes v={v} aoMudar={recarregar} />}
      {aba === "pedidos" && <AbaMaisPedidos painel={p} />}
      {aba === "google" && <AbaGoogle painel={p} aoSalvar={setP} />}

      {ajuda && <ModalComoBaixar aoFechar={() => setAjuda(false)} />}

      {novo && (
        <ModalEnvio
          painel={p}
          aoRecarregar={recarregar}
          aoFechar={() => setNovo(false)}
          aoConfigurarGoogle={() => {
            setNovo(false);
            mudarAba("google");
          }}
          aoTerminar={async () => {
            setNovo(false);
            if (aba !== "envios") mudarAba("envios");
            await recarregar();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Livros ou outros materiais
// ---------------------------------------------------------------------------

// O que a biblioteca guarda. Materiais: textos do robô e do painel falam em
// "material", aceita também vídeos, imagens, planilhas e apresentações, e não
// usa o Google Books nem o campo gênero.
function SeletorTipo({ painel, aoSalvar }: { painel: PainelBiblioteca; aoSalvar: (p: PainelBiblioteca) => void }) {
  const { carregando, erro, executar } = useAcao();
  const opcoes: [TipoBiblioteca, typeof BookOpen, string, string][] = [
    ["livros", BookOpen, "Livros", "E-books, PDFs, quadrinhos e audiolivros. Completa autor, gênero e capa pelo Google Books."],
    ["materiais", FileText, "Outros materiais", "Apostilas, vídeos, áudios, imagens, planilhas, apresentações, modelos..."],
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-gv-muted">O que a sua biblioteca guarda:</span>
        <div className="inline-flex rounded-xl border border-gv-line bg-gv-bg/40 p-0.5">
          {opcoes.map(([valor, Icone, rotulo, dica]) => (
            <button
              key={valor}
              type="button"
              title={dica}
              disabled={carregando !== null}
              onClick={() => valor !== painel.tipo && executar(valor, async () => aoSalvar(await apiBiblioteca.mudarTipo(valor)))}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12.5px] font-medium transition ${
                painel.tipo === valor ? "bg-orange-500/20 text-orange-200" : "text-gv-muted hover:text-white"
              }`}
            >
              <Icone className="size-3.5" /> {rotulo}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-gv-muted">{opcoes.find((o) => o[0] === painel.tipo)?.[3]}</span>
      </div>
      <MensagemErro texto={erro} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Como baixar todos os arquivos de um grupo (pelo Telegram Desktop)
// ---------------------------------------------------------------------------

// Passo a passo para baixar vídeos, fotos e arquivos de um grupo ou canal para
// o computador. Serve para grupos de outras pessoas, onde o robô não entra: é
// o próprio Telegram que baixa, com a conta de quem está no grupo.
function ModalComoBaixar({ aoFechar }: { aoFechar: () => void }) {
  const passos = [
    <>
      Instale o <b>Telegram Desktop</b> no computador (
      <a href="https://desktop.telegram.org/" target="_blank" rel="noreferrer" className="text-orange-300 underline">
        desktop.telegram.org
      </a>
      ) e entre com a sua conta.
    </>,
    <>Abra o grupo ou canal de onde você quer baixar os arquivos.</>,
    <>
      Clique nos <b>três pontinhos (⋮)</b> no canto de cima e escolha <b>"Exportar histórico do chat"</b>.
    </>,
    <>
      Marque o que quer baixar: <b>Vídeos</b>, <b>Fotos</b>, <b>Arquivos</b> (livros, PDFs) e, se quiser, o texto das mensagens (a
      descrição de cada post).
    </>,
    <>
      Em <b>limite de tamanho</b>, aumente para o máximo (4000 MB). Senão os vídeos e arquivos grandes ficam de fora.
    </>,
    <>
      Escolha a <b>pasta</b> do computador onde salvar e o <b>período</b> (ex.: desde o começo).
    </>,
    <>
      Clique em <b>Exportar</b> e deixe o computador ligado até terminar. Com muitos arquivos pode levar algumas horas.
    </>,
  ];
  return (
    <Modal
      titulo="Como baixar todos os arquivos de um grupo do Telegram"
      subtitulo="Pelo próprio Telegram do computador, sem precisar do robô."
      aoFechar={aoFechar}
      largura="max-w-2xl"
    >
      <ol className="flex flex-col gap-3">
        {passos.map((passo, i) => (
          <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-slate-200">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">{i + 1}</span>
            <span>{passo}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-col gap-3">
        <Dica icone={FolderOpen} cor="emerald">
          No fim fica uma pasta com os arquivos separados (vídeos, fotos, arquivos) e um arquivo <b>messages.html</b>, que mostra cada arquivo
          junto com o texto do post. Para subir os arquivos para o seu grupo, use o <b>Novo envio em massa › Do computador › Escolher uma pasta</b>.
        </Dica>
        <Dica icone={TriangleAlert} cor="amber">
          <b>A opção não aparece ou os arquivos não vêm?</b> O dono do grupo ligou a proteção de conteúdo ("Restringir conteúdo salvo"). Aí o
          Telegram não deixa ninguém baixar.
        </Dica>
        <Dica icone={KeyRound}>
          Arquivos de grupos de outras pessoas são para o seu uso. Para postar no seu grupo ou vender o acesso, peça autorização ao dono do
          conteúdo (ou use conteúdo de domínio público).
        </Dica>
      </div>
      <div className="mt-5 flex justify-end">
        <Botao variante="primario" onClick={aoFechar}>
          Entendi
        </Botao>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Envios em massa
// ---------------------------------------------------------------------------

function AbaEnvios({ painel, aoMudar, aoConfigurarGoogle }: { painel: PainelBiblioteca; aoMudar: () => Promise<void>; aoConfigurarGoogle: () => void }) {
  const { carregando, erro, executar } = useAcao();
  const [vendo, setVendo] = useState<Importacao | null>(null);
  const v = palavras(painel.tipo);

  return (
    <div className="flex flex-col gap-3">
      {!painel.googleConfigurado && (
        <Dica icone={KeyRound}>
          Para enviar direto de uma pasta do Google Drive, conecte o{" "}
          <button type="button" onClick={aoConfigurarGoogle} className="underline">
            Google
          </button>{" "}
          (uma vez só). Enviar do computador funciona sem isso.
        </Dica>
      )}
      <MensagemErro texto={erro} />
      {painel.importacoes.length === 0 ? (
        <Card>
          <Vazio icone={CloudDownload}>Nenhum envio ainda. Toque em "Novo envio em massa".</Vazio>
        </Card>
      ) : (
        painel.importacoes.map((i) => {
          const feitos = i.enviados + i.pulados + i.grandes + i.falhas;
          const pct = i.total ? Math.round((feitos / i.total) * 100) : 0;
          return (
            <Card key={i.id}>
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gv-bg text-orange-300">
                  {i.origem === "drive" ? <HardDrive className="size-5" /> : i.origem === "telegram" ? <Copy className="size-5" /> : <Upload className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-poppins text-[15px] font-semibold text-white">
                      {i.origem === "drive"
                        ? (i.pastaNome ?? "Pasta do Google Drive")
                        : i.origem === "telegram"
                          ? `Acervo do grupo ${i.origemGrupo}`
                          : "Arquivos do computador"}
                    </span>
                    <SeloStatus status={i.status} />
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-gv-muted">
                    {i.grupo}
                    {i.topico ? ` › ${i.topico}` : ""} · {i.postarNoGrupo ? "posta no grupo e fica no robô" : "só no robô bibliotecário"} ·{" "}
                    {formatar.diaHora(i.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(i.status === "enviando" || i.status === "listando") && (
                    <Botao pequeno carregando={carregando === `pausar:${i.id}`} onClick={() => executar(`pausar:${i.id}`, async () => { await apiBiblioteca.pausar(i.id); await aoMudar(); })}>
                      <Pause className="size-3.5" /> Pausar
                    </Botao>
                  )}
                  {(i.status === "pausada" || i.status === "falhou") && (
                    <Botao pequeno variante="primario" carregando={carregando === `continuar:${i.id}`} onClick={() => executar(`continuar:${i.id}`, async () => { await apiBiblioteca.continuar(i.id); await aoMudar(); })}>
                      <Play className="size-3.5" /> {i.status === "falhou" ? "Tentar de novo" : "Continuar"}
                    </Botao>
                  )}
                  {i.falhas > 0 && i.status !== "recebendo" && i.status !== "listando" && (
                    <Botao pequeno carregando={carregando === `falhas:${i.id}`} onClick={() => executar(`falhas:${i.id}`, async () => { await apiBiblioteca.tentarFalhas(i.id); await aoMudar(); })}>
                      <RotateCw className="size-3.5" /> Reenviar {i.falhas} com falha
                    </Botao>
                  )}
                  {i.total > 0 && (
                    <Botao pequeno onClick={() => setVendo(i)}>
                      <List className="size-3.5" /> Arquivos
                    </Botao>
                  )}
                  <Botao
                    pequeno
                    variante="perigo"
                    carregando={carregando === `excluir:${i.id}`}
                    onClick={() =>
                      executar(`excluir:${i.id}`, async () => {
                        const msg = ativos.has(i.status) || i.status === "pausada"
                          ? `Cancelar este envio? O que ainda não foi postado não será mais enviado. Os ${v.uns} continuam na biblioteca.`
                          : `Tirar este envio da lista? Os ${v.uns} continuam na biblioteca e no grupo.`;
                        if (!confirm(msg)) return;
                        await apiBiblioteca.excluir(i.id);
                        await aoMudar();
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Botao>
                </div>
              </div>

              {i.status === "listando" && i.origem === "telegram" && i.varreduraAte ? (
                <LeituraDoGrupo importacao={i} />
              ) : i.status === "listando" ? (
                <p className="mt-3 text-[13px] text-sky-300">Lendo a pasta do Google Drive... (pastas grandes podem levar alguns minutos)</p>
              ) : (
                <>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gv-bg">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
                    <span className="text-white">
                      {formatar.numero(feitos)} de {formatar.numero(i.total)} ({pct}%)
                    </span>
                    <span className="text-emerald-300">{formatar.numero(i.enviados)} {i.postarNoGrupo ? "postados" : "na biblioteca"}</span>
                    {i.pulados > 0 && <span className="text-gv-muted">{i.pulados} pulados (repetidos ou formato não aceito)</span>}
                    {i.grandes > 0 && <span className="text-amber-300">{i.grandes} acima de 50 MB (o robô entrega um link temporário)</span>}
                    {i.falhas > 0 && <span className="text-red-300">{i.falhas} com falha</span>}
                    {i.minutosRestantes !== null && i.pendentes > 0 && (
                      <span className="text-gv-muted">
                        faltam {i.pendentes} · cerca de {i.minutosRestantes < 60 ? `${i.minutosRestantes} min` : `${Math.floor(i.minutosRestantes / 60)} h ${i.minutosRestantes % 60} min`}
                      </span>
                    )}
                  </div>
                </>
              )}
              {i.origem === "telegram" && i.protegidas > 0 && (
                <p className="mt-2 text-[12.5px] text-amber-300">
                  {i.protegidas} mensagem(ns) com conteúdo protegido não puderam ser copiadas. Para copiar: no grupo {i.origemGrupo}, Editar › desligue
                  "Restringir conteúdo salvo" e rode a cópia de novo (o que já foi copiado é pulado).
                </p>
              )}
              {i.erro && (
                <div className="mt-2 inline-flex items-start gap-1.5 text-[12.5px] text-amber-300">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {i.erro}
                </div>
              )}
              {i.status === "recebendo" && (
                <p className="mt-2 text-[12.5px] text-amber-300">
                  Os arquivos pararam de chegar (a janela foi fechada?). Exclua este envio e comece de novo.
                </p>
              )}
            </Card>
          );
        })
      )}
      {vendo && <ModalArquivos importacao={vendo} aoFechar={() => setVendo(null)} />}
    </div>
  );
}

// Andamento da leitura das mensagens do grupo de origem (cópia entre grupos).
function LeituraDoGrupo({ importacao: i }: { importacao: Importacao }) {
  const ate = i.varreduraAte ?? 1;
  const atual = Math.min(i.varreduraAtual ?? 1, ate);
  const pct = Math.round((atual / ate) * 100);
  const segundos = Math.max(0, ate - atual);
  return (
    <>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gv-bg">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
        <span className="text-sky-300">
          Lendo a mensagem {formatar.numero(atual)} de {formatar.numero(ate)} do grupo {i.origemGrupo}
        </span>
        <span className="text-white">{formatar.numero(i.total)} arquivo(s) encontrados</span>
        <span className="text-gv-muted">
          faltam cerca de {segundos < 3600 ? `${Math.ceil(segundos / 60)} min` : `${Math.floor(segundos / 3600)} h ${Math.ceil((segundos % 3600) / 60)} min`} de leitura; depois
          o robô copia
        </span>
      </div>
    </>
  );
}

function SeloStatus({ status }: { status: Importacao["status"] }) {
  const cores: Record<Importacao["status"], string> = {
    recebendo: "bg-sky-500/15 text-sky-300",
    listando: "bg-sky-500/15 text-sky-300",
    enviando: "bg-orange-500/15 text-orange-300",
    pausada: "bg-slate-500/20 text-slate-300",
    concluida: "bg-emerald-500/15 text-emerald-300",
    falhou: "bg-red-500/15 text-red-300",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cores[status]}`}>{rotuloStatusImportacao[status]}</span>;
}

function ModalArquivos({ importacao, aoFechar }: { importacao: Importacao; aoFechar: () => void }) {
  const [filtro, setFiltro] = useState<StatusItem | "todos">("todos");
  const [itens, setItens] = useState<ItemImportacao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    setItens(null);
    apiBiblioteca
      .detalhes(importacao.id, filtro === "todos" ? null : filtro)
      .then((d) => setItens(d.itens))
      .catch((e) => setErro(mensagemDe(e)));
  }, [importacao.id, filtro]);
  const cor: Record<StatusItem, string> = {
    pendente: "text-gv-muted",
    enviado: "text-emerald-300",
    pulado: "text-slate-400",
    grande_demais: "text-amber-300",
    falhou: "text-red-300",
  };

  return (
    <Modal titulo="Arquivos do envio" subtitulo="Mostra até 500 arquivos por vez." aoFechar={aoFechar} largura="max-w-3xl">
      <Abas
        abas={[
          { valor: "todos" as const, rotulo: "Todos", quantidade: importacao.total },
          { valor: "falhou" as const, rotulo: "Com falha", quantidade: importacao.falhas },
          { valor: "grande_demais" as const, rotulo: "Acima de 50 MB", quantidade: importacao.grandes },
          { valor: "pulado" as const, rotulo: "Pulados", quantidade: importacao.pulados },
          { valor: "pendente" as const, rotulo: "Na fila", quantidade: importacao.pendentes },
        ]}
        valor={filtro}
        aoMudar={setFiltro}
      />
      <div className="mt-3">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-2 max-h-[60vh] overflow-y-auto">
        {itens === null ? (
          <div className="py-8 text-center text-sm text-gv-muted">Carregando...</div>
        ) : itens.length === 0 ? (
          <div className="py-8 text-center text-sm text-gv-muted">Nenhum arquivo aqui.</div>
        ) : (
          <ul className="divide-y divide-gv-line/70">
            {itens.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 text-[13px]">
                <span className="min-w-0 flex-1 truncate text-slate-200">{i.arquivoNome}</span>
                <span className="text-gv-muted">{tamanho(i.tamanho)}</span>
                <span className={`w-28 text-right font-medium ${cor[i.status]}`}>{rotuloStatusItem[i.status]}</span>
                {i.erro && <span className="w-full text-[12px] text-gv-muted">{i.erro}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Novo envio em massa
// ---------------------------------------------------------------------------

function ModalEnvio({
  painel,
  aoRecarregar,
  aoFechar,
  aoTerminar,
  aoConfigurarGoogle,
}: {
  painel: PainelBiblioteca;
  aoRecarregar: () => Promise<void>;
  aoFechar: () => void;
  aoTerminar: () => void;
  aoConfigurarGoogle: () => void;
}) {
  const [f, setF] = useState<DadosImportacao>({
    origem: painel.googleConfigurado ? "drive" : "computador",
    pastaUrl: "",
    grupoId: painel.grupos[0]?.id ?? "",
    topicoId: null,
    postarNoGrupo: true,
    origemGrupoId: null,
    ultimaMensagem: "",
    primeiraMensagem: "",
    copiarMidias: false,
  });
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [progresso, setProgresso] = useState<{ atual: number; total: number; pct: number; falhas: string[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [trabalhando, setTrabalhando] = useState(false);
  const entradaArquivos = useRef<HTMLInputElement>(null);
  const entradaPasta = useRef<HTMLInputElement>(null);
  const grupo = painel.grupos.find((g) => g.id === f.grupoId);
  const outrosGrupos = painel.grupos.filter((g) => g.id !== f.grupoId);
  const [conferindo, setConferindo] = useState(false);
  const v = palavras(painel.tipo);

  // Separa o que dá para enviar do que vai ser ignorado (formato ou tamanho).
  const analise = useMemo(() => {
    const aceitos = arquivos.filter((a) => painel.extensoes.includes(extensao(a.name)) && a.size <= painel.tamanhoMaximo);
    const formato = arquivos.filter((a) => !painel.extensoes.includes(extensao(a.name))).length;
    const grandes = arquivos.filter((a) => painel.extensoes.includes(extensao(a.name)) && a.size > painel.tamanhoMaximo).length;
    return { aceitos, formato, grandes, bytes: aceitos.reduce((s, a) => s + a.size, 0) };
  }, [arquivos, painel]);

  const escolher = (lista: FileList | null) => {
    if (!lista) return;
    setArquivos((atuais) => {
      const chaves = new Set(atuais.map((a) => `${a.name}:${a.size}`));
      return [...atuais, ...Array.from(lista).filter((a) => !chaves.has(`${a.name}:${a.size}`))];
    });
  };

  async function comecar() {
    setErro(null);
    if (f.origem === "computador" && analise.aceitos.length === 0) {
      setErro(`Escolha os arquivos dos ${v.uns}`);
      return;
    }
    setTrabalhando(true);
    try {
      const imp = await apiBiblioteca.criar({
        ...f,
        pastaUrl: f.origem === "drive" ? f.pastaUrl : null,
        origemGrupoId: f.origem === "telegram" ? (f.origemGrupoId ?? outrosGrupos[0]?.id ?? null) : null,
      });
      if (f.origem !== "computador") {
        aoTerminar();
        return;
      }
      const falhas: string[] = [];
      for (let n = 0; n < analise.aceitos.length; n++) {
        const a = analise.aceitos[n];
        setProgresso({ atual: n + 1, total: analise.aceitos.length, pct: 0, falhas });
        try {
          await enviarLivro(imp.id, a, (pct) => setProgresso({ atual: n + 1, total: analise.aceitos.length, pct, falhas }));
        } catch (e) {
          falhas.push(`${a.name}: ${mensagemDe(e)}`);
        }
      }
      await apiBiblioteca.iniciar(imp.id);
      if (falhas.length) {
        setProgresso({ atual: analise.aceitos.length, total: analise.aceitos.length, pct: 100, falhas });
        setErro(`${falhas.length} arquivo(s) não chegaram ao sistema. Os outros já estão na fila.`);
        return;
      }
      aoTerminar();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setTrabalhando(false);
    }
  }

  const enviandoArquivos = progresso !== null && trabalhando;

  return (
    <Modal
      titulo="Novo envio em massa"
      subtitulo={`Os ${v.uns} entram na biblioteca e o robô posta um por um no grupo (cerca de 20 por minuto).`}
      aoFechar={enviandoArquivos ? () => {} : aoFechar}
      largura="max-w-2xl"
    >
      {progresso ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-white">
            {progresso.atual < progresso.total || trabalhando
              ? `Enviando arquivo ${progresso.atual} de ${progresso.total} para o sistema...`
              : "Arquivos recebidos."}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gv-bg">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              style={{ width: `${((progresso.atual - 1 + progresso.pct / 100) / progresso.total) * 100}%` }}
            />
          </div>
          <Dica icone={TriangleAlert} cor="amber">
            Não feche esta janela enquanto os arquivos sobem do seu computador. Depois disso o robô continua sozinho, mesmo com a janela fechada.
          </Dica>
          <MensagemErro texto={erro} />
          {progresso.falhas.length > 0 && (
            <ul className="max-h-40 overflow-y-auto text-[12px] text-red-300">
              {progresso.falhas.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
          {!trabalhando && (
            <div className="flex justify-end">
              <Botao variante="primario" onClick={aoTerminar}>
                Ver o envio
              </Botao>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["drive", HardDrive, "Pasta do Google Drive", "Cole o link da pasta"],
                  ["computador", Upload, "Do computador", "Escolha arquivos ou uma pasta"],
                  ["telegram", Copy, "Outro grupo seu", "Copia o acervo de um grupo para outro"],
                ] as const
              ).map(([valor, Icone, rotulo, dica]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setF((v) => ({ ...v, origem: valor }))}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                    f.origem === valor ? "border-orange-500/70 bg-orange-500/10" : "border-gv-line hover:border-slate-600"
                  }`}
                >
                  <Icone className="mt-0.5 size-5 shrink-0 text-orange-300" />
                  <span>
                    <span className="block text-sm font-semibold text-white">{rotulo}</span>
                    <span className="block text-[11.5px] text-gv-muted">{dica}</span>
                  </span>
                </button>
              ))}
            </div>

            {f.origem === "telegram" ? (
              <div className="grid gap-4">
                {!painel.donoConectado ? (
                  <Dica icone={Bot} cor="amber">
                    <b>1º passo (uma vez só):</b> conecte o seu Telegram de dono ao robô. Ele usa a conversa com você para ler as mensagens do
                    grupo antigo (elas aparecem e somem rapidinho). <BotaoGuia id="dono-telegram" rotulo="Passo a passo completo" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {painel.linkDono && (
                        <a href={painel.linkDono} target="_blank" rel="noreferrer">
                          <Botao pequeno variante="telegram">
                            <ExternalLink className="size-3.5" /> Conectar meu Telegram
                          </Botao>
                        </a>
                      )}
                      <Botao
                        pequeno
                        carregando={conferindo}
                        onClick={async () => {
                          setConferindo(true);
                          try {
                            await aoRecarregar();
                          } finally {
                            setConferindo(false);
                          }
                        }}
                      >
                        Já conectei
                      </Botao>
                    </div>
                  </Dica>
                ) : (
                  <p className="inline-flex items-center gap-1.5 text-[12.5px] text-emerald-300">
                    <CircleCheck className="size-4" /> Seu Telegram de dono está conectado ao robô.
                  </p>
                )}
                <Campo rotulo="Copiar DO grupo *" dica="O robô precisa ser administrador deste grupo também.">
                  <select
                    className={classeInput}
                    value={f.origemGrupoId ?? outrosGrupos[0]?.id ?? ""}
                    onChange={(e) => setF((v) => ({ ...v, origemGrupoId: e.target.value }))}
                  >
                    {outrosGrupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo
                  rotulo="Link da ÚLTIMA mensagem do grupo de origem *"
                  dica={
                    <>
                      No Telegram (computador): abra o grupo de origem, clique com o botão direito na última mensagem › <b>Copiar link</b>. No
                      celular: segure a mensagem › Copiar link. Assim o robô sabe até onde ler.
                    </>
                  }
                >
                  <input
                    className={classeInput}
                    value={f.ultimaMensagem}
                    placeholder="https://t.me/c/1234567890/4567"
                    onChange={(e) => setF((v) => ({ ...v, ultimaMensagem: e.target.value }))}
                  />
                </Campo>
                <Campo rotulo="Link da primeira mensagem (opcional)" dica="Vazio = lê desde o começo do grupo.">
                  <input
                    className={classeInput}
                    value={f.primeiraMensagem}
                    placeholder="https://t.me/c/1234567890/1"
                    onChange={(e) => setF((v) => ({ ...v, primeiraMensagem: e.target.value }))}
                  />
                </Campo>
                <Interruptor
                  ligado={f.copiarMidias}
                  aoMudar={(copiarMidias) => setF((v) => ({ ...v, copiarMidias }))}
                  titulo="Copiar também fotos, vídeos e áudios"
                  descricao={`Desligado: copia só os arquivos (${painel.tipo === "materiais" ? "PDFs, documentos, planilhas" : "livros, PDFs, documentos"}). Mensagens de texto nunca são copiadas.`}
                />
                <p className="text-[12px] text-gv-muted">
                  O robô lê cerca de 1 mensagem por segundo e depois copia cerca de 20 arquivos por minuto. Os {v.uns} que o robô já postou no
                  grupo de origem vão direto, sem precisar ler.
                </p>
              </div>
            ) : f.origem === "drive" ? (
              painel.googleConfigurado ? (
                <Campo
                  rotulo="Link da pasta do Google Drive *"
                  dica={
                    <>
                      {painel.contaServicoEmail ? (
                        <>
                          No Drive: botão direito na pasta › <b>Compartilhar</b> › adicione <b>{painel.contaServicoEmail}</b> como Leitor (acesso
                          geral: Restrito) › Copiar link. As subpastas também entram.
                        </>
                      ) : (
                        <>
                          No Drive: botão direito na pasta › <b>Compartilhar</b> › Acesso geral: <b>Qualquer pessoa com o link</b> › Copiar link. As
                          subpastas também entram. Melhor: use a pasta privada (aba Google).
                        </>
                      )}
                    </>
                  }
                >
                  <input
                    autoFocus
                    className={classeInput}
                    value={f.pastaUrl ?? ""}
                    placeholder="https://drive.google.com/drive/folders/..."
                    onChange={(e) => setF((v) => ({ ...v, pastaUrl: e.target.value }))}
                  />
                </Campo>
              ) : (
                <Dica icone={KeyRound} cor="amber">
                  Para ler pastas do Drive, primeiro conecte o{" "}
                  <button type="button" className="underline" onClick={aoConfigurarGoogle}>
                    Google
                  </button>{" "}
                  (leva uns 5 minutos, uma vez só).
                </Dica>
              )
            ) : (
              <div>
                <span className="text-xs font-medium text-slate-300">Arquivos dos {v.uns} *</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Botao onClick={() => entradaArquivos.current?.click()}>
                    <Upload className="size-4" /> Escolher arquivos
                  </Botao>
                  <Botao onClick={() => entradaPasta.current?.click()}>
                    <FolderOpen className="size-4" /> Escolher uma pasta
                  </Botao>
                  {arquivos.length > 0 && (
                    <Botao variante="perigo" onClick={() => setArquivos([])}>
                      Limpar
                    </Botao>
                  )}
                </div>
                <input ref={entradaArquivos} type="file" multiple hidden onChange={(e) => { escolher(e.target.files); e.target.value = ""; }} />
                <input
                  ref={(el) => {
                    entradaPasta.current = el;
                    el?.setAttribute("webkitdirectory", "");
                  }}
                  type="file"
                  hidden
                  onChange={(e) => {
                    escolher(e.target.files);
                    e.target.value = "";
                  }}
                />
                {arquivos.length > 0 && (
                  <div className="mt-2 rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2 text-[12.5px]">
                    <div className="text-white">
                      {formatar.numero(analise.aceitos.length)} arquivo(s) para enviar · {tamanho(analise.bytes)}
                    </div>
                    {analise.formato > 0 && <div className="text-gv-muted">{analise.formato} arquivo(s) ignorados (formato não aceito)</div>}
                    {analise.grandes > 0 && <div className="text-amber-300">{analise.grandes} arquivo(s) acima de 50 MB ignorados (limite do robô)</div>}
                  </div>
                )}
                <p className="mt-1.5 text-[11.5px] text-gv-muted">Formatos: {painel.extensoes.join(", ")}. Até 50 MB por arquivo.</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo={f.origem === "telegram" ? "Copiar PARA o grupo *" : "Grupo *"}>
                <select
                  className={classeInput}
                  value={f.grupoId}
                  onChange={(e) => setF((v) => ({ ...v, grupoId: e.target.value, topicoId: null }))}
                >
                  {painel.grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              {grupo && grupo.topicos.length > 0 && f.postarNoGrupo && (
                <Campo rotulo="Tópico" dica={`Dica: crie um tópico só para os ${v.uns}.`}>
                  <select className={classeInput} value={f.topicoId ?? ""} onChange={(e) => setF((v) => ({ ...v, topicoId: e.target.value || null }))}>
                    <option value="">Tópico geral</option>
                    {grupo.topicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </Campo>
              )}
            </div>
            <Interruptor
              ligado={f.postarNoGrupo}
              aoMudar={(postarNoGrupo) => setF((v) => ({ ...v, postarNoGrupo }))}
              titulo={`Postar os ${v.uns} no grupo`}
              descricao={
                f.postarNoGrupo
                  ? `O robô posta um por um no grupo (${v.uns} que já estão no grupo são pulados). Eles também ficam no robô bibliotecário.`
                  : `Os ${v.uns} ficam só no robô bibliotecário: o membro pede pelo menu do robô e recebe no privado. O grupo não recebe nada.`
              }
            />
            {f.postarNoGrupo && f.origem === "computador" && analise.aceitos.length > 0 && (
              <p className="text-[12px] text-gv-muted">
                Tempo estimado para postar no grupo: cerca de{" "}
                {Math.ceil((analise.aceitos.length * 3) / 60) < 60
                  ? `${Math.ceil((analise.aceitos.length * 3) / 60)} min`
                  : `${Math.floor((analise.aceitos.length * 3) / 3600)} h ${Math.ceil(((analise.aceitos.length * 3) % 3600) / 60)} min`}{" "}
                (o Telegram aceita uns 20 arquivos por minuto).
              </p>
            )}
          </div>
          <div className="mt-4">
            <MensagemErro texto={erro} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Botao onClick={aoFechar}>Cancelar</Botao>
            <Botao
              variante="primario"
              carregando={trabalhando}
              disabled={
                (f.origem === "drive" && !painel.googleConfigurado) ||
                (f.origem === "telegram" && (!painel.donoConectado || outrosGrupos.length === 0))
              }
              onClick={comecar}
            >
              <CloudDownload className="size-4" /> Começar
            </Botao>
          </div>
        </>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Livros
// ---------------------------------------------------------------------------

function AbaLivros({ painel, aoMudar }: { painel: PainelBiblioteca; aoMudar: () => Promise<void> }) {
  const [termo, setTermo] = useState("");
  const [grupo, setGrupo] = useState<string>("");
  const [pagina, setPagina] = useState(0);
  const [lista, setLista] = useState<ListaLivros | null>(null);
  const [editando, setEditando] = useState<Livro | null>(null);
  // capas que não carregaram (mostra o ícone no lugar)
  const [semCapa, setSemCapa] = useState<Set<string>>(new Set());
  const { carregando, erro, setErro, executar } = useAcao();
  const v = palavras(painel.tipo);
  const materiais = painel.tipo === "materiais";

  const buscar = async (pg = pagina) => {
    try {
      setLista(await apiBiblioteca.livros(termo, grupo || null, pg));
    } catch (e) {
      setErro(mensagemDe(e));
    }
  };
  useEffect(() => {
    const t = setTimeout(() => {
      setPagina(0);
      buscar(0);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo, grupo]);

  const paginas = lista ? Math.max(1, Math.ceil(lista.total / lista.porPagina)) : 1;

  return (
    <Card className="!p-0">
      <div className="flex flex-wrap gap-2 border-b border-gv-line p-4">
        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gv-muted" />
          <input className={`${classeInput} pl-9`} type="search" placeholder={`Buscar ${v.um}`} value={termo} onChange={(e) => setTermo(e.target.value)} />
        </label>
        {painel.resumo.length > 1 && (
          <select className={`${classeInput} w-auto`} value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="">Todos os grupos</option>
            {painel.resumo.map((r) => (
              <option key={r.grupoId} value={r.grupoId}>
                {r.grupo} ({r.livros})
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="px-4 pt-3">
        <MensagemErro texto={erro} />
      </div>
      {lista === null ? (
        <div className="py-10 text-center text-sm text-gv-muted">Carregando...</div>
      ) : lista.livros.length === 0 ? (
        <Vazio icone={materiais ? FileText : BookOpen}>{termo ? `Nenhum ${v.um} com essa busca.` : `Nenhum ${v.um} ainda. Faça um envio em massa.`}</Vazio>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className={cabecalhoTabela}>
                <tr>
                  <th className="px-4 py-2 font-medium">{v.Um}</th>
                  <th className="px-4 py-2 font-medium">Grupo</th>
                  <th className="px-4 py-2 font-medium">Tamanho</th>
                  <th className="px-4 py-2 text-right font-medium">Pedidos</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gv-line/70">
                {lista.livros.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-start gap-3">
                        {l.capaUrl && !semCapa.has(l.id) ? (
                          <img
                            src={l.capaUrl}
                            alt=""
                            className="h-14 w-10 shrink-0 rounded object-cover"
                            loading="lazy"
                            onError={() => setSemCapa((s) => new Set(s).add(l.id))}
                          />
                        ) : (
                          <span className="grid h-14 w-10 shrink-0 place-items-center rounded bg-gv-bg text-gv-muted">
                            {materiais ? <FileText className="size-4" /> : <BookOpen className="size-4" />}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-white">{l.titulo}</div>
                          {(l.autor || l.ano) && (
                            <div className="text-[12px] text-slate-300">
                              {l.autor}
                              {l.ano ? ` (${l.ano})` : ""}
                            </div>
                          )}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {l.categoria && <Etiqueta cor="orange">{l.categoria}</Etiqueta>}
                            {l.genero && l.genero !== l.categoria && <Etiqueta cor="violet">{l.genero}</Etiqueta>}
                            {l.soLink && <Etiqueta cor="amber">acima de 50 MB · vai por link temporário</Etiqueta>}
                            {!materiais && l.dadosStatus === "pendente" && painel.completarLivros && <Etiqueta cor="sky">buscando dados...</Etiqueta>}
                            {!materiais && l.dadosStatus === "nao_encontrado" && <Etiqueta cor="slate">não achado no Google Books</Etiqueta>}
                          </div>
                          <div className="mt-0.5 text-[11.5px] text-gv-muted">
                            {l.arquivoNome} · {l.origem === "drive" ? "Google Drive" : l.origem === "telegram" ? "copiado de grupo" : "computador"}
                            {l.noTelegram && " · já no Telegram"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{l.grupo}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-gv-muted">{tamanho(l.tamanho)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-200">{l.pedidos}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => setEditando(l)}
                        className="rounded-lg p-1.5 text-gv-muted hover:bg-white/5 hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir"
                        disabled={carregando === l.id}
                        onClick={() =>
                          executar(l.id, async () => {
                            if (!confirm(`Tirar "${l.titulo}" da biblioteca? O robô para de enviar este ${v.um}.`)) return;
                            const doGrupo = confirm(`Apagar também os posts deste ${v.um} no grupo do Telegram?\n\nOK = apagar do grupo · Cancelar = deixar no grupo`);
                            await apiBiblioteca.excluirLivro(l.id, doGrupo);
                            await buscar();
                            await aoMudar();
                          })
                        }
                        className="rounded-lg p-1.5 text-gv-muted hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-gv-line px-4 py-3 text-[12.5px] text-gv-muted">
            <span>
              {formatar.numero(lista.total)} {v.um}(s) · página {lista.pagina + 1} de {paginas}
            </span>
            <div className="flex gap-1.5">
              <Botao pequeno disabled={pagina === 0} onClick={() => { setPagina(pagina - 1); buscar(pagina - 1); }}>
                Anterior
              </Botao>
              <Botao pequeno disabled={pagina + 1 >= paginas} onClick={() => { setPagina(pagina + 1); buscar(pagina + 1); }}>
                Próxima
              </Botao>
            </div>
          </div>
        </>
      )}
      {editando && (
        <ModalLivro
          tipo={painel.tipo}
          livro={editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => {
            setEditando(null);
            await buscar();
          }}
        />
      )}
    </Card>
  );
}

function Etiqueta({ cor, children }: { cor: "orange" | "violet" | "amber" | "sky" | "slate"; children: React.ReactNode }) {
  const cores = {
    orange: "bg-orange-500/15 text-orange-300",
    violet: "bg-violet-500/15 text-violet-300",
    amber: "bg-amber-500/15 text-amber-300",
    sky: "bg-sky-500/15 text-sky-300",
    slate: "bg-slate-500/20 text-slate-300",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${cores[cor]}`}>{children}</span>;
}

// Corrigir os dados do livro (o que o robô usa para buscar por autor, categoria e gênero).
function ModalLivro({ tipo, livro, aoFechar, aoSalvar }: { tipo: TipoBiblioteca; livro: Livro; aoFechar: () => void; aoSalvar: () => void }) {
  const v = palavras(tipo);
  const materiais = tipo === "materiais";
  const [f, setF] = useState<DadosLivro>({
    titulo: livro.titulo,
    autor: livro.autor ?? "",
    categoria: livro.categoria ?? "",
    genero: livro.genero ?? "",
    sinopse: livro.sinopse ?? "",
  });
  const { carregando, erro, executar } = useAcao();
  const muda = (campo: keyof DadosLivro) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [campo]: e.target.value }));

  return (
    <Modal titulo={`Dados do ${v.um}`} subtitulo={livro.arquivoNome} aoFechar={aoFechar} largura="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Título *" className="sm:col-span-2">
          <input autoFocus className={classeInput} value={f.titulo} onChange={muda("titulo")} />
        </Campo>
        <Campo rotulo={materiais ? "Autor (opcional)" : "Autor"} className="sm:col-span-2">
          <input className={classeInput} value={f.autor} onChange={muda("autor")} placeholder={materiais ? "Ex.: nome do professor" : "Ex.: Machado de Assis"} />
        </Campo>
        <Campo rotulo="Categoria" className={materiais ? "sm:col-span-2" : undefined} dica={`No robô: Baixar um ${v.um} › Por categoria.`}>
          <input className={classeInput} value={f.categoria} onChange={muda("categoria")} placeholder={materiais ? "Ex.: Módulo 1" : "Ex.: Clássicos"} />
        </Campo>
        {!materiais && (
          <Campo rotulo="Gênero" dica="No robô: Baixar um livro › Por gênero.">
            <input className={classeInput} value={f.genero} onChange={muda("genero")} placeholder="Ex.: Romance" />
          </Campo>
        )}
        <Campo rotulo={materiais ? "Descrição" : "Resumo"} className="sm:col-span-2" dica={`Aparece no ${v.Um} surpresa do robô.`}>
          <textarea className={classeTexto} rows={4} value={f.sinopse} onChange={muda("sinopse")} />
        </Campo>
      </div>
      <p className="mt-3 text-[12px] text-gv-muted">
        Salvar vale também para as cópias deste {v.um} em outros grupos{materiais ? "." : ", e o Google Books não troca mais."}
      </p>
      <div className="mt-3">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {!materiais && <Botao
          carregando={carregando === "google"}
          onClick={() =>
            executar("google", async () => {
              await apiBiblioteca.buscarDados(livro.id);
              aoSalvar();
            })
          }
        >
          <RotateCw className="size-4" /> Buscar no Google Books de novo
        </Botao>}
        <Botao onClick={aoFechar}>Cancelar</Botao>
        <Botao
          variante="primario"
          carregando={carregando === "salvar"}
          onClick={() =>
            executar("salvar", async () => {
              await apiBiblioteca.editarLivro(livro.id, f);
              aoSalvar();
            })
          }
        >
          Salvar
        </Botao>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sugestões dos membros
// ---------------------------------------------------------------------------

function AbaSugestoes({ v, aoMudar }: { v: Palavras; aoMudar: () => Promise<void> }) {
  const [lista, setLista] = useState<Sugestao[] | null>(null);
  const { carregando, erro, setErro, executar } = useAcao();
  useEffect(() => {
    apiBiblioteca.sugestoes().then(setLista).catch((e) => setErro(mensagemDe(e)));
  }, [setErro]);

  const responder = (s: Sugestao, acao: "adicionado" | "recusado") =>
    executar(`${acao}:${s.ids[0]}`, async () => {
      if (acao === "recusado" && !confirm(`Recusar "${s.titulo}"? Quem pediu recebe um aviso no Telegram.`)) return;
      setLista(await apiBiblioteca.responder(s.ids, acao, null));
      await aoMudar();
    });

  const pendentes = lista?.filter((s) => s.status === "pendente") ?? [];
  const respondidas = lista?.filter((s) => s.status !== "pendente") ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Dica icone={Lightbulb}>
        {v.Uns} que os membros pediram pelo robô (menu › Sugerir um {v.um}). Quando o {v.um} chega pela biblioteca (envio em massa), a sugestão
        é atendida sozinha e o robô avisa quem pediu com um botão para receber. Se o {v.um} já estava lá com outro nome, toque em{" "}
        <b>Já está na biblioteca</b>.
      </Dica>
      <MensagemErro texto={erro} />
      <Card className="!p-0">
        <div className="p-4 pb-2">
          <TituloCard icone={Lightbulb}>Pedidos em aberto</TituloCard>
        </div>
        {lista === null ? (
          <div className="py-8 text-center text-sm text-gv-muted">Carregando...</div>
        ) : pendentes.length === 0 ? (
          <Vazio icone={Lightbulb}>Nenhuma sugestão em aberto.</Vazio>
        ) : (
          <ul className="divide-y divide-gv-line/70">
            {pendentes.map((s) => (
              <li key={s.ids[0]} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white">
                    {s.titulo}
                    {s.autor && <span className="font-normal text-slate-300"> · {s.autor}</span>}
                  </div>
                  <div className="text-[12px] text-gv-muted">
                    {s.pedidos} pedido(s) · {s.nomes.join(", ")}
                    {s.pedidos > s.nomes.length ? "..." : ""} · último {formatar.diaHora(s.ultimaEm)}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Botao pequeno variante="sucesso" carregando={carregando === `adicionado:${s.ids[0]}`} onClick={() => responder(s, "adicionado")}>
                    <CircleCheck className="size-3.5" /> Já está na biblioteca
                  </Botao>
                  <Botao pequeno variante="perigo" carregando={carregando === `recusado:${s.ids[0]}`} onClick={() => responder(s, "recusado")}>
                    Recusar
                  </Botao>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {respondidas.length > 0 && (
        <Card className="!p-0">
          <div className="p-4 pb-2">
            <TituloCard icone={List}>Respondidas (últimos 60 dias)</TituloCard>
          </div>
          <ul className="divide-y divide-gv-line/70">
            {respondidas.map((s) => (
              <li key={s.ids[0]} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1 text-slate-200">
                  {s.titulo} <span className="text-gv-muted">· {s.nomes.join(", ")}</span>
                </span>
                <span className={s.status === "adicionado" ? "text-emerald-300" : "text-red-300"}>
                  {s.status === "adicionado" ? `Atendida${s.livro ? `: ${s.livro}` : ""}` : "Recusada"}
                </span>
                <span className="text-[11.5px] text-gv-muted">{formatar.diaHora(s.respondidaEm)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mais pedidos
// ---------------------------------------------------------------------------

function AbaMaisPedidos({ painel }: { painel: PainelBiblioteca }) {
  const v = palavras(painel.tipo);
  const materiais = painel.tipo === "materiais";
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <Card className="!p-0">
        <div className="p-4 pb-2">
          <TituloCard icone={Send}>{v.Uns} mais pedidos ao robô</TituloCard>
        </div>
        {painel.maisPedidos.length === 0 ? (
          <Vazio icone={BookOpen}>Ninguém pediu {v.uns} ao robô ainda.</Vazio>
        ) : (
          <ol className="divide-y divide-gv-line/70">
            {painel.maisPedidos.map((m, i) => (
              <li key={m.livroId} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-6 text-right font-poppins text-sm font-bold text-orange-300">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-white">{m.titulo}</div>
                  <div className="text-[11.5px] text-gv-muted">{m.grupo}</div>
                </div>
                <div className="text-right text-[12.5px]">
                  <div className="text-white">{m.pedidos} pedidos</div>
                  <div className="text-gv-muted">{m.pedidos30Dias} nos últimos 30 dias</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
      <Card>
        <TituloCard icone={Bot}>Como o membro usa o robô</TituloCard>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[13px] text-slate-300">
          <li>
            Abre a conversa com o robô{painel.roboUsuario ? <b> @{painel.roboUsuario}</b> : ""} no Telegram e escreve "oi" (ou toca em Menu).
          </li>
          <li>
            O robô mostra os botões: <b>Baixar um {v.um}</b>, Sugerir um {v.um}, Novidades, Mais pedidos, {v.Um} surpresa, Meus pedidos, Meus
            grupos, Minha assinatura, Indique e ganhe, Falar com a equipe e Conhecer mais.
          </li>
          <li>
            {materiais ? (
              <>
                Em Baixar um material, escolhe como procurar: <b>pelo nome</b> ou <b>por categoria</b> (as subpastas do Drive ou do computador).
              </>
            ) : (
              <>
                Em Baixar um livro, escolhe como procurar: <b>pelo nome</b>, <b>pelo autor</b>, <b>por categoria</b> (as subpastas do Drive) ou{" "}
                <b>por gênero</b> (Google Books).
              </>
            )}
          </li>
          <li>
            Toca no {v.um} e recebe o arquivo no privado (protegido contra encaminhar, se o grupo estiver com proteção). Arquivo acima de 50 MB vai
            por um link temporário do sistema (só dele, vale 24 horas e para de abrir se ele deixar de pagar).
          </li>
          <li>Não achou? Toca em "Pedir este {v.um}": a sugestão aparece na aba Sugestões.</li>
        </ol>
        <p className="mt-3 text-[12px] text-gv-muted">
          Só quem está com acesso ao grupo do {v.um} recebe. Limite de {painel.limitePorDia} {v.uns} por pessoa por dia. Quem ainda não é membro vê
          outro menu: conhecer o negócio, ver os planos e "já sou membro". Mensagens escritas fora do menu continuam indo para o Suporte.
        </p>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Google (Drive e Google Books)
// ---------------------------------------------------------------------------

function AbaGoogle({ painel, aoSalvar }: { painel: PainelBiblioteca; aoSalvar: (p: PainelBiblioteca) => void }) {
  const [chave, setChave] = useState("");
  const { carregando, erro, executar } = useAcao();
  const [ok, setOk] = useState<string | null>(null);
  const entradaJson = useRef<HTMLInputElement>(null);
  const v = palavras(painel.tipo);

  const enviarJson = (arquivo: File | undefined) => {
    if (!arquivo) return;
    executar("conta", async () => {
      aoSalvar(await apiBiblioteca.salvarContaServico(await arquivo.text()));
      setOk(`Conta de serviço conectada. Agora compartilhe a pasta dos ${v.uns} com o e-mail dela.`);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <MensagemErro texto={erro} />
      {ok && !erro && <p className="text-sm text-emerald-300">{ok}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <TituloCard icone={ShieldCheck}>Pasta privada (recomendado)</TituloCard>
          <p className="mt-1 text-[12.5px] text-gv-muted">
            Com a <b>conta de serviço</b>, a pasta dos {v.uns} no Drive fica <b>Restrita</b>: só o sistema consegue abrir. Os membros nunca veem o
            endereço do Drive. Arquivos que não vão pelo Telegram saem por um link do sistema que é só daquela pessoa, vale{" "}
            {LINK_HORAS} horas e para de funcionar se ela deixar de pagar.
          </p>
          {painel.contaServicoEmail ? (
            <div className="mt-3 flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
                <CircleCheck className="size-4" /> Conta de serviço conectada
              </span>
              <div className="rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
                <div className="text-[11px] text-gv-muted">Compartilhe a pasta dos {v.uns} com este e-mail (como Leitor)</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-200">{painel.contaServicoEmail}</span>
                  <BotaoCopiar texto={painel.contaServicoEmail} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Botao pequeno carregando={carregando === "conta"} onClick={() => entradaJson.current?.click()}>
                  <Upload className="size-3.5" /> Trocar arquivo
                </Botao>
                <Botao
                  pequeno
                  variante="perigo"
                  carregando={carregando === "tirar-conta"}
                  onClick={() =>
                    executar("tirar-conta", async () => {
                      if (!confirm("Desconectar a conta de serviço? Pastas privadas param de funcionar.")) return;
                      aoSalvar(await apiBiblioteca.salvarContaServico(""));
                    })
                  }
                >
                  Desconectar
                </Botao>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <Botao variante="primario" carregando={carregando === "conta"} onClick={() => entradaJson.current?.click()}>
                <Upload className="size-4" /> Enviar o arquivo .json da conta de serviço
              </Botao>
            </div>
          )}
          <input
            ref={entradaJson}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              enviarJson(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </Card>
        <Card>
          <TituloCard icone={List}>Como criar a conta de serviço (uma vez só)</TituloCard>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[13px] text-slate-300">
            <li>
              Entre em{" "}
              <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-orange-300 underline">
                console.cloud.google.com
              </a>{" "}
              com sua conta Google. No topo, <b>Selecionar projeto › Novo projeto</b>, dê um nome (ex.: Biblioteca) e crie.
            </li>
            <li>
              No menu (☰): <b>APIs e serviços › Biblioteca</b>. Procure <b>Google Drive API</b> e clique em <b>Ativar</b>.
            </li>
            <li>
              No menu: <b>IAM e administrador › Contas de serviço › Criar conta de serviço</b>. Dê um nome (ex.: robo-biblioteca) e clique em{" "}
              <b>Concluir</b> (não precisa dar nenhum papel).
            </li>
            <li>
              Clique na conta criada › aba <b>Chaves › Adicionar chave › Criar nova chave › JSON</b>. O computador baixa um arquivo .json.
            </li>
            <li>Envie esse arquivo aqui ao lado. Guarde-o bem: ele é a senha do sistema no seu Drive.</li>
            <li>
              No Google Drive: botão direito na pasta dos {v.uns} › <b>Compartilhar</b> › cole o e-mail da conta de serviço como <b>Leitor</b>. Em
              "Acesso geral", deixe <b>Restrito</b>.
            </li>
          </ol>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <TituloCard icone={KeyRound}>Chave de API (opcional)</TituloCard>
          <p className="mt-1 text-[12.5px] text-gv-muted">
            {painel.contaServicoEmail
              ? "Com a conta de serviço, a chave só serve para o Google Books completar os dados dos livros com um limite diário maior."
              : "Sem a conta de serviço, a chave lê pastas PÚBLICAS do Drive (qualquer pessoa com o link abre). Prefira a pasta privada."}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            {painel.chaveConfigurada ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <CircleCheck className="size-4" /> Chave cadastrada
              </span>
            ) : (
              <span className="text-gv-muted">Nenhuma chave cadastrada</span>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input className={classeInput} value={chave} placeholder="AIza..." onChange={(e) => setChave(e.target.value)} />
            <Botao
              variante="primario"
              disabled={!chave.trim()}
              carregando={carregando === "salvar"}
              onClick={() =>
                executar("salvar", async () => {
                  aoSalvar(await apiBiblioteca.salvarChave(chave));
                  setChave("");
                  setOk("Chave salva. Ela é testada no primeiro uso.");
                })
              }
            >
              Salvar chave
            </Botao>
          </div>
          {painel.chaveConfigurada && (
            <Botao
              pequeno
              variante="perigo"
              className="mt-2"
              carregando={carregando === "tirar"}
              onClick={() =>
                executar("tirar", async () => {
                  if (!confirm("Apagar a chave do Google?")) return;
                  aoSalvar(await apiBiblioteca.salvarChave(""));
                })
              }
            >
              Apagar chave
            </Botao>
          )}
          <p className="mt-3 text-[12px] text-gv-muted">
            Para criar: no mesmo projeto do Google Cloud, <b>APIs e serviços › Biblioteca</b> › ative a <b>Books API</b>; depois{" "}
            <b>Credenciais › Criar credenciais › Chave de API</b>. Recomendado: restrinja a chave à Books API (e à Google Drive API, se usar pasta
            pública).
          </p>
        </Card>
        <Card>
          <TituloCard icone={BookOpen}>Google Books</TituloCard>
          {painel.tipo === "materiais" ? (
            <p className="mt-2 text-[12.5px] text-gv-muted">
              Não é usado na biblioteca de <b>outros materiais</b>: o robô usa o nome do arquivo e a subpasta (categoria). Para buscar autor,
              gênero e capa, escolha <b>Livros</b> no topo da página.
            </p>
          ) : (
          <div className="mt-3">
            <Interruptor
              ligado={painel.completarLivros}
              aoMudar={(ligado) =>
                executar("completar", async () => {
                  aoSalvar(await apiBiblioteca.completar(ligado));
                })
              }
              titulo="Completar os dados dos livros pelo Google Books"
              descricao={
                painel.completarLivros
                  ? `Busca autor, gênero, capa, ano e resumo de cada livro (1 a cada 2 segundos).${
                      painel.dadosPendentes > 0 ? ` Faltam ${painel.dadosPendentes}.` : ""
                    } Funciona mesmo sem chave (com limite diário menor).`
                  : "Desligado: o robô usa só o nome do arquivo e a subpasta do Drive (categoria)."
              }
            />
          </div>
          )}
        </Card>
      </div>
    </div>
  );
}
