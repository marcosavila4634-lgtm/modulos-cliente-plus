import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Bell, Clapperboard, Clock, ExternalLink, Pencil, Plus, Trash2, Video, XCircle } from "lucide-react";
import { useState } from "react";
import { CampoMidia } from "../../components/grupo-vip/CampoMidia";
import { Botao, Campo, classeInput, classeTexto, MensagemErro, Modal, mensagemDe, useAcao } from "../../components/grupo-vip/formulario";
import { Abas, CabecalhoPagina, Card, Dica, Vazio } from "../../components/grupo-vip/ui";
import { formatar } from "../../lib/grupo-vip";
import { apiConteudos, paraCampoDataHora, type DadosLive, type GrupoOpcao, type Live } from "../../lib/grupo-vip-conteudos";
import { BotaoGuia } from "../../components/grupo-vip/Ajuda";

type Busca = { novo?: boolean };
type Filtro = "proximas" | "passadas";

// Lives e eventos: aviso automático antes de começar (post nos grupos com o
// robô e mensagem no privado de quem tem acesso).
export const Route = createFileRoute("/grupo-vip/lives-e-eventos")({
  validateSearch: (s: Record<string, unknown>): Busca => ({ novo: s.novo === true || s.novo === "true" ? true : undefined }),
  loader: () => apiConteudos.lives(),
  component: PaginaLives,
});

const selo: Record<Live["status"], { rotulo: string; cor: string }> = {
  agendado: { rotulo: "Agendada", cor: "bg-sky-500/15 text-sky-300" },
  ao_vivo: { rotulo: "Ao vivo", cor: "bg-red-600 text-white" },
  encerrado: { rotulo: "Encerrada", cor: "bg-slate-500/20 text-slate-300" },
  cancelado: { rotulo: "Cancelada", cor: "bg-slate-500/20 text-slate-400 line-through" },
};

function tempoAviso(min: number) {
  if (min === 0) return "na hora";
  if (min < 60) return `${min} min antes`;
  if (min < 1440) return `${min / 60} h antes`;
  return `${min / 1440} dia(s) antes`;
}

function PaginaLives() {
  const inicial = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [d, setD] = useState(inicial);
  const [filtro, setFiltro] = useState<Filtro>("proximas");
  const [editando, setEditando] = useState<Live | "nova" | null>(busca.novo ? "nova" : null);
  const { carregando, erro, executar } = useAcao();

  const recarregar = async () => {
    setD(await apiConteudos.lives());
    router.invalidate();
  };
  const fechar = () => {
    setEditando(null);
    if (busca.novo) navigate({ to: "/grupo-vip/lives-e-eventos", search: {}, replace: true });
  };

  const proximas = d.eventos
    .filter((e) => e.status === "agendado" || e.status === "ao_vivo")
    .sort((a, b) => a.comecaEm.localeCompare(b.comecaEm));
  const passadas = d.eventos.filter((e) => e.status === "encerrado" || e.status === "cancelado");
  const lista = filtro === "proximas" ? proximas : passadas;

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        guia={<BotaoGuia id="lives" />} titulo="Lives e Eventos" descricao="Agende as lives. O aviso sai sozinho antes de começar, nos grupos e no privado dos membros.">
        <Botao variante="primario" onClick={() => setEditando("nova")}>
          <Plus className="size-4" /> Agendar live
        </Botao>
      </CabecalhoPagina>

      <Dica icone={Bell}>
        O aviso vai pela caixa de saída: no Telegram o robô envia sozinho; no WhatsApp as mensagens ficam em Automação para
        você enviar. O texto do aviso é editado em Automação › Aviso de live.
      </Dica>

      <Abas
        abas={[
          { valor: "proximas" as Filtro, rotulo: "Próximas", quantidade: proximas.length },
          { valor: "passadas" as Filtro, rotulo: "Passadas", quantidade: passadas.length },
        ]}
        valor={filtro}
        aoMudar={setFiltro}
      />
      <MensagemErro texto={erro} />

      {lista.length === 0 ? (
        <Card>
          <Vazio icone={Clapperboard}>{filtro === "proximas" ? "Nenhuma live agendada." : "Nenhuma live passada."}</Vazio>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {lista.map((e) => (
            <Card key={e.id} className="flex gap-4">
              {e.foto ? (
                <img src={e.foto} alt="" className="size-24 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid size-24 shrink-0 place-items-center rounded-xl bg-gv-card-2">
                  <Video className="size-8 text-orange-300" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-poppins text-[15px] font-semibold text-white">{e.titulo}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${selo[e.status].cor}`}>{selo[e.status].rotulo}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {formatar.diaHora(e.comecaEm)} · {e.duracaoMinutos} min
                  </span>
                  <span className="text-gv-muted">{e.grupo ? `só ${e.grupo}` : "todos os grupos"}</span>
                </div>
                {e.descricao && <p className="mt-1 line-clamp-2 text-[12.5px] text-gv-muted">{e.descricao}</p>}
                <div className="mt-1 text-[12px] text-gv-muted">
                  Aviso {tempoAviso(e.avisoMinutos)} · {e.avisadoEm ? `enviado ${formatar.diaHora(e.avisadoEm)}` : "ainda não enviado"}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {e.link && (
                    <a href={e.link} target="_blank" rel="noreferrer">
                      <Botao pequeno>
                        <ExternalLink className="size-3.5" /> Link
                      </Botao>
                    </a>
                  )}
                  {(e.status === "agendado" || e.status === "ao_vivo") && (
                    <>
                      <Botao
                        pequeno
                        variante="primario"
                        carregando={carregando === `avisar:${e.id}`}
                        onClick={() =>
                          executar(`avisar:${e.id}`, async () => {
                            await apiConteudos.avisarLive(e.id);
                            await recarregar();
                          })
                        }
                      >
                        <Bell className="size-3.5" /> Avisar agora
                      </Botao>
                      <Botao pequeno onClick={() => setEditando(e)}>
                        <Pencil className="size-3.5" /> Editar
                      </Botao>
                      <Botao
                        pequeno
                        variante="perigo"
                        carregando={carregando === `cancelar:${e.id}`}
                        onClick={() =>
                          executar(`cancelar:${e.id}`, async () => {
                            if (!confirm(`Cancelar a live "${e.titulo}"?`)) return;
                            await apiConteudos.cancelarLive(e.id);
                            await recarregar();
                          })
                        }
                      >
                        <XCircle className="size-3.5" /> Cancelar
                      </Botao>
                    </>
                  )}
                  {(e.status === "encerrado" || e.status === "cancelado") && (
                    <Botao
                      pequeno
                      variante="perigo"
                      carregando={carregando === `excluir:${e.id}`}
                      onClick={() =>
                        executar(`excluir:${e.id}`, async () => {
                          await apiConteudos.excluirLive(e.id);
                          await recarregar();
                        })
                      }
                    >
                      <Trash2 className="size-3.5" /> Excluir
                    </Botao>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editando && (
        <ModalLive
          live={editando === "nova" ? null : editando}
          grupos={d.grupos}
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

function ModalLive({
  live,
  grupos,
  aoFechar,
  aoSalvar,
}: {
  live: Live | null;
  grupos: GrupoOpcao[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [f, setF] = useState<DadosLive>({
    titulo: live?.titulo ?? "",
    descricao: live?.descricao ?? "",
    foto: live?.foto ?? null,
    link: live?.link ?? "",
    comecaEm: paraCampoDataHora(live?.comecaEm ?? null),
    duracaoMinutos: live?.duracaoMinutos ?? 60,
    avisoMinutos: live?.avisoMinutos ?? 60,
    grupoId: live?.grupoId ?? null,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal titulo={live ? "Editar live" : "Agendar live"} aoFechar={aoFechar} largura="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Título *" className="sm:col-span-2">
          <input autoFocus className={classeInput} value={f.titulo} onChange={(e) => setF((v) => ({ ...v, titulo: e.target.value }))} />
        </Campo>
        <Campo rotulo="Descrição" className="sm:col-span-2">
          <textarea className={classeTexto} rows={2} value={f.descricao} onChange={(e) => setF((v) => ({ ...v, descricao: e.target.value }))} />
        </Campo>
        <Campo rotulo="Dia e hora *">
          <input type="datetime-local" className={classeInput} value={f.comecaEm} onChange={(e) => setF((v) => ({ ...v, comecaEm: e.target.value }))} />
        </Campo>
        <Campo rotulo="Duração">
          <select className={classeInput} value={f.duracaoMinutos} onChange={(e) => setF((v) => ({ ...v, duracaoMinutos: Number(e.target.value) }))}>
            {[30, 45, 60, 90, 120, 180].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} h`}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Link da transmissão" dica="YouTube, Meet, Zoom... Só quem tem acesso vê.">
          <input className={classeInput} value={f.link} onChange={(e) => setF((v) => ({ ...v, link: e.target.value }))} placeholder="https://" />
        </Campo>
        <Campo rotulo="Avisar">
          <select className={classeInput} value={f.avisoMinutos} onChange={(e) => setF((v) => ({ ...v, avisoMinutos: Number(e.target.value) }))}>
            {[0, 15, 30, 60, 120, 1440].map((m) => (
              <option key={m} value={m}>
                {tempoAviso(m)}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Para quem" className="sm:col-span-2">
          <select className={classeInput} value={f.grupoId ?? ""} onChange={(e) => setF((v) => ({ ...v, grupoId: e.target.value || null }))}>
            <option value="">Todos os grupos</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                Só o grupo {g.nome}
              </option>
            ))}
          </select>
        </Campo>
        <div className="sm:col-span-2">
          <span className="text-xs font-medium text-slate-300">Capa (opcional)</span>
          <div className="mt-1.5">
            <CampoMidia soImagem url={f.foto} tipo={f.foto ? "imagem" : null} aoMudar={(foto) => setF((v) => ({ ...v, foto }))} />
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
              if (live) await apiConteudos.atualizarLive(live.id, f);
              else await apiConteudos.criarLive(f);
              aoSalvar();
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          Salvar
        </Botao>
      </div>
    </Modal>
  );
}
