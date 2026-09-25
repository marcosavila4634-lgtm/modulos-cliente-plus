package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.TreinosContrato.Referencia;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// Formatos de entrada e saída da Avaliação física.
// Contrato com o frontend: frontend/src/lib/academia-avaliacoes.ts.
public final class AvaliacoesContrato {

    private AvaliacoesContrato() {}

    // Dobras cutâneas em mm (protocolo de 7 dobras de Jackson & Pollock).
    public record Dobras(
            BigDecimal peitoral,
            BigDecimal axilar,
            BigDecimal triceps,
            BigDecimal subescapular,
            BigDecimal abdominal,
            BigDecimal suprailiaca,
            BigDecimal coxa) {}

    // Circunferências em cm.
    public record Medidas(
            BigDecimal peitoral,
            BigDecimal cintura,
            BigDecimal abdomen,
            BigDecimal quadril,
            BigDecimal bracoDireito,
            BigDecimal bracoEsquerdo,
            BigDecimal coxaDireita,
            BigDecimal coxaEsquerda,
            BigDecimal panturrilha) {}

    // ---------- Entrada ----------

    // metodoGordura: "nenhum" | "bioimpedancia" (gorduraPct digitado) |
    // "dobras_pollock7" (gorduraPct calculado pelas dobras)
    public record DadosAvaliacao(
            UUID alunoId,
            UUID profissionalId,
            LocalDate data,
            String sexo,
            Integer idade,
            BigDecimal peso,
            BigDecimal alturaCm,
            String metodoGordura,
            BigDecimal gorduraPct,
            Dobras dobras,
            Medidas medidas,
            Integer pressaoSistolica,
            Integer pressaoDiastolica,
            Integer fcRepouso,
            String objetivo,
            String restricoes,
            String observacoes) {}

    // ---------- Saída ----------

    // classificacaoImc: "abaixo" | "normal" | "sobrepeso" | "obesidade_1" | "obesidade_2" | "obesidade_3"
    public record AvaliacaoJson(
            UUID id,
            Referencia aluno,
            Referencia profissional,
            LocalDate data,
            String sexo,
            Integer idade,
            Number peso,
            Number alturaCm,
            Number imc,
            String classificacaoImc,
            String metodoGordura,
            Number gorduraPct,
            Number massaGordaKg,
            Number massaMagraKg,
            Number relacaoCinturaQuadril,
            Dobras dobras,
            Medidas medidas,
            Integer pressaoSistolica,
            Integer pressaoDiastolica,
            Integer fcRepouso,
            String objetivo,
            String restricoes,
            String observacoes) {}

    // situacao: "sem_avaliacao" | "pendente" (passou do prazo de reavaliação) | "em_dia"
    public record AlunoAvaliacao(
            UUID alunoId,
            String nome,
            String situacao,
            LocalDate ultima,
            LocalDate proxima,
            int total,
            Number peso,
            Number gorduraPct) {}

    public record ContagemAvaliacoes(int todos, int semAvaliacao, int pendentes, int emDia, int noMes) {}

    public record PainelAvaliacoes(
            int reavaliacaoDias, List<AlunoAvaliacao> alunos, List<AvaliacaoJson> recentes, ContagemAvaliacoes contagem) {}

    // idadeAtual e sexo sugeridos para a próxima avaliação
    public record HistoricoAvaliacoes(
            Referencia aluno,
            Integer idadeAtual,
            String sexo,
            String situacao,
            LocalDate proxima,
            List<AvaliacaoJson> avaliacoes) {}
}
