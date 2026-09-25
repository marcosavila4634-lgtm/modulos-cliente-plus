package br.com.clienteplus.modulos.academia;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formatos de entrada e saída das telas de Alunos e Faturamento.
// Contrato com o frontend: frontend/src/lib/academia-alunos.ts.
public final class AlunosContrato {

    private AlunosContrato() {}

    // ---------- Entrada ----------

    public record DadosAluno(String nome, String email, String telefone, String cpf, LocalDate dataNascimento) {}

    // inicio vazio = hoje
    public record NovaMatricula(UUID planoId, LocalDate inicio) {}

    // "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto"
    public record Receber(String formaPagamento) {}

    // ---------- Saída ----------

    public record PlanoJson(UUID id, String nome, String descricao, Number preco, int duracaoMeses) {}

    // situacao: "ativo" | "em_atraso" | "sem_matricula"
    public record AlunoResumo(
            UUID id,
            String nome,
            String telefone,
            String email,
            String plano,
            LocalDate proximoVencimento,
            String situacao,
            OffsetDateTime alunoDesde) {}

    public record Contagem(int todos, int ativo, int emAtraso, int semMatricula) {}

    public record ListaAlunos(List<AlunoResumo> alunos, Contagem contagem) {}

    public record MatriculaAtual(UUID id, PlanoJson plano, Number valor, LocalDate inicio, LocalDate proximoVencimento) {}

    // status: "pendente" | "atrasada" | "paga" | "cancelada"
    public record Cobranca(
            UUID id,
            UUID alunoId,
            String aluno,
            String plano,
            Number valor,
            LocalDate vencimento,
            String status,
            OffsetDateTime pagoEm,
            String formaPagamento) {}

    public record AlunoDetalhe(
            UUID id,
            String nome,
            String email,
            String telefone,
            String cpf,
            LocalDate dataNascimento,
            OffsetDateTime alunoDesde,
            String situacao,
            MatriculaAtual matricula,
            List<Cobranca> cobrancas) {}

    // Cards do topo do Faturamento (mês atual).
    public record ResumoFaturamento(
            Number recebidoMes,
            int qtdRecebidoMes,
            Number aReceberMes,
            int qtdAReceberMes,
            Number emAtraso,
            int qtdEmAtraso) {}

    public record Faturamento(ResumoFaturamento resumo, List<Cobranca> cobrancas) {}
}
