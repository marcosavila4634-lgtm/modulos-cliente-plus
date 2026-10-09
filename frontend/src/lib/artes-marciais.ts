// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/artesmarciais/ArtesMarciaisContrato.java
// Rotas do painel em /api/artes-marciais; páginas sem login em /api/artes-marciais/publico.

import { http } from "./http";

export type RefFaixa = { id: string; nome: string; cor: string; corPonta: string | null };
export type RefModalidade = { id: string; nome: string; cor: string };
export type RefAluno = { id: string; nome: string; telefone: string | null; idade: number | null };
export type SituacaoCobranca = "paga" | "pendente" | "atrasada" | "cancelada";
export type CobrancaJson = {
  id: string;
  valor: number;
  vencimento: string;
  situacao: SituacaoCobranca;
  formaPagamento: string | null;
};

// ---------- Configurações ----------

export type ConfigLutas = {
  contarAulasPor: "aulas" | "checkins";
  idadeAdulto: number;
  lema: string;
  codigoPresenca: string;
  linkPresenca: string;
};

// ---------- Modalidades e faixas ----------

export type Publico = "adulto" | "infantil" | "todos";

export type FaixaJson = {
  id: string;
  modalidadeId: string;
  nome: string;
  cor: string;
  corPonta: string | null;
  publico: Publico;
  ordem: number;
  grausMaximos: number;
  mesesMinimos: number;
  aulasMinimas: number;
  aulasPorGrau: number;
  idadeMinima: number | null;
  taxaExame: number;
  ativo: boolean;
};

export type ModalidadeJson = {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  alunos: number;
  faixas: FaixaJson[];
  aulas: string[];
};

export type ModeloFaixas = "jiu-jitsu" | "judo" | "karate" | "taekwondo" | "muay-thai" | "niveis" | "";

export type DadosFaixa = Omit<FaixaJson, "id" | "modalidadeId" | "ordem">;

export type TecnicaJson = {
  id: string;
  modalidadeId: string;
  faixaId: string;
  categoria: string;
  nome: string;
  descricao: string;
  videoUrl: string;
  ordem: number;
};

export type AulaDaModalidade = { aulaId: string; modalidadeId: string; publico: Publico };

// ---------- Progresso e graduações ----------

export type Requisito = { rotulo: string; atual: number; meta: number; ok: boolean };
export type SituacaoProgresso = "apto_faixa" | "apto_grau" | "em_progresso" | "ultima_faixa" | "livre";

export type Progresso = {
  id: string;
  aluno: RefAluno;
  modalidade: RefModalidade;
  faixa: RefFaixa;
  grau: number;
  grausMaximos: number;
  inicio: string;
  faixaDesde: string;
  grauDesde: string;
  aulasNaFaixa: number;
  aulasNoGrau: number;
  aulasPorGrau: number;
  mesesNaFaixa: number;
  requisitos: Requisito[];
  proximo: { tipo: "faixa" | "grau"; faixa: RefFaixa; grau: number } | null;
  percentual: number;
  situacao: SituacaoProgresso;
  matriculaAtiva: boolean;
  infantil: boolean;
};

export type GraduacaoJson = {
  id: string;
  aluno: RefAluno;
  modalidade: RefModalidade;
  tipo: "inicial" | "faixa" | "grau";
  faixa: RefFaixa;
  grau: number;
  faixaAnterior: RefFaixa | null;
  grauAnterior: number | null;
  data: string;
  professor: string | null;
  codigo: string;
  observacao: string;
  exame: string | null;
};

export type PainelGraduacoes = {
  alunos: Progresso[];
  modalidades: RefModalidade[];
  aptosFaixa: number;
  aptosGrau: number;
  graduacoesNoMes: number;
  recentes: GraduacaoJson[];
};

export type DadosGraduacao = {
  alunoModalidadeId: string;
  tipo: "faixa" | "grau";
  faixaId?: string;
  grau?: number;
  data?: string;
  professorId?: string | null;
  observacao?: string;
};

export type Certificado = {
  codigo: string;
  academia: string;
  aluno: string;
  modalidade: string;
  faixa: RefFaixa;
  grau: number;
  tipo: GraduacaoJson["tipo"];
  data: string;
  professor: string | null;
  exame: string | null;
};

export type Conquista = { id: string; titulo: string; descricao: string; conquistada: boolean; quando: string | null };

export type FichaLutas = {
  alunoId: string;
  nome: string;
  idade: number | null;
  modalidades: Progresso[];
  historico: GraduacaoJson[];
  eventos: InscricaoJson[];
  filiacoes: FiliacaoJson[];
  responsavel: { id: string; nome: string; telefone: string | null; parentesco: string; codigo: string } | null;
  conquistas: Conquista[];
  aulasTotal: number;
};

// ---------- Exames ----------

export type ExameResumo = {
  id: string;
  modalidade: RefModalidade;
  titulo: string;
  data: string;
  hora: string | null;
  local: string;
  banca: string;
  status: "agendado" | "realizado" | "cancelado";
  candidatos: number;
  aprovados: number;
  pagos: number;
};

export type CandidatoJson = {
  id: string;
  aluno: RefAluno;
  faixaAtual: RefFaixa | null;
  grauAtual: number;
  faixa: RefFaixa;
  grau: number;
  taxa: CobrancaJson | null;
  resultado: "pendente" | "aprovado" | "reprovado";
  observacao: string;
  codigoCertificado: string | null;
};

export type ExameDetalhe = { exame: ExameResumo; candidatos: CandidatoJson[]; sugeridos: Progresso[] };

export type DadosExame = {
  modalidadeId: string;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  banca: string;
  observacao: string;
};

// ---------- Eventos ----------

export type TipoEvento = "campeonato" | "seminario" | "aulao" | "confraternizacao" | "outro";
export type FaseEvento = "inscricoes_abertas" | "inscricoes_encerradas" | "realizado" | "cancelado";
export type Medalhas = { ouro: number; prata: number; bronze: number };
export type ResultadoEvento = "ouro" | "prata" | "bronze" | "participou";

export type EventoResumo = {
  id: string;
  tipo: TipoEvento;
  nome: string;
  descricao: string;
  modalidade: RefModalidade | null;
  data: string;
  hora: string | null;
  local: string;
  organizador: string;
  valorInscricao: number;
  vagas: number | null;
  inscricoesAte: string | null;
  participaIndicacoes: boolean;
  abertoNoApp: boolean;
  status: "ativo" | "cancelado";
  fase: FaseEvento;
  inscritos: number;
  pagos: number;
  medalhas: Medalhas;
};

export type InscricaoJson = {
  id: string;
  eventoId: string;
  evento: string;
  tipoEvento: TipoEvento;
  data: string;
  aluno: RefAluno;
  categoria: string;
  faixa: string;
  peso: number | null;
  cobranca: CobrancaJson | null;
  resultado: ResultadoEvento | null;
  origem: "recepcao" | "area_aluno";
  status: "inscrito" | "cancelado";
};

export type EventoDetalhe = { evento: EventoResumo; inscricoes: InscricaoJson[] };

export type DadosEvento = {
  tipo: TipoEvento;
  nome: string;
  descricao: string;
  modalidadeId: string | null;
  data: string;
  hora: string;
  local: string;
  organizador: string;
  valorInscricao: number;
  vagas: number | null;
  inscricoesAte: string | null;
  participaIndicacoes: boolean;
  abertoNoApp: boolean;
};

export type LinhaRanking = {
  aluno: RefAluno;
  ouro: number;
  prata: number;
  bronze: number;
  participacoes: number;
  pontos: number;
};

export type FiliacaoJson = {
  id: string;
  aluno: RefAluno;
  entidade: string;
  numero: string;
  validade: string;
  situacao: "valida" | "vence_em_breve" | "vencida";
  observacao: string;
};

// ---------- Loja ----------

export type CategoriaProduto =
  | "kimono"
  | "faixa"
  | "rashguard"
  | "bermuda"
  | "luvas"
  | "protecao"
  | "camiseta"
  | "acessorio"
  | "outro";

export type TamanhoJson = { id: string; tamanho: string; estoque: number; estoqueMinimo: number };

export type ProdutoJson = {
  id: string;
  nome: string;
  categoria: CategoriaProduto;
  descricao: string;
  preco: number;
  custo: number;
  foto: string;
  participaIndicacoes: boolean;
  ativo: boolean;
  tamanhos: TamanhoJson[];
  estoqueTotal: number;
  estoqueBaixo: boolean;
  vendidosMes: number;
};

export type VendaJson = {
  id: string;
  aluno: RefAluno;
  itens: { nome: string; tamanho: string; quantidade: number; precoUnitario: number }[];
  total: number;
  cobranca: CobrancaJson;
  status: "ativa" | "cancelada";
  entregue: boolean;
  observacao: string;
  quando: string;
};

export type PainelLoja = {
  produtos: ProdutoJson[];
  vendas: VendaJson[];
  vendidoMes: number;
  lucroMes: number;
  itensEstoqueBaixo: number;
  valorEmEstoque: number;
};

export type DadosProduto = {
  nome: string;
  categoria: CategoriaProduto;
  descricao: string;
  preco: number;
  custo: number;
  foto: string;
  participaIndicacoes: boolean;
  ativo: boolean;
  tamanhos: { id: string | null; tamanho: string; estoqueMinimo: number }[];
};

export type NovaVenda = {
  alunoId: string;
  itens: { produtoId: string; tamanhoId: string; quantidade: number }[];
  desconto: number;
  pago: boolean;
  formaPagamento: string | null;
  vencimento: string | null;
  entregue: boolean;
  observacao: string;
};

// ---------- Equipamentos ----------

export type EstadoEquipamento = "bom" | "atencao" | "manutencao" | "inativo";
export type CategoriaEquipamento =
  | "tatame"
  | "saco"
  | "luvas"
  | "protecao"
  | "aparador"
  | "manequim"
  | "som_video"
  | "outro";

export type EquipamentoJson = {
  id: string;
  nome: string;
  categoria: CategoriaEquipamento;
  quantidade: number;
  local: string;
  estado: EstadoEquipamento;
  intervaloManutencaoDias: number | null;
  ultimaManutencao: string | null;
  proximaManutencao: string | null;
  manutencaoVencida: boolean;
  aquisicao: string | null;
  valor: number | null;
  observacao: string;
  manutencoes: { id: string; data: string; descricao: string; custo: number | null }[];
};

export type DadosEquipamento = Omit<
  EquipamentoJson,
  "id" | "proximaManutencao" | "manutencaoVencida" | "manutencoes"
>;

// ---------- Responsáveis ----------

export type ResponsavelJson = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  codigo: string;
  dependentes: { aluno: RefAluno; parentesco: string; faixa: RefFaixa | null; modalidade: string | null }[];
};

export type PainelResponsaveis = { responsaveis: ResponsavelJson[]; kidsSemResponsavel: RefAluno[] };

// ---------- Comunicação ----------

export type PublicoComunicado =
  | "todos"
  | "modalidade"
  | "faixa"
  | "aula"
  | "inadimplentes"
  | "aniversariantes"
  | "kids"
  | "sem_frequencia";

export type ComunicadoJson = {
  id: string;
  titulo: string;
  texto: string;
  publico: PublicoComunicado;
  filtro: string | null;
  whatsapp: boolean;
  mural: boolean;
  muralAte: string | null;
  criadoEm: string;
  destinatarios: number;
  enviados: number;
};

export type EnvioJson = {
  id: string;
  alunoId: string;
  aluno: string;
  nome: string;
  telefone: string | null;
  texto: string;
  enviadoEm: string | null;
};

export type ComunicadoDetalhe = { comunicado: ComunicadoJson; envios: EnvioJson[] };

export type DadosComunicado = {
  titulo: string;
  texto: string;
  publico: PublicoComunicado;
  filtroId: string | null;
  whatsapp: boolean;
  mural: boolean;
  muralAte: string | null;
};

// ---------- Presença ----------

export type StatusAulaHoje = "concluida" | "em_andamento" | "proxima" | "agendada";

export type AulaDeHoje = {
  horarioId: string;
  aula: string;
  modalidade: RefModalidade | null;
  hora: string;
  fim: string;
  sala: string;
  professor: string | null;
  ocupados: number;
  capacidade: number;
  presentes: number;
  status: StatusAulaHoje;
};

export type LinhaRankingPresenca = { aluno: RefAluno; faixa: RefFaixa; modalidade: string; aulas: number };

export type PainelPresenca = {
  aulas: AulaDeHoje[];
  presencasHoje: number;
  rankingMes: LinhaRankingPresenca[];
  linkPresenca: string;
};

export type PaginaPresenca = { academia: string; aulas: AulaDeHoje[] };

export type RespostaPresenca = {
  ok: boolean;
  mensagem: string;
  aluno: string | null;
  aula: string | null;
  aulasNaFaixa: number;
  faixa: string | null;
};

// ---------- Áreas do aluno e do responsável ----------

export type AvisoMural = { id: string; titulo: string; texto: string; quando: string };

export type AreaAluno = {
  academia: string;
  whatsapp: string | null;
  ficha: FichaLutas;
  curriculo: TecnicaJson[];
  eventos: EventoResumo[];
  avisos: AvisoMural[];
  loja: ProdutoJson[];
  ranking: LinhaRankingPresenca[];
};

export type AreaResponsavel = {
  academia: string;
  whatsapp: string | null;
  nome: string;
  filhos: {
    ficha: FichaLutas;
    presencasMes: number;
    cobrancas: { id: string; descricao: string; valor: number; vencimento: string; situacao: SituacaoCobranca }[];
  }[];
  avisos: AvisoMural[];
};

// ---------- Dashboard ----------

export type TipoAlertaLutas =
  | "aptos_graduar"
  | "exame"
  | "evento"
  | "equipamentos"
  | "filiacoes"
  | "kids_sem_responsavel"
  | "estoque";

export type DashboardLutas = {
  lema: string;
  agendaHoje: AulaDeHoje[];
  modalidades: { nome: string; cor: string; alunos: number; percentual: number }[];
  totalAlunosModalidades: number;
  statusMatriculas: { ativas: number; emRenovacao: number; emAtraso: number; canceladas: number; total: number };
  permanencia: { valor: number; variacao: number; base: number };
  presencasHoje: { valor: number; variacao: number; alunosAtivos: number; percentual: number };
  alertas: { tipo: TipoAlertaLutas; titulo: string; descricao: string }[];
  atividades: {
    tipo: "graduacao" | "checkin" | "inscricao" | "venda" | "pagamento" | "matricula" | "avaliacao";
    texto: string;
    detalhe: string;
    quando: string;
  }[];
};

// ---------- Chamadas ----------

const base = "/artes-marciais";

export const apiLutas = {
  dashboard: () => http.get<DashboardLutas>(`${base}/dashboard`),
  config: () => http.get<ConfigLutas>(`${base}/config`),
  salvarConfig: (d: Partial<Pick<ConfigLutas, "contarAulasPor" | "idadeAdulto" | "lema">>) =>
    http.put<ConfigLutas>(`${base}/config`, d),
  novoQr: () => http.post<ConfigLutas>(`${base}/config/novo-qr`),

  modalidades: () => http.get<ModalidadeJson[]>(`${base}/modalidades`),
  criarModalidade: (d: { nome: string; cor: string; modelo: ModeloFaixas }) =>
    http.post<ModalidadeJson[]>(`${base}/modalidades`, { ...d, modelo: d.modelo || null }),
  salvarModalidade: (id: string, d: { nome: string; cor: string; ativo: boolean }) =>
    http.put<ModalidadeJson[]>(`${base}/modalidades/${id}`, d),
  criarFaixa: (modalidadeId: string, d: DadosFaixa) =>
    http.post<ModalidadeJson[]>(`${base}/modalidades/${modalidadeId}/faixas`, d),
  salvarFaixa: (id: string, d: DadosFaixa) => http.put<ModalidadeJson[]>(`${base}/faixas/${id}`, d),
  excluirFaixa: (id: string) => http.del<ModalidadeJson[]>(`${base}/faixas/${id}`),
  ordenarFaixas: (modalidadeId: string, ids: string[]) =>
    http.put<ModalidadeJson[]>(`${base}/modalidades/${modalidadeId}/ordem-faixas`, { ids }),
  aulasModalidades: () => http.get<AulaDaModalidade[]>(`${base}/aulas-modalidades`),
  modalidadeDaAula: (aulaId: string, modalidadeId: string | null, publico: Publico) =>
    http.put<AulaDaModalidade[]>(`${base}/aulas/${aulaId}/modalidade`, { modalidadeId, publico }),
  curriculo: (modalidadeId: string) => http.get<TecnicaJson[]>(`${base}/modalidades/${modalidadeId}/curriculo`),
  salvarTecnica: (
    modalidadeId: string,
    id: string | null,
    d: { faixaId: string; categoria: string; nome: string; descricao: string; videoUrl: string },
  ) =>
    id
      ? http.put<TecnicaJson[]>(`${base}/modalidades/${modalidadeId}/curriculo/${id}`, d)
      : http.post<TecnicaJson[]>(`${base}/modalidades/${modalidadeId}/curriculo`, d),
  excluirTecnica: (modalidadeId: string, id: string) =>
    http.del<TecnicaJson[]>(`${base}/modalidades/${modalidadeId}/curriculo/${id}`),

  graduacoes: () => http.get<PainelGraduacoes>(`${base}/graduacoes`),
  graduar: (d: DadosGraduacao) => http.post<GraduacaoJson>(`${base}/graduacoes`, d),
  ficha: (alunoId: string) => http.get<FichaLutas>(`${base}/alunos/${alunoId}`),
  alunosFaixas: () => http.get<Progresso[]>(`${base}/alunos-faixas`),
  adicionarModalidade: (
    alunoId: string,
    d: { modalidadeId: string; faixaId: string; grau: number; inicio: string; faixaDesde: string },
  ) => http.post<FichaLutas>(`${base}/alunos/${alunoId}/modalidades`, d),
  sairDaModalidade: (alunoId: string, id: string) => http.del<FichaLutas>(`${base}/alunos/${alunoId}/modalidades/${id}`),

  exames: () => http.get<ExameResumo[]>(`${base}/exames`),
  exame: (id: string) => http.get<ExameDetalhe>(`${base}/exames/${id}`),
  criarExame: (d: DadosExame) => http.post<ExameDetalhe>(`${base}/exames`, d),
  salvarExame: (id: string, d: DadosExame) => http.put<ExameDetalhe>(`${base}/exames/${id}`, d),
  adicionarCandidato: (
    id: string,
    d: { alunoModalidadeId: string; faixaId?: string; grau?: number; cobrarTaxa: boolean; pago: boolean; formaPagamento?: string },
  ) => http.post<ExameDetalhe>(`${base}/exames/${id}/candidatos`, d),
  removerCandidato: (id: string, c: string) => http.del<ExameDetalhe>(`${base}/exames/${id}/candidatos/${c}`),
  resultadoCandidato: (id: string, c: string, resultado: CandidatoJson["resultado"], observacao?: string) =>
    http.put<ExameDetalhe>(`${base}/exames/${id}/candidatos/${c}`, { resultado, observacao }),
  concluirExame: (id: string, professorId: string | null) =>
    http.post<ExameDetalhe>(`${base}/exames/${id}/concluir`, { professorId }),
  cancelarExame: (id: string) => http.post<ExameDetalhe>(`${base}/exames/${id}/cancelar`),

  eventos: () => http.get<EventoResumo[]>(`${base}/eventos`),
  evento: (id: string) => http.get<EventoDetalhe>(`${base}/eventos/${id}`),
  criarEvento: (d: DadosEvento) => http.post<EventoDetalhe>(`${base}/eventos`, d),
  salvarEvento: (id: string, d: DadosEvento) => http.put<EventoDetalhe>(`${base}/eventos/${id}`, d),
  cancelarEvento: (id: string) => http.post<EventoDetalhe>(`${base}/eventos/${id}/cancelar`),
  categoria: (id: string, alunoId: string) =>
    http.get<{ categoria: string }>(`${base}/eventos/${id}/categoria?aluno=${alunoId}`),
  inscrever: (
    id: string,
    d: { alunoId: string; categoria: string; peso: number | null; pago: boolean; formaPagamento: string | null },
  ) => http.post<EventoDetalhe>(`${base}/eventos/${id}/inscricoes`, d),
  resultado: (id: string, i: string, d: { resultado: ResultadoEvento | null; categoria?: string; peso?: number | null }) =>
    http.put<EventoDetalhe>(`${base}/eventos/${id}/inscricoes/${i}`, d),
  cancelarInscricao: (id: string, i: string) => http.del<EventoDetalhe>(`${base}/eventos/${id}/inscricoes/${i}`),
  ranking: (ano: number) =>
    http.get<{ atletas: LinhaRanking[]; total: Medalhas }>(`${base}/eventos/ranking?ano=${ano}`),

  filiacoes: () => http.get<FiliacaoJson[]>(`${base}/filiacoes`),
  salvarFiliacao: (
    id: string | null,
    d: { alunoId: string; entidade: string; numero: string; validade: string; observacao: string },
  ) => (id ? http.put<FiliacaoJson[]>(`${base}/filiacoes/${id}`, d) : http.post<FiliacaoJson[]>(`${base}/filiacoes`, d)),
  excluirFiliacao: (id: string) => http.del<FiliacaoJson[]>(`${base}/filiacoes/${id}`),

  loja: () => http.get<PainelLoja>(`${base}/loja`),
  salvarProduto: (id: string | null, d: DadosProduto) =>
    id ? http.put<PainelLoja>(`${base}/loja/produtos/${id}`, d) : http.post<PainelLoja>(`${base}/loja/produtos`, d),
  estoque: (id: string, d: { tamanhoId: string; quantidade: number; motivo: "entrada" | "ajuste"; observacao: string }) =>
    http.post<PainelLoja>(`${base}/loja/produtos/${id}/estoque`, d),
  vender: (d: NovaVenda) => http.post<PainelLoja>(`${base}/loja/vendas`, d),
  cancelarVenda: (id: string) => http.post<PainelLoja>(`${base}/loja/vendas/${id}/cancelar`),
  entregar: (id: string) => http.post<PainelLoja>(`${base}/loja/vendas/${id}/entregar`),

  equipamentos: () => http.get<EquipamentoJson[]>(`${base}/equipamentos`),
  salvarEquipamento: (id: string | null, d: DadosEquipamento) =>
    id
      ? http.put<EquipamentoJson[]>(`${base}/equipamentos/${id}`, d)
      : http.post<EquipamentoJson[]>(`${base}/equipamentos`, d),
  excluirEquipamento: (id: string) => http.del<EquipamentoJson[]>(`${base}/equipamentos/${id}`),
  manutencao: (
    id: string,
    d: { data: string; descricao: string; custo: number | null; estado: EstadoEquipamento; lancarDespesa: boolean; formaPagamento: string },
  ) => http.post<EquipamentoJson[]>(`${base}/equipamentos/${id}/manutencoes`, d),

  responsaveis: () => http.get<PainelResponsaveis>(`${base}/responsaveis`),
  criarResponsavel: (d: {
    nome: string;
    telefone: string;
    email: string;
    cpf: string;
    alunoId: string | null;
    parentesco: string;
  }) => http.post<PainelResponsaveis>(`${base}/responsaveis`, d),
  salvarResponsavel: (id: string, d: { nome: string; telefone: string; email: string; cpf: string }) =>
    http.put<PainelResponsaveis>(`${base}/responsaveis/${id}`, d),
  excluirResponsavel: (id: string) => http.del<PainelResponsaveis>(`${base}/responsaveis/${id}`),
  adicionarDependente: (id: string, alunoId: string, parentesco: string) =>
    http.post<PainelResponsaveis>(`${base}/responsaveis/${id}/dependentes`, { alunoId, parentesco }),
  removerDependente: (id: string, alunoId: string) =>
    http.del<PainelResponsaveis>(`${base}/responsaveis/${id}/dependentes/${alunoId}`),

  comunicados: () => http.get<ComunicadoJson[]>(`${base}/comunicados`),
  comunicado: (id: string) => http.get<ComunicadoDetalhe>(`${base}/comunicados/${id}`),
  previa: (d: DadosComunicado) =>
    http.post<{ destinatarios: number; exemplos: string[]; semTelefone: number }>(`${base}/comunicados/previa`, d),
  criarComunicado: (d: DadosComunicado) => http.post<ComunicadoDetalhe>(`${base}/comunicados`, d),
  marcarEnviado: (id: string, envioId: string, desfazer = false) =>
    http.post<ComunicadoDetalhe>(`${base}/comunicados/${id}/envios/${envioId}${desfazer ? "?desfazer=true" : ""}`),
  excluirComunicado: (id: string) => http.del<ComunicadoJson[]>(`${base}/comunicados/${id}`),

  presenca: () => http.get<PainelPresenca>(`${base}/presenca`),
  rankingPresenca: () => http.get<LinhaRankingPresenca[]>(`${base}/presenca/ranking`),
};

const pub = `${base}/publico`;

export const apiPublicoLutas = {
  certificado: (codigo: string) => http.get<Certificado>(`${pub}/certificados/${encodeURIComponent(codigo)}`),
  presenca: (codigo: string) => http.get<PaginaPresenca>(`${pub}/presenca/${encodeURIComponent(codigo)}`),
  marcarPresenca: (codigo: string, documento: string, horarioId: string) =>
    http.post<RespostaPresenca>(`${pub}/presenca/${encodeURIComponent(codigo)}`, { documento, horarioId }),
  aluno: (id: string) => http.get<AreaAluno>(`${pub}/aluno/${id}`),
  inscrever: (id: string, eventoId: string, categoria: string, peso: number | null) =>
    http.post<AreaAluno>(`${pub}/aluno/${id}/inscricoes`, { eventoId, categoria, peso }),
  cancelarInscricao: (id: string, inscricaoId: string) =>
    http.del<AreaAluno>(`${pub}/aluno/${id}/inscricoes/${inscricaoId}`),
  responsavel: (codigo: string) => http.get<AreaResponsavel>(`${pub}/responsavel/${encodeURIComponent(codigo)}`),
};

// ---------- Textos e formatos ----------

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const moeda = (v: number) => brl.format(v);

// "2026-09-29" -> "29/09/2026"
export function data(iso: string | null | undefined) {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function dataCurta(iso: string | null | undefined) {
  if (!iso) return "—";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

export function hojeIso() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function diasAte(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const alvo = new Date(a, m - 1, d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

export function faixaComGrau(f: RefFaixa, grau: number) {
  return grau > 0 ? `${f.nome} · ${grau} ${grau === 1 ? "grau" : "graus"}` : f.nome;
}

export const rotuloTipoEvento: Record<TipoEvento, string> = {
  campeonato: "Campeonato",
  seminario: "Seminário",
  aulao: "Aulão",
  confraternizacao: "Confraternização",
  outro: "Evento",
};

export const rotuloFase: Record<FaseEvento, string> = {
  inscricoes_abertas: "Inscrições abertas",
  inscricoes_encerradas: "Inscrições encerradas",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export const rotuloResultado: Record<ResultadoEvento, string> = {
  ouro: "Ouro",
  prata: "Prata",
  bronze: "Bronze",
  participou: "Participou",
};

export const rotuloSituacao: Record<SituacaoProgresso, string> = {
  apto_faixa: "Pronto para nova faixa",
  apto_grau: "Pronto para novo grau",
  em_progresso: "Em progresso",
  ultima_faixa: "Última faixa",
  livre: "Sem requisitos",
};

export const rotuloCategoriaProduto: Record<CategoriaProduto, string> = {
  kimono: "Kimono",
  faixa: "Faixa",
  rashguard: "Rashguard",
  bermuda: "Bermuda",
  luvas: "Luvas",
  protecao: "Proteção",
  camiseta: "Camiseta",
  acessorio: "Acessório",
  outro: "Outro",
};

export const rotuloCategoriaEquipamento: Record<CategoriaEquipamento, string> = {
  tatame: "Tatame",
  saco: "Saco de pancada",
  luvas: "Luvas",
  protecao: "Proteção",
  aparador: "Aparador",
  manequim: "Boneco",
  som_video: "Som e vídeo",
  outro: "Outro",
};

export const rotuloEstado: Record<EstadoEquipamento, string> = {
  bom: "Bom",
  atencao: "Atenção",
  manutencao: "Em manutenção",
  inativo: "Fora de uso",
};

export const rotuloPublico: Record<PublicoComunicado, string> = {
  todos: "Todos os alunos ativos",
  modalidade: "Uma modalidade",
  faixa: "Uma faixa",
  aula: "Uma turma (aula)",
  inadimplentes: "Mensalidade atrasada",
  aniversariantes: "Aniversariantes do mês",
  kids: "Kids (pelos responsáveis)",
  sem_frequencia: "Sem vir há 14 dias ou mais",
};

export const formasPagamento: { valor: string; rotulo: string }[] = [
  { valor: "pix", rotulo: "Pix" },
  { valor: "dinheiro", rotulo: "Dinheiro" },
  { valor: "cartao_credito", rotulo: "Cartão de crédito" },
  { valor: "cartao_debito", rotulo: "Cartão de débito" },
  { valor: "boleto", rotulo: "Boleto" },
];

// Link do WhatsApp com a mensagem pronta.
export function linkWhatsapp(telefone: string | null, texto: string) {
  const numero = (telefone ?? "").replace(/\D/g, "");
  const com55 = numero.length <= 11 ? `55${numero}` : numero;
  return `https://wa.me/${com55}?text=${encodeURIComponent(texto)}`;
}
