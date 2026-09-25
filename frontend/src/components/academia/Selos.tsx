import {
  iniciais,
  rotuloCobranca,
  rotuloSituacao,
  type Situacao,
  type StatusCobranca,
} from "../../lib/academia-alunos";

const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap";

const coresSituacao: Record<Situacao, string> = {
  ativo: "bg-emerald-500/15 text-emerald-300",
  em_atraso: "bg-red-500/15 text-red-300",
  sem_matricula: "bg-slate-500/20 text-slate-300",
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

// Círculo com as iniciais do aluno; a cor muda conforme o nome.
const fundos = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-violet-600",
];

export function AvatarAluno({ nome, grande = false }: { nome: string; grande?: boolean }) {
  const indice = [...nome].reduce((soma, letra) => soma + letra.charCodeAt(0), 0) % fundos.length;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white ${fundos[indice]} ${
        grande ? "size-16 text-xl" : "size-9 text-[13px]"
      }`}
    >
      {iniciais(nome)}
    </span>
  );
}
