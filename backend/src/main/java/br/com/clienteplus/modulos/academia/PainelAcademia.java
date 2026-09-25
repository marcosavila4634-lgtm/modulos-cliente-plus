package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.haQuanto;
import static br.com.clienteplus.modulos.comum.Formatos.mesAbreviado;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.DashboardAcademia.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.stream.Collectors;

// Calcula os números do Dashboard da academia a partir dos alunos, matrículas
// e mensalidades (clientes, assinaturas e pagamentos do Cliente Plus).
//
// - Aluno ativo = matrícula ativa naquele dia (inclui quem está em atraso).
// - Inadimplência = % dos alunos ativos com alguma mensalidade vencida e não
//   paga naquele dia.
// - Faturamento/receita = mensalidades pagas no mês (pela data do pagamento).
// - Check-ins hoje e horários de pico: a partir dos acessos liberados.
@ApplicationScoped
public class PainelAcademia {

    private static final int MESES_NOS_GRAFICOS = 6;
    private static final Locale PT_BR = Locale.of("pt", "BR");

    @Inject
    HorariosPico pico;

    public DashboardAcademia montar(UUID storeId) {
        AcademiaPainel painel = AcademiaPainel.<AcademiaPainel>find("storeId", storeId)
                .firstResultOptional()
                .orElseThrow(() -> new NotFoundException("Painel da academia não encontrado"));

        Dados d = new Dados(
                Cliente.list("storeId", storeId),
                Assinatura.list("storeId", storeId),
                Pagamento.list("storeId", storeId),
                Ficha.list("storeId = ?1 and status = ?2 and cliente is not null", storeId, Ficha.ATIVA),
                Matriculas.hoje());

        List<Alerta> alertas = alertas(d);

        return new DashboardAcademia(
                true,
                new Academia(painel.nomeAcademia),
                new Gestor(painel.gestorNome, painel.gestorCargo),
                alertas.size(),
                painel.frase,
                indicadores(d, checkinsHoje(storeId)),
                evolucao(d),
                pico.paraDashboard(storeId),
                alertas,
                receita(d),
                tiposPlanos(d),
                atividades(d));
    }

    // Tudo o que o cálculo usa, carregado uma vez só.
    private record Dados(
            List<Cliente> clientes,
            List<Assinatura> matriculas,
            List<Pagamento> pagamentos,
            List<Ficha> fichas,
            LocalDate hoje) {

        YearMonth mesAtual() {
            return YearMonth.from(hoje);
        }

        List<Assinatura> ativasEm(LocalDate dia) {
            return matriculas.stream().filter(m -> ativaEm(m, dia)).toList();
        }

        long matriculasEntre(LocalDate de, LocalDate ate) {
            return matriculas.stream()
                    .filter(m -> !m.inicio.isBefore(de) && !m.inicio.isAfter(ate))
                    .count();
        }

        BigDecimal recebidoNoMes(YearMonth mes) {
            return pagamentos.stream()
                    .filter(p -> Pagamento.PAGO.equals(p.status) && YearMonth.from(dia(p.pagoEm)).equals(mes))
                    .map(p -> p.valor)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // % de alunos ativos com mensalidade vencida e não paga naquele dia.
        double inadimplenciaEm(LocalDate dia) {
            List<Assinatura> ativas = ativasEm(dia);
            if (ativas.isEmpty()) return 0;
            Set<UUID> emAtraso = pagamentos.stream()
                    .filter(p -> p.vencimento.isBefore(dia)
                            && !(Pagamento.PAGO.equals(p.status) && !dia(p.pagoEm).isAfter(dia)))
                    .map(p -> p.assinatura.id)
                    .collect(Collectors.toSet());
            long atrasados = ativas.stream().filter(m -> emAtraso.contains(m.id)).count();
            return Math.round(atrasados * 1000.0 / ativas.size()) / 10.0;
        }
    }

    private static boolean ativaEm(Assinatura m, LocalDate dia) {
        if (m.inicio.isAfter(dia)) return false;
        if (Assinatura.ATIVA.equals(m.status)) return true;
        return m.canceladaEm != null && dia(m.canceladaEm).isAfter(dia);
    }

    private static LocalDate dia(OffsetDateTime instante) {
        return instante.atZoneSameInstant(FUSO).toLocalDate();
    }

    // ---------- Cards do topo ----------

    private static Indicadores indicadores(Dados d, CheckinsHoje checkins) {
        LocalDate hoje = d.hoje();
        YearMonth mes = d.mesAtual();
        YearMonth anterior = mes.minusMonths(1);

        int ativos = d.ativasEm(hoje).size();
        int ativos30Dias = d.ativasEm(hoje.minusDays(30)).size();
        long novas30Dias = d.matriculasEntre(hoje.minusDays(29), hoje);

        long matriculasMes = d.matriculasEntre(mes.atDay(1), hoje);
        long matriculasAnterior = d.matriculasEntre(anterior.atDay(1), anterior.atEndOfMonth());

        BigDecimal faturamento = d.recebidoNoMes(mes);
        BigDecimal faturamentoAnterior = d.recebidoNoMes(anterior);

        double inadimplencia = d.inadimplenciaEm(hoje);
        double inadimplenciaAnterior = d.inadimplenciaEm(anterior.atEndOfMonth());

        return new Indicadores(
                new ComUltimoMes(ativos, variacao(ativos, ativos30Dias), novas30Dias),
                new ComMesAnterior(matriculasMes, variacao(matriculasMes, matriculasAnterior), matriculasAnterior),
                new ComMesAnterior(
                        numero(faturamento),
                        variacao(faturamento.doubleValue(), faturamentoAnterior.doubleValue()),
                        numero(faturamentoAnterior)),
                new ComMesAnterior(
                        inadimplencia,
                        Math.round((inadimplencia - inadimplenciaAnterior) * 10) / 10.0,
                        inadimplenciaAnterior),
                checkins);
    }

    // Entradas liberadas hoje, comparadas com o mesmo dia da semana passada até
    // a mesma hora.
    private static CheckinsHoje checkinsHoje(UUID storeId) {
        LocalDate hoje = Matriculas.hoje();
        List<Acesso> deHoje = Acesso.list(
                "storeId = ?1 and resultado = ?2 and momento >= ?3 order by momento desc",
                storeId, Acesso.LIBERADO, Acessos.inicioDo(hoje));
        long semanaPassada = Acesso.count("storeId = ?1 and resultado = ?2 and momento >= ?3 and momento < ?4",
                storeId, Acesso.LIBERADO, Acessos.inicioDo(hoje.minusWeeks(1)), OffsetDateTime.now().minusWeeks(1));
        return new CheckinsHoje(
                deHoje.size(),
                variacao(deHoje.size(), semanaPassada),
                deHoje.isEmpty() ? "nenhum ainda" : haQuanto(deHoje.get(0).momento));
    }

    // Variação percentual inteira entre dois valores (ex.: 110 vs 100 -> 10).
    private static long variacao(double atual, double anterior) {
        if (anterior == 0) return atual > 0 ? 100 : 0;
        return Math.round((atual - anterior) * 100 / anterior);
    }

    // ---------- Gráficos ----------

    private static List<YearMonth> ultimosMeses(Dados d) {
        List<YearMonth> meses = new ArrayList<>();
        for (int i = MESES_NOS_GRAFICOS - 1; i >= 0; i--) meses.add(d.mesAtual().minusMonths(i));
        return meses;
    }

    private static List<EvolucaoAlunos> evolucao(Dados d) {
        return ultimosMeses(d).stream()
                .map(mes -> {
                    // mês atual: até hoje; meses passados: até o último dia
                    LocalDate fim = mes.equals(d.mesAtual()) ? d.hoje() : mes.atEndOfMonth();
                    return new EvolucaoAlunos(
                            mesAbreviado(mes.atDay(1)),
                            d.ativasEm(fim).size(),
                            (int) d.matriculasEntre(mes.atDay(1), fim));
                })
                .toList();
    }

    private static List<ReceitaDespesas> receita(Dados d) {
        return ultimosMeses(d).stream()
                .map(mes -> new ReceitaDespesas(mesAbreviado(mes.atDay(1)), numero(d.recebidoNoMes(mes)), null))
                .toList();
    }

    // Percentual dos alunos ativos em cada plano, do mais usado para o menos.
    private static List<TipoPlano> tiposPlanos(Dados d) {
        List<Assinatura> ativas = d.ativasEm(d.hoje());
        if (ativas.isEmpty()) return List.of();
        return ativas.stream()
                .collect(Collectors.groupingBy(m -> m.plano.nome, Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new TipoPlano(e.getKey(), (int) Math.round(e.getValue() * 100.0 / ativas.size())))
                .toList();
    }

    // ---------- Requer atenção ----------

    private static List<Alerta> alertas(Dados d) {
        LocalDate hoje = d.hoje();
        List<Alerta> alertas = new ArrayList<>();
        Set<UUID> ativas = d.ativasEm(hoje).stream().map(m -> m.id).collect(Collectors.toSet());
        Predicate<Pagamento> emAbertoDeAtiva =
                p -> Pagamento.PENDENTE.equals(p.status) && ativas.contains(p.assinatura.id);

        List<Pagamento> atrasadas = d.pagamentos().stream()
                .filter(emAbertoDeAtiva.and(p -> p.vencimento.isBefore(hoje)))
                .toList();
        long alunosAtrasados = atrasadas.stream().map(p -> p.cliente.id).distinct().count();
        if (alunosAtrasados > 0) {
            alertas.add(new Alerta(
                    "mensalidades_atrasadas",
                    plural(alunosAtrasados, "aluno com mensalidade atrasada", "alunos com mensalidade atrasada"),
                    moeda(soma(atrasadas)) + " em atraso"));
        }

        List<Pagamento> vencendo = d.pagamentos().stream()
                .filter(emAbertoDeAtiva.and(p -> !p.vencimento.isBefore(hoje) && !p.vencimento.isAfter(hoje.plusDays(7))))
                .toList();
        if (!vencendo.isEmpty()) {
            alertas.add(new Alerta(
                    "vencem_em_breve",
                    plural(vencendo.size(), "mensalidade vence", "mensalidades vencem") + " em até 7 dias",
                    moeda(soma(vencendo)) + " a receber"));
        }

        Set<UUID> comMatricula = d.ativasEm(hoje).stream().map(m -> m.cliente.id).collect(Collectors.toSet());
        long semMatricula = d.clientes().stream().filter(c -> !comMatricula.contains(c.id)).count();
        if (semMatricula > 0) {
            alertas.add(new Alerta(
                    "sem_matricula",
                    plural(semMatricula, "aluno sem matrícula", "alunos sem matrícula"),
                    "Oportunidade de matrícula ou rematrícula"));
        }

        // Fichas de treino dos alunos ativos que precisam ser renovadas.
        Map<String, Long> fichasPorSituacao = d.fichas().stream()
                .filter(f -> comMatricula.contains(f.cliente.id))
                .collect(Collectors.groupingBy(Treinos::situacao, Collectors.counting()));
        long fichasVencidas = fichasPorSituacao.getOrDefault("vencida", 0L);
        long fichasVencendo = fichasPorSituacao.getOrDefault("vence_em_breve", 0L);
        if (fichasVencidas + fichasVencendo > 0) {
            alertas.add(new Alerta(
                    "fichas_treino",
                    plural(fichasVencidas + fichasVencendo, "ficha de treino para renovar", "fichas de treino para renovar"),
                    fichasVencidas + " vencidas · " + fichasVencendo + " vencem em até 7 dias"));
        }

        YearMonth mes = d.mesAtual();
        long cancelamentos = cancelamentosNoMes(d, mes);
        if (cancelamentos > 0) {
            alertas.add(new Alerta(
                    "cancelamentos",
                    plural(cancelamentos, "cancelamento", "cancelamentos") + " em "
                            + mes.getMonth().getDisplayName(TextStyle.FULL, PT_BR),
                    "Mês anterior: " + cancelamentosNoMes(d, mes.minusMonths(1))));
        }
        return alertas;
    }

    private static long cancelamentosNoMes(Dados d, YearMonth mes) {
        return d.matriculas().stream()
                .filter(m -> m.canceladaEm != null && YearMonth.from(dia(m.canceladaEm)).equals(mes))
                .count();
    }

    private static String plural(long n, String singular, String plural) {
        return n + " " + (n == 1 ? singular : plural);
    }

    private static BigDecimal soma(List<Pagamento> pagamentos) {
        return pagamentos.stream().map(p -> p.valor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static String moeda(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(PT_BR).format(valor).replace(' ', ' ');
    }

    // ---------- Últimas atividades ----------

    private record Evento(OffsetDateTime quando, String tipo, String texto) {}

    private static List<Atividade> atividades(Dados d) {
        List<Evento> eventos = new ArrayList<>();
        Set<UUID> comAlgumaMatricula = new HashSet<>();
        for (Assinatura m : d.matriculas()) {
            comAlgumaMatricula.add(m.cliente.id);
            eventos.add(new Evento(m.createdAt, "matricula",
                    "Nova matrícula - " + m.cliente.nome + " (" + m.plano.nome + ")"));
            if (m.canceladaEm != null) {
                eventos.add(new Evento(m.canceladaEm, "cancelamento", "Matrícula cancelada - " + m.cliente.nome));
            }
        }
        for (Pagamento p : d.pagamentos()) {
            if (Pagamento.PAGO.equals(p.status) && p.pagoEm != null) {
                eventos.add(new Evento(p.pagoEm, "pagamento",
                        "Mensalidade recebida - " + p.cliente.nome));
            }
        }
        for (Cliente c : d.clientes()) {
            if (!comAlgumaMatricula.contains(c.id)) {
                eventos.add(new Evento(c.createdAt, "novo_aluno", "Novo aluno cadastrado - " + c.nome));
            }
        }

        OffsetDateTime agora = OffsetDateTime.now();
        return eventos.stream()
                .filter(e -> e.quando() != null && !e.quando().isAfter(agora))
                .sorted(Comparator.comparing(Evento::quando).reversed())
                .limit(5)
                .map(e -> new Atividade(e.tipo(), e.texto(), haQuanto(e.quando())))
                .toList();
    }
}
