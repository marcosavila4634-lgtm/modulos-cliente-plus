package br.com.clienteplus.modulos.artesmarciais;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formatos (JSON) do módulo Artes Marciais.
// Contrato com o frontend: frontend/src/lib/artes-marciais.ts
public final class ArtesMarciaisContrato {

    private ArtesMarciaisContrato() {}

    // ---------- Referências curtas ----------

    public record RefFaixa(UUID id, String nome, String cor, String corPonta) {}

    public record RefModalidade(UUID id, String nome, String cor) {}

    public record RefAluno(UUID id, String nome, String telefone, Integer idade) {}

    // situacao: "paga" | "pendente" | "atrasada" | "cancelada"
    public record CobrancaJson(UUID id, Number valor, LocalDate vencimento, String situacao, String formaPagamento) {}

    // ---------- Configurações ----------

    public record ConfigJson(String contarAulasPor, int idadeAdulto, String lema, String codigoPresenca,
            String linkPresenca) {}

    public record DadosConfig(String contarAulasPor, Integer idadeAdulto, String lema) {}

    // ---------- Modalidades, faixas e currículo ----------

    public record ModalidadeJson(UUID id, String nome, String cor, int ordem, boolean ativo, int alunos,
            List<FaixaJson> faixas, List<UUID> aulas) {}

    public record FaixaJson(UUID id, UUID modalidadeId, String nome, String cor, String corPonta, String publico,
            int ordem, int grausMaximos, int mesesMinimos, int aulasMinimas, int aulasPorGrau, Integer idadeMinima,
            Number taxaExame, boolean ativo) {}

    // modelo: "jiu-jitsu" | "judo" | "karate" | "taekwondo" | "muay-thai" | "niveis" | null (sem faixas)
    public record DadosModalidade(String nome, String cor, String modelo, Boolean ativo) {}

    public record DadosFaixa(String nome, String cor, String corPonta, String publico, Integer grausMaximos,
            Integer mesesMinimos, Integer aulasMinimas, Integer aulasPorGrau, Integer idadeMinima,
            BigDecimal taxaExame, Boolean ativo) {}

    public record NovaOrdem(List<UUID> ids) {}

    public record TecnicaJson(UUID id, UUID modalidadeId, UUID faixaId, String categoria, String nome,
            String descricao, String videoUrl, int ordem) {}

    public record DadosTecnica(UUID faixaId, String categoria, String nome, String descricao, String videoUrl) {}

    public record AulaDaModalidade(UUID aulaId, UUID modalidadeId, String publico) {}

    public record DadosAulaModalidade(UUID modalidadeId, String publico) {}

    // ---------- Progresso e graduações ----------

    public record Requisito(String rotulo, int atual, int meta, boolean ok) {}

    // situacao: "apto_faixa" | "apto_grau" | "em_progresso" | "ultima_faixa" | "livre"
    // proximo.tipo: "faixa" | "grau"
    public record Proximo(String tipo, RefFaixa faixa, int grau) {}

    public record Progresso(
            UUID id,
            RefAluno aluno,
            RefModalidade modalidade,
            RefFaixa faixa,
            int grau,
            int grausMaximos,
            LocalDate inicio,
            LocalDate faixaDesde,
            LocalDate grauDesde,
            int aulasNaFaixa,
            int aulasNoGrau,
            int aulasPorGrau,
            int mesesNaFaixa,
            List<Requisito> requisitos,
            Proximo proximo,
            int percentual,
            String situacao,
            boolean matriculaAtiva,
            boolean infantil) {}

    public record PainelGraduacoes(List<Progresso> alunos, List<RefModalidade> modalidades,
            int aptosFaixa, int aptosGrau, int graduacoesNoMes, List<GraduacaoJson> recentes) {}

    public record GraduacaoJson(UUID id, RefAluno aluno, RefModalidade modalidade, String tipo, RefFaixa faixa,
            int grau, RefFaixa faixaAnterior, Integer grauAnterior, LocalDate data, String professor, String codigo,
            String observacao, String exame) {}

    // tipo: "faixa" | "grau"
    public record DadosGraduacao(UUID alunoModalidadeId, String tipo, UUID faixaId, Integer grau, LocalDate data,
            UUID professorId, String observacao) {}

    public record DadosAlunoModalidade(UUID modalidadeId, UUID faixaId, Integer grau, LocalDate inicio,
            LocalDate faixaDesde) {}

    public record Certificado(String codigo, String academia, String aluno, String modalidade, RefFaixa faixa,
            int grau, String tipo, LocalDate data, String professor, String exame) {}

    // Tudo de luta de um aluno (ficha do aluno e área do aluno).
    public record FichaLutas(
            UUID alunoId,
            String nome,
            Integer idade,
            List<Progresso> modalidades,
            List<GraduacaoJson> historico,
            List<InscricaoJson> eventos,
            List<FiliacaoJson> filiacoes,
            ResponsavelResumo responsavel,
            List<Conquista> conquistas,
            int aulasTotal) {}

    public record ResponsavelResumo(UUID id, String nome, String telefone, String parentesco, String codigo) {}

    // ---------- Exames ----------

    public record ExameResumo(UUID id, RefModalidade modalidade, String titulo, LocalDate data, String hora,
            String local, String banca, String status, int candidatos, int aprovados, int pagos) {}

    public record CandidatoJson(UUID id, RefAluno aluno, RefFaixa faixaAtual, int grauAtual, RefFaixa faixa,
            int grau, CobrancaJson taxa, String resultado, String observacao, String codigoCertificado) {}

    public record ExameDetalhe(ExameResumo exame, List<CandidatoJson> candidatos, List<Progresso> sugeridos) {}

    public record DadosExame(UUID modalidadeId, String titulo, LocalDate data, String hora, String local,
            String banca, String observacao) {}

    // cobrarTaxa: cria a cobrança da taxa da faixa pretendida
    public record NovoCandidato(UUID alunoModalidadeId, UUID faixaId, Integer grau, Boolean cobrarTaxa,
            Boolean pago, String formaPagamento) {}

    public record ResultadoCandidato(String resultado, String observacao) {}

    public record ConcluirExame(UUID professorId) {}

    // ---------- Eventos e filiações ----------

    public record EventoResumo(UUID id, String tipo, String nome, String descricao, RefModalidade modalidade,
            LocalDate data, String hora, String local, String organizador, Number valorInscricao, Integer vagas,
            LocalDate inscricoesAte, boolean participaIndicacoes, boolean abertoNoApp, String status,
            // "inscricoes_abertas" | "inscricoes_encerradas" | "realizado" | "cancelado"
            String fase, int inscritos, int pagos, Medalhas medalhas) {}

    public record Medalhas(int ouro, int prata, int bronze) {}

    public record InscricaoJson(UUID id, UUID eventoId, String evento, String tipoEvento, LocalDate data,
            RefAluno aluno, String categoria, String faixa, Number peso, CobrancaJson cobranca, String resultado,
            String origem, String status) {}

    public record EventoDetalhe(EventoResumo evento, List<InscricaoJson> inscricoes) {}

    public record DadosEvento(String tipo, String nome, String descricao, UUID modalidadeId, LocalDate data,
            String hora, String local, String organizador, BigDecimal valorInscricao, Integer vagas,
            LocalDate inscricoesAte, Boolean participaIndicacoes, Boolean abertoNoApp) {}

    public record NovaInscricao(UUID alunoId, String categoria, BigDecimal peso, Boolean pago, String formaPagamento) {}

    public record DadosResultado(String resultado, String categoria, BigDecimal peso) {}

    public record Ranking(List<LinhaRanking> atletas, Medalhas total) {}

    public record LinhaRanking(RefAluno aluno, int ouro, int prata, int bronze, int participacoes, int pontos) {}

    public record FiliacaoJson(UUID id, RefAluno aluno, String entidade, String numero, LocalDate validade,
            // "valida" | "vence_em_breve" | "vencida"
            String situacao, String observacao) {}

    public record DadosFiliacao(UUID alunoId, String entidade, String numero, LocalDate validade, String observacao) {}

    // ---------- Loja ----------

    public record TamanhoJson(UUID id, String tamanho, int estoque, int estoqueMinimo) {}

    public record ProdutoJson(UUID id, String nome, String categoria, String descricao, Number preco, Number custo,
            String foto, boolean participaIndicacoes, boolean ativo, List<TamanhoJson> tamanhos, int estoqueTotal,
            boolean estoqueBaixo, int vendidosMes) {}

    public record DadosProduto(String nome, String categoria, String descricao, BigDecimal preco, BigDecimal custo,
            String foto, Boolean participaIndicacoes, Boolean ativo, List<DadosTamanho> tamanhos) {}

    public record DadosTamanho(UUID id, String tamanho, Integer estoqueMinimo) {}

    public record DadosMovimento(UUID tamanhoId, Integer quantidade, String motivo, String observacao) {}

    public record ItemVendaJson(String nome, String tamanho, int quantidade, Number precoUnitario) {}

    public record VendaJson(UUID id, RefAluno aluno, List<ItemVendaJson> itens, Number total, CobrancaJson cobranca,
            String status, boolean entregue, String observacao, OffsetDateTime quando) {}

    public record ItemPedido(UUID produtoId, UUID tamanhoId, Integer quantidade) {}

    public record NovaVenda(UUID alunoId, List<ItemPedido> itens, BigDecimal desconto, Boolean pago,
            String formaPagamento, LocalDate vencimento, Boolean entregue, String observacao) {}

    public record PainelLoja(List<ProdutoJson> produtos, List<VendaJson> vendas, Number vendidoMes, Number lucroMes,
            int itensEstoqueBaixo, Number valorEmEstoque) {}

    // ---------- Equipamentos ----------

    public record EquipamentoJson(UUID id, String nome, String categoria, int quantidade, String local, String estado,
            Integer intervaloManutencaoDias, LocalDate ultimaManutencao, LocalDate proximaManutencao,
            boolean manutencaoVencida, LocalDate aquisicao, Number valor, String observacao,
            List<ManutencaoJson> manutencoes) {}

    public record ManutencaoJson(UUID id, LocalDate data, String descricao, Number custo) {}

    public record DadosEquipamento(String nome, String categoria, Integer quantidade, String local, String estado,
            Integer intervaloManutencaoDias, LocalDate ultimaManutencao, LocalDate aquisicao, BigDecimal valor,
            String observacao) {}

    // estado: como ficou depois da manutenção; lancarDespesa: custo vira despesa paga
    public record NovaManutencao(LocalDate data, String descricao, BigDecimal custo, String estado,
            Boolean lancarDespesa, String formaPagamento) {}

    // ---------- Responsáveis (kids) ----------

    public record DependenteJson(RefAluno aluno, String parentesco, RefFaixa faixa, String modalidade) {}

    public record ResponsavelJson(UUID id, String nome, String telefone, String email, String cpf, String codigo,
            List<DependenteJson> dependentes) {}

    public record PainelResponsaveis(List<ResponsavelJson> responsaveis, List<RefAluno> kidsSemResponsavel) {}

    public record DadosResponsavel(String nome, String telefone, String email, String cpf) {}

    public record NovoDependente(UUID alunoId, String parentesco) {}

    // ---------- Comunicação ----------

    public record ComunicadoJson(UUID id, String titulo, String texto, String publico, String filtro, boolean whatsapp,
            boolean mural, LocalDate muralAte, OffsetDateTime criadoEm, int destinatarios, int enviados) {}

    public record EnvioJson(UUID id, UUID alunoId, String aluno, String nome, String telefone, String texto,
            OffsetDateTime enviadoEm) {}

    public record ComunicadoDetalhe(ComunicadoJson comunicado, List<EnvioJson> envios) {}

    public record DadosComunicado(String titulo, String texto, String publico, UUID filtroId, Boolean whatsapp,
            Boolean mural, LocalDate muralAte) {}

    public record Previa(int destinatarios, List<String> exemplos, int semTelefone) {}

    // ---------- Presença ----------

    public record AulaDeHoje(UUID horarioId, String aula, RefModalidade modalidade, String hora, String fim,
            String sala, String professor, int ocupados, int capacidade, int presentes,
            // "concluida" | "em_andamento" | "proxima" | "agendada"
            String status) {}

    public record LinhaRankingPresenca(RefAluno aluno, RefFaixa faixa, String modalidade, int aulas) {}

    public record Conquista(String id, String titulo, String descricao, boolean conquistada, String quando) {}

    public record PainelPresenca(List<AulaDeHoje> aulas, int presencasHoje, List<LinhaRankingPresenca> rankingMes,
            String linkPresenca) {}

    // Página do QR Code (sem login): identifica pelo CPF ou telefone.
    public record PaginaPresenca(String academia, List<AulaDeHoje> aulas) {}

    public record PedidoPresenca(String documento, UUID horarioId) {}

    public record RespostaPresenca(boolean ok, String mensagem, String aluno, String aula, int aulasNaFaixa,
            String faixa) {}

    // ---------- Área do aluno e do responsável ----------

    public record AvisoMural(UUID id, String titulo, String texto, OffsetDateTime quando) {}

    public record AreaAluno(String academia, String whatsapp, FichaLutas ficha, List<TecnicaJson> curriculo,
            List<EventoResumo> eventos, List<AvisoMural> avisos, List<ProdutoJson> loja,
            List<LinhaRankingPresenca> ranking) {}

    public record FilhoResumo(FichaLutas ficha, int presencasMes, List<CobrancaAberta> cobrancas) {}

    public record CobrancaAberta(UUID id, String descricao, Number valor, LocalDate vencimento, String situacao) {}

    public record AreaResponsavel(String academia, String whatsapp, String nome, List<FilhoResumo> filhos,
            List<AvisoMural> avisos) {}

    public record InscricaoAluno(UUID eventoId, String categoria, BigDecimal peso) {}

    // ---------- Dashboard ----------

    public record FatiaModalidade(String nome, String cor, int alunos, int percentual) {}

    public record StatusMatriculas(int ativas, int emRenovacao, int emAtraso, int canceladas, int total) {}

    public record Permanencia(int valor, int variacao, int base) {}

    public record PresencasHoje(int valor, int variacao, int alunosAtivos, int percentual) {}

    // tipo: "aptos_graduar" | "exame" | "evento" | "equipamentos" | "filiacoes" | "kids_sem_responsavel" | "estoque"
    public record AlertaLutas(String tipo, String titulo, String descricao) {}

    // tipo: "graduacao" | "checkin" | "inscricao" | "venda" | "exame"
    public record AtividadeLutas(String tipo, String texto, String detalhe, String quando, OffsetDateTime momento) {}

    public record DashboardLutas(
            String lema,
            List<AulaDeHoje> agendaHoje,
            List<FatiaModalidade> modalidades,
            int totalAlunosModalidades,
            StatusMatriculas statusMatriculas,
            Permanencia permanencia,
            PresencasHoje presencasHoje,
            List<AlertaLutas> alertas,
            List<AtividadeLutas> atividades) {}

    public record Json(JsonNode valor) {}
}
