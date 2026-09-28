import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Bot, Building2, CircleCheck, Globe, Palette, Pencil, Plus, QrCode, Save, ShieldCheck, Ticket, Trash2, Unplug } from "lucide-react";
import { useState } from "react";
import {
  Botao,
  BotaoCopiar,
  Campo,
  classeBotao,
  classeInput,
  Interruptor,
  MensagemErro,
  Modal,
  mensagemDe,
  useAcao,
} from "../../components/grupo-vip/formulario";
import { CabecalhoPagina, Card, Dica, TituloCard } from "../../components/grupo-vip/ui";
import { formatar, haQuanto } from "../../lib/grupo-vip";
import { apiConfig, type Configuracoes, type Cupom, type DadosConfiguracoes, type DadosCupom } from "../../lib/grupo-vip-financeiro";
import { BotaoGuia } from "../../components/grupo-vip/Ajuda";

// Configurações do módulo Grupos VIP.
export const Route = createFileRoute("/grupo-vip/configuracoes")({
  loader: () => apiConfig.buscar(),
  component: PaginaConfiguracoes,
});

function dadosDe(c: Configuracoes): DadosConfiguracoes {
  return {
    nomeNegocio: c.nomeNegocio,
    slug: c.slug,
    descricaoPagina: c.descricaoPagina,
    beneficios: c.beneficios,
    fotoCapa: c.fotoCapa,
    gestorNome: c.gestorNome,
    gestorSobrenome: c.gestorSobrenome,
    gestorCargo: c.gestorCargo,
    frase: c.frase,
    fraseDestaque: c.fraseDestaque,
    toleranciaDias: c.toleranciaDias,
    atrasadoSomenteLeitura: c.atrasadoSomenteLeitura,
    chavePix: c.chavePix ?? "",
    nomeRecebedor: c.nomeRecebedor ?? "",
    cidadeRecebedor: c.cidadeRecebedor ?? "",
    whatsappSuporte: c.whatsappSuporte ?? "",
  };
}

function PaginaConfiguracoes() {
  const router = useRouter();
  const [c, setC] = useState<Configuracoes>(Route.useLoaderData());
  const [f, setF] = useState<DadosConfiguracoes>(() => dadosDe(c));
  const [ok, setOk] = useState(false);
  const [cupom, setCupom] = useState<Cupom | "novo" | null>(null);
  const [token, setToken] = useState("");
  const { carregando, erro, executar } = useAcao();
  const muda = (campo: keyof DadosConfiguracoes) => (e: { target: { value: string } }) => {
    setOk(false);
    setF((v) => ({ ...v, [campo]: e.target.value }));
  };

  const atualizar = (nova: Configuracoes) => {
    setC(nova);
    setF(dadosDe(nova));
    router.invalidate();
  };

  const salvar = () =>
    executar("salvar", async () => {
      atualizar(await apiConfig.salvar(f));
      setOk(true);
    });

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina titulo="Configurações" descricao="Dados do negócio, página de vendas, Pix, regras de acesso, robô do Telegram e cupons.">
        <Botao variante="primario" carregando={carregando === "salvar"} onClick={salvar}>
          <Save className="size-4" /> Salvar
        </Botao>
      </CabecalhoPagina>
      <MensagemErro texto={erro} />
      {ok && <p className="text-sm text-emerald-300">Configurações salvas.</p>}

      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <TituloCard icone={Building2}>Negócio</TituloCard>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Nome do negócio" className="sm:col-span-2">
              <input className={classeInput} value={f.nomeNegocio} onChange={muda("nomeNegocio")} />
            </Campo>
            <Campo rotulo="Seu nome">
              <input className={classeInput} value={f.gestorNome} onChange={muda("gestorNome")} />
            </Campo>
            <Campo rotulo="Sobrenome">
              <input className={classeInput} value={f.gestorSobrenome} onChange={muda("gestorSobrenome")} />
            </Campo>
            <Campo rotulo="Cargo">
              <input className={classeInput} value={f.gestorCargo} onChange={muda("gestorCargo")} />
            </Campo>
            <Campo rotulo="WhatsApp do suporte" dica="Aparece na página de vendas e na área do membro.">
              <input className={classeInput} inputMode="tel" value={f.whatsappSuporte ?? ""} onChange={muda("whatsappSuporte")} />
            </Campo>
            <Campo rotulo="Frase do painel" className="sm:col-span-2">
              <input className={classeInput} value={f.frase} onChange={muda("frase")} />
            </Campo>
            <Campo rotulo="Frase em destaque" className="sm:col-span-2">
              <input className={classeInput} value={f.fraseDestaque} onChange={muda("fraseDestaque")} />
            </Campo>
          </div>
        </Card>

        <Card>
          <TituloCard icone={ShieldCheck} acao={<BotaoGuia id="permissoes" rotulo="Permissões no Telegram" />}>
            Regras de acesso
          </TituloCard>
          <Campo
            rotulo="Tolerância de atraso (dias)"
            className="mt-4 max-w-[240px]"
            dica="Quantos dias depois do vencimento a pessoa ainda fica nos grupos. Passou disso, sai (o robô tira sozinho no Telegram)."
          >
            <input
              type="number"
              min={0}
              max={60}
              className={classeInput}
              value={f.toleranciaDias}
              onChange={(e) => setF((v) => ({ ...v, toleranciaDias: Number(e.target.value) }))}
            />
          </Campo>
          <div className="mt-4">
            <Interruptor
              ligado={f.atrasadoSomenteLeitura}
              aoMudar={(atrasadoSomenteLeitura) => {
                setOk(false);
                setF((v) => ({ ...v, atrasadoSomenteLeitura }));
              }}
              titulo="Atrasado só lê (Telegram)"
              descricao="Enquanto está atrasado (dentro da tolerância), o membro continua no grupo mas não pode escrever. Pagou, o robô libera sozinho. Só em grupos do Telegram com o robô."
            />
          </div>
          <div className="mt-5">
            <TituloCard icone={QrCode} acao={<BotaoGuia id="pix" />}>
              Pix
            </TituloCard>
            <p className="mt-1 text-[12.5px] text-gv-muted">
              Com a chave preenchida, a área do membro mostra o QR Code e o "copia e cola" de cada cobrança, com o valor certo. O
              dinheiro cai direto na sua conta; depois você confirma o recebimento no painel.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Chave Pix" className="sm:col-span-2" dica="E-mail, CPF/CNPJ, telefone (+5511999999999) ou chave aleatória.">
                <input className={classeInput} value={f.chavePix ?? ""} onChange={muda("chavePix")} />
              </Campo>
              <Campo rotulo="Nome de quem recebe">
                <input className={classeInput} value={f.nomeRecebedor ?? ""} onChange={muda("nomeRecebedor")} />
              </Campo>
              <Campo rotulo="Cidade">
                <input className={classeInput} value={f.cidadeRecebedor ?? ""} onChange={muda("cidadeRecebedor")} />
              </Campo>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <TituloCard icone={Globe} acao={<BotaoGuia id="pagina" />}>
            Página de vendas
          </TituloCard>
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{c.paginaVendas}</span>
            <BotaoCopiar texto={c.paginaVendas} rotulo="Copiar link" />
            <a href={c.paginaVendas} target="_blank" rel="noreferrer">
              <Botao pequeno>Abrir</Botao>
            </a>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <Campo rotulo="Endereço da página" className="min-w-[240px] flex-1" dica={`${c.enderecoPublico}/g/ + este nome (letras minúsculas, números e hífen).`}>
              <input className={classeInput} value={f.slug} onChange={muda("slug")} />
            </Campo>
            <Link to="/grupo-vip/pagina" className={classeBotao("primario")}>
              <Palette className="size-4" /> Personalizar a página
            </Link>
          </div>
          <p className="mt-2 text-[12.5px] text-gv-muted">
            Textos, fotos, cores, benefícios, depoimentos, vídeo e a ordem das partes da página ficam em <b>Página de vendas</b>.
          </p>
        </Card>

        <Card className="xl:col-span-2">
          <TituloCard icone={Bot} acao={<BotaoGuia id="robo" rotulo="Passo a passo" />}>
            Robô do Telegram
          </TituloCard>
          {c.robo.conectado ? (
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-3 py-2.5">
                <CircleCheck className="size-5 text-emerald-300" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-semibold text-white">Conectado: @{c.robo.usuario}</div>
                  <div className="text-[12.5px] text-gv-muted">
                    {c.robo.erro
                      ? `Problema: ${c.robo.erro}`
                      : c.robo.ultimaConsulta
                        ? `Funcionando · última conversa com o Telegram ${haQuanto(c.robo.ultimaConsulta)}`
                        : "Conectando..."}
                  </div>
                </div>
                <Botao
                  pequeno
                  variante="perigo"
                  carregando={carregando === "desconectar"}
                  onClick={() =>
                    executar("desconectar", async () => {
                      if (!confirm("Desconectar o robô? Os grupos do Telegram voltam para o modo manual.")) return;
                      atualizar(await apiConfig.desconectarRobo());
                    })
                  }
                >
                  <Unplug className="size-3.5" /> Desconectar
                </Botao>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300">Grupos em que o robô está</div>
                {c.detectados.length === 0 ? (
                  <p className="mt-1 text-[12.5px] text-gv-muted">
                    Nenhum ainda. Adicione o robô como administrador do grupo e mande uma mensagem no grupo (ex.: /id).
                  </p>
                ) : (
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {c.detectados.map((g) => (
                      <li key={g.chatId} className="flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="text-slate-100">{g.titulo}</span>
                        <code className="text-gv-muted">{g.chatId}</code>
                        <BotaoCopiar texto={g.chatId} rotulo="Copiar ID" />
                        {!g.administrador && <span className="text-amber-300">o robô ainda não é administrador</span>}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-gv-muted">
                  Depois, em Grupos e planos, abra o grupo e informe o ID.
                  <BotaoGuia id="robo-admin" rotulo="Como colocar o robô como administrador?" />
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[13px] text-slate-300">
                <li>
                  No Telegram, abra o{" "}
                  <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-300 underline">
                    @BotFather
                  </a>{" "}
                  e mande <code>/newbot</code>.
                </li>
                <li>Escolha um nome e um usuário para o robô (terminando em "bot").</li>
                <li>O BotFather manda um <b>token</b> (parece 123456789:AAE...). Copie e cole aqui ao lado.</li>
                <li>Adicione o robô em cada grupo do Telegram como <b>administrador</b>, com permissão de convidar e banir.</li>
                <li>Mande <code>/id</code> no grupo e informe o número em Grupos e planos.</li>
              </ol>
              <div className="flex flex-col gap-3">
                <Campo rotulo="Token do robô" dica="Fica guardado só no servidor; ninguém vê depois.">
                  <input className={classeInput} value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456789:AAE..." />
                </Campo>
                <Botao
                  variante="telegram"
                  disabled={!token.trim()}
                  carregando={carregando === "conectar"}
                  onClick={() =>
                    executar("conectar", async () => {
                      atualizar(await apiConfig.conectarRobo(token));
                      setToken("");
                    })
                  }
                >
                  <Bot className="size-4" /> Conectar robô
                </Botao>
              </div>
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <TituloCard
            icone={Ticket}
            acao={
              <span className="flex items-center gap-3">
                <BotaoGuia id="cupom" />
                <Botao pequeno variante="primario" onClick={() => setCupom("novo")}>
                  <Plus className="size-3.5" /> Novo cupom
                </Botao>
              </span>
            }
          >
            Cupons de desconto
          </TituloCard>
          <p className="mt-1 text-[12.5px] text-gv-muted">O desconto vale para o primeiro pagamento, na página de vendas.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {c.cupons.map((cp) => {
              const expirado = cp.validade !== null && cp.validade < new Date().toISOString().slice(0, 10);
              return (
                <div key={cp.id} className={`flex items-center gap-3 rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2.5 ${cp.ativo && !expirado ? "" : "opacity-60"}`}>
                  <Ticket className="size-5 shrink-0 text-orange-300" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-semibold text-white">{cp.codigo}</div>
                    <div className="text-[12px] text-gv-muted">
                      {cp.tipo === "percentual" ? `${cp.valor}% off` : `${formatar.moeda(cp.valor)} off`} · {cp.usos}
                      {cp.limiteUsos ? `/${cp.limiteUsos}` : ""} usos
                      {cp.validade && ` · até ${formatar.data(cp.validade)}`}
                      {!cp.ativo ? " · desativado" : expirado ? " · expirado" : ""}
                    </div>
                  </div>
                  <button type="button" aria-label="Editar" onClick={() => setCupom(cp)} className="rounded-lg p-2 text-gv-muted hover:bg-white/5 hover:text-white">
                    <Pencil className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Dica icone={Save} cor="amber">
        Lembre de tocar em <b>Salvar</b> (no alto da tela) depois de mudar os dados, o endereço da página, as regras ou o Pix.
      </Dica>

      {cupom && (
        <ModalCupom
          cupom={cupom === "novo" ? null : cupom}
          aoFechar={() => setCupom(null)}
          aoSalvar={(n) => {
            setCupom(null);
            setC(n);
          }}
        />
      )}
    </div>
  );
}

function ModalCupom({ cupom, aoFechar, aoSalvar }: { cupom: Cupom | null; aoFechar: () => void; aoSalvar: (c: Configuracoes) => void }) {
  const [f, setF] = useState<DadosCupom>({
    codigo: cupom?.codigo ?? "",
    tipo: cupom?.tipo ?? "percentual",
    valor: cupom?.valor ?? 10,
    validade: cupom?.validade ?? null,
    limiteUsos: cupom?.limiteUsos ?? null,
    ativo: cupom?.ativo ?? true,
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  return (
    <Modal titulo={cupom ? "Editar cupom" : "Novo cupom"} aoFechar={aoFechar} largura="max-w-md">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Código" className="sm:col-span-2">
          <input autoFocus className={`${classeInput} font-mono uppercase`} value={f.codigo} onChange={(e) => setF((v) => ({ ...v, codigo: e.target.value }))} />
        </Campo>
        <Campo rotulo="Tipo">
          <select className={classeInput} value={f.tipo} onChange={(e) => setF((v) => ({ ...v, tipo: e.target.value as DadosCupom["tipo"] }))}>
            <option value="percentual">Porcentagem (%)</option>
            <option value="valor">Valor (R$)</option>
          </select>
        </Campo>
        <Campo rotulo={f.tipo === "percentual" ? "Desconto (%)" : "Desconto (R$)"}>
          <input type="number" min={0} step="0.01" className={classeInput} value={f.valor} onChange={(e) => setF((v) => ({ ...v, valor: Number(e.target.value) }))} />
        </Campo>
        <Campo rotulo="Vale até (opcional)">
          <input type="date" className={classeInput} value={f.validade ?? ""} onChange={(e) => setF((v) => ({ ...v, validade: e.target.value || null }))} />
        </Campo>
        <Campo rotulo="Limite de usos (opcional)">
          <input
            type="number"
            min={1}
            className={classeInput}
            value={f.limiteUsos ?? ""}
            onChange={(e) => setF((v) => ({ ...v, limiteUsos: e.target.value ? Number(e.target.value) : null }))}
          />
        </Campo>
        <div className="sm:col-span-2">
          <Interruptor ligado={f.ativo} aoMudar={(ativo) => setF((v) => ({ ...v, ativo }))} titulo="Cupom ativo" />
        </div>
      </div>
      <div className="mt-3">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-2">
        {cupom ? (
          <Botao
            variante="perigo"
            onClick={async () => {
              try {
                aoSalvar(await apiConfig.excluirCupom(cupom.id));
              } catch (e) {
                setErro(mensagemDe(e));
              }
            }}
          >
            <Trash2 className="size-4" />
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
                aoSalvar(cupom ? await apiConfig.atualizarCupom(cupom.id, f) : await apiConfig.criarCupom(f));
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
      </div>
    </Modal>
  );
}
