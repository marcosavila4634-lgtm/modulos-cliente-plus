package br.com.clienteplus.modulos.grupovip;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formato do JSON do Financeiro (Receitas, Assinaturas e Saques).
// Contrato com o frontend: frontend/src/lib/grupo-vip-financeiro.ts
public final class FinanceiroContrato {

    private FinanceiroContrato() {}

    // status: "pendente" | "atrasada" | "paga" | "cancelada"
    public record Cobranca(
            UUID id,
            UUID clienteId,
            String nome,
            String descricao,
            Number valor,
            LocalDate vencimento,
            String status,
            OffsetDateTime pagoEm,
            String formaPagamento,
            // "pagina" = comprou pela página de vendas; "painel" = lançado pela equipe
            String origem) {}

    public record ResumoReceitas(
            Number recebido,
            int qtdRecebido,
            Number recebidoMesAnterior,
            Number aReceber,
            int qtdAReceber,
            Number emAtraso,
            int qtdEmAtraso,
            Number ticketMedio) {}

    public record ValorDia(String dia, Number valor) {}

    public record ValorPor(String nome, Number valor, int quantidade) {}

    public record Receitas(
            String mes, // "2026-09"
            ResumoReceitas resumo,
            List<ValorDia> porDia,
            List<ValorPor> porPlano,
            List<ValorPor> porForma,
            List<Cobranca> recebidas,
            List<Cobranca> emAberto) {}

    public record AssinaturaLinha(
            UUID clienteId,
            String nome,
            String telefone,
            String plano,
            Number valor,
            int duracaoMeses,
            LocalDate inicio,
            String situacao,
            LocalDate proximoVencimento,
            UUID proximaCobrancaId,
            Number proximoValor,
            LocalDate pagoAte,
            OffsetDateTime canceladaEm) {}

    public record Assinaturas(
            List<AssinaturaLinha> assinaturas,
            // receita recorrente por mês (planos convertidos para valor mensal)
            Number receitaMensal,
            Number previsao30Dias,
            int ativas,
            int canceladasMes) {}

    // status: "solicitado" | "pago" | "recusado"
    public record SaqueJson(
            UUID id,
            UUID clienteId,
            String nome,
            String telefone,
            Number valor,
            String chavePix,
            String status,
            String motivo,
            OffsetDateTime createdAt,
            OffsetDateTime pagoEm,
            Number saldoDisponivel) {}

    public record Indicador(
            UUID clienteId,
            String nome,
            int indicados,
            int indicadosAtivos,
            Number comissaoMes,
            Number comissaoTotal,
            Number saldo) {}

    public record ComissaoLinha(LocalDate data, String beneficiario, String pagador, int nivel, Number percentual,
                                Number valorPagamento, Number valor) {}

    public record Saques(
            List<SaqueJson> saques,
            Number aPagar,
            Number pagoMes,
            Number comissoesMes,
            List<Indicador> indicadores,
            List<ComissaoLinha> comissoesRecentes,
            List<Number> percentuais) {}

    public record Receber(String formaPagamento) {}

    public record Recusar(String motivo) {}
}
