import { iniciais, nomePlataforma, rotuloSituacao, type Plataforma, type Situacao } from "../../lib/grupo-vip";
import { rotuloCobranca, type StatusCobranca } from "../../lib/grupo-vip-membros";
import { IconePlataforma } from "./Marcas";

const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap";

export const coresSituacao: Record<Situacao, string> = {
  em_dia: "bg-emerald-500/15 text-emerald-300",
  vencendo: "bg-sky-500/15 text-sky-300",
  atrasado: "bg-amber-500/15 text-amber-300",
  bloqueado: "bg-red-500/15 text-red-300",
  aguardando_pagamento: "bg-violet-500/15 text-violet-300",
  cancelando: "bg-orange-500/15 text-orange-300",
  sem_plano: "bg-slate-500/20 text-slate-300",
};

export function SeloSituacao({ situacao }: { situacao: Situacao }) {
  return (
    <span className={`${base} ${coresSituacao[situacao]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {rotuloSituacao[situacao]}
    </span>
  );
}

const coresCobranca: Record<StatusCobranca, string> = {
  pendente: "bg-sky-500/15 text-sky-300",
  atrasada: "bg-red-500/15 text-red-300",
  paga: "bg-emerald-500/15 text-emerald-300",
  cancelada: "bg-slate-500/20 text-slate-400",
};

export function SeloCobranca({ status }: { status: StatusCobranca }) {
  return <span className={`${base} ${coresCobranca[status]}`}>{rotuloCobranca[status]}</span>;
}

export function SeloPlataforma({ plataforma, automatico }: { plataforma: Plataforma; automatico?: boolean }) {
  return (
    <span
      className={`${base} ${plataforma === "telegram" ? "bg-sky-500/15 text-sky-300" : "bg-green-500/15 text-green-300"}`}
      title={automatico ? "O robô cuida das entradas e saídas" : undefined}
    >
      <IconePlataforma plataforma={plataforma} className="size-3" />
      {nomePlataforma[plataforma]}
      {automatico !== undefined && <span className="font-normal opacity-80">· {automatico ? "robô" : "manual"}</span>}
    </span>
  );
}

// Selo simples com cor livre.
export function Selo({ cor, children }: { cor: string; children: React.ReactNode }) {
  return <span className={`${base} ${cor}`}>{children}</span>;
}

// Círculo com as iniciais; a cor muda conforme o nome.
const fundos = [
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-violet-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-700",
];

export function Avatar({ nome, tamanho = "md" }: { nome: string; tamanho?: "sm" | "md" | "lg" }) {
  const indice = [...nome].reduce((soma, letra) => soma + letra.charCodeAt(0), 0) % fundos.length;
  const tam = { sm: "size-7 text-[11px]", md: "size-9 text-[13px]", lg: "size-16 text-xl" }[tamanho];
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white ${fundos[indice]} ${tam}`}>
      {iniciais(nome)}
    </span>
  );
}
