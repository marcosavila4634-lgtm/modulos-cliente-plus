import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { formatar, hojeIso, periodicidade, rotuloForma, type FormaPagamento } from "../../lib/grupo-vip";
import {
  apiMembros,
  type DadosMembro,
  type MembroDetalhe,
  type Plano,
} from "../../lib/grupo-vip-membros";
import { Botao, Campo, classeInput, classeTexto, MensagemErro, Modal, mensagemDe } from "./formulario";

const formas: FormaPagamento[] = ["pix", "dinheiro", "cartao_credito", "cartao_debito", "boleto"];

function vazio(m?: MembroDetalhe): DadosMembro {
  return {
    nome: m?.nome ?? "",
    email: m?.email ?? "",
    telefone: m?.telefone ?? "",
    cpf: m?.cpf ?? "",
    dataNascimento: m?.dataNascimento ?? null,
    telegramUsuario: m?.telegramUsuario ?? "",
    observacoes: m?.observacoes ?? "",
  };
}

// Novo membro (com plano opcional) ou edição dos dados.
export function ModalMembro({
  membro,
  planos,
  aoFechar,
  aoSalvar,
}: {
  membro?: MembroDetalhe;
  planos: Plano[];
  aoFechar: () => void;
  aoSalvar: (m: MembroDetalhe) => void;
}) {
  const [d, setD] = useState<DadosMembro>(() => vazio(membro));
  const [planoId, setPlanoId] = useState<string>("");
  const [inicio, setInicio] = useState(hojeIso());
  const [forma, setForma] = useState<FormaPagamento | "">("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const muda = (campo: keyof DadosMembro) => (e: { target: { value: string } }) =>
    setD((v) => ({ ...v, [campo]: e.target.value }));
  const ativos = planos.filter((p) => p.ativo);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const m = membro
        ? await apiMembros.atualizar(membro.id, d)
        : await apiMembros.cadastrar({
            ...d,
            planoId: planoId || null,
            inicio: planoId ? inicio : null,
            formaPagamento: planoId && forma ? forma : null,
          });
      aoSalvar(m);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={membro ? "Editar membro" : "Novo membro"} aoFechar={aoFechar} largura="max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome completo *" className="sm:col-span-2">
          <input autoFocus className={classeInput} value={d.nome} onChange={muda("nome")} />
        </Campo>
        <Campo rotulo="WhatsApp (com DDD)" dica="Usado para mandar os links e os avisos.">
          <input className={classeInput} inputMode="tel" value={d.telefone} onChange={muda("telefone")} placeholder="(11) 98765-4321" />
        </Campo>
        <Campo rotulo="E-mail">
          <input className={classeInput} type="email" value={d.email} onChange={muda("email")} />
        </Campo>
        <Campo rotulo="Usuário do Telegram" dica="Sem o @. Opcional.">
          <input className={classeInput} value={d.telegramUsuario} onChange={muda("telegramUsuario")} placeholder="usuario" />
        </Campo>
        <Campo rotulo="Data de nascimento" dica="Para a mensagem de aniversário.">
          <input
            className={classeInput}
            type="date"
            value={d.dataNascimento ?? ""}
            onChange={(e) => setD((v) => ({ ...v, dataNascimento: e.target.value || null }))}
          />
        </Campo>
        <Campo rotulo="CPF">
          <input className={classeInput} inputMode="numeric" value={d.cpf} onChange={muda("cpf")} />
        </Campo>
        <Campo rotulo="Observações" className="sm:col-span-2">
          <textarea className={classeTexto} rows={2} value={d.observacoes} onChange={muda("observacoes")} />
        </Campo>

        {!membro && (
          <div className="rounded-xl border border-gv-line bg-gv-bg/40 p-3 sm:col-span-2">
            <div className="text-sm font-semibold text-white">Assinatura (opcional)</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Campo rotulo="Plano">
                <select className={classeInput} value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
                  <option value="">Só cadastrar</option>
                  {ativos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} · {formatar.moeda(p.preco)}
                    </option>
                  ))}
                </select>
              </Campo>
              {planoId && (
                <>
                  <Campo rotulo="Início">
                    <input className={classeInput} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                  </Campo>
                  <Campo rotulo="1º pagamento">
                    <select className={classeInput} value={forma} onChange={(e) => setForma(e.target.value as FormaPagamento | "")}>
                      <option value="">Ainda não pagou</option>
                      {formas.map((f) => (
                        <option key={f} value={f}>
                          Já pagou · {rotuloForma[f]}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Botao onClick={aoFechar}>Cancelar</Botao>
        <Botao variante="primario" carregando={salvando} onClick={salvar}>
          Salvar
        </Botao>
      </div>
    </Modal>
  );
}

// Assinar um plano (ou trocar, se ainda não pagou).
export function ModalAssinar({
  membro,
  planos,
  aoFechar,
  aoSalvar,
}: {
  membro: MembroDetalhe;
  planos: Plano[];
  aoFechar: () => void;
  aoSalvar: (m: MembroDetalhe) => void;
}) {
  const ativos = planos.filter((p) => p.ativo);
  const [planoId, setPlanoId] = useState(ativos[0]?.id ?? "");
  const [inicio, setInicio] = useState(hojeIso());
  const [forma, setForma] = useState<FormaPagamento | "">("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const plano = ativos.find((p) => p.id === planoId);

  return (
    <Modal titulo="Assinar plano" subtitulo={membro.nome} aoFechar={aoFechar}>
      <div className="flex flex-col gap-2">
        {ativos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlanoId(p.id)}
            className={`rounded-xl border px-3 py-2.5 text-left transition ${
              planoId === p.id ? "border-orange-500/70 bg-orange-500/10" : "border-gv-line hover:border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-white">{p.nome}</span>
              <span className="text-sm font-semibold text-orange-300">
                {formatar.moeda(p.preco)} <span className="text-xs font-normal text-gv-muted">{periodicidade(p.duracaoMeses)}</span>
              </span>
            </div>
            <div className="mt-0.5 text-xs text-gv-muted">Grupos: {p.grupos.map((g) => g.nome).join(", ") || "nenhum"}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Início (1º vencimento)">
          <input className={classeInput} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </Campo>
        <Campo rotulo="1º pagamento">
          <select className={classeInput} value={forma} onChange={(e) => setForma(e.target.value as FormaPagamento | "")}>
            <option value="">Ainda não pagou</option>
            {formas.map((f) => (
              <option key={f} value={f}>
                Já pagou · {rotuloForma[f]}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      {plano && plano.preco === 0 && <p className="mt-3 text-xs text-gv-muted">Plano de cortesia: não gera cobrança.</p>}
      <div className="mt-4">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Botao onClick={aoFechar}>Cancelar</Botao>
        <Botao
          variante="primario"
          carregando={salvando}
          disabled={!planoId}
          onClick={async () => {
            setSalvando(true);
            setErro(null);
            try {
              aoSalvar(await apiMembros.assinar(membro.id, planoId, inicio, forma || null));
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          Assinar
        </Botao>
      </div>
    </Modal>
  );
}

// Registrar o recebimento de uma cobrança.
export function ModalReceber({
  cobranca,
  aoFechar,
  aoSalvar,
}: {
  cobranca: { id: string; nome: string; descricao: string; valor: number; vencimento: string };
  aoFechar: () => void;
  aoSalvar: (m: MembroDetalhe) => void;
}) {
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Modal titulo="Receber pagamento" subtitulo={`${cobranca.nome} · ${cobranca.descricao}`} aoFechar={aoFechar} largura="max-w-md">
      <div className="rounded-xl border border-gv-line bg-gv-bg/40 px-4 py-3">
        <div className="text-xs text-gv-muted">Valor · vence em {formatar.data(cobranca.vencimento)}</div>
        <div className="font-poppins text-2xl font-bold text-white">{formatar.moeda(cobranca.valor)}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {formas.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setForma(f)}
            className={`rounded-xl border px-3 py-2 text-sm transition ${
              forma === f ? "border-orange-500/70 bg-orange-500/10 text-white" : "border-gv-line text-slate-300 hover:border-slate-600"
            }`}
          >
            {rotuloForma[f]}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-gv-muted">
        O pagamento confirmado libera o acesso aos grupos e gera as comissões de indicação no Cliente Plus.
      </p>
      <div className="mt-4">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Botao onClick={aoFechar}>Cancelar</Botao>
        <Botao
          variante="sucesso"
          carregando={salvando}
          onClick={async () => {
            setSalvando(true);
            setErro(null);
            try {
              aoSalvar(await apiMembros.receber(cobranca.id, forma));
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          Confirmar recebimento
        </Botao>
      </div>
    </Modal>
  );
}

// Mensagem avulsa para o membro (Telegram envia sozinho; WhatsApp abre o app).
export function ModalMensagem({
  membro,
  aoFechar,
  aoEnviar,
}: {
  membro: { id: string; nome: string };
  aoFechar: () => void;
  aoEnviar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [enviadoTelegram, setEnviadoTelegram] = useState(false);

  if (whatsapp || enviadoTelegram) {
    return (
      <Modal titulo="Mensagem pronta" subtitulo={membro.nome} aoFechar={aoFechar} largura="max-w-md">
        {enviadoTelegram ? (
          <p className="text-sm text-emerald-300">O robô enviou a mensagem pelo Telegram.</p>
        ) : (
          <>
            <p className="text-sm text-slate-300">Toque no botão para abrir o WhatsApp com o texto pronto e enviar.</p>
            <a href={whatsapp!} target="_blank" rel="noreferrer" onClick={aoEnviar} className="mt-4 flex">
              <Botao variante="whatsapp" className="w-full">
                <MessageCircle className="size-4" /> Abrir o WhatsApp
              </Botao>
            </a>
          </>
        )}
        <div className="mt-4 flex justify-end">
          <Botao onClick={aoFechar}>Fechar</Botao>
        </div>
      </Modal>
    );
  }

  return (
    <Modal titulo="Enviar mensagem" subtitulo={membro.nome} aoFechar={aoFechar} largura="max-w-md">
      <textarea
        autoFocus
        className={classeTexto}
        rows={5}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva a mensagem..."
      />
      <div className="mt-3">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Botao onClick={aoFechar}>Cancelar</Botao>
        <Botao
          variante="primario"
          carregando={salvando}
          disabled={!texto.trim()}
          onClick={async () => {
            setSalvando(true);
            setErro(null);
            try {
              const m = await apiMembros.mensagem(membro.id, texto);
              if (m.canal === "telegram") {
                if (m.status === "falhou") throw new Error(m.erro ?? "Falha no envio pelo Telegram");
                setEnviadoTelegram(true);
                aoEnviar();
              } else setWhatsapp(m.whatsapp);
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          <Send className="size-4" /> Enviar
        </Botao>
      </div>
    </Modal>
  );
}
