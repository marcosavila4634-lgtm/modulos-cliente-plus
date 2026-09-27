import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Bot,
  CircleCheck,
  Clock,
  History,
  LogIn,
  LogOut,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Botao, BotaoCopiar, MensagemErro, useAcao } from "../../components/grupo-vip/formulario";
import { Avatar, SeloPlataforma, SeloSituacao } from "../../components/grupo-vip/Selos";
import { Abas, CabecalhoPagina, Card, Dica, Vazio } from "../../components/grupo-vip/ui";
import { formatar, haQuanto, linkWhatsapp } from "../../lib/grupo-vip";
import {
  apiAcessos,
  type AcaoAcesso,
  type PainelAcessos,
  type Pendencia,
  type ResultadoAutomacao,
} from "../../lib/grupo-vip-membros";

type Aba = AcaoAcesso | "historico";

// Controle de acesso: compara quem pagou com quem está em cada grupo.
export const Route = createFileRoute("/grupo-vip/acessos")({
  loader: () => apiAcessos.painel(),
  component: PaginaAcessos,
});

function PaginaAcessos() {
  const inicial = Route.useLoaderData();
  const router = useRouter();
  const [d, setD] = useState<PainelAcessos>(inicial);
  const [aba, setAba] = useState<Aba>(() =>
    inicial.pendencias.some((p) => p.acao === "remover") ? "remover" : "adicionar",
  );
  const [grupo, setGrupo] = useState("");
  const [resultado, setResultado] = useState<ResultadoAutomacao | null>(null);
  const [abrir, setAbrir] = useState<{ titulo: string; link: string } | null>(null);
  const { carregando, erro, executar } = useAcao();

  const recarregar = async () => {
    setD(await apiAcessos.painel());
    router.invalidate();
  };

  const contagem = (a: AcaoAcesso) => d.pendencias.filter((p) => p.acao === a).length;
  const lista = useMemo(
    () => d.pendencias.filter((p) => p.acao === aba && (!grupo || p.grupoId === grupo)),
    [d, aba, grupo],
  );
  // Uma linha por pessoa, com os grupos dela dentro.
  const porPessoa = useMemo(() => {
    const mapa = new Map<string, Pendencia[]>();
    for (const p of lista) mapa.set(p.clienteId, [...(mapa.get(p.clienteId) ?? []), p]);
    return [...mapa.values()];
  }, [lista]);
  const historico = d.historico.filter((h) => !grupo || h.grupoId === grupo);

  async function agir(p: Pendencia, acao: "convidar" | "entrou" | "removido" | "remover") {
    await executar(`${p.grupoId}:${p.clienteId}:${acao}`, async () => {
      if (acao === "convidar") {
        const r = await apiAcessos.convidar(p.grupoId, p.clienteId);
        if (r.whatsapp) setAbrir({ titulo: `Mandar o acesso do grupo ${p.grupo} para ${p.nome}`, link: r.whatsapp });
      } else if (acao === "entrou") await apiAcessos.entrou(p.grupoId, p.clienteId);
      else if (acao === "removido") await apiAcessos.removido(p.grupoId, p.clienteId);
      else await apiAcessos.remover(p.grupoId, p.clienteId);
      await recarregar();
    });
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Controle de acesso"
        descricao={`Quem pagou precisa estar no grupo; quem ficou mais de ${d.toleranciaDias} dias sem pagar precisa sair. Com o robô do Telegram isso acontece sozinho a cada minuto.`}
      >
        <Botao
          variante="primario"
          carregando={carregando === "sincronizar"}
          onClick={() =>
            executar("sincronizar", async () => {
              setResultado(await apiAcessos.sincronizar());
              await recarregar();
            })
          }
        >
          <RefreshCw className="size-4" /> Sincronizar agora
        </Botao>
      </CabecalhoPagina>

      <Card className="flex flex-wrap items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-full ${d.robo.conectado ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>
          <Bot className="size-5" />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          {d.robo.conectado ? (
            <>
              <div className="font-semibold text-white">Robô do Telegram ligado (@{d.robo.usuario})</div>
              <div className="text-[12.5px] text-gv-muted">
                {d.robo.erro
                  ? `Problema: ${d.robo.erro}`
                  : d.robo.ultimaConsulta
                    ? `Última conversa com o Telegram ${haQuanto(d.robo.ultimaConsulta)}.`
                    : "Aguardando a primeira conversa com o Telegram."}
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold text-white">Robô do Telegram desligado</div>
              <div className="text-[12.5px] text-gv-muted">
                Tudo está no modo manual: você coloca e tira as pessoas e marca aqui.{" "}
                <Link to="/grupo-vip/configuracoes" className="text-orange-300 underline">
                  Conectar o robô
                </Link>
              </div>
            </>
          )}
        </div>
      </Card>

      {resultado && (
        <Dica icone={CircleCheck} cor="emerald">
          <div className="flex items-start gap-3">
            <span className="flex-1">
              Pronto: {resultado.convidados} link(s) de entrada criados, {resultado.removidos} pessoa(s) tiradas pelo robô,{" "}
              {resultado.mensagensCriadas} mensagem(ns) nova(s) e {resultado.mensagensEnviadas} enviada(s) pelo Telegram.
              {resultado.erros.length > 0 && <span className="mt-1 block text-red-300">Erros: {resultado.erros.join(" · ")}</span>}
            </span>
            <button type="button" aria-label="Fechar" onClick={() => setResultado(null)}>
              <X className="size-4" />
            </button>
          </div>
        </Dica>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
        {d.grupos.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGrupo(grupo === g.id ? "" : g.id)}
            className={`min-w-0 rounded-2xl border p-2.5 text-left transition sm:p-3 ${
              grupo === g.id ? "border-orange-500/70 bg-orange-500/10" : "border-gv-line bg-gv-card hover:border-slate-600"
            }`}
          >
            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <span className="w-full truncate text-[13.5px] font-medium text-white sm:w-auto">{g.nome}</span>
              <SeloPlataforma plataforma={g.plataforma} automatico={g.automatico} />
            </div>
            <div className="mt-1 text-[12px] text-gv-muted">
              {g.noGrupo} no grupo · {g.comDireito} pagantes
            </div>
          </button>
        ))}
      </div>

      <MensagemErro texto={erro} />
      {abrir && (
        <Dica icone={MessageCircle} cor="emerald">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex-1">{abrir.titulo}</span>
            <a href={abrir.link} target="_blank" rel="noreferrer" onClick={() => setAbrir(null)}>
              <Botao variante="whatsapp" pequeno>
                <MessageCircle className="size-3.5" /> Abrir WhatsApp
              </Botao>
            </a>
          </div>
        </Dica>
      )}

      <Card className="!p-0">
        <div className="border-b border-gv-line p-4">
          <Abas
            abas={[
              { valor: "adicionar" as Aba, rotulo: "Colocar nos grupos", quantidade: contagem("adicionar") },
              { valor: "remover" as Aba, rotulo: "Tirar dos grupos", quantidade: contagem("remover") },
              { valor: "aguardando" as Aba, rotulo: "Link enviado", quantidade: contagem("aguardando") },
              { valor: "historico" as Aba, rotulo: "Histórico" },
            ]}
            valor={aba}
            aoMudar={setAba}
          />
          {grupo && (
            <button type="button" onClick={() => setGrupo("")} className="mt-2 text-xs text-orange-300 underline">
              Mostrando só um grupo · ver todos
            </button>
          )}
        </div>

        {aba === "historico" ? (
          historico.length === 0 ? (
            <Vazio icone={History}>Sem movimentações.</Vazio>
          ) : (
            <ul className="divide-y divide-gv-line/70">
              {historico.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                  {h.acao === "entrou" ? (
                    <LogIn className="size-4 shrink-0 text-emerald-400" />
                  ) : h.acao === "convite" ? (
                    <Send className="size-4 shrink-0 text-sky-400" />
                  ) : h.acao === "recusado" ? (
                    <X className="size-4 shrink-0 text-amber-400" />
                  ) : (
                    <LogOut className="size-4 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link to="/grupo-vip/membros/$id" params={{ id: h.clienteId }} className="font-medium text-slate-100 hover:underline">
                      {h.nome}
                    </Link>
                    <span className="text-gv-muted"> · {h.grupo}</span>
                    <div className="truncate text-[11.5px] text-gv-muted">
                      {h.detalhe}
                      {h.automatico && " · robô"}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11.5px] text-gv-muted">{formatar.diaHora(h.momento)}</span>
                </li>
              ))}
            </ul>
          )
        ) : lista.length === 0 ? (
          <Vazio icone={ShieldCheck}>
            {aba === "adicionar"
              ? "Todo mundo que pagou já tem o acesso."
              : aba === "remover"
                ? "Ninguém sem acesso está nos grupos."
                : "Nenhum link aguardando."}
          </Vazio>
        ) : (
          <ul className="divide-y divide-gv-line/70">
            {porPessoa.map((grupoDaPessoa) => {
              const primeiro = grupoDaPessoa[0];
              return (
                <li key={primeiro.clienteId} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 items-start gap-3 lg:w-[34%]">
                    <Avatar nome={primeiro.nome} />
                    <div className="min-w-0">
                      <Link to="/grupo-vip/membros/$id" params={{ id: primeiro.clienteId }} className="font-medium text-white hover:underline">
                        {primeiro.nome}
                      </Link>
                      <div className="mt-0.5">
                        <SeloSituacao situacao={primeiro.situacao} />
                      </div>
                      {primeiro.motivo && <div className="mt-1 text-[12px] text-red-300">{primeiro.motivo}</div>}
                      <div className="mt-0.5 text-[11.5px] text-gv-muted">
                        {formatar.telefone(primeiro.telefone)}
                        {primeiro.telegramUsuario && ` · @${primeiro.telegramUsuario}`}
                        {primeiro.telegramConectado && " · conectado ao robô"}
                      </div>
                    </div>
                  </div>
                  <ul className="flex min-w-0 flex-1 flex-col gap-2">
                    {grupoDaPessoa.map((p) => {
                      const chave = `${p.grupoId}:${p.clienteId}`;
                      return (
                        <li key={chave} className="flex flex-wrap items-center gap-2 rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
                          <SeloPlataforma plataforma={p.plataforma} automatico={p.automatico} />
                          <span className="min-w-[120px] flex-1 text-[13px] text-slate-200">
                            {p.grupo}
                            {p.acao === "aguardando" && p.desde && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[11.5px] text-gv-muted">
                                <Clock className="size-3" /> link enviado {haQuanto(p.desde)}
                              </span>
                            )}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {p.acao === "adicionar" && (
                              <>
                                <Botao pequeno variante="primario" carregando={carregando === `${chave}:convidar`} onClick={() => agir(p, "convidar")}>
                                  <UserPlus className="size-3.5" /> {p.automatico ? "Gerar link e enviar" : "Enviar acesso"}
                                </Botao>
                                <Botao pequeno carregando={carregando === `${chave}:entrou`} onClick={() => agir(p, "entrou")}>
                                  <LogIn className="size-3.5" /> Já adicionei
                                </Botao>
                              </>
                            )}
                            {p.acao === "aguardando" && (
                              <>
                                {p.conviteLink && <BotaoCopiar texto={p.conviteLink} rotulo="Copiar link" />}
                                <Botao pequeno carregando={carregando === `${chave}:convidar`} onClick={() => agir(p, "convidar")}>
                                  <Send className="size-3.5" /> Reenviar
                                </Botao>
                                <Botao pequeno carregando={carregando === `${chave}:entrou`} onClick={() => agir(p, "entrou")}>
                                  <LogIn className="size-3.5" /> Já entrou
                                </Botao>
                              </>
                            )}
                            {p.acao === "remover" && (
                              <>
                                {p.automatico ? (
                                  <Botao pequeno variante="perigo" carregando={carregando === `${chave}:remover`} onClick={() => agir(p, "remover")}>
                                    <UserMinus className="size-3.5" /> Tirar agora
                                  </Botao>
                                ) : (
                                  <Botao pequeno variante="perigo" carregando={carregando === `${chave}:removido`} onClick={() => agir(p, "removido")}>
                                    <LogOut className="size-3.5" /> Já tirei do grupo
                                  </Botao>
                                )}
                                {p.telefone && (
                                  <a
                                    href={
                                      linkWhatsapp(
                                        p.telefone,
                                        `Oi, ${p.nome.split(" ")[0]}! Seu acesso ao grupo ${p.grupo} foi encerrado por falta de pagamento. Para voltar, é só regularizar pela sua área de membro.`,
                                      ) ?? "#"
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Botao pequeno variante="whatsapp">
                                      <MessageCircle className="size-3.5" /> Avisar
                                    </Botao>
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {aba === "remover" && lista.some((p) => !p.automatico) && (
        <Dica icone={UserMinus} cor="amber">
          No WhatsApp (e no Telegram sem robô) a remoção é feita por você: abra o grupo › toque no nome da pessoa ›
          Remover. Depois toque em <b>Já tirei do grupo</b>.
        </Dica>
      )}
    </div>
  );
}
