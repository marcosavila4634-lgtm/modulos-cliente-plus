import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Megaphone, MessageCircle, Send, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Botao, Campo, classeInput, classeTexto, Interruptor, MensagemErro, mensagemDe } from "../../components/grupo-vip/formulario";
import { CabecalhoPagina, Card, TituloCard, Vazio } from "../../components/grupo-vip/ui";
import { formatar } from "../../lib/grupo-vip";
import {
  apiConteudos,
  rotuloPublico,
  rotuloTipoAnuncio,
  variaveisMensagem,
  type ContagemPublico,
  type DadosAnuncio,
  type PublicoAnuncio,
  type TipoAnuncio,
} from "../../lib/grupo-vip-conteudos";

// Anúncios: um recado para um público de membros (vai pela caixa de saída) e,
// se quiser, também postado nos grupos.
export const Route = createFileRoute("/grupo-vip/anuncios")({
  loader: () => apiConteudos.anuncios(),
  component: PaginaAnuncios,
});

const vazio: DadosAnuncio = { titulo: "", texto: "", tipo: "conteudo", publico: "em_dia", publicoRef: null, postarNosGrupos: false };

function PaginaAnuncios() {
  const inicial = Route.useLoaderData();
  const router = useRouter();
  const [d, setD] = useState(inicial);
  const [f, setF] = useState<DadosAnuncio>(vazio);
  const [contagem, setContagem] = useState<ContagemPublico | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const precisaRef = f.publico === "plano" || f.publico === "grupo";

  // Quantas pessoas vão receber.
  useEffect(() => {
    if (precisaRef && !f.publicoRef) {
      setContagem(null);
      return;
    }
    let vivo = true;
    apiConteudos
      .contarPublico(f.publico, precisaRef ? f.publicoRef : null)
      .then((c) => vivo && setContagem(c))
      .catch(() => vivo && setContagem(null));
    return () => {
      vivo = false;
    };
  }, [f.publico, f.publicoRef, precisaRef]);

  async function enviar() {
    setEnviando(true);
    setErro(null);
    setOk(null);
    try {
      if (!confirm(`Enviar para ${contagem?.quantidade ?? 0} pessoa(s)?`)) return;
      setD(await apiConteudos.enviarAnuncio(f));
      setOk(`Anúncio criado para ${contagem?.quantidade ?? 0} pessoa(s).`);
      setF(vazio);
      router.invalidate();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Anúncios"
        descricao="Mande um recado para todos ou para um grupo de membros. Quem conversa com o robô recebe pelo Telegram na hora; os demais ficam na caixa de saída do WhatsApp."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <Card>
          <TituloCard icone={Megaphone}>Novo anúncio</TituloCard>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Título *" className="sm:col-span-2">
              <input className={classeInput} value={f.titulo} onChange={(e) => setF((v) => ({ ...v, titulo: e.target.value }))} />
            </Campo>
            <Campo rotulo="Tipo">
              <select className={classeInput} value={f.tipo} onChange={(e) => setF((v) => ({ ...v, tipo: e.target.value as TipoAnuncio }))}>
                {Object.entries(rotuloTipoAnuncio).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Para quem">
              <select
                className={classeInput}
                value={f.publico}
                onChange={(e) => setF((v) => ({ ...v, publico: e.target.value as PublicoAnuncio, publicoRef: null }))}
              >
                {Object.entries(rotuloPublico).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            {precisaRef && (
              <Campo rotulo={f.publico === "plano" ? "Plano" : "Grupo"} className="sm:col-span-2">
                <select className={classeInput} value={f.publicoRef ?? ""} onChange={(e) => setF((v) => ({ ...v, publicoRef: e.target.value || null }))}>
                  <option value="">Escolha...</option>
                  {(f.publico === "plano" ? d.planos : d.grupos).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
            <Campo
              rotulo="Mensagem *"
              className="sm:col-span-2"
              dica={<>Pode usar {variaveisMensagem.slice(0, 4).map((v) => v.nome).join(", ")} e {"{link_area}"}.</>}
            >
              <textarea className={classeTexto} rows={6} value={f.texto} onChange={(e) => setF((v) => ({ ...v, texto: e.target.value }))} />
            </Campo>
            <div className="sm:col-span-2">
              <Interruptor
                ligado={f.postarNosGrupos}
                aoMudar={(postarNosGrupos) => setF((v) => ({ ...v, postarNosGrupos }))}
                titulo="Postar também nos grupos"
                descricao="Cria uma publicação nos grupos do público (robô no Telegram; no WhatsApp fica para você postar)."
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2.5 text-[13px]">
            <Users className="size-4 text-orange-300" />
            {contagem ? (
              <span className="text-slate-200">
                <b>{contagem.quantidade}</b> pessoa(s) · {contagem.telegram} pelo Telegram · {contagem.whatsapp} pelo WhatsApp
                {contagem.semCanal > 0 && <span className="text-amber-300"> · {contagem.semCanal} sem contato</span>}
              </span>
            ) : (
              <span className="text-gv-muted">Escolha o público.</span>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <MensagemErro texto={erro} />
            {ok && (
              <p className="text-sm text-emerald-300">
                {ok}{" "}
                <Link to="/grupo-vip/automacao" className="underline">
                  Ver caixa de saída
                </Link>
              </p>
            )}
            <div className="flex justify-end">
              <Botao
                variante="primario"
                carregando={enviando}
                disabled={!f.titulo.trim() || !f.texto.trim() || !contagem || contagem.quantidade === 0}
                onClick={enviar}
              >
                <Send className="size-4" /> Enviar anúncio
              </Botao>
            </div>
          </div>
        </Card>

        <Card className="!p-0">
          <div className="p-4 pb-2">
            <TituloCard icone={MessageCircle}>Enviados</TituloCard>
          </div>
          {d.anuncios.length === 0 ? (
            <Vazio icone={Megaphone}>Nenhum anúncio enviado.</Vazio>
          ) : (
            <ul className="divide-y divide-gv-line/70">
              {d.anuncios.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-white">{a.titulo}</span>
                    <span className="text-[11.5px] text-gv-muted">{formatar.diaHora(a.enviadoEm)}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-gv-muted">
                    {rotuloTipoAnuncio[a.tipo]} · {rotuloPublico[a.publico]}
                    {a.publicoNome && `: ${a.publicoNome}`}
                    {a.postadoNosGrupos && " · postado nos grupos"}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] whitespace-pre-line text-slate-300">{a.texto}</p>
                  <div className="mt-1.5 text-[12px]">
                    <span className="text-slate-200">{a.destinatarios} destinatários</span>
                    {(a.enviadas > 0 || a.pendentes > 0) && (
                      <span className="text-gv-muted">
                        {" "}
                        · {a.enviadas} enviadas · <span className={a.pendentes ? "text-amber-300" : ""}>{a.pendentes} para enviar</span>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
