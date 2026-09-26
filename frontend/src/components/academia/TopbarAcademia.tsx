import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, ChevronRight, CircleQuestionMark, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DashboardAcademia } from "../../lib/academia";
import { MarcaCircular } from "./Marcas";
import { destinoAlerta, estiloAlerta } from "./Paineis";
import { Modal } from "./formulario";

type Props = {
  nomeAcademia: string;
  alertas: DashboardAcademia["alertas"];
  demo: boolean;
  aoAlternarMenu: () => void;
};

export function TopbarAcademia({ nomeAcademia, alertas, demo, aoAlternarMenu }: Props) {
  const navigate = useNavigate();
  const [avisosAbertos, setAvisosAbertos] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  // Fecha a lista de avisos ao clicar fora dela.
  useEffect(() => {
    if (!avisosAbertos) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAvisosAbertos(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [avisosAbertos]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-ac-line bg-ac-bg/85 px-4 backdrop-blur md:px-6 print:hidden">
      <button
        type="button"
        onClick={aoAlternarMenu}
        aria-label="Abrir ou recolher menu"
        className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <Menu className="size-5" />
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const busca = new FormData(e.currentTarget).get("busca")?.toString().trim();
          navigate({ to: "/academia/alunos", search: busca ? { busca } : {} });
        }}
        className="hidden h-10 w-full max-w-[300px] items-center gap-2.5 rounded-xl border border-ac-line bg-ac-card px-3 text-sm focus-within:border-violet-500/60 sm:flex"
      >
        <Search className="size-4 text-ac-muted" />
        <input
          type="search"
          name="busca"
          placeholder="Buscar alunos (Enter)"
          className="w-full bg-transparent text-slate-200 outline-none placeholder:text-ac-muted"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        {demo && (
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[11px] font-bold text-white">DEMO</span>
            <span className="text-xs text-ac-muted">Dados demonstrativos</span>
          </div>
        )}

        <div ref={caixa} className="relative">
          <button
            type="button"
            aria-label="Avisos"
            aria-expanded={avisosAbertos}
            onClick={() => setAvisosAbertos((v) => !v)}
            className="relative rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Bell className="size-5" />
            {alertas.length > 0 && (
              <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {alertas.length}
              </span>
            )}
          </button>
          {avisosAbertos && (
            <div className="absolute top-12 right-0 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-ac-line bg-ac-card p-2 shadow-2xl">
              <div className="px-2 pt-1 pb-2 text-sm font-semibold text-white">Requer atenção</div>
              {alertas.length === 0 && <p className="px-2 pb-3 text-sm text-emerald-300">Tudo em dia por aqui.</p>}
              <ul className="flex flex-col">
                {alertas.map((a) => {
                  const { icone: Icone, cor } = estiloAlerta[a.tipo];
                  return (
                    <li key={a.tipo}>
                      <Link
                        {...destinoAlerta[a.tipo]}
                        onClick={() => setAvisosAbertos(false)}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]"
                      >
                        <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${cor}`}>
                          <Icone className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1 leading-snug">
                          <div className="text-[13px] font-medium text-white">{a.titulo}</div>
                          <div className="truncate text-[11.5px] text-ac-muted">{a.descricao}</div>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-ac-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Ajuda"
          onClick={() => setAjuda(true)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <CircleQuestionMark className="size-5" />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-ac-line md:block" />

        <Link
          to="/academia/configuracoes"
          className="hidden items-center gap-1.5 text-sm font-medium text-slate-200 hover:text-white md:flex"
        >
          {nomeAcademia}
          <ChevronDown className="size-4 text-ac-muted" />
        </Link>

        <MarcaCircular />
      </div>

      {ajuda && <ModalAjuda aoFechar={() => setAjuda(false)} />}
    </header>
  );
}

const guia: [string, string][] = [
  ["Alunos", "Cadastro, matrícula, mensalidades, ficha de treino, avaliação e frequência de cada aluno."],
  ["Check-in", "A recepção registra a entrada. Quem está em atraso ou sem matrícula é avisado na hora."],
  ["Controle de acesso", "Regras da catraca (tolerância de atraso, horário), bloqueios e dispositivos."],
  ["Treinos e Exercícios", "Fichas por aluno, modelos prontos e a biblioteca de exercícios com vídeo."],
  ["Avaliação física", "Peso, medidas, % de gordura e a evolução. Avisa quando a reavaliação vence."],
  ["Aulas e turmas / Agenda", "Grade de aulas com lotação e chamada; horários marcados com os profissionais."],
  ["Faturamento", "Mensalidades, serviços, despesas e o resultado do mês (lucro ou prejuízo)."],
  ["Comissão e Benefícios", "Comissão dos profissionais e das indicações; vantagens que o aluno resgata no app."],
  ["Relatórios", "Entradas e saídas de alunos, quem sumiu, inadimplência, aulas e profissionais."],
];

function ModalAjuda({ aoFechar }: { aoFechar: () => void }) {
  return (
    <Modal titulo="Como usar o Gestão Plus Academia" aoFechar={aoFechar} largura="max-w-xl">
      <ul className="flex flex-col gap-3">
        {guia.map(([titulo, texto]) => (
          <li key={titulo} className="rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5">
            <div className="text-sm font-semibold text-white">{titulo}</div>
            <p className="mt-0.5 text-xs leading-relaxed text-ac-muted">{texto}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-ac-muted">
        Tudo o que é recebido aqui entra no Cliente Plus como pagamento confirmado e gera as comissões de indicação.
      </p>
    </Modal>
  );
}
