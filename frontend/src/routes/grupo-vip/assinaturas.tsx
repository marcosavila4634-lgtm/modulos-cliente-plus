import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { CalendarClock, Download, Repeat, Search, TrendingUp, UserMinus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Botao, classeInput } from "../../components/grupo-vip/formulario";
import { ModalReceber } from "../../components/grupo-vip/ModaisMembro";
import { SeloSituacao } from "../../components/grupo-vip/Selos";
import { Abas, CabecalhoPagina, Card, CardNumero, cabecalhoTabela, Vazio } from "../../components/grupo-vip/ui";
import { baixarCsv, formatar, normalizar, periodicidade, prazo, rotuloSituacao, type Situacao } from "../../lib/grupo-vip";
import { apiFinanceiro, type AssinaturaLinha } from "../../lib/grupo-vip-financeiro";

type Filtro = "ativas" | "atrasadas" | "aguardando" | "canceladas" | "todas";

// Assinaturas: quem assina qual plano, próximos vencimentos e atrasos.
export const Route = createFileRoute("/grupo-vip/assinaturas")({
  loader: () => apiFinanceiro.assinaturas(),
  component: PaginaAssinaturas,
});

const grupoFiltro: Record<Filtro, Situacao[] | null> = {
  ativas: ["em_dia", "vencendo", "atrasado", "cancelando"],
  atrasadas: ["atrasado", "bloqueado"],
  aguardando: ["aguardando_pagamento"],
  canceladas: ["cancelando", "sem_plano"],
  todas: null,
};

function PaginaAssinaturas() {
  const d = Route.useLoaderData();
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("ativas");
  const [termo, setTermo] = useState("");
  const [receber, setReceber] = useState<AssinaturaLinha | null>(null);

  const conta = (f: Filtro) => d.assinaturas.filter((a) => !grupoFiltro[f] || grupoFiltro[f]!.includes(a.situacao)).length;
  const lista = useMemo(() => {
    const t = normalizar(termo.trim());
    return d.assinaturas.filter(
      (a) =>
        (!grupoFiltro[filtro] || grupoFiltro[filtro]!.includes(a.situacao)) &&
        (!t || normalizar(a.nome).includes(t) || normalizar(a.plano).includes(t)),
    );
  }, [d, filtro, termo]);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina titulo="Assinaturas" descricao="Planos assinados pelos membros, próximos vencimentos e atrasos.">
        <Botao
          onClick={() =>
            baixarCsv(
              "assinaturas",
              ["Membro", "WhatsApp", "Plano", "Valor", "Início", "Situação", "Próximo vencimento", "Pago até"],
              lista.map((a) => [
                a.nome,
                a.telefone,
                a.plano,
                a.valor,
                formatar.data(a.inicio),
                rotuloSituacao[a.situacao],
                formatar.data(a.proximoVencimento),
                formatar.data(a.pagoAte),
              ]),
            )
          }
        >
          <Download className="size-4" /> Planilha
        </Botao>
      </CabecalhoPagina>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardNumero icone={Users} cor="from-blue-500 to-blue-700" rotulo="Assinaturas com acesso" valor={formatar.numero(d.ativas)} />
        <CardNumero
          icone={TrendingUp}
          cor="from-amber-400 to-orange-600"
          rotulo="Receita recorrente por mês"
          valor={formatar.moeda(d.receitaMensal)}
          detalhe="planos trimestrais/anuais divididos por mês"
        />
        <CardNumero icone={CalendarClock} cor="from-violet-400 to-violet-600" rotulo="A receber em 30 dias" valor={formatar.moeda(d.previsao30Dias)} detalhe="inclui as atrasadas" />
        <CardNumero icone={UserMinus} cor="from-red-400 to-red-600" rotulo="Cancelamentos no mês" valor={formatar.numero(d.canceladasMes)} />
      </div>

      <Card className="!p-0">
        <div className="flex flex-col gap-3 border-b border-gv-line p-4">
          <label className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gv-muted" />
            <input className={`${classeInput} pl-9`} type="search" placeholder="Buscar membro ou plano" value={termo} onChange={(e) => setTermo(e.target.value)} />
          </label>
          <Abas
            abas={[
              { valor: "ativas" as Filtro, rotulo: "Com acesso", quantidade: conta("ativas") },
              { valor: "atrasadas" as Filtro, rotulo: "Atrasadas", quantidade: conta("atrasadas") },
              { valor: "aguardando" as Filtro, rotulo: "Aguardando 1º pagamento", quantidade: conta("aguardando") },
              { valor: "canceladas" as Filtro, rotulo: "Canceladas", quantidade: conta("canceladas") },
              { valor: "todas" as Filtro, rotulo: "Todas", quantidade: conta("todas") },
            ]}
            valor={filtro}
            aoMudar={setFiltro}
          />
        </div>
        {lista.length === 0 ? (
          <Vazio icone={Repeat}>Nenhuma assinatura aqui.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className={cabecalhoTabela}>
                  <th className="py-2.5 pr-3 pl-4 font-medium">Membro</th>
                  <th className="py-2.5 pr-3 font-medium">Plano</th>
                  <th className="py-2.5 pr-3 font-medium">Desde</th>
                  <th className="py-2.5 pr-3 font-medium">Próximo vencimento</th>
                  <th className="py-2.5 pr-3 font-medium">Situação</th>
                  <th className="py-2.5 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gv-line/70">
                {lista.map((a) => (
                  <tr key={a.clienteId}>
                    <td className="py-2.5 pr-3 pl-4">
                      <Link to="/grupo-vip/membros/$id" params={{ id: a.clienteId }} className="font-medium text-slate-100 hover:underline">
                        {a.nome}
                      </Link>
                      <div className="text-[11.5px] text-gv-muted">{formatar.telefone(a.telefone)}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">
                      {a.plano}
                      <div className="text-[11.5px] text-gv-muted">
                        {formatar.moeda(a.valor)} {periodicidade(a.duracaoMeses)}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-slate-300">{formatar.data(a.inicio)}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {a.proximoVencimento ? (
                        <>
                          <div className="text-slate-200">{formatar.data(a.proximoVencimento)}</div>
                          <div className={`text-[11px] ${a.situacao === "atrasado" || a.situacao === "bloqueado" ? "text-red-400" : "text-gv-muted"}`}>
                            {prazo(a.proximoVencimento)}
                          </div>
                        </>
                      ) : (
                        <span className="text-[12px] text-gv-muted">{a.pagoAte ? `acesso até ${formatar.data(a.pagoAte)}` : "—"}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <SeloSituacao situacao={a.situacao} />
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      {a.proximaCobrancaId && (
                        <Botao pequeno variante="sucesso" onClick={() => setReceber(a)}>
                          Receber {a.proximoValor !== null ? formatar.moeda(a.proximoValor) : ""}
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

      {receber && receber.proximaCobrancaId && (
        <ModalReceber
          cobranca={{
            id: receber.proximaCobrancaId,
            nome: receber.nome,
            descricao: receber.plano,
            valor: receber.proximoValor ?? receber.valor,
            vencimento: receber.proximoVencimento ?? "",
          }}
          aoFechar={() => setReceber(null)}
          aoSalvar={() => {
            setReceber(null);
            router.invalidate();
          }}
        />
      )}
    </div>
  );
}
