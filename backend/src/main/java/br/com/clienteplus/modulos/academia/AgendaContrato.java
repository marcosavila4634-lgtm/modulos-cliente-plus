package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.TreinosContrato.Referencia;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formatos de entrada e saída de Serviços, Agenda e Aulas e turmas.
// Contrato com o frontend: frontend/src/lib/academia-agenda.ts.
public final class AgendaContrato {

    private AgendaContrato() {}

    // ---------- Serviços e vendas ----------

    public record DadosServico(
            String nome,
            String descricao,
            String categoria,
            BigDecimal preco,
            Integer duracaoMinutos,
            UUID profissionalId,
            BigDecimal comissaoPct,
            Boolean participaIndicacoes,
            Boolean ativo) {}

    // valor vazio = preço do serviço × quantidade; vencimento vazio = hoje.
    // receberAgora = já registra o pagamento (formaPagamento obrigatória).
    public record NovaVenda(
            UUID alunoId,
            UUID servicoId,
            UUID profissionalId,
            Integer quantidade,
            BigDecimal valor,
            LocalDate vencimento,
            Boolean receberAgora,
            String formaPagamento) {}

    public record ServicoJson(
            UUID id,
            String nome,
            String descricao,
            String categoria,
            Number preco,
            Integer duracaoMinutos,
            Referencia profissional,
            Number comissaoPct,
            boolean participaIndicacoes,
            boolean ativo,
            int vendasMes,
            Number receitaMes) {}

    // status: "pendente" | "atrasada" | "paga" | "cancelada" (o do pagamento)
    public record VendaJson(
            UUID id,
            Referencia aluno,
            Referencia servico,
            Referencia profissional,
            int quantidade,
            Number valor,
            Number comissaoPct,
            String status,
            LocalDate vencimento,
            OffsetDateTime pagoEm,
            String formaPagamento,
            UUID cobrancaId,
            OffsetDateTime criadaEm) {}

    public record PainelServicos(List<ServicoJson> servicos, List<VendaJson> vendas, Number vendidoMes, Number recebidoMes) {}

    // ---------- Agenda ----------

    // hora "14:30"; alunoId vazio = compromisso interno
    public record DadosAgendamento(
            UUID alunoId,
            UUID profissionalId,
            UUID servicoId,
            String tipo,
            String titulo,
            LocalDate data,
            String hora,
            Integer duracaoMinutos,
            String observacao) {}

    // status: "agendado" | "confirmado" | "concluido" | "faltou" | "cancelado".
    // Ao concluir um serviço com preço, gerarCobranca cria a venda.
    public record MudarStatus(String status, Boolean gerarCobranca) {}

    public record AgendamentoJson(
            UUID id,
            Referencia aluno,
            Referencia profissional,
            Referencia servico,
            String tipo,
            String titulo,
            OffsetDateTime inicio,
            OffsetDateTime fim,
            String status,
            String observacao,
            Number preco,
            UUID vendaId) {}

    // Uma aula da grade numa data (aparece na agenda e na grade da semana).
    public record AulaNaData(
            UUID horarioId,
            UUID aulaId,
            String nome,
            String cor,
            String sala,
            Referencia professor,
            LocalDate data,
            String hora,
            OffsetDateTime inicio,
            OffsetDateTime fim,
            int ocupados,
            int capacidade) {}

    public record ProfissionalAgenda(UUID id, String nome, String especialidade) {}

    public record PainelAgenda(
            LocalDate inicio,
            int dias,
            List<ProfissionalAgenda> profissionais,
            List<AgendamentoJson> agendamentos,
            List<AulaNaData> aulas) {}

    // ---------- Aulas e turmas ----------

    public record DadosHorario(int diaSemana, String hora) {}

    public record DadosAula(
            String nome,
            String descricao,
            UUID professorId,
            String sala,
            Integer capacidade,
            Integer duracaoMinutos,
            String cor,
            Boolean ativo,
            List<DadosHorario> horarios) {}

    public record HorarioAulaJson(UUID id, int diaSemana, String dia, String hora, int fixos) {}

    public record AulaJson(
            UUID id,
            String nome,
            String descricao,
            Referencia professor,
            String sala,
            int capacidade,
            int duracaoMinutos,
            String cor,
            boolean ativo,
            List<HorarioAulaJson> horarios) {}

    public record GradeAulas(LocalDate inicio, List<AulaJson> aulas, List<AulaNaData> semana) {}

    // tipo: "fixo" | "avulso"; status: "reservado" | "presente" | "faltou" | "cancelado"
    public record Participante(UUID alunoId, String nome, String tipo, String status, String origem) {}

    public record SessaoAula(
            AulaNaData aula,
            String diaSemana,
            boolean passou,
            List<Participante> participantes,
            int vagas,
            // presentes e faltas já marcados
            int presentes,
            int faltas) {}

    public record Reserva(UUID alunoId, LocalDate data) {}

    public record Chamada(UUID alunoId, LocalDate data, String status) {}

    public record NovoFixo(UUID alunoId) {}

    // Área do cliente: aulas dos próximos dias com a reserva do aluno.
    // minhaSituacao: null (não reservou) | "fixo" | "reservado" | "presente" | "faltou"
    public record AulaDoAluno(AulaNaData aula, String minhaSituacao, boolean podeReservar, String motivo) {}

    public record AulasDoAluno(String academia, String aluno, List<AulaDoAluno> aulas) {}
}
