import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronRight, Download, Search, Send, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Botao, classeInput } from "../../../components/grupo-vip/formulario";
import { ModalMembro } from "../../../components/grupo-vip/ModaisMembro";
import { Avatar, SeloSituacao } from "../../../components/grupo-vip/Selos";
import { Abas, CabecalhoPagina, Card, cabecalhoTabela, Vazio } from "../../../components/grupo-vip/ui";
import {
  baixarCsv,
  formatar,
  normalizar,
  prazo,
  rotuloSituacao,
  type Situacao,
} from "../../../lib/grupo-vip";
import { apiMembros } from "../../../lib/grupo-vip-membros";

type Filtro = "todos" | Situacao;
type Busca = { busca?: string; filtro?: Filtro; novo?: boolean };

const filtros: { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "em_dia", rotulo: "Em dia" },
  { valor: "vencendo", rotulo: "Vencem em breve" },
  { valor: "atrasado", rotulo: "Atrasados" },
  { valor: "bloqueado", rotulo: "Bloqueados" },
  { valor: "aguardando_pagamento", rotulo: "Aguardando pagamento" },
  { valor: "cancelando", rotulo: "Cancelaram" },
  { valor: "sem_plano", rotulo: "Sem acesso" },
];

// Membros = clientes do lojista no Cliente Plus.
export const Route = createFileRoute("/grupo-vip/membros/")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    busca: typeof s.busca === "string" && s.busca ? s.busca : undefined,
    filtro: filtros.some((f) => f.valor === s.filtro) ? (s.filtro as Filtro) : undefined,
    novo: s.novo === true || s.novo === "true" ? true : undefined,
  }),
  loader: () => apiMembros.listar(),
  component: PaginaMembros,
});

function PaginaMembros() {
  const lista = Route.useLoaderData();
  const inicial = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const [busca, setBusca] = useState(inicial.busca ?? "");
  const [filtro, setFiltro] = useState<Filtro>(inicial.filtro ?? "todos");
  const [novoAberto, setNovoAberto] = useState(!!inicial.novo);

  useEffect(() => {
    if (inicial.busca !== undefined) setBusca(inicial.busca);
  }, [inicial.busca]);

  const membros = useMemo(() => {
    const termo = normalizar(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    return lista.membros.filter(
      (m) =>
        (filtro === "todos" || m.situacao === filtro) &&
        (!termo ||
          normalizar(m.nome).includes(termo) ||
          normalizar(m.email ?? "").includes(termo) ||
          normalizar(m.telegramUsuario ?? "").includes(termo) ||
          (digitos.length >= 3 && (m.telefone ?? "").includes(digitos))),
    );
  }, [lista, busca, filtro]);

  const fecharNovo = () => {
    setNovoAberto(false);
    if (inicial.novo) navigate({ to: "/grupo-vip/membros", search: {}, replace: true });
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Membros"
        descricao={`${lista.contagem.todos} cadastrados · ${
          lista.contagem.em_dia + lista.contagem.vencendo + lista.contagem.atrasado + lista.contagem.cancelando
        } com acesso aos grupos`}
      >
        <Botao
          onClick={() =>
            baixarCsv(
              "membros",
              ["Nome", "WhatsApp", "E-mail", "Telegram", "Plano", "Situação", "Próximo vencimento", "Pago até", "Indicado por"],
              membros.map((m) => [
                m.nome,
                m.telefone,
                m.email,
                m.telegramUsuario,
                m.plano,
                rotuloSituacao[m.situacao],
                formatar.data(m.proximoVencimento),
                formatar.data(m.pagoAte),
                m.indicadoPor,
              ]),
            )
          }
        >
          <Download className="size-4" /> Planilha
        </Botao>
        <Botao variante="primario" onClick={() => setNovoAberto(true)}>
          <UserPlus className="size-4" /> Novo membro
        </Botao>
      </CabecalhoPagina>

      <Card className="!p-0">
        <div className="flex flex-col gap-3 border-b border-gv-line p-4">
          <label className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gv-muted" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, WhatsApp, e-mail ou Telegram"
              className={`${classeInput} pl-9`}
            />
          </label>
          <Abas
            abas={filtros.map((f) => ({ valor: f.valor, rotulo: f.rotulo, quantidade: lista.contagem[f.valor] }))}
            valor={filtro}
            aoMudar={setFiltro}
          />
        </div>

        {membros.length === 0 ? (
          <Vazio icone={Users}>Nenhum membro encontrado.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead>
                <tr className={cabecalhoTabela}>
                  <th className="py-2.5 pr-3 pl-5 font-medium">Membro</th>
                  <th className="py-2.5 pr-3 font-medium">Contato</th>
                  <th className="py-2.5 pr-3 font-medium">Plano</th>
                  <th className="py-2.5 pr-3 font-medium">Próximo vencimento</th>
                  <th className="py-2.5 pr-3 font-medium">Grupos</th>
                  <th className="py-2.5 pr-3 font-medium">Situação</th>
                  <th className="py-2.5 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gv-line/70">
                {membros.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => navigate({ to: "/grupo-vip/membros/$id", params: { id: m.id } })}
                    className="cursor-pointer hover:bg-white/[0.03]"
                  >
                    <td className="py-3 pr-3 pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar nome={m.nome} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">{m.nome}</div>
                          <div className="truncate text-[11.5px] text-gv-muted">
                            {m.indicadoPor ? `indicado por ${m.indicadoPor}` : m.origem === "pagina" ? "veio pela página de vendas" : "cadastro manual"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-slate-300">
                      <div>{formatar.telefone(m.telefone)}</div>
                      {m.telegramUsuario && (
                        <div className="flex items-center gap-1 text-[11.5px] text-sky-300">
                          <Send className="size-3" />@{m.telegramUsuario}
                          {m.telegramConectado && <span className="text-emerald-300">· conectado</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-300">{m.plano ?? <span className="text-gv-muted">—</span>}</td>
                    <td className="py-3 pr-3">
                      {m.proximoVencimento ? (
                        <>
                          <div className="text-slate-200">{formatar.data(m.proximoVencimento)}</div>
                          <div className={`text-[11px] ${m.diasAtraso > 0 ? "text-red-400" : "text-gv-muted"}`}>
                            {prazo(m.proximoVencimento)}
                          </div>
                        </>
                      ) : m.pagoAte ? (
                        <div className="text-[12px] text-gv-muted">pago até {formatar.data(m.pagoAte)}</div>
                      ) : (
                        <span className="text-gv-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <span
                        className={
                          m.gruposDentro < m.gruposComDireito
                            ? "text-emerald-300"
                            : m.gruposDentro > m.gruposComDireito
                              ? "text-red-300"
                              : "text-slate-300"
                        }
                      >
                        {m.gruposDentro} de {m.gruposComDireito}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <SeloSituacao situacao={m.situacao} />
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <ChevronRight className="ml-auto size-4 text-gv-muted" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {novoAberto && (
        <ModalMembro
          planos={lista.planos}
          aoFechar={fecharNovo}
          aoSalvar={(m) => {
            router.invalidate();
            navigate({ to: "/grupo-vip/membros/$id", params: { id: m.id } });
          }}
        />
      )}
    </div>
  );
}
