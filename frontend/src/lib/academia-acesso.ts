// Check-in, controle de acesso, horários de pico e configurações.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/AcessoContrato.java

import { http } from "./http";

export type MeioAcesso = "recepcao" | "catraca" | "leitor_facial" | "leitor_biometrico" | "totem_qr" | "app";
export type MotivoBloqueio = "sem_matricula" | "inadimplente" | "fora_do_horario" | "bloqueio_manual";
export type TipoDispositivo = "catraca" | "leitor_facial" | "leitor_biometrico" | "totem_qr";

export type Acesso = {
  id: string;
  alunoId: string;
  aluno: string;
  momento: string;
  meio: MeioAcesso;
  dispositivo: string | null;
  resultado: "liberado" | "bloqueado";
  motivo: MotivoBloqueio | null;
  liberadoManual: boolean;
  observacao: string;
};

// "repetido" = já tinha entrado há pouco; não conta de novo
export type ResultadoAcesso = {
  resultado: "liberado" | "bloqueado" | "repetido";
  motivo: MotivoBloqueio | null;
  mensagem: string;
  alunoId: string;
  aluno: string;
  plano: string | null;
  acesso: Acesso | null;
};

export type PainelCheckins = {
  data: string;
  ehHoje: boolean;
  resumo: {
    hoje: number;
    variacao: number;
    // alunos que entraram nos últimos 90 minutos
    agora: number;
    bloqueadosHoje: number;
    liberacoesManuaisHoje: number;
    ultimo: string | null;
  };
  acessos: Acesso[];
};

export type Regras = {
  bloquearInadimplentes: boolean;
  toleranciaAtrasoDias: number;
  bloquearForaDoHorario: boolean;
  intervaloCheckinMinutos: number;
};

export type Horario = { diaSemana: number; dia: string; abre: string | null; fecha: string | null; fechado: boolean };

export type AlunoBloqueado = {
  alunoId: string;
  nome: string;
  motivo: MotivoBloqueio;
  detalhe: string;
  desde: string;
  manual: boolean;
  bloqueioId: string | null;
};

export type Dispositivo = {
  id: string;
  nome: string;
  tipo: TipoDispositivo;
  fabricante: string;
  identificador: string;
  token: string;
  ativo: boolean;
  ultimoContato: string | null;
  acessosHoje: number;
};

export type DadosDispositivo = Pick<Dispositivo, "nome" | "tipo" | "fabricante" | "identificador"> & { ativo?: boolean };

export type PainelAcesso = {
  regras: Regras;
  horarios: Horario[];
  abertoAgora: boolean;
  bloqueados: AlunoBloqueado[];
  dispositivos: Dispositivo[];
  historico: Acesso[];
};

export type PainelPico = {
  capacidade: number;
  semanas: number;
  horaInicio: number;
  horaFim: number;
  diaHoje: number;
  mapa: { diaSemana: number; dia: string; horas: { hora: number; media: number; ocupacao: number }[] }[];
  hoje: { hora: number; hoje: number; media: number }[];
  destaques: {
    horaMaisCheia: string;
    ocupacaoMaisCheia: number;
    horaMaisVazia: string;
    diaMaisMovimentado: string;
    mediaDiaria: number;
  };
  agora: number;
  ocupacaoAgora: number;
};

export type Configuracoes = {
  nomeAcademia: string;
  gestorNome: string;
  gestorCargo: string;
  frase: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cnpj: string | null;
  whatsapp: string | null;
  // página pública: /a/<slug> (editada em "Página da academia")
  slug: string;
  paginaPublica: string;
  capacidade: number;
  validadeFichaSemanas: number;
  reavaliacaoDias: number;
  horarios: Horario[];
};

export const apiAcesso = {
  checkins: (data?: string) => http.get<PainelCheckins>(`/academia/checkins${data ? `?data=${data}` : ""}`),
  registrarCheckin: (alunoId: string, liberarMesmoAssim = false, observacao = "") =>
    http.post<ResultadoAcesso>("/academia/checkins", { alunoId, liberarMesmoAssim, observacao }),

  painel: () => http.get<PainelAcesso>("/academia/acesso"),
  salvarRegras: (r: Partial<Regras>) => http.put<Regras>("/academia/acesso/regras", r),
  bloquear: (alunoId: string, motivo: string) => http.post<void>("/academia/acesso/bloqueios", { alunoId, motivo }),
  desbloquear: (bloqueioId: string) => http.post<void>(`/academia/acesso/bloqueios/${bloqueioId}/remover`),
  cadastrarDispositivo: (d: DadosDispositivo) => http.post<Dispositivo>("/academia/acesso/dispositivos", d),
  atualizarDispositivo: (id: string, d: DadosDispositivo) =>
    http.put<Dispositivo>(`/academia/acesso/dispositivos/${id}`, d),
  // O mesmo que a catraca chama: identifica o aluno pelo CPF ou pelo id.
  entradaDispositivo: (token: string, aluno: { documento?: string; alunoId?: string }) =>
    http.post<ResultadoAcesso>("/academia/acesso/dispositivos/entrada", { token, ...aluno }),

  pico: (semanas = 4) => http.get<PainelPico>(`/academia/horarios-de-pico?semanas=${semanas}`),

  configuracoes: () => http.get<Configuracoes>("/academia/configuracoes"),
  salvarConfiguracoes: (c: Configuracoes) => http.put<Configuracoes>("/academia/configuracoes", c),
};

// ---------- Textos ----------

export const rotuloMeio: Record<MeioAcesso, string> = {
  recepcao: "Recepção",
  catraca: "Catraca",
  leitor_facial: "Leitor facial",
  leitor_biometrico: "Biometria",
  totem_qr: "QR code",
  app: "App",
};

export const rotuloMotivo: Record<MotivoBloqueio, string> = {
  sem_matricula: "Sem matrícula",
  inadimplente: "Mensalidade em atraso",
  fora_do_horario: "Fora do horário",
  bloqueio_manual: "Bloqueado pela academia",
};

export const rotuloTipoDispositivo: Record<TipoDispositivo, string> = {
  catraca: "Catraca",
  leitor_facial: "Leitor facial",
  leitor_biometrico: "Leitor biométrico",
  totem_qr: "Totem de QR code",
};

// "2026-09-25T18:32:00-03:00" -> "18:32"
export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// "25/09 18:32"
export function diaHora(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${hora(iso)}`;
}
