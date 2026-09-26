package br.com.clienteplus.modulos.academia;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formato de GET /api/academia/relatorios.
// Contrato com o frontend: frontend/src/lib/academia-relatorios.ts.
public final class RelatoriosContrato {

    private RelatoriosContrato() {}

    // ---------- Alunos ----------

    // churn = cancelados no mês / ativos no início do mês (%)
    public record AlunosMes(String mes, int ano, int ativosFim, int novos, int cancelados, double churn) {}

    public record ResumoAlunos(
            int ativos,
            int novosPeriodo,
            int canceladosPeriodo,
            double churnMedio,
            Number ticketMedio,
            double tempoMedioMeses) {}

    public record Aniversariante(UUID alunoId, String nome, int dia, Integer idade, String telefone) {}

    public record RelatorioAlunos(ResumoAlunos resumo, List<AlunosMes> meses, List<Aniversariante> aniversariantes) {}

    // ---------- Frequência ----------

    // faixa: "7_dias" | "14_dias" | "30_dias" | "nunca"
    public record AlunoSumido(
            UUID alunoId, String nome, String telefone, String plano, OffsetDateTime ultimaEntrada, Integer diasSemVir,
            String faixa) {}

    public record Frequentador(UUID alunoId, String nome, int entradas) {}

    public record RelatorioFrequencia(
            double mediaSemanalPorAluno,
            int alunosQueVieram,
            int ativos,
            List<AlunoSumido> sumidos,
            List<Frequentador> maisFrequentes) {}

    // ---------- Inadimplência ----------

    public record Devedor(
            UUID alunoId, String nome, String telefone, String plano, LocalDate vencimentoMaisAntigo, int diasAtraso,
            int mensalidades, Number valor) {}

    public record RelatorioInadimplencia(Number total, int alunos, List<Devedor> devedores) {}

    // ---------- Aulas ----------

    // ocupacao = % média das vagas usadas; presenca = presentes / (presentes + faltas)
    public record AulaRelatorio(
            String aula, String professor, int sessoes, int capacidade, double mediaAlunos, int ocupacao, Integer presenca,
            int faltas) {}

    // ---------- Profissionais ----------

    public record ProfissionalRelatorio(
            UUID id,
            String nome,
            String especialidade,
            int alunosComFicha,
            int fichasMontadas,
            int avaliacoes,
            int atendimentos,
            int aulasDadas,
            Number comissao) {}

    public record Relatorios(
            int dias,
            LocalDate de,
            LocalDate ate,
            RelatorioAlunos alunos,
            RelatorioFrequencia frequencia,
            RelatorioInadimplencia inadimplencia,
            List<AulaRelatorio> aulas,
            List<ProfissionalRelatorio> profissionais) {}
}
