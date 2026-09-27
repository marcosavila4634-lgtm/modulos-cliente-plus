import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  CircleCheck,
  Clock,
  CreditCard,
  ExternalLink,
  History,
  Link2,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  MessagesSquare,
  Network,
  Pencil,
  Send,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { Botao, BotaoCopiar, MensagemErro, useAcao } from "../../../components/grupo-vip/formulario";
import { ModalAssinar, ModalMembro, ModalMensagem, ModalReceber } from "../../../components/grupo-vip/ModaisMembro";
import { Avatar, SeloCobranca, SeloPlataforma, SeloSituacao } from "../../../components/grupo-vip/Selos";
import { Card, cabecalhoTabela, Dica, TituloCard } from "../../../components/grupo-vip/ui";
import {
  explicacaoSituacao,
  formatar,
  linkWhatsapp,
  periodicidade,
  prazo,
  rotuloForma,
} from "../../../lib/grupo-vip";
import {
  apiAcessos,
  apiMembros,
  rotuloTipoMensagem,
  type Cobranca,
  type GrupoDoMembro,
  type MembroDetalhe,
} from "../../../lib/grupo-vip-membros";

export const Route = createFileRoute("/grupo-vip/membros/$id")({
  loader: async ({ params }) => {
    const [membro, lista] = await Promise.all([apiMembros.buscar(params.id), apiMembros.listar()]);
    return { membro, planos: lista.planos };
  },
  component: FichaMembro,
});

type Janela = "editar" | "assinar" | "mensagem" | { receber: Cobranca } | null;

function FichaMembro() {
  const { membro: inicial, planos } = Route.useLoaderData();
  const router = useRouter();
  const [m, setM] = useState<MembroDetalhe>(inicial);
  const [janela, setJanela] = useState<Janela>(null);
  const [abrir, setAbrir] = useState<{ titulo: string; link: string } | null>(null);
  const { carregando, erro, executar } = useAcao();

  // Troca de membro (ex.: clicou num indicado) sem sair da tela.
  if (inicial.id !== m.id) setM(inicial);

  const atualizar = async (novo?: MembroDetalhe) => {
    setM(novo ?? (await apiMembros.buscar(m.id)));
    router.invalidate();
  };

  const a = m.assinatura;
  const pendente = m.cobrancas.find((c) => c.status === "pendente" || c.status === "atrasada");

  async function acaoGrupo(g: GrupoDoMembro, acao: "convidar" | "entrou" | "removido" | "remover") {
    await executar(`${g.grupoId}:${acao}`, async () => {
      if (acao === "convidar") {
        const r = await apiAcessos.convidar(g.grupoId, m.id);
        if (r.whatsapp) setAbrir({ titulo: `Enviar o acesso ao grupo ${g.nome} pelo WhatsApp`, link: r.whatsapp });
      } else if (acao === "entrou") await apiAcessos.entrou(g.grupoId, m.id);
      else if (acao === "removido") await apiAcessos.removido(g.grupoId, m.id);
      else await apiAcessos.remover(g.grupoId, m.id);
      await atualizar();
    });
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <Link to="/grupo-vip/membros" className="inline-flex w-fit items-center gap-1.5 text-sm text-gv-muted hover:text-white">
        <ArrowLeft className="size-4" /> Membros
      </Link>

      {/* Cabeçalho */}
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar nome={m.nome} tamanho="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-poppins text-2xl font-bold text-white">{m.nome}</h1>
            <SeloSituacao situacao={m.situacao} />
          </div>
          <p className="mt-1 text-sm text-gv-muted">
            {m.situacao === "bloqueado" && m.motivoBloqueio === "manual"
              ? "Bloqueado pela equipe: perde o acesso mesmo pagando."
              : m.situacao === "atrasado"
                ? `Atrasado há ${m.diasAtraso} dia(s). Sai dos grupos depois de ${m.toleranciaDias} dias de atraso.`
                : explicacaoSituacao[m.situacao]}
          </p>
          <p className="mt-0.5 text-xs text-gv-muted">
            Membro desde {formatar.data(m.membroDesde)} · {m.origem === "pagina" ? "veio pela página de vendas" : "cadastro manual"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={() => setJanela("editar")}>
            <Pencil className="size-4" /> Editar
          </Botao>
          <Botao onClick={() => setJanela("mensagem")}>
            <MessagesSquare className="size-4" /> Mensagem
          </Botao>
          <a href={m.links.areaMembro} target="_blank" rel="noreferrer">
            <Botao>
              <ExternalLink className="size-4" /> Área do membro
            </Botao>
          </a>
          <Botao
            variante={m.bloqueado ? "sucesso" : "perigo"}
            carregando={carregando === "bloquear"}
            onClick={() =>
              executar("bloquear", async () => {
                if (!m.bloqueado && !confirm(`Bloquear ${m.nome}? A pessoa perde o acesso aos grupos mesmo pagando.`)) return;
                await atualizar(await apiMembros.bloquear(m.id, !m.bloqueado));
              })
            }
          >
            <Ban className="size-4" /> {m.bloqueado ? "Desbloquear" : "Bloquear"}
          </Botao>
        </div>
      </Card>

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
            <button type="button" onClick={() => setAbrir(null)} aria-label="Fechar" className="text-gv-muted hover:text-white">
              <X className="size-4" />
            </button>
          </div>
        </Dica>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          {/* Assinatura */}
          <Card>
            <TituloCard icone={CreditCard}>Assinatura</TituloCard>
            {!a ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gv-muted">Sem assinatura. Escolha um plano para liberar os grupos.</p>
                <Botao variante="primario" onClick={() => setJanela("assinar")}>
                  Assinar plano
                </Botao>
              </div>
            ) : (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <Info rotulo="Plano" valor={a.plano.nome} detalhe={`${formatar.moeda(a.valor)} ${periodicidade(a.plano.duracaoMeses)}`} />
                  <Info
                    rotulo="Próximo vencimento"
                    valor={a.proximoVencimento ? formatar.data(a.proximoVencimento) : "—"}
                    detalhe={a.proximoVencimento ? prazo(a.proximoVencimento) : a.status === "cancelada" ? "cancelada" : ""}
                    alerta={m.diasAtraso > 0}
                  />
                  <Info rotulo="Pago até" valor={formatar.data(a.pagoAte)} detalhe="fim do período pago" />
                  <Info
                    rotulo="Situação"
                    valor={a.status === "ativa" ? "Ativa" : "Cancelada"}
                    detalhe={a.canceladaEm ? `em ${formatar.data(a.canceladaEm)}` : `desde ${formatar.data(a.inicio)}`}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pendente && (
                    <Botao variante="sucesso" onClick={() => setJanela({ receber: pendente })}>
                      <Wallet className="size-4" /> Receber {formatar.moeda(pendente.valor)}
                    </Botao>
                  )}
                  {(a.status === "cancelada" || m.situacao === "aguardando_pagamento") && (
                    <Botao variante="primario" onClick={() => setJanela("assinar")}>
                      {a.status === "cancelada" ? "Assinar de novo" : "Trocar plano"}
                    </Botao>
                  )}
                  {a.status === "ativa" && (
                    <Botao
                      variante="perigo"
                      carregando={carregando === "cancelar"}
                      onClick={() =>
                        executar("cancelar", async () => {
                          if (!confirm("Cancelar a assinatura? O membro continua nos grupos até o fim do período pago.")) return;
                          await atualizar(await apiMembros.cancelar(m.id));
                        })
                      }
                    >
                      Cancelar assinatura
                    </Botao>
                  )}
                </div>
              </>
            )}
          </Card>

          {/* Grupos */}
          <Card>
            <TituloCard icone={ShieldCheck}>Grupos</TituloCard>
            {m.grupos.length === 0 && <p className="mt-3 text-sm text-gv-muted">Nenhum grupo liberado.</p>}
            <ul className="mt-3 flex flex-col divide-y divide-gv-line/70">
              {m.grupos.map((g) => (
                <li key={g.grupoId} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{g.nome}</span>
                      <SeloPlataforma plataforma={g.plataforma} automatico={g.automatico} />
                    </div>
                    <div className="mt-0.5 text-xs text-gv-muted">
                      {g.status === "no_grupo"
                        ? `No grupo${g.entrouEm ? ` desde ${formatar.data(g.entrouEm)}` : ""}`
                        : g.status === "convidado"
                          ? "Recebeu o link, ainda não entrou"
                          : g.status === "removido"
                            ? "Fora do grupo"
                            : "Nunca entrou"}
                      {!g.direito && " · sem direito pelo plano/pagamento"}
                    </div>
                  </div>
                  {g.pendencia === "adicionar" && (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                      Precisa entrar
                    </span>
                  )}
                  {g.pendencia === "remover" && (
                    <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-300">
                      Precisa sair
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {g.direito && g.status !== "no_grupo" && (
                      <Botao pequeno variante="primario" carregando={carregando === `${g.grupoId}:convidar`} onClick={() => acaoGrupo(g, "convidar")}>
                        <UserPlus className="size-3.5" /> {g.automatico ? "Gerar link" : "Enviar acesso"}
                      </Botao>
                    )}
                    {g.status !== "no_grupo" && g.direito && (
                      <Botao pequeno carregando={carregando === `${g.grupoId}:entrou`} onClick={() => acaoGrupo(g, "entrou")}>
                        <LogIn className="size-3.5" /> Já está no grupo
                      </Botao>
                    )}
                    {g.status !== null && g.status !== "removido" && g.automatico && m.telegramConectado && (
                      <Botao pequeno variante="perigo" carregando={carregando === `${g.grupoId}:remover`} onClick={() => acaoGrupo(g, "remover")}>
                        <UserMinus className="size-3.5" /> Tirar pelo robô
                      </Botao>
                    )}
                    {g.status !== null && g.status !== "removido" && (
                      <Botao pequeno carregando={carregando === `${g.grupoId}:removido`} onClick={() => acaoGrupo(g, "removido")}>
                        <LogOut className="size-3.5" /> Já saiu
                      </Botao>
                    )}
                  </div>
                  {g.conviteLink && g.status === "convidado" && (
                    <div className="flex w-full items-center gap-2 rounded-lg bg-gv-bg/50 px-2 py-1.5 text-xs text-slate-300">
                      <Link2 className="size-3.5 shrink-0 text-gv-muted" />
                      <span className="flex-1 truncate">{g.conviteLink}</span>
                      <BotaoCopiar texto={g.conviteLink} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {/* Cobranças */}
          <Card className="!p-0">
            <div className="p-4 pb-2">
              <TituloCard icone={Wallet}>Pagamentos</TituloCard>
            </div>
            {m.cobrancas.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-gv-muted">Nenhuma cobrança.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[13px]">
                  <thead>
                    <tr className={cabecalhoTabela}>
                      <th className="py-2 pr-3 pl-4 font-medium">Vencimento</th>
                      <th className="py-2 pr-3 font-medium">Plano</th>
                      <th className="py-2 pr-3 font-medium">Valor</th>
                      <th className="py-2 pr-3 font-medium">Pagamento</th>
                      <th className="py-2 pr-4 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gv-line/70">
                    {m.cobrancas.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2.5 pr-3 pl-4 whitespace-nowrap text-slate-200">{formatar.data(c.vencimento)}</td>
                        <td className="py-2.5 pr-3 text-slate-300">{c.descricao}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap text-white">{formatar.moeda(c.valor)}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <SeloCobranca status={c.status} />
                          {c.pagoEm && (
                            <span className="ml-2 text-[11.5px] text-gv-muted">
                              {formatar.data(c.pagoEm)} · {c.formaPagamento ? rotuloForma[c.formaPagamento] : "cortesia"}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          {(c.status === "pendente" || c.status === "atrasada") && (
                            <Botao pequeno variante="sucesso" onClick={() => setJanela({ receber: c })}>
                              Receber
                            </Botao>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* Contato e links */}
          <Card>
            <TituloCard icone={Mail}>Contato e links</TituloCard>
            <dl className="mt-3 flex flex-col gap-2.5 text-sm">
              <Linha rotulo="WhatsApp">
                {m.telefone ? (
                  <a href={linkWhatsapp(m.telefone) ?? "#"} target="_blank" rel="noreferrer" className="text-green-300 hover:underline">
                    {formatar.telefone(m.telefone)}
                  </a>
                ) : (
                  "—"
                )}
              </Linha>
              <Linha rotulo="E-mail">{m.email ?? "—"}</Linha>
              <Linha rotulo="Telegram">
                {m.telegramUsuario ? (
                  <a href={`https://t.me/${m.telegramUsuario}`} target="_blank" rel="noreferrer" className="text-sky-300 hover:underline">
                    @{m.telegramUsuario}
                  </a>
                ) : (
                  "—"
                )}
                <span className={`ml-2 text-xs ${m.telegramConectado ? "text-emerald-300" : "text-gv-muted"}`}>
                  {m.telegramConectado ? "conectado ao robô" : "não conectado ao robô"}
                </span>
              </Linha>
              <Linha rotulo="Nascimento">{formatar.data(m.dataNascimento)}</Linha>
              <Linha rotulo="CPF">{formatar.cpf(m.cpf)}</Linha>
              {m.observacoes && <Linha rotulo="Observações">{m.observacoes}</Linha>}
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <LinkCopiavel rotulo="Área do membro (pagar, entrar nos grupos)" link={m.links.areaMembro} />
              <LinkCopiavel rotulo="Link de indicação" link={m.links.indicacao} />
              {m.links.robo && <LinkCopiavel rotulo="Conectar ao robô do Telegram" link={m.links.robo} />}
            </div>
          </Card>

          {/* Indicações */}
          <Card>
            <TituloCard icone={Network}>Indicações</TituloCard>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Info rotulo="Comissões ganhas" valor={formatar.moeda(m.comissaoTotal)} />
              <Info rotulo="Saldo para saque" valor={formatar.moeda(m.saldoComissao)} />
            </div>
            <div className="mt-3 text-sm">
              <span className="text-gv-muted">Indicado por: </span>
              {m.indicadoPor ? (
                <Link to="/grupo-vip/membros/$id" params={{ id: m.indicadoPor.id }} className="text-orange-300 hover:underline">
                  {m.indicadoPor.nome}
                </Link>
              ) : (
                <span className="text-slate-300">ninguém</span>
              )}
            </div>
            <div className="mt-2 text-sm text-gv-muted">Indicou {m.indicados.length} pessoa(s)</div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {m.indicados.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <Link to="/grupo-vip/membros/$id" params={{ id: p.id }} className="truncate text-sm text-slate-200 hover:text-white">
                    {p.nome}
                  </Link>
                  <SeloSituacao situacao={p.situacao} />
                </li>
              ))}
            </ul>
          </Card>

          {/* Histórico */}
          <Card>
            <TituloCard icone={History}>Entradas e saídas</TituloCard>
            {m.historico.length === 0 && <p className="mt-3 text-sm text-gv-muted">Sem histórico.</p>}
            <ul className="mt-3 flex flex-col gap-2.5">
              {m.historico.map((h) => (
                <li key={h.id} className="flex items-start gap-2.5 text-[13px]">
                  {h.acao === "entrou" ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  ) : h.acao === "convite" ? (
                    <Send className="mt-0.5 size-4 shrink-0 text-sky-400" />
                  ) : (
                    <UserMinus className="mt-0.5 size-4 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0">
                    <div className="text-slate-200">
                      {{ entrou: "Entrou", convite: "Convite", removido: "Saiu", recusado: "Entrada recusada" }[h.acao]} · {h.grupo}
                    </div>
                    <div className="text-[11.5px] text-gv-muted">
                      {formatar.diaHora(h.momento)} · {h.detalhe}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Mensagens */}
          <Card>
            <TituloCard icone={MessagesSquare} acao={<Botao pequeno onClick={() => setJanela("mensagem")}>Nova</Botao>}>
              Mensagens
            </TituloCard>
            {m.mensagens.length === 0 && <p className="mt-3 text-sm text-gv-muted">Nenhuma mensagem.</p>}
            <ul className="mt-3 flex flex-col gap-2.5">
              {m.mensagens.map((msg) => (
                <li key={msg.id} className="rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
                  <div className="flex items-center justify-between gap-2 text-[11.5px]">
                    <span className="font-semibold text-slate-200">{rotuloTipoMensagem[msg.tipo] ?? msg.tipo}</span>
                    <span className={msg.status === "enviada" ? "text-emerald-300" : msg.status === "falhou" ? "text-red-300" : "text-amber-300"}>
                      {msg.canal === "telegram" ? "Telegram" : "WhatsApp"} ·{" "}
                      {msg.status === "enviada" ? `enviada ${formatar.diaHora(msg.enviadaEm)}` : msg.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[12.5px] whitespace-pre-line text-gv-muted">{msg.texto}</p>
                  {msg.status === "pendente" && msg.whatsapp && (
                    <a href={msg.whatsapp} target="_blank" rel="noreferrer" className="mt-2 inline-flex">
                      <Botao pequeno variante="whatsapp">
                        <MessageCircle className="size-3.5" /> Enviar pelo WhatsApp
                      </Botao>
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-gv-muted">
              <Clock className="size-3.5" /> As pendentes também aparecem em Automação › Caixa de saída.
            </p>
          </Card>
        </div>
      </div>

      {janela === "editar" && (
        <ModalMembro
          membro={m}
          planos={planos}
          aoFechar={() => setJanela(null)}
          aoSalvar={(novo) => {
            setJanela(null);
            atualizar(novo);
          }}
        />
      )}
      {janela === "assinar" && (
        <ModalAssinar
          membro={m}
          planos={planos}
          aoFechar={() => setJanela(null)}
          aoSalvar={(novo) => {
            setJanela(null);
            atualizar(novo);
          }}
        />
      )}
      {janela === "mensagem" && <ModalMensagem membro={m} aoFechar={() => setJanela(null)} aoEnviar={() => atualizar()} />}
      {janela !== null && typeof janela === "object" && (
        <ModalReceber
          cobranca={{ ...janela.receber, nome: m.nome }}
          aoFechar={() => setJanela(null)}
          aoSalvar={(novo) => {
            setJanela(null);
            atualizar(novo);
          }}
        />
      )}
    </div>
  );
}

function Info({ rotulo, valor, detalhe, alerta }: { rotulo: string; valor: string; detalhe?: string; alerta?: boolean }) {
  return (
    <div className="rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
      <div className="text-[11px] text-gv-muted">{rotulo}</div>
      <div className="font-poppins text-[15px] font-semibold text-white">{valor}</div>
      {detalhe && <div className={`text-[11px] ${alerta ? "text-red-400" : "text-gv-muted"}`}>{detalhe}</div>}
    </div>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-gv-muted">{rotulo}</dt>
      <dd className="min-w-0 text-slate-200">{children}</dd>
    </div>
  );
}

function LinkCopiavel({ rotulo, link }: { rotulo: string; link: string }) {
  return (
    <div className="rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
      <div className="text-[11px] text-gv-muted">{rotulo}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-200">{link}</span>
        <BotaoCopiar texto={link} />
      </div>
    </div>
  );
}
