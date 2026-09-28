import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, CircleCheck, Headset, MessageCircle, RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import { Botao, classeTexto, MensagemErro, useAcao } from "../../components/grupo-vip/formulario";
import { IconePlataforma } from "../../components/grupo-vip/Marcas";
import { Avatar, SeloSituacao } from "../../components/grupo-vip/Selos";
import { Abas, CabecalhoPagina, Card, Vazio } from "../../components/grupo-vip/ui";
import { formatar, haQuanto, linkWhatsapp } from "../../lib/grupo-vip";
import { apiSuporte, type Chamado } from "../../lib/grupo-vip-financeiro";
import { BotaoGuia } from "../../components/grupo-vip/Ajuda";

type Filtro = "aberto" | "respondido" | "resolvido";

// Suporte: conversas abertas pelos membros na área do membro ou escrevendo
// para o robô do Telegram.
export const Route = createFileRoute("/grupo-vip/suporte")({
  loader: () => apiSuporte.listar(),
  component: PaginaSuporte,
});

const rotulo: Record<Filtro, string> = { aberto: "Esperando resposta", respondido: "Respondidas", resolvido: "Resolvidas" };

function PaginaSuporte() {
  const router = useRouter();
  const [lista, setLista] = useState<Chamado[]>(Route.useLoaderData());
  const [filtro, setFiltro] = useState<Filtro>("aberto");
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const { carregando, erro, executar } = useAcao();

  const visiveis = lista.filter((c) => c.status === filtro);
  const aberto = lista.find((c) => c.id === abertoId) ?? null;
  const atualizar = (nova: Chamado[]) => {
    setLista(nova);
    router.invalidate();
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        guia={<BotaoGuia id="suporte" />}
        titulo="Suporte"
        descricao="Os membros escrevem pela área do membro ou direto para o robô do Telegram. Sua resposta aparece na área do membro e também vai por mensagem (no Telegram, ele responde ali mesmo)."
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card className={`!p-0 ${aberto ? "hidden lg:block" : ""}`}>
          <div className="border-b border-gv-line p-3">
            <Abas
              abas={(Object.keys(rotulo) as Filtro[]).map((f) => ({ valor: f, rotulo: rotulo[f], quantidade: lista.filter((c) => c.status === f).length }))}
              valor={filtro}
              aoMudar={(f) => {
                setFiltro(f);
                setAbertoId(null);
              }}
            />
          </div>
          {visiveis.length === 0 ? (
            <Vazio icone={Headset}>Nenhuma conversa aqui.</Vazio>
          ) : (
            <ul className="divide-y divide-gv-line/70">
              {visiveis.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setAbertoId(c.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] ${abertoId === c.id ? "bg-orange-500/[0.07]" : ""}`}
                  >
                    <Avatar nome={c.nome} tamanho="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-white">{c.nome}</span>
                        <span className="shrink-0 text-[11px] text-gv-muted">{haQuanto(c.atualizadoEm)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12.5px] text-slate-300">
                        {c.origem === "telegram" && <IconePlataforma plataforma="telegram" className="size-3.5 shrink-0" />}
                        <span className="truncate">{c.assunto}</span>
                      </div>
                      <div className="truncate text-[11.5px] text-gv-muted">{c.mensagens[c.mensagens.length - 1]?.texto}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className={`flex min-h-[420px] flex-col ${aberto ? "" : "hidden lg:flex"}`}>
          {!aberto ? (
            <Vazio icone={MessageCircle}>Escolha uma conversa.</Vazio>
          ) : (
            <>
              <div className="flex flex-wrap items-start gap-3 border-b border-gv-line pb-3">
                <button type="button" onClick={() => setAbertoId(null)} className="rounded-lg p-1 text-gv-muted hover:text-white lg:hidden" aria-label="Voltar">
                  <ArrowLeft className="size-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="font-poppins text-[16px] font-semibold text-white">{aberto.assunto}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12.5px] text-gv-muted">
                    <Link to="/grupo-vip/membros/$id" params={{ id: aberto.clienteId }} className="text-orange-300 hover:underline">
                      {aberto.nome}
                    </Link>
                    {aberto.situacao && <SeloSituacao situacao={aberto.situacao} />}
                    <span>
                      aberta {formatar.diaHora(aberto.createdAt)}
                      {aberto.origem === "telegram" ? " pelo Telegram" : " pela área do membro"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {aberto.telefone && (
                    <a href={linkWhatsapp(aberto.telefone) ?? "#"} target="_blank" rel="noreferrer">
                      <Botao pequeno variante="whatsapp">
                        <MessageCircle className="size-3.5" /> WhatsApp
                      </Botao>
                    </a>
                  )}
                  {aberto.status !== "resolvido" ? (
                    <Botao
                      pequeno
                      variante="sucesso"
                      carregando={carregando === "resolver"}
                      onClick={() => executar("resolver", async () => atualizar(await apiSuporte.resolver(aberto.id)))}
                    >
                      <CircleCheck className="size-3.5" /> Resolvido
                    </Botao>
                  ) : (
                    <Botao pequeno carregando={carregando === "reabrir"} onClick={() => executar("reabrir", async () => atualizar(await apiSuporte.reabrir(aberto.id)))}>
                      <RotateCcw className="size-3.5" /> Reabrir
                    </Botao>
                  )}
                </div>
              </div>
              <ul className="flex flex-1 flex-col gap-3 overflow-y-auto py-4">
                {aberto.mensagens.map((m) => (
                  <li key={m.id} className={`flex ${m.autor === "equipe" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] whitespace-pre-line ${
                        m.autor === "equipe" ? "rounded-br-sm bg-orange-500/20 text-orange-50" : "rounded-bl-sm bg-gv-card-2 text-slate-100"
                      }`}
                    >
                      {m.texto}
                      <div className="mt-1 text-right text-[10.5px] opacity-60">
                        {m.autor === "equipe" ? "Equipe" : aberto.nome.split(" ")[0]} · {formatar.diaHora(m.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <MensagemErro texto={erro} />
              <div className="mt-2 flex items-end gap-2">
                <textarea className={classeTexto} rows={2} placeholder="Escreva a resposta..." value={texto} onChange={(e) => setTexto(e.target.value)} />
                <Botao
                  variante="primario"
                  disabled={!texto.trim()}
                  carregando={carregando === "responder"}
                  onClick={() =>
                    executar("responder", async () => {
                      atualizar(await apiSuporte.responder(aberto.id, texto));
                      setTexto("");
                      setFiltro("respondido");
                    })
                  }
                >
                  <Send className="size-4" />
                </Botao>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
