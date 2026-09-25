package br.com.clienteplus.modulos.academia;

import java.util.List;

// Formato da resposta de GET /api/academia/dashboard.
// Contrato com o frontend: frontend/src/lib/academia.ts (tipo DashboardAcademia).
public record DashboardAcademia(
        boolean demo,
        Academia academia,
        Gestor gestor,
        int notificacoes,
        String frase,
        Indicadores indicadores,
        List<EvolucaoAlunos> evolucaoAlunos,
        List<HorarioPico> horariosPico,
        List<Alerta> alertas,
        List<ReceitaDespesas> receitaDespesas,
        List<TipoPlano> tiposPlanos,
        List<Atividade> atividades) {

    public record Academia(String nome) {}

    public record Gestor(String nome, String cargo) {}

    // checkinsHoje fica null até existir o Check-in.
    public record Indicadores(
            ComUltimoMes alunosAtivos,
            ComMesAnterior matriculasMes,
            ComMesAnterior faturamentoMensal,
            ComMesAnterior inadimplencia,
            CheckinsHoje checkinsHoje) {}

    // variacao em %; noUltimoMes = novas matrículas nos últimos 30 dias
    public record ComUltimoMes(Number valor, Number variacao, Number noUltimoMes) {}

    // variacao em % (na inadimplência, em pontos percentuais)
    public record ComMesAnterior(Number valor, Number variacao, Number mesAnterior) {}

    public record CheckinsHoje(Number valor, Number variacao, String ultimo) {}

    public record EvolucaoAlunos(String mes, int ativos, int novos) {}

    // Vazio até existir o Check-in.
    public record HorarioPico(String hora, int ocupacao) {}

    // tipo: "mensalidades_atrasadas" | "vencem_em_breve" | "sem_matricula" | "cancelamentos"
    public record Alerta(String tipo, String titulo, String descricao) {}

    // despesas fica null até existir o lançamento de despesas.
    public record ReceitaDespesas(String mes, Number receita, Number despesas) {}

    public record TipoPlano(String nome, int percentual) {}

    // tipo: "matricula" | "pagamento" | "cancelamento" | "novo_aluno"
    public record Atividade(String tipo, String texto, String quando) {}
}
