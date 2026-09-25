// Profissionais, exercícios, fichas de treino e área do cliente.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/TreinosContrato.java

import { http } from "./http";

export type GrupoMuscular =
  | "peito"
  | "costas"
  | "ombros"
  | "biceps"
  | "triceps"
  | "pernas"
  | "gluteos"
  | "panturrilha"
  | "abdomen"
  | "cardio"
  | "corpo_todo"
  | "alongamento";

export type SituacaoFicha = "sem_ficha" | "vencida" | "vence_em_breve" | "em_dia";

export type Profissional = {
  id: string;
  nome: string;
  especialidade: string;
  telefone: string | null;
  email: string | null;
  registro: string | null;
  ativo: boolean;
  alunos: number;
};

export type DadosProfissional = Pick<Profissional, "nome" | "especialidade" | "telefone" | "email" | "registro"> & {
  ativo?: boolean;
};

export type Exercicio = {
  id: string;
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: string;
  instrucoes: string;
  imagemUrl: string | null;
  videoUrl: string | null;
  videoLink: string | null;
  ativo: boolean;
};

export type DadosExercicio = Omit<Exercicio, "id">;

export type ItemFicha = {
  id: string;
  exercicio: Exercicio;
  series: number | null;
  repeticoes: string;
  carga: string;
  descansoSegundos: number | null;
  observacao: string;
};

export type TreinoFicha = { id: string; letra: string; nome: string; exercicios: ItemFicha[] };

export type Ficha = {
  id: string;
  modelo: boolean;
  aluno: { id: string; nome: string } | null;
  nome: string;
  objetivo: string;
  observacoes: string;
  professor: { id: string; nome: string } | null;
  inicio: string | null;
  validade: string | null;
  situacao: Exclude<SituacaoFicha, "sem_ficha">;
  status: "ativa" | "encerrada";
  atualizadaEm: string | null;
  treinos: TreinoFicha[];
};

export type FichaResumo = {
  id: string;
  nome: string;
  professor: string | null;
  inicio: string | null;
  validade: string | null;
  situacao: Exclude<SituacaoFicha, "sem_ficha">;
  divisoes: string;
};

export type PainelTreinos = {
  alunos: { alunoId: string; nome: string; situacao: SituacaoFicha; ficha: FichaResumo | null }[];
  modelos: {
    id: string;
    nome: string;
    objetivo: string;
    professor: string | null;
    divisoes: string;
    exercicios: number;
    alunos: number;
  }[];
  contagem: { todos: number; semFicha: number; vencidas: number; venceEmBreve: number; emDia: number };
};

// O que o editor envia ao salvar (a ficha inteira).
export type DadosFicha = {
  nome: string;
  objetivo: string;
  observacoes: string;
  professorId: string | null;
  inicio: string | null;
  validade: string | null;
  treinos: {
    nome: string;
    exercicios: {
      exercicioId: string;
      series: number | null;
      repeticoes: string;
      carga: string;
      descansoSegundos: number | null;
      observacao: string;
    }[];
  }[];
};

export type TreinoDoAluno = { academia: string; aluno: string; ficha: Ficha | null };

export type ArquivoEnviado = { url: string; nome: string; tipo: "imagem" | "video" };

export const apiTreinos = {
  profissionais: () => http.get<Profissional[]>("/academia/profissionais"),
  cadastrarProfissional: (d: DadosProfissional) => http.post<Profissional>("/academia/profissionais", d),
  atualizarProfissional: (id: string, d: DadosProfissional) =>
    http.put<Profissional>(`/academia/profissionais/${id}`, d),

  exercicios: () => http.get<Exercicio[]>("/academia/exercicios"),
  cadastrarExercicio: (d: DadosExercicio) => http.post<Exercicio>("/academia/exercicios", d),
  atualizarExercicio: (id: string, d: DadosExercicio) => http.put<Exercicio>(`/academia/exercicios/${id}`, d),

  painel: () => http.get<PainelTreinos>("/academia/treinos"),
  ficha: (id: string) => http.get<Ficha>(`/academia/fichas/${id}`),
  // sem alunoId = novo modelo; com modeloId = copia do modelo
  criarFicha: (pedido: { alunoId?: string; modeloId?: string }) => http.post<Ficha>("/academia/fichas", pedido),
  salvarFicha: (id: string, d: DadosFicha) => http.put<Ficha>(`/academia/fichas/${id}`, d),
  excluirFicha: (id: string) => http.post<void>(`/academia/fichas/${id}/excluir`),

  treinoDoAluno: (alunoId: string) => http.get<TreinoDoAluno>(`/area-cliente/${alunoId}/treino`),
};

// Envia uma imagem ou vídeo. Mostra o progresso (0 a 100) enquanto sobe.
export function enviarArquivo(arquivo: File, aoProgredir?: (pct: number) => void): Promise<ArquivoEnviado> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/arquivos");
    xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir?.(Math.round((e.loaded * 100) / e.total));
    xhr.onload = () => {
      const corpo = (() => {
        try {
          return JSON.parse(xhr.responseText);
        } catch {
          return null;
        }
      })();
      if (xhr.status >= 200 && xhr.status < 300) resolve(corpo);
      else reject(new Error(corpo?.error ?? `Erro ${xhr.status} ao enviar o arquivo`));
    };
    xhr.onerror = () => reject(new Error("Não foi possível enviar o arquivo"));
    const form = new FormData();
    form.append("arquivo", arquivo);
    xhr.send(form);
  });
}

// ---------- Textos ----------

export const rotuloGrupo: Record<GrupoMuscular, string> = {
  peito: "Peito",
  costas: "Costas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  pernas: "Pernas",
  gluteos: "Glúteos",
  panturrilha: "Panturrilha",
  abdomen: "Abdômen",
  cardio: "Cardio",
  corpo_todo: "Corpo todo",
  alongamento: "Alongamento",
};

export const grupos = Object.keys(rotuloGrupo) as GrupoMuscular[];

export const rotuloSituacaoFicha: Record<SituacaoFicha, string> = {
  sem_ficha: "Sem ficha",
  vencida: "Vencida",
  vence_em_breve: "Vence em breve",
  em_dia: "Em dia",
};

// 90 -> "1 min 30 s", 60 -> "1 min", 45 -> "45 s"
export function descanso(segundos: number | null) {
  if (segundos === null || segundos === undefined) return "";
  if (segundos < 60) return `${segundos} s`;
  const min = Math.floor(segundos / 60);
  const s = segundos % 60;
  return s ? `${min} min ${s} s` : `${min} min`;
}

// "4 × 10 a 12"; com 1 série só o que fazer ("10 min")
export function seriesERepeticoes(i: Pick<ItemFicha, "series" | "repeticoes">) {
  if (i.series === 1 && i.repeticoes) return i.repeticoes;
  if (i.series && i.repeticoes) return `${i.series} × ${i.repeticoes}`;
  if (i.series) return `${i.series} séries`;
  return i.repeticoes;
}

// Link do YouTube -> endereço para mostrar o vídeo dentro da página.
export function embedYoutube(link: string | null) {
  if (!link) return null;
  const m = link.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
