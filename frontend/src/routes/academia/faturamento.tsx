import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CircleAlert, CircleCheck, Clock, Search, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { ModalReceber } from "../../components/academia/ModalReceber";
import { TabelaCobrancas } from "../../components/academia/TabelaCobrancas";
import { classeInput } from "../../components/academia/formulario";
import { Card } from "../../components/academia/ui";
import { apiAlunos, fmt, type Cobranca } from "../../lib/academia-alunos";

type Aba = "a_receber" | "atrasadas" | "pagas" | "todas";

// Mensalidades dos alunos (pagamentos do Cliente Plus).
export const Route = createFileRoute("/academia/faturamento")({
  loader: apiAlunos.faturamento,
  component: PaginaFaturamento,
});

const abas: { aba: Aba; rotulo: string }[] = [
  { aba: "a_receber", rotulo: "A receber" },
  { aba: "atrasadas", rotulo: "Em atraso" },
  { aba: "pagas", rotulo: "Pagas" },
  { aba: "todas", rotulo: "Todas" },
];

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Mais urgente primeiro nas abas em aberto; mais recente primeiro nas pagas.
function daAba(cobrancas: Cobranca[], aba: Aba) {
  const porVencimento = (a: Cobranca, b: Cobranca) => a.vencimento.localeCompare(b.vencimento);
  switch (aba) {
    case "a_receber":
      return cobrancas.filter((c) => c.status === "pendente").sort(porVencimento);
    case "atrasadas":
      return cobrancas.filter((c) => c.status === "atrasada").sort(porVencimento);
    case "pagas":
      return cobrancas
        .filter((c) => c.status === "paga")
        .sort((a, b) => (b.pagoEm ?? "").localeCompare(a.pagoEm ?? ""));
    case "todas":
      return cobrancas;
  }
}

function PaginaFaturamento() {
  const { resumo, cobrancas } = Route.useLoaderData();
  const router = useRouter();
  const [aba, setAba] = useState<Aba>(resumo.qtdEmAtraso > 0 ? "atrasadas" : "a_receber");
  const [busca, setBusca] = useState("");
  const [receber, setReceber] = useState<Cobranca | null>(null);

  const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return daAba(cobrancas, aba).filter((c) => !termo || normalizar(c.aluno).includes(termo));
  }, [cobrancas, aba, busca]);

  const quantos = (a: Aba) => daAba(cobrancas, a).length;

  return (
    <div className="flex flex-col gap-5 py-4">
      <div>
        <h1 className="font-poppins text-[28px] font-bold text-white">Faturamento</h1>
        <p className="mt-1 text-sm text-ac-muted">
          Mensalidades dos alunos. Cada pagamento confirmado aqui gera as comissões de indicação no Cliente Plus.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CardResumo
          icone={CircleCheck}
          cor="bg-emerald-500/15 text-emerald-300"
          rotulo={`Recebido em ${mes}`}
          valor={resumo.recebidoMes}
          detalhe={`${resumo.qtdRecebidoMes} mensalidades pagas`}
          aoClicar={() => setAba("pagas")}
        />
        <CardResumo
          icone={Clock}
          cor="bg-sky-500/15 text-sky-300"
          rotulo={`A receber em ${mes}`}
          valor={resumo.aReceberMes}
          detalhe={`${resumo.qtdAReceberMes} mensalidades a vencer`}
          aoClicar={() => setAba("a_receber")}
        />
        <CardResumo
          icone={CircleAlert}
          cor="bg-red-500/15 text-red-300"
          rotulo="Em atraso"
          valor={resumo.emAtraso}
          detalhe={`${resumo.qtdEmAtraso} mensalidades atrasadas`}
          aoClicar={() => setAba("atrasadas")}
        />
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-ac-line p-4">
          <div className="flex flex-wrap gap-1.5">
            {abas.map((a) => (
              <button
                key={a.aba}
                type="button"
                onClick={() => setAba(a.aba)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  aba === a.aba
                    ? "bg-violet-600/25 text-white ring-1 ring-violet-500/60"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {a.rotulo}
                <span className="ml-1.5 text-xs text-ac-muted">{quantos(a.aba)}</span>
              </button>
            ))}
          </div>
          <label className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno"
              className={`${classeInput} pl-9`}
            />
          </label>
        </div>
        <div className="px-5 pb-2">
          <TabelaCobrancas cobrancas={lista} mostrarAluno aoReceber={setReceber} />
        </div>
      </Card>

      {receber && (
        <ModalReceber
          cobranca={receber}
          aoFechar={() => setReceber(null)}
          aoReceber={async () => {
            await router.invalidate();
            setReceber(null);
          }}
        />
      )}
    </div>
  );
}

function CardResumo({
  icone: Icone,
  cor,
  rotulo,
  valor,
  detalhe,
  aoClicar,
}: {
  icone: LucideIcon;
  cor: string;
  rotulo: string;
  valor: number;
  detalhe: string;
  aoClicar: () => void;
}) {
  return (
    <button type="button" onClick={aoClicar} className="text-left">
      <Card className="!p-4 transition-colors hover:border-violet-500/50">
        <div className="flex items-center gap-3">
          <span className={`grid size-9 place-items-center rounded-full ${cor}`}>
            <Icone className="size-[18px]" />
          </span>
          <span className="text-[13px] text-slate-300">{rotulo}</span>
        </div>
        <div className="mt-3 font-poppins text-[26px] font-bold text-white">{fmt.moeda(valor)}</div>
        <div className="mt-0.5 text-[11.5px] text-ac-muted">{detalhe}</div>
      </Card>
    </button>
  );
}
