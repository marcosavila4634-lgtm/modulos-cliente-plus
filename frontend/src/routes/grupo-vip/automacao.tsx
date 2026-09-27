import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Bot,
  CircleCheck,
  Inbox,
  MessageCircle,
  Play,
  RotateCw,
  Save,
  Send,
  Trash2,
  TriangleAlert,
  Workflow,
  X,
} from "lucide-react";
import { useState } from "react";
import { Botao, Campo, classeInput, classeTexto, Interruptor, MensagemErro, mensagemDe, useAcao } from "../../components/grupo-vip/formulario";
import { Avatar } from "../../components/grupo-vip/Selos";
import { Abas, CabecalhoPagina, Card, Dica, Vazio } from "../../components/grupo-vip/ui";
import { formatar, haQuanto } from "../../lib/grupo-vip";
import {
  apiAutomacao,
  preencher,
  variaveisMensagem,
  type Automacao,
  type PainelAutomacao,
} from "../../lib/grupo-vip-conteudos";
import { rotuloTipoMensagem, type Mensagem, type ResultadoAutomacao } from "../../lib/grupo-vip-membros";

type Aba = "saida" | "enviadas" | "regras";

// Automação: mensagens automáticas e a caixa de saída.
export const Route = createFileRoute("/grupo-vip/automacao")({
  loader: () => apiAutomacao.painel(),
  component: PaginaAutomacao,
});

function PaginaAutomacao() {
  const inicial = Route.useLoaderData();
  const router = useRouter();
  const [d, setD] = useState<PainelAutomacao>(inicial);
  const [aba, setAba] = useState<Aba>(inicial.pendentes.length ? "saida" : "regras");
  const [resultado, setResultado] = useState<ResultadoAutomacao | null>(null);
  const { carregando, erro, executar } = useAcao();

  const recarregar = async () => {
    setD(await apiAutomacao.painel());
    router.invalidate();
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Automação"
        descricao="As automações rodam sozinhas a cada minuto: lembram o vencimento, avisam o atraso, dão boas-vindas, avisam as lives e cuidam do acesso aos grupos."
      >
        <Botao
          variante="primario"
          carregando={carregando === "rodar"}
          onClick={() =>
            executar("rodar", async () => {
              setResultado(await apiAutomacao.rodar());
              await recarregar();
            })
          }
        >
          <Play className="size-4" /> Rodar agora
        </Botao>
      </CabecalhoPagina>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <MessageCircle className="size-6 text-green-400" />
          <div>
            <div className="font-poppins text-xl font-bold text-white">{d.contagem.pendentesWhatsapp}</div>
            <div className="text-[12px] text-gv-muted">para enviar pelo WhatsApp</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <CircleCheck className="size-6 text-emerald-400" />
          <div>
            <div className="font-poppins text-xl font-bold text-white">{d.contagem.enviadasHoje}</div>
            <div className="text-[12px] text-gv-muted">enviadas hoje</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Bot className={`size-6 ${d.roboConectado ? "text-sky-400" : "text-gv-muted"}`} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{d.roboConectado ? `Robô @${d.roboUsuario}` : "Robô desligado"}</div>
            <div className="text-[12px] text-gv-muted">
              {d.roboConectado ? "Envia sozinho para quem conectou o Telegram." : (
                <Link to="/grupo-vip/configuracoes" className="text-orange-300 underline">
                  Conectar para enviar sozinho
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>

      {resultado && (
        <Dica icone={CircleCheck} cor="emerald">
          <div className="flex items-start gap-3">
            <span className="flex-1">
              Rodou agora: {resultado.mensagensCriadas} mensagem(ns) nova(s), {resultado.mensagensEnviadas} enviada(s) pelo
              Telegram, {resultado.convidados} link(s) de entrada, {resultado.removidos} remoção(ões),{" "}
              {resultado.conteudosPublicados} conteúdo(s) agendado(s) publicado(s), {resultado.livesAvisadas} live(s) avisada(s).
              {resultado.erros.length > 0 && <span className="mt-1 block text-red-300">{resultado.erros.join(" · ")}</span>}
            </span>
            <button type="button" aria-label="Fechar" onClick={() => setResultado(null)}>
              <X className="size-4" />
            </button>
          </div>
        </Dica>
      )}
      <MensagemErro texto={erro} />

      <Abas
        abas={[
          { valor: "saida" as Aba, rotulo: "Caixa de saída", quantidade: d.pendentes.length },
          { valor: "enviadas" as Aba, rotulo: "Enviadas" },
          { valor: "regras" as Aba, rotulo: "Mensagens automáticas", quantidade: d.automacoes.filter((a) => a.ativa).length },
        ]}
        valor={aba}
        aoMudar={setAba}
      />

      {aba === "saida" && (
        <Card className="!p-0">
          {d.pendentes.length === 0 ? (
            <Vazio icone={Inbox}>Nada para enviar. Tudo em dia!</Vazio>
          ) : (
            <>
              <div className="border-b border-gv-line px-4 py-3 text-[12.5px] text-gv-muted">
                Toque em <b className="text-green-300">Enviar</b>: o WhatsApp abre com a mensagem pronta para a pessoa. É só
                apertar enviar no WhatsApp.
              </div>
              <ul className="divide-y divide-gv-line/70">
                {d.pendentes.map((m) => (
                  <ItemMensagem key={m.id} m={m} carregando={carregando} executar={executar} recarregar={recarregar} />
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      {aba === "enviadas" && (
        <Card className="!p-0">
          {d.recentes.length === 0 ? (
            <Vazio icone={Send}>Nenhuma mensagem enviada ainda.</Vazio>
          ) : (
            <ul className="divide-y divide-gv-line/70">
              {d.recentes.map((m) => (
                <li key={m.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar nome={m.nome} tamanho="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                      <span className="font-medium text-white">{m.nome}</span>
                      <span className="text-gv-muted">· {rotuloTipoMensagem[m.tipo] ?? m.tipo}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] whitespace-pre-line text-gv-muted">{m.texto}</p>
                  </div>
                  <span className={`shrink-0 text-[11.5px] ${m.status === "enviada" ? "text-emerald-300" : "text-gv-muted"}`}>
                    {m.status === "enviada"
                      ? `${m.canal === "telegram" ? "Telegram" : "WhatsApp"} · ${formatar.diaHora(m.enviadaEm)}`
                      : "descartada"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {aba === "regras" && (
        <div className="grid gap-3 xl:grid-cols-2">
          {d.automacoes.map((a) => (
            <CardAutomacao key={a.tipo} a={a} exemplo={d.exemplo} aoSalvar={setD} />
          ))}
          <Card className="xl:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Workflow className="size-4 text-orange-300" /> Palavras que viram dados do membro
            </div>
            <div className="mt-2 grid gap-1.5 text-[12.5px] sm:grid-cols-2 lg:grid-cols-3">
              {variaveisMensagem.map((v) => (
                <div key={v.nome}>
                  <code className="text-orange-300">{v.nome}</code> <span className="text-gv-muted">{v.descricao}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ItemMensagem({
  m,
  carregando,
  executar,
  recarregar,
}: {
  m: Mensagem;
  carregando: string | null;
  executar: <T>(chave: string, acao: () => Promise<T>) => Promise<T | undefined>;
  recarregar: () => Promise<void>;
}) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Avatar nome={m.nome} tamanho="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-medium text-white">{m.nome}</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">{rotuloTipoMensagem[m.tipo] ?? m.tipo}</span>
            <span className="text-[11.5px] text-gv-muted">{haQuanto(m.criadaEm)}</span>
          </div>
          <p className="mt-1 text-[12.5px] whitespace-pre-line text-slate-300">{m.texto}</p>
          {m.status === "falhou" && (
            <p className="mt-1 flex items-center gap-1 text-[12px] text-red-300">
              <TriangleAlert className="size-3.5" /> {m.erro}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5 sm:flex-col">
        {m.status === "pendente" && m.whatsapp && (
          <a
            href={m.whatsapp}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              executar(`env:${m.id}`, async () => {
                await apiAutomacao.marcarEnviada(m.id);
                await recarregar();
              })
            }
          >
            <Botao pequeno variante="whatsapp" className="w-full">
              <MessageCircle className="size-3.5" /> Enviar
            </Botao>
          </a>
        )}
        {m.status === "falhou" && (
          <Botao
            pequeno
            carregando={carregando === `re:${m.id}`}
            onClick={() =>
              executar(`re:${m.id}`, async () => {
                await apiAutomacao.reenviar(m.id);
                await recarregar();
              })
            }
          >
            <RotateCw className="size-3.5" /> Tentar de novo
          </Botao>
        )}
        <Botao
          pequeno
          carregando={carregando === `desc:${m.id}`}
          onClick={() =>
            executar(`desc:${m.id}`, async () => {
              await apiAutomacao.descartar(m.id);
              await recarregar();
            })
          }
        >
          <Trash2 className="size-3.5" /> Descartar
        </Botao>
      </div>
    </li>
  );
}

function CardAutomacao({
  a,
  exemplo,
  aoSalvar,
}: {
  a: Automacao;
  exemplo: Record<string, string>;
  aoSalvar: (d: PainelAutomacao) => void;
}) {
  const [ativa, setAtiva] = useState(a.ativa);
  const [dias, setDias] = useState(a.dias);
  const [texto, setTexto] = useState(a.texto);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const mudou = ativa !== a.ativa || dias !== a.dias || texto !== a.texto;
  const valoresPrevia = { ...exemplo, live: "Análise de Mercado", horario: "27/09 às 20:00", link_live: "https://youtube.com/..." };

  return (
    <Card className={ativa ? "" : "opacity-75"}>
      <Interruptor ligado={ativa} aoMudar={setAtiva} titulo={a.titulo} descricao={`${a.descricao} · ${a.enviadas} enviada(s) até hoje`} />
      {a.usaDias && (
        <Campo rotulo={a.tipo === "lembrete" ? "Quantos dias antes do vencimento" : "Quantos dias depois"} className="mt-3 max-w-[220px]">
          <input type="number" min={0} max={90} className={classeInput} value={dias} onChange={(e) => setDias(Number(e.target.value))} />
        </Campo>
      )}
      <Campo rotulo="Texto" className="mt-3">
        <textarea className={classeTexto} rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </Campo>
      <div className="mt-2 rounded-xl border border-green-600/30 bg-green-600/[0.07] px-3 py-2 text-[12.5px] whitespace-pre-line text-green-50">
        <div className="mb-1 text-[11px] font-semibold text-green-300">Como fica (exemplo)</div>
        {preencher(texto, valoresPrevia)}
      </div>
      <div className="mt-3">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        {salvo && !mudou && <span className="text-xs text-emerald-300">Salvo!</span>}
        <Botao
          variante="primario"
          pequeno
          disabled={!mudou}
          carregando={salvando}
          onClick={async () => {
            setSalvando(true);
            setErro(null);
            try {
              aoSalvar(await apiAutomacao.salvar(a.tipo, ativa, dias, texto));
              setSalvo(true);
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          <Save className="size-3.5" /> Salvar
        </Botao>
      </div>
    </Card>
  );
}
