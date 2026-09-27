import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Banknote, Check, CircleDollarSign, Download, Network, Trophy, X } from "lucide-react";
import { useState } from "react";
import { Botao, BotaoCopiar, Campo, classeInput, MensagemErro, Modal, mensagemDe, useAcao } from "../../components/grupo-vip/formulario";
import { Avatar } from "../../components/grupo-vip/Selos";
import { Abas, CabecalhoPagina, Card, CardNumero, cabecalhoTabela, Dica, TituloCard, Vazio } from "../../components/grupo-vip/ui";
import { baixarCsv, formatar } from "../../lib/grupo-vip";
import { apiFinanceiro, type Saque, type Saques } from "../../lib/grupo-vip-financeiro";

// Saques de comissão pedidos pelos membros e o ranking de quem mais indica.
// SIMULAÇÃO do Cliente Plus: no projeto principal, isto é o menu "Saques".
export const Route = createFileRoute("/grupo-vip/saques")({
  loader: () => apiFinanceiro.saques(),
  component: PaginaSaques,
});

const selo: Record<Saque["status"], string> = {
  solicitado: "bg-amber-500/15 text-amber-300",
  pago: "bg-emerald-500/15 text-emerald-300",
  recusado: "bg-red-500/15 text-red-300",
};

function PaginaSaques() {
  const router = useRouter();
  const [d, setD] = useState<Saques>(Route.useLoaderData());
  const [aba, setAba] = useState<"saques" | "ranking" | "comissoes">("saques");
  const [recusar, setRecusar] = useState<Saque | null>(null);
  const { carregando, erro, executar } = useAcao();

  const atualizar = (novo: Saques) => {
    setD(novo);
    router.invalidate();
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Saques e indicações"
        descricao={`Cada membro tem um link de indicação. Quem indica ganha ${d.percentuais[0]}% (nível 1), ${d.percentuais[1]}% (nível 2) e ${d.percentuais[2]}% (nível 3) de cada pagamento, enquanto o indicado continuar pagando.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <CardNumero icone={Banknote} cor="from-amber-400 to-orange-600" rotulo="Saques para pagar" valor={formatar.moeda(d.aPagar)} />
        <CardNumero icone={Check} cor="from-emerald-400 to-green-600" rotulo="Pago em saques no mês" valor={formatar.moeda(d.pagoMes)} />
        <CardNumero icone={CircleDollarSign} cor="from-violet-400 to-violet-600" rotulo="Comissões geradas no mês" valor={formatar.moeda(d.comissoesMes)} />
      </div>

      <MensagemErro texto={erro} />
      <Abas
        abas={[
          { valor: "saques" as const, rotulo: "Pedidos de saque", quantidade: d.saques.filter((s) => s.status === "solicitado").length },
          { valor: "ranking" as const, rotulo: "Quem mais indica", quantidade: d.indicadores.length },
          { valor: "comissoes" as const, rotulo: "Comissões recentes" },
        ]}
        valor={aba}
        aoMudar={setAba}
      />

      {aba === "saques" && (
        <Card className="!p-0">
          {d.saques.length === 0 ? (
            <Vazio icone={Banknote}>Nenhum pedido de saque.</Vazio>
          ) : (
            <ul className="divide-y divide-gv-line/70">
              {d.saques.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar nome={s.nome} />
                  <div className="min-w-[180px] flex-1">
                    <Link to="/grupo-vip/membros/$id" params={{ id: s.clienteId }} className="font-medium text-white hover:underline">
                      {s.nome}
                    </Link>
                    <div className="text-[12px] text-gv-muted">
                      Pedido {formatar.diaHora(s.createdAt)} · saldo disponível {formatar.moeda(s.saldoDisponivel)}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-300">
                      Pix: <span className="truncate">{s.chavePix}</span>
                      {s.status === "solicitado" && <BotaoCopiar texto={s.chavePix} />}
                    </div>
                    {s.motivo && <div className="text-[12px] text-red-300">Motivo: {s.motivo}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-poppins text-lg font-bold text-white">{formatar.moeda(s.valor)}</div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${selo[s.status]}`}>
                      {s.status === "solicitado" ? "Aguardando" : s.status === "pago" ? `Pago ${formatar.data(s.pagoEm)}` : "Recusado"}
                    </span>
                  </div>
                  {s.status === "solicitado" && (
                    <div className="flex gap-1.5">
                      <Botao
                        pequeno
                        variante="sucesso"
                        carregando={carregando === `pagar:${s.id}`}
                        onClick={() =>
                          executar(`pagar:${s.id}`, async () => {
                            if (!confirm(`Confirma que já fez o Pix de ${formatar.moeda(s.valor)} para ${s.nome}?`)) return;
                            atualizar(await apiFinanceiro.pagarSaque(s.id));
                          })
                        }
                      >
                        <Check className="size-3.5" /> Já paguei
                      </Botao>
                      <Botao pequeno variante="perigo" onClick={() => setRecusar(s)}>
                        <X className="size-3.5" /> Recusar
                      </Botao>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {aba === "ranking" && (
        <Card className="!p-0">
          <div className="flex items-center justify-between p-4 pb-2">
            <TituloCard icone={Trophy}>Quem mais indica</TituloCard>
            <Botao
              pequeno
              onClick={() =>
                baixarCsv(
                  "indicacoes",
                  ["Membro", "Indicados", "Indicados ativos", "Comissão do mês", "Comissão total", "Saldo"],
                  d.indicadores.map((i) => [i.nome, i.indicados, i.indicadosAtivos, i.comissaoMes, i.comissaoTotal, i.saldo]),
                )
              }
            >
              <Download className="size-3.5" /> Planilha
            </Botao>
          </div>
          {d.indicadores.length === 0 ? (
            <Vazio icone={Network}>Ninguém indicou ainda.</Vazio>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className={cabecalhoTabela}>
                    <th className="py-2.5 pr-3 pl-4 font-medium">#</th>
                    <th className="py-2.5 pr-3 font-medium">Membro</th>
                    <th className="py-2.5 pr-3 font-medium">Indicados</th>
                    <th className="py-2.5 pr-3 font-medium">Comissão do mês</th>
                    <th className="py-2.5 pr-3 font-medium">Total ganho</th>
                    <th className="py-2.5 pr-4 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gv-line/70">
                  {d.indicadores.map((i, n) => (
                    <tr key={i.clienteId}>
                      <td className="py-2.5 pr-3 pl-4 text-gv-muted">{n + 1}</td>
                      <td className="py-2.5 pr-3">
                        <Link to="/grupo-vip/membros/$id" params={{ id: i.clienteId }} className="text-slate-100 hover:underline">
                          {i.nome}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">
                        {i.indicados} <span className="text-gv-muted">({i.indicadosAtivos} ativos)</span>
                      </td>
                      <td className="py-2.5 pr-3 text-white">{formatar.moeda(i.comissaoMes)}</td>
                      <td className="py-2.5 pr-3 text-slate-300">{formatar.moeda(i.comissaoTotal)}</td>
                      <td className="py-2.5 pr-4 text-emerald-300">{formatar.moeda(Math.max(0, i.saldo))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {aba === "comissoes" && (
        <Card className="!p-0">
          {d.comissoesRecentes.length === 0 ? (
            <Vazio icone={CircleDollarSign}>Nenhuma comissão ainda.</Vazio>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className={cabecalhoTabela}>
                    <th className="py-2.5 pr-3 pl-4 font-medium">Data</th>
                    <th className="py-2.5 pr-3 font-medium">Quem ganhou</th>
                    <th className="py-2.5 pr-3 font-medium">Pagamento de</th>
                    <th className="py-2.5 pr-3 font-medium">Nível</th>
                    <th className="py-2.5 pr-4 font-medium">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gv-line/70">
                  {d.comissoesRecentes.map((c, i) => (
                    <tr key={i}>
                      <td className="py-2.5 pr-3 pl-4 text-slate-300">{formatar.data(c.data)}</td>
                      <td className="py-2.5 pr-3 text-slate-100">{c.beneficiario}</td>
                      <td className="py-2.5 pr-3 text-slate-300">
                        {c.pagador} <span className="text-gv-muted">({formatar.moeda(c.valorPagamento)})</span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">
                        {c.nivel} · {c.percentual}%
                      </td>
                      <td className="py-2.5 pr-4 text-emerald-300">{formatar.moeda(c.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Dica icone={Network}>
        Simulação do motor de comissões do Cliente Plus. No projeto principal estes números vêm do próprio Cliente Plus
        (menus Saques e Árvore de Indicações).
      </Dica>

      {recusar && <ModalRecusar saque={recusar} aoFechar={() => setRecusar(null)} aoSalvar={(n) => { setRecusar(null); atualizar(n); }} />}
    </div>
  );
}

function ModalRecusar({ saque, aoFechar, aoSalvar }: { saque: Saque; aoFechar: () => void; aoSalvar: (d: Saques) => void }) {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  return (
    <Modal titulo="Recusar saque" subtitulo={`${saque.nome} · ${formatar.moeda(saque.valor)}`} aoFechar={aoFechar} largura="max-w-md">
      <Campo rotulo="Motivo (o membro vê na área dele)">
        <input autoFocus className={classeInput} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Campo>
      <div className="mt-3">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Botao onClick={aoFechar}>Voltar</Botao>
        <Botao
          variante="perigo"
          carregando={salvando}
          onClick={async () => {
            setSalvando(true);
            try {
              aoSalvar(await apiFinanceiro.recusarSaque(saque.id, motivo));
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          Recusar
        </Botao>
      </div>
    </Modal>
  );
}
