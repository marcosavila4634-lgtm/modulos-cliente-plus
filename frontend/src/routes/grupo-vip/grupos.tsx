import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Bot, ExternalLink, Layers, Pencil, Plus, Send, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Botao, BotaoCopiar, Campo, classeInput, classeTexto, Interruptor, MensagemErro, Modal, mensagemDe } from "../../components/grupo-vip/formulario";
import { SeloPlataforma } from "../../components/grupo-vip/Selos";
import { corGrupo } from "../../components/grupo-vip/Topo";
import { CabecalhoPagina, Card, Dica, TituloCard } from "../../components/grupo-vip/ui";
import { formatar, periodicidade, type Plataforma } from "../../lib/grupo-vip";
import {
  apiGrupos,
  type CorGrupo,
  type DadosGrupo,
  type DadosPlano,
  type Grupo,
  type Grupos,
  type Plano,
} from "../../lib/grupo-vip-membros";

type Busca = { novo?: boolean };

// Grupos (Telegram/WhatsApp) e os planos que liberam cada grupo.
export const Route = createFileRoute("/grupo-vip/grupos")({
  validateSearch: (s: Record<string, unknown>): Busca => ({ novo: s.novo === true || s.novo === "true" ? true : undefined }),
  loader: () => apiGrupos.listar(),
  component: PaginaGrupos,
});

function PaginaGrupos() {
  const inicial = Route.useLoaderData();
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [d, setD] = useState<Grupos>(inicial);
  const [grupo, setGrupo] = useState<Grupo | "novo" | null>(busca.novo ? "novo" : null);
  const [plano, setPlano] = useState<Plano | "novo" | null>(null);

  const atualizar = (novo: Grupos) => {
    setD(novo);
    router.invalidate();
  };
  const fecharGrupo = () => {
    setGrupo(null);
    if (busca.novo) navigate({ to: "/grupo-vip/grupos", search: {}, replace: true });
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Grupos e planos"
        descricao="Cadastre seus grupos e diga quais grupos cada plano libera. Quem paga um plano recebe acesso a todos os grupos dele."
      >
        <Botao variante="primario" onClick={() => setGrupo("novo")}>
          <Plus className="size-4" /> Novo grupo
        </Botao>
      </CabecalhoPagina>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">Página de vendas</div>
          <div className="truncate text-[13px] text-gv-muted">{d.paginaVendas}</div>
        </div>
        <BotaoCopiar texto={d.paginaVendas} rotulo="Copiar link" pequeno={false} />
        <a href={d.paginaVendas} target="_blank" rel="noreferrer">
          <Botao>
            <ExternalLink className="size-4" /> Abrir
          </Botao>
        </a>
      </Card>

      {!d.robo.conectado && d.grupos.some((g) => g.plataforma === "telegram") && (
        <Dica icone={Bot} cor="amber">
          Seus grupos do Telegram estão no <b>modo manual</b>. Conecte o robô do Telegram em{" "}
          <Link to="/grupo-vip/configuracoes" className="underline">
            Configurações
          </Link>{" "}
          e informe o ID de cada grupo: o robô passa a colocar quem pagou e tirar quem não pagou sozinho.
        </Dica>
      )}

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {d.grupos.map((g) => (
          <Card key={g.id} className={g.ativo ? "" : "opacity-60"}>
            <div className="flex items-start gap-3">
              <span className={`grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-b ${corGrupo[g.cor]}`}>
                <Users className="size-5 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-poppins text-[15px] font-semibold text-white">{g.nome}</span>
                  {!g.ativo && <span className="text-xs text-gv-muted">(desativado)</span>}
                </div>
                <div className="mt-1">
                  <SeloPlataforma plataforma={g.plataforma} automatico={g.automatico} />
                </div>
                {g.descricao && <p className="mt-2 text-[13px] text-gv-muted">{g.descricao}</p>}
              </div>
              <button type="button" onClick={() => setGrupo(g)} aria-label="Editar" className="rounded-lg p-2 text-gv-muted hover:bg-white/5 hover:text-white">
                <Pencil className="size-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
                <div className="font-poppins text-lg font-bold text-white">{g.noGrupo}</div>
                <div className="text-[11px] text-gv-muted">no grupo</div>
              </div>
              <div className="rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
                <div className="font-poppins text-lg font-bold text-white">{g.comDireito}</div>
                <div className="text-[11px] text-gv-muted">com acesso pago</div>
              </div>
            </div>
            <div className="mt-3 text-[12px] text-gv-muted">
              Planos: {g.planos.length ? g.planos.map((p) => p.nome).join(", ") : <span className="text-amber-300">nenhum (ninguém entra)</span>}
            </div>
            {g.plataforma === "telegram" && (
              <Link
                to="/grupo-vip/telegram"
                search={{ grupo: g.id }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-orange-400 underline underline-offset-2 hover:text-orange-300"
              >
                <Bot className="size-3.5" /> Gerenciar no Telegram
              </Link>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <TituloCard icone={Layers} acao={<Botao pequeno variante="primario" onClick={() => setPlano("novo")}><Plus className="size-3.5" /> Novo plano</Botao>}>
          Planos
        </TituloCard>
        <p className="mt-1 text-[12.5px] text-gv-muted">
          São os planos do Cliente Plus. Mudar o preço vale para as próximas assinaturas. Plano com preço zero é cortesia (não aparece na página de vendas).
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {d.planos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlano(p)}
              className={`rounded-xl border border-gv-line bg-gv-bg/40 p-3 text-left transition hover:border-orange-500/50 ${p.ativo ? "" : "opacity-60"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{p.nome}</span>
                <span className="text-sm font-semibold text-orange-300">{p.preco === 0 ? "Cortesia" : formatar.moeda(p.preco)}</span>
              </div>
              <div className="text-[12px] text-gv-muted">
                {periodicidade(p.duracaoMeses)} · {p.assinantes} assinante(s) · {p.participaIndicacoes ? "gera comissão" : "sem comissão"}
                {!p.ativo && " · desativado"}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.grupos.map((g) => (
                  <span key={g.id} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                    {g.nome}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {grupo && (
        <ModalGrupo
          grupo={grupo === "novo" ? null : grupo}
          dados={d}
          aoFechar={fecharGrupo}
          aoSalvar={(novo) => {
            atualizar(novo);
            fecharGrupo();
          }}
        />
      )}
      {plano && (
        <ModalPlano
          plano={plano === "novo" ? null : plano}
          grupos={d.grupos}
          aoFechar={() => setPlano(null)}
          aoSalvar={(novo) => {
            atualizar(novo);
            setPlano(null);
          }}
        />
      )}
    </div>
  );
}

const cores: CorGrupo[] = ["blue", "sky", "violet", "indigo", "amber"];

function ModalGrupo({
  grupo,
  dados,
  aoFechar,
  aoSalvar,
}: {
  grupo: Grupo | null;
  dados: Grupos;
  aoFechar: () => void;
  aoSalvar: (d: Grupos) => void;
}) {
  const [f, setF] = useState<DadosGrupo>({
    nome: grupo?.nome ?? "",
    descricao: grupo?.descricao ?? "",
    plataforma: grupo?.plataforma ?? "telegram",
    cor: grupo?.cor ?? "blue",
    linkConvite: grupo?.linkConvite ?? "",
    telegramChatId: grupo?.telegramChatId ?? "",
    ativo: grupo?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const muda = (campo: keyof DadosGrupo) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [campo]: e.target.value }));

  return (
    <Modal titulo={grupo ? "Editar grupo" : "Novo grupo"} aoFechar={aoFechar} largura="max-w-xl">
      <div className="grid gap-4">
        <Campo rotulo="Nome do grupo *">
          <input autoFocus className={classeInput} value={f.nome} onChange={muda("nome")} />
        </Campo>
        <Campo rotulo="Descrição (aparece na página de vendas)">
          <textarea className={classeTexto} rows={2} value={f.descricao} onChange={muda("descricao")} />
        </Campo>
        <div>
          <span className="text-xs font-medium text-slate-300">Plataforma</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["telegram", "whatsapp"] as Plataforma[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setF((v) => ({ ...v, plataforma: p }))}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                  f.plataforma === p ? "border-orange-500/70 bg-orange-500/10 text-white" : "border-gv-line text-slate-300"
                }`}
              >
                <SeloPlataforma plataforma={p} />
              </button>
            ))}
          </div>
        </div>

        {f.plataforma === "telegram" ? (
          <>
            <Campo
              rotulo="ID do grupo no Telegram (modo automático)"
              dica={
                <>
                  Coloque o robô como <b>administrador</b> do grupo e escreva <code>/id</code> no grupo: o robô responde o
                  número (ex.: -1001234567890). {dados.robo.conectado ? "" : "Primeiro conecte o robô em Configurações."}
                </>
              }
            >
              <input className={classeInput} value={f.telegramChatId} onChange={muda("telegramChatId")} placeholder="-100..." />
            </Campo>
            {dados.detectados.length > 0 && (
              <div className="rounded-xl border border-gv-line bg-gv-bg/40 p-3">
                <div className="text-xs font-medium text-slate-300">Grupos em que o robô está (toque para usar)</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {dados.detectados.map((g) => (
                    <button
                      key={g.chatId}
                      type="button"
                      onClick={() => setF((v) => ({ ...v, telegramChatId: g.chatId, nome: v.nome || g.titulo }))}
                      className="rounded-lg border border-gv-line px-2.5 py-1 text-xs text-slate-200 hover:border-orange-500/60"
                    >
                      {g.titulo} {g.administrador ? "· admin" : "· NÃO é admin"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Campo rotulo="Link fixo do grupo (opcional, modo manual)" dica="Só é usado enquanto o robô não cuida do grupo.">
              <input className={classeInput} value={f.linkConvite} onChange={muda("linkConvite")} placeholder="https://t.me/+..." />
            </Campo>
          </>
        ) : (
          <Campo
            rotulo="Link de convite do grupo (opcional)"
            dica="No WhatsApp: dados do grupo › Convidar via link. Se preencher, o membro entra sozinho pela área do membro; se deixar vazio, você adiciona cada pessoa."
          >
            <input className={classeInput} value={f.linkConvite} onChange={muda("linkConvite")} placeholder="https://chat.whatsapp.com/..." />
          </Campo>
        )}

        <div>
          <span className="text-xs font-medium text-slate-300">Cor</span>
          <div className="mt-1.5 flex gap-2">
            {cores.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setF((v) => ({ ...v, cor: c }))}
                className={`size-8 rounded-full bg-gradient-to-b ${corGrupo[c]} ${f.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-gv-card" : ""}`}
              />
            ))}
          </div>
        </div>
        {grupo && (
          <Interruptor
            ligado={f.ativo}
            aoMudar={(ativo) => setF((v) => ({ ...v, ativo }))}
            titulo="Grupo ativo"
            descricao="Desativado: some da página de vendas e ninguém recebe acesso novo."
          />
        )}
      </div>
      <div className="mt-4">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-2">
        {grupo ? (
          <Botao
            variante="perigo"
            onClick={async () => {
              if (!confirm(`Excluir o grupo ${grupo.nome}?`)) return;
              try {
                aoSalvar(await apiGrupos.excluir(grupo.id));
              } catch (e) {
                setErro(mensagemDe(e));
              }
            }}
          >
            <Trash2 className="size-4" /> Excluir
          </Botao>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            carregando={salvando}
            onClick={async () => {
              setSalvando(true);
              setErro(null);
              try {
                aoSalvar(grupo ? await apiGrupos.atualizar(grupo.id, f) : await apiGrupos.criar(f));
              } catch (e) {
                setErro(mensagemDe(e));
              } finally {
                setSalvando(false);
              }
            }}
          >
            <Send className="size-4" /> Salvar
          </Botao>
        </div>
      </div>
    </Modal>
  );
}

function ModalPlano({
  plano,
  grupos,
  aoFechar,
  aoSalvar,
}: {
  plano: Plano | null;
  grupos: Grupo[];
  aoFechar: () => void;
  aoSalvar: (d: Grupos) => void;
}) {
  const [f, setF] = useState<DadosPlano>({
    nome: plano?.nome ?? "",
    descricao: plano?.descricao ?? "",
    preco: plano?.preco ?? 0,
    duracaoMeses: plano?.duracaoMeses ?? 1,
    participaIndicacoes: plano?.participaIndicacoes ?? true,
    ativo: plano?.ativo ?? true,
    grupoIds: plano?.grupos.map((g) => g.id) ?? [],
  });
  const [preco, setPreco] = useState(plano ? String(plano.preco).replace(".", ",") : "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const alternar = (id: string) =>
    setF((v) => ({ ...v, grupoIds: v.grupoIds.includes(id) ? v.grupoIds.filter((x) => x !== id) : [...v.grupoIds, id] }));

  return (
    <Modal titulo={plano ? "Editar plano" : "Novo plano"} aoFechar={aoFechar} largura="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome *" className="sm:col-span-2">
          <input autoFocus className={classeInput} value={f.nome} onChange={(e) => setF((v) => ({ ...v, nome: e.target.value }))} />
        </Campo>
        <Campo rotulo="Descrição" className="sm:col-span-2">
          <input className={classeInput} value={f.descricao} onChange={(e) => setF((v) => ({ ...v, descricao: e.target.value }))} />
        </Campo>
        <Campo rotulo="Preço (R$)" dica="0 = cortesia">
          <input className={classeInput} inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="49,90" />
        </Campo>
        <Campo rotulo="Cobrança">
          <select
            className={classeInput}
            value={f.duracaoMeses}
            onChange={(e) => setF((v) => ({ ...v, duracaoMeses: Number(e.target.value) }))}
          >
            {[1, 2, 3, 6, 12].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "Mensal" : n === 3 ? "Trimestral" : n === 6 ? "Semestral" : n === 12 ? "Anual" : `A cada ${n} meses`}
              </option>
            ))}
          </select>
        </Campo>
        <div className="sm:col-span-2">
          <span className="text-xs font-medium text-slate-300">Grupos que este plano libera *</span>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {grupos.map((g) => (
              <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-gv-line px-3 py-2 text-sm text-slate-200 hover:border-slate-600">
                <input type="checkbox" className="accent-orange-500" checked={f.grupoIds.includes(g.id)} onChange={() => alternar(g.id)} />
                <span className="flex-1 truncate">{g.nome}</span>
                <SeloPlataforma plataforma={g.plataforma} />
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <Interruptor
            ligado={f.participaIndicacoes}
            aoMudar={(v) => setF((x) => ({ ...x, participaIndicacoes: v }))}
            titulo="Gera comissão de indicação"
            descricao="Os pagamentos deste plano pagam comissão para quem indicou (Cliente Plus)."
          />
          <Interruptor
            ligado={f.ativo}
            aoMudar={(v) => setF((x) => ({ ...x, ativo: v }))}
            titulo="Plano à venda"
            descricao="Desligado: some da página de vendas; quem já assina continua."
          />
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
              const valor = Number(preco.replace(/\./g, "").replace(",", "."));
              if (!preco.trim() || Number.isNaN(valor)) throw new Error("Informe o preço (ex.: 49,90)");
              const dados = { ...f, preco: valor };
              aoSalvar(plano ? await apiGrupos.atualizarPlano(plano.id, dados) : await apiGrupos.criarPlano(dados));
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
