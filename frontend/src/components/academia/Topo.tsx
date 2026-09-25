import { Link, type LinkProps } from "@tanstack/react-router";
import {
  BadgeAlert,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  CreditCard,
  DollarSign,
  Dumbbell,
  FilePlus,
  QrCode,
  Radio,
  SquarePen,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { dataPorExtenso, formatar, type DashboardAcademia } from "../../lib/academia";
import { Card, Variacao } from "./ui";

type Indicadores = DashboardAcademia["indicadores"];

export function Saudacao({ nome, frase }: { nome: string; frase: string }) {
  return (
    <div className="relative min-h-[104px] overflow-hidden">
      <img
        src="/academia/hero.jpg"
        alt=""
        className="pointer-events-none absolute top-0 right-0 hidden h-full w-[320px] object-cover object-[center_30%] brightness-[1.7] contrast-110 md:block [mask-image:linear-gradient(to_right,transparent,black_30%,black_85%,transparent)]"
      />
      <div className="relative py-3">
        <h1 className="font-poppins text-[32px] font-bold text-white">Olá, {nome}</h1>
        <p className="mt-1 text-[15px] text-slate-300">Aqui está o desempenho da sua academia hoje.</p>
      </div>
      <p className="absolute top-5 right-[270px] hidden text-right font-poppins text-[17px] leading-snug whitespace-pre-line text-slate-200 italic lg:block">
        “{frase.replace(/, /, ",\n")}”
      </p>
    </div>
  );
}

type ConfigIndicador = {
  icone: LucideIcon;
  corIcone: string;
  rotulo: string;
  valor: string;
  variacao: number;
  melhorQuandoCai?: boolean;
  detalhe: string;
};

export function Indicadores({ dados }: { dados: Indicadores }) {
  const cards: ConfigIndicador[] = [
    {
      icone: UserRound,
      corIcone: "bg-violet-500/20 text-violet-300",
      rotulo: "Alunos ativos",
      valor: String(dados.alunosAtivos.valor),
      variacao: dados.alunosAtivos.variacao,
      detalhe: `+ ${dados.alunosAtivos.noUltimoMes} matrículas em 30 dias`,
    },
    {
      icone: SquarePen,
      corIcone: "bg-cyan-500/20 text-cyan-300",
      rotulo: "Matrículas no mês",
      valor: String(dados.matriculasMes.valor),
      variacao: dados.matriculasMes.variacao,
      detalhe: `Mês anterior: ${dados.matriculasMes.mesAnterior}`,
    },
    {
      icone: DollarSign,
      corIcone: "bg-emerald-500 text-white",
      rotulo: "Faturamento mensal",
      valor: formatar.moeda(dados.faturamentoMensal.valor),
      variacao: dados.faturamentoMensal.variacao,
      detalhe: `Mês anterior: ${formatar.moeda(dados.faturamentoMensal.mesAnterior)}`,
    },
    {
      icone: BadgeAlert,
      corIcone: "bg-red-500/20 text-red-400",
      rotulo: "Inadimplência",
      valor: formatar.percentual(dados.inadimplencia.valor),
      variacao: dados.inadimplencia.variacao,
      melhorQuandoCai: true,
      detalhe: `Mês anterior: ${formatar.percentual(dados.inadimplencia.mesAnterior)}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icone: Icone, ...c }) => (
        <Card key={c.rotulo} className="!p-4">
          <div className="flex items-center gap-3">
            <span className={`grid size-9 place-items-center rounded-full ${c.corIcone}`}>
              <Icone className="size-[18px]" />
            </span>
            <span className="text-[13px] whitespace-nowrap text-slate-300">{c.rotulo}</span>
          </div>
          <div className="mt-3 flex items-baseline justify-center gap-3">
            <span className="font-poppins text-[26px] font-bold text-white">{c.valor}</span>
            <Variacao valor={c.variacao} melhorQuandoCai={c.melhorQuandoCai} />
          </div>
          <div className="mt-1 text-center text-[11.5px] text-ac-muted">{c.detalhe}</div>
        </Card>
      ))}
    </div>
  );
}

type Acao = { rotulo: string; icone: LucideIcon; cor: string; link?: LinkProps };

const acoes: Acao[] = [
  {
    rotulo: "Novo aluno",
    icone: UserPlus,
    cor: "text-blue-400",
    link: { to: "/academia/alunos", search: { novo: true } },
  },
  { rotulo: "Check-in", icone: QrCode, cor: "text-blue-400" },
  {
    rotulo: "Nova matrícula",
    icone: FilePlus,
    cor: "text-blue-400",
    link: { to: "/academia/alunos", search: { filtro: "sem_matricula" } },
  },
  { rotulo: "Ficha de treino", icone: Dumbbell, cor: "text-violet-400", link: { to: "/academia/treinos" } },
  { rotulo: "Avaliação física", icone: ClipboardList, cor: "text-blue-400" },
  { rotulo: "Nova aula", icone: Users, cor: "text-violet-400" },
  { rotulo: "Cobrança", icone: CreditCard, cor: "text-teal-300", link: { to: "/academia/faturamento" } },
  { rotulo: "Relatório", icone: ChartColumn, cor: "text-violet-400" },
];

const classeAcao =
  "flex flex-col items-center justify-center gap-2 rounded-2xl border border-ac-line bg-gradient-to-b from-ac-card-2/70 to-ac-card px-2 py-3.5 text-center transition-colors hover:border-violet-500/50 hover:bg-ac-card-2";

// Atalhos do Dashboard. Os que têm "link" já abrem a tela correspondente.
export function AcoesRapidas() {
  return (
    <div className="grid grid-cols-4 gap-3 lg:grid-cols-8">
      {acoes.map(({ rotulo, icone: Icone, cor, link }) => {
        const conteudo = (
          <>
            <Icone className={`size-7 ${cor}`} strokeWidth={1.75} />
            <span className="text-[12px] leading-tight text-slate-200">{rotulo}</span>
          </>
        );
        return link ? (
          <Link key={rotulo} {...link} className={classeAcao}>
            {conteudo}
          </Link>
        ) : (
          <button key={rotulo} type="button" className={classeAcao}>
            {conteudo}
          </button>
        );
      })}
    </div>
  );
}

export function DataDeHoje() {
  return (
    <Card className="flex items-center gap-3 !py-3.5">
      <span className="grid size-9 place-items-center rounded-lg border border-ac-line text-slate-300">
        <CalendarDays className="size-[18px]" />
      </span>
      <span className="text-[13px] whitespace-nowrap text-slate-200">{dataPorExtenso()}</span>
    </Card>
  );
}

export function BannerMotivacional() {
  return (
    <div className="relative min-h-[140px] flex-1 overflow-hidden rounded-2xl border border-teal-500/30 bg-[#06221f]">
      <img
        src="/academia/banner.jpg"
        alt=""
        className="absolute inset-y-0 right-0 h-full w-[62%] object-cover object-[35%_center] opacity-90 [mask-image:linear-gradient(to_right,transparent,black_40%)]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-teal-900/70 via-teal-900/20 to-teal-500/10 mix-blend-multiply" />
      <div className="relative flex h-full flex-col justify-center p-4 font-impact leading-[0.95] tracking-wide text-teal-300 italic drop-shadow-[0_0_12px_rgba(45,212,191,0.45)]">
        <span className="text-[34px]">CORPO</span>
        <span className="text-[25px]">SAUDÁVEL</span>
        <span className="text-[19px]">MENTE MAIS FORTE</span>
      </div>
    </div>
  );
}

export function CheckinsHoje({ dados }: { dados: Indicadores["checkinsHoje"] }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-3">
        <Radio className="size-5 text-emerald-400" />
        <span className="text-[13px] text-slate-300">Check-ins hoje</span>
      </div>
      {dados ? (
        <>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="font-poppins text-[26px] font-bold text-white">{dados.valor}</span>
            <Variacao valor={dados.variacao} />
          </div>
          <div className="mt-1 text-[11.5px] text-ac-muted">Último check-in: {dados.ultimo}</div>
        </>
      ) : (
        <div className="mt-2">
          <span className="rounded-md bg-violet-600/25 px-2 py-0.5 text-[11px] font-semibold text-violet-200">
            Em breve
          </span>
          <p className="mt-2 text-[11.5px] text-ac-muted">Aparece aqui quando o Check-in for criado.</p>
        </div>
      )}
    </Card>
  );
}
