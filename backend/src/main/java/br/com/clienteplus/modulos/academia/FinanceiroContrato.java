package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.TreinosContrato.Referencia;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formatos de entrada e saída de Despesas, Resultado, Comissão e Benefícios.
// Contrato com o frontend: frontend/src/lib/academia-financeiro.ts.
public final class FinanceiroContrato {

    private FinanceiroContrato() {}

    // ---------- Despesas ----------

    public record DadosDespesa(
            String descricao,
            String categoria,
            String fornecedor,
            BigDecimal valor,
            LocalDate vencimento,
            Boolean recorrente,
            String observacao) {}

    // data vazia = hoje
    public record PagarDespesa(String formaPagamento, LocalDate data) {}

    // status: "pendente" | "atrasada" | "paga" | "cancelada"
    public record DespesaJson(
            UUID id,
            String descricao,
            String categoria,
            String fornecedor,
            Number valor,
            LocalDate vencimento,
            String status,
            OffsetDateTime pagoEm,
            String formaPagamento,
            boolean recorrente,
            String observacao) {}

    public record ResumoDespesas(
            Number pagoMes, int qtdPagoMes, Number aPagarMes, int qtdAPagarMes, Number atrasadas, int qtdAtrasadas) {}

    public record PainelDespesas(ResumoDespesas resumo, List<DespesaJson> despesas) {}

    // ---------- Resultado ----------

    public record ValorCategoria(String categoria, Number valor) {}

    // receita = mensalidades + serviços recebidos; despesas = pagas no mês
    public record ResultadoMes(
            String mes, int ano, int numeroMes, Number mensalidades, Number servicos, Number receita, Number despesas,
            Number resultado) {}

    public record Resultado(List<ResultadoMes> meses, List<ValorCategoria> despesasPorCategoria,
            List<ValorCategoria> receitaPorForma) {}

    // ---------- Comissão dos profissionais ----------

    public record ItemComissao(
            UUID vendaId, LocalDate pagoEm, String aluno, String servico, Number valor, Number pct, Number comissao) {}

    // paga = já registrada como despesa neste mês
    public record ComissaoProfissional(
            Referencia profissional,
            int atendimentos,
            Number vendido,
            Number comissao,
            boolean paga,
            OffsetDateTime pagaEm,
            List<ItemComissao> itens) {}

    public record ComissoesProfissionais(String competencia, Number total, Number pago, List<ComissaoProfissional> profissionais) {}

    // ---------- Comissão de indicações (simulação do Cliente Plus) ----------

    public record LinhaIndicacao(
            LocalDate data,
            Referencia pagante,
            Referencia beneficiario,
            int nivel,
            String origem,
            Number base,
            Number pct,
            Number comissao) {}

    public record Indicador(Referencia aluno, int indicadosAtivos, int rede, Number comissaoMes) {}

    public record ComissoesIndicacoes(
            String competencia,
            List<Number> percentuais,
            Number total,
            int pagamentosComComissao,
            int indicadores,
            List<Indicador> ranking,
            List<LinhaIndicacao> linhas) {}

    // ---------- Benefícios ----------

    public record DadosBeneficio(
            String titulo,
            String descricao,
            String tipo,
            Integer regra,
            String recompensa,
            String parceiro,
            String codigo,
            LocalDate validade,
            Boolean ativo) {}

    public record BeneficioJson(
            UUID id,
            String titulo,
            String descricao,
            String tipo,
            Integer regra,
            String recompensa,
            String parceiro,
            String codigo,
            LocalDate validade,
            boolean ativo,
            int elegiveis,
            int resgatados,
            int aEntregar) {}

    // situacao: "disponivel" | "resgatado" (falta entregar) | "entregue"
    public record Elegivel(
            UUID alunoId, String nome, String motivo, String situacao, UUID resgateId, OffsetDateTime resgatadoEm,
            String origem) {}

    public record DetalheBeneficio(BeneficioJson beneficio, String referencia, List<Elegivel> alunos) {}

    public record NovoResgate(UUID alunoId) {}

    // Área do cliente: situacao "bloqueado" (ainda não atingiu), "disponivel",
    // "resgatado", "entregue"; progresso = quanto falta ("Indique mais 2").
    public record BeneficioDoAluno(BeneficioJson beneficio, String situacao, String progresso, int atual, Integer meta) {}

    public record BeneficiosDoAluno(String academia, String aluno, List<BeneficioDoAluno> beneficios) {}
}
