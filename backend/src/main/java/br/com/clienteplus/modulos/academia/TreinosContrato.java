package br.com.clienteplus.modulos.academia;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formatos de entrada e saída de Profissionais, Exercícios, Treinos e da
// área do cliente. Contrato com o frontend: frontend/src/lib/academia-treinos.ts.
public final class TreinosContrato {

    private TreinosContrato() {}

    // ---------- Entrada ----------

    public record DadosProfissional(
            String nome, String especialidade, String telefone, String email, String registro, Boolean ativo) {}

    public record DadosExercicio(
            String nome,
            String grupoMuscular,
            String equipamento,
            String instrucoes,
            String imagemUrl,
            String videoUrl,
            String videoLink,
            Boolean ativo) {}

    // alunoId vazio = novo modelo; modeloId preenchido = copiar desse modelo
    public record NovaFicha(UUID alunoId, UUID modeloId) {}

    // Ficha inteira, como está no editor. As letras (A, B, C...) seguem a ordem.
    public record DadosFicha(
            String nome,
            String objetivo,
            String observacoes,
            UUID professorId,
            LocalDate inicio,
            LocalDate validade,
            List<DadosTreino> treinos) {}

    public record DadosTreino(String nome, List<DadosItem> exercicios) {}

    public record DadosItem(
            UUID exercicioId,
            Integer series,
            String repeticoes,
            String carga,
            Integer descansoSegundos,
            String observacao) {}

    // ---------- Saída ----------

    public record ProfissionalJson(
            UUID id,
            String nome,
            String especialidade,
            String telefone,
            String email,
            String registro,
            boolean ativo,
            long alunos) {}

    public record ExercicioJson(
            UUID id,
            String nome,
            String grupoMuscular,
            String equipamento,
            String instrucoes,
            String imagemUrl,
            String videoUrl,
            String videoLink,
            boolean ativo) {}

    public record ArquivoJson(String url, String nome, String tipo) {}

    public record Referencia(UUID id, String nome) {}

    public record ItemJson(
            UUID id,
            ExercicioJson exercicio,
            Integer series,
            String repeticoes,
            String carga,
            Integer descansoSegundos,
            String observacao) {}

    public record TreinoJson(UUID id, String letra, String nome, List<ItemJson> exercicios) {}

    // situacao: "vencida" | "vence_em_breve" | "em_dia" (modelos: "em_dia")
    public record FichaJson(
            UUID id,
            boolean modelo,
            Referencia aluno,
            String nome,
            String objetivo,
            String observacoes,
            Referencia professor,
            LocalDate inicio,
            LocalDate validade,
            String situacao,
            String status,
            OffsetDateTime atualizadaEm,
            List<TreinoJson> treinos) {}

    public record FichaResumo(
            UUID id,
            String nome,
            String professor,
            LocalDate inicio,
            LocalDate validade,
            String situacao,
            String divisoes) {}

    // situacao: "sem_ficha" | "vencida" | "vence_em_breve" | "em_dia"
    public record AlunoTreino(UUID alunoId, String nome, String situacao, FichaResumo ficha) {}

    public record ModeloResumo(
            UUID id, String nome, String objetivo, String professor, String divisoes, int exercicios, long alunos) {}

    public record ContagemTreinos(int todos, int semFicha, int vencidas, int venceEmBreve, int emDia) {}

    public record PainelTreinos(List<AlunoTreino> alunos, List<ModeloResumo> modelos, ContagemTreinos contagem) {}

    // Área do cliente (Cliente Plus): o que o aluno vê.
    // registrosHoje: o que já marcou hoje; ultimasCargas: a última carga
    // anotada em cada exercício (para sugerir); diasTreinadosMes: dias com
    // algum exercício feito no mês.
    public record TreinoDoAluno(
            String academia,
            String aluno,
            FichaJson ficha,
            List<RegistroJson> registrosHoje,
            List<UltimaCarga> ultimasCargas,
            int diasTreinadosMes) {}

    public record RegistroJson(String letra, UUID exercicioId, boolean feito, Number cargaKg) {}

    public record UltimaCarga(UUID exercicioId, Number cargaKg, LocalDate data) {}

    // Marcar/desmarcar um exercício de hoje. cargaKg vazio = não anotou.
    public record DadosRegistro(String letra, UUID exercicioId, Boolean feito, java.math.BigDecimal cargaKg) {}

    // ---------- Para o professor: treinos feitos e evolução de carga ----------

    public record PontoCarga(LocalDate data, Number cargaKg) {}

    public record EvolucaoExercicio(UUID exercicioId, String nome, String grupoMuscular, List<PontoCarga> pontos) {}

    public record TreinosFeitos(
            int diasMes, int dias30, LocalDate ultimoTreino, List<EvolucaoExercicio> exercicios) {}
}
