package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.RelatoriosContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Formatos;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Collator;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// Relatórios da academia. Período = últimos N dias (aulas, profissionais,
// novos/cancelados); séries mensais = últimos 6 meses.
@ApplicationScoped
public class Relatorios {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    @Inject
    Aulas aulas;

    Base carregar(UUID storeId) {
        return new Base(
                Cliente.list("storeId", storeId),
                Assinatura.list("storeId", storeId),
                Pagamento.list("storeId", storeId),
                Matriculas.hoje());
    }

    record Base(List<Cliente> clientes, List<Assinatura> matriculas, List<Pagamento> pagamentos, LocalDate hoje) {

        boolean ativaEm(Assinatura m, LocalDate dia) {
            if (m.inicio.isAfter(dia)) return false;
            if (Assinatura.ATIVA.equals(m.status)) return true;
            return m.canceladaEm != null && Acessos.dia(m.canceladaEm).isAfter(dia);
        }

        List<Assinatura> ativasHoje() {
            return matriculas.stream().filter(m -> Assinatura.ATIVA.equals(m.status)).toList();
        }
    }

    public RelatoriosContrato.Relatorios montar(UUID storeId, int dias) {
        Base b = carregar(storeId);
        LocalDate de = b.hoje().minusDays(dias - 1);
        return new RelatoriosContrato.Relatorios(
                dias,
                de,
                b.hoje(),
                alunos(b, de),
                frequencia(storeId, b),
                inadimplencia(b),
                aulas(storeId, de, b.hoje()),
                profissionais(storeId, de));
    }

    // ---------- Alunos ----------

    private static RelatorioAlunos alunos(Base b, LocalDate de) {
        YearMonth atual = YearMonth.from(b.hoje());
        List<AlunosMes> meses = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth m = atual.minusMonths(i);
            LocalDate inicio = m.atDay(1);
            LocalDate fim = m.equals(atual) ? b.hoje() : m.atEndOfMonth();
            long ativosInicio = b.matriculas().stream().filter(x -> b.ativaEm(x, inicio.minusDays(1))).count();
            long ativosFim = b.matriculas().stream().filter(x -> b.ativaEm(x, fim)).count();
            long novos = b.matriculas().stream().filter(x -> !x.inicio.isBefore(inicio) && !x.inicio.isAfter(fim)).count();
            long cancelados = b.matriculas().stream()
                    .filter(x -> x.canceladaEm != null && YearMonth.from(Acessos.dia(x.canceladaEm)).equals(m))
                    .count();
            double churn = ativosInicio > 0 ? Math.round(cancelados * 1000.0 / ativosInicio) / 10.0 : 0;
            meses.add(new AlunosMes(Formatos.mesAbreviado(inicio), m.getYear(), (int) ativosFim, (int) novos,
                    (int) cancelados, churn));
        }

        List<Assinatura> ativas = b.ativasHoje();
        int novosPeriodo = (int) b.matriculas().stream().filter(x -> !x.inicio.isBefore(de)).count();
        int canceladosPeriodo = (int) b.matriculas().stream()
                .filter(x -> x.canceladaEm != null && !Acessos.dia(x.canceladaEm).isBefore(de))
                .count();
        double churnMedio = Math.round(meses.stream().mapToDouble(AlunosMes::churn).average().orElse(0) * 10) / 10.0;

        // ticket médio = mensalidades recebidas no mês passado / ativos
        YearMonth anterior = atual.minusMonths(1);
        BigDecimal recebido = b.pagamentos().stream()
                .filter(p -> Pagamento.PAGO.equals(p.status) && p.assinatura != null && p.pagoEm != null
                        && YearMonth.from(Acessos.dia(p.pagoEm)).equals(anterior))
                .map(p -> p.valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long ativosAnterior = b.matriculas().stream().filter(x -> b.ativaEm(x, anterior.atEndOfMonth())).count();
        BigDecimal ticket = ativosAnterior > 0
                ? recebido.divide(BigDecimal.valueOf(ativosAnterior), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<UUID, LocalDate> primeira = new HashMap<>();
        for (Assinatura a : b.matriculas()) primeira.merge(a.cliente.id, a.inicio, (x, y) -> x.isBefore(y) ? x : y);
        double tempoMedio = ativas.stream()
                .mapToLong(a -> ChronoUnit.MONTHS.between(primeira.get(a.cliente.id), b.hoje()))
                .average()
                .orElse(0);

        List<Aniversariante> aniversariantes = ativas.stream()
                .map(a -> a.cliente)
                .filter(c -> c.dataNascimento != null && c.dataNascimento.getMonth() == b.hoje().getMonth())
                .distinct()
                .sorted(Comparator.comparingInt(c -> c.dataNascimento.getDayOfMonth()))
                // idade que completa este ano
                .map(c -> new Aniversariante(c.id, c.nome, c.dataNascimento.getDayOfMonth(),
                        b.hoje().getYear() - c.dataNascimento.getYear(), c.telefone))
                .toList();

        return new RelatorioAlunos(
                new ResumoAlunos(ativas.size(), novosPeriodo, canceladosPeriodo, churnMedio, numero(ticket),
                        Math.round(tempoMedio * 10) / 10.0),
                meses,
                aniversariantes);
    }

    // ---------- Frequência ----------

    private static RelatorioFrequencia frequencia(UUID storeId, Base b) {
        OffsetDateTime inicio30 = Acessos.inicioDo(b.hoje().minusDays(29));
        Map<UUID, OffsetDateTime> ultima = new HashMap<>();
        Map<UUID, Integer> entradas30 = new HashMap<>();
        for (Acesso a : Acesso.<Acesso>list("storeId = ?1 and resultado = ?2", storeId, Acesso.LIBERADO)) {
            ultima.merge(a.cliente.id, a.momento, (x, y) -> x.isAfter(y) ? x : y);
            if (!a.momento.isBefore(inicio30)) entradas30.merge(a.cliente.id, 1, Integer::sum);
        }
        Map<UUID, Assinatura> ativas = b.ativasHoje().stream()
                .collect(Collectors.toMap(a -> a.cliente.id, Function.identity(), (x, y) -> x));

        List<AlunoSumido> sumidos = new ArrayList<>();
        for (Assinatura m : ativas.values()) {
            Cliente c = m.cliente;
            OffsetDateTime u = ultima.get(c.id);
            Integer dias = u != null ? (int) ChronoUnit.DAYS.between(Acessos.dia(u), b.hoje()) : null;
            // quem se matriculou há menos de 7 dias ainda não conta como sumido
            if (u == null && ChronoUnit.DAYS.between(m.inicio, b.hoje()) < 7) continue;
            String faixa = dias == null ? "nunca" : dias >= 30 ? "30_dias" : dias >= 14 ? "14_dias" : dias >= 7 ? "7_dias" : null;
            if (faixa != null) {
                sumidos.add(new AlunoSumido(c.id, c.nome, c.telefone, m.plano.nome,
                        u != null ? u.atZoneSameInstant(FUSO).toOffsetDateTime() : null, dias, faixa));
            }
        }
        sumidos.sort(Comparator.comparing((AlunoSumido s) -> s.diasSemVir() == null ? Integer.MAX_VALUE : s.diasSemVir())
                .reversed()
                .thenComparing(AlunoSumido::nome, ALFABETICA));

        List<Frequentador> top = entradas30.entrySet().stream()
                .filter(e -> ativas.containsKey(e.getKey()))
                .sorted(Map.Entry.<UUID, Integer>comparingByValue().reversed())
                .limit(10)
                .map(e -> new Frequentador(e.getKey(), ativas.get(e.getKey()).cliente.nome, e.getValue()))
                .toList();

        int total30 = entradas30.entrySet().stream()
                .filter(e -> ativas.containsKey(e.getKey()))
                .mapToInt(Map.Entry::getValue)
                .sum();
        double media = ativas.isEmpty() ? 0 : Math.round(total30 / (double) ativas.size() / (30 / 7.0) * 10) / 10.0;
        int vieram = (int) entradas30.keySet().stream().filter(ativas::containsKey).count();
        return new RelatorioFrequencia(media, vieram, ativas.size(), sumidos, top);
    }

    // ---------- Inadimplência ----------

    private static RelatorioInadimplencia inadimplencia(Base b) {
        Map<UUID, List<Pagamento>> atrasadasPorAluno = b.pagamentos().stream()
                .filter(p -> Pagamento.PENDENTE.equals(p.status) && p.vencimento.isBefore(b.hoje()))
                .filter(p -> p.assinatura == null || Assinatura.ATIVA.equals(p.assinatura.status))
                .collect(Collectors.groupingBy(p -> p.cliente.id));
        List<Devedor> devedores = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (List<Pagamento> lista : atrasadasPorAluno.values()) {
            Pagamento maisAntiga = lista.stream().min(Comparator.comparing(p -> p.vencimento)).orElseThrow();
            BigDecimal valor = lista.stream().map(p -> p.valor).reduce(BigDecimal.ZERO, BigDecimal::add);
            total = total.add(valor);
            Cliente c = maisAntiga.cliente;
            devedores.add(new Devedor(c.id, c.nome, c.telefone,
                    maisAntiga.assinatura != null ? maisAntiga.assinatura.plano.nome : maisAntiga.descricao,
                    maisAntiga.vencimento, (int) ChronoUnit.DAYS.between(maisAntiga.vencimento, b.hoje()), lista.size(),
                    numero(valor)));
        }
        devedores.sort(Comparator.comparingInt(Devedor::diasAtraso).reversed());
        return new RelatorioInadimplencia(numero(total), devedores.size(), devedores);
    }

    // ---------- Aulas ----------

    private List<AulaRelatorio> aulas(UUID storeId, LocalDate de, LocalDate ate) {
        OffsetDateTime agora = OffsetDateTime.now();
        List<AgendaContrato.AulaNaData> ocorridas = aulas.entre(storeId, de, ate, null).stream()
                .filter(a -> a.fim().isBefore(agora))
                .toList();
        Map<UUID, int[]> chamada = new HashMap<>(); // aula -> [presentes, faltas]
        for (Presenca p : Presenca.<Presenca>list("storeId = ?1 and data >= ?2 and data <= ?3", storeId, de, ate)) {
            int[] c = chamada.computeIfAbsent(p.horario.aula.id, k -> new int[2]);
            if (Presenca.PRESENTE.equals(p.status)) c[0]++;
            if (Presenca.FALTOU.equals(p.status)) c[1]++;
        }
        return ocorridas.stream()
                .collect(Collectors.groupingBy(AgendaContrato.AulaNaData::aulaId))
                .values()
                .stream()
                .map(lista -> {
                    AgendaContrato.AulaNaData a = lista.get(0);
                    double media = lista.stream().mapToInt(AgendaContrato.AulaNaData::ocupados).average().orElse(0);
                    int[] c = chamada.getOrDefault(a.aulaId(), new int[2]);
                    Integer presenca = c[0] + c[1] > 0 ? (int) Math.round(c[0] * 100.0 / (c[0] + c[1])) : null;
                    return new AulaRelatorio(a.nome(), a.professor() != null ? a.professor().nome() : "—", lista.size(),
                            a.capacidade(), Math.round(media * 10) / 10.0,
                            (int) Math.round(media * 100 / a.capacidade()), presenca, c[1]);
                })
                .sorted(Comparator.comparingInt(AulaRelatorio::ocupacao).reversed())
                .toList();
    }

    // ---------- Profissionais ----------

    private List<ProfissionalRelatorio> profissionais(UUID storeId, LocalDate de) {
        OffsetDateTime desde = Acessos.inicioDo(de);
        LocalDate hoje = Matriculas.hoje();
        List<Ficha> fichas = Ficha.list("storeId = ?1 and cliente is not null", storeId);
        List<Avaliacao> avaliacoes = Avaliacao.list("storeId = ?1 and data >= ?2", storeId, de);
        List<Agendamento> atendimentos = Agendamento.list(
                "storeId = ?1 and status = ?2 and inicio >= ?3", storeId, "concluido", desde);
        List<AgendaContrato.AulaNaData> aulasDadas = aulas.entre(storeId, de, hoje, null).stream()
                .filter(a -> a.fim().isBefore(OffsetDateTime.now()))
                .toList();
        List<Venda> vendas = Venda.<Venda>list("storeId = ?1 and profissional is not null", storeId).stream()
                .filter(v -> Pagamento.PAGO.equals(v.pagamento.status) && v.pagamento.pagoEm != null
                        && !v.pagamento.pagoEm.isBefore(desde))
                .toList();

        return Profissional.<Profissional>list("storeId = ?1 and ativo = true", storeId).stream()
                .map(p -> new ProfissionalRelatorio(
                        p.id,
                        p.nome,
                        p.especialidade,
                        (int) fichas.stream()
                                .filter(f -> Ficha.ATIVA.equals(f.status) && f.professor != null && f.professor.id.equals(p.id))
                                .count(),
                        (int) fichas.stream()
                                .filter(f -> f.professor != null && f.professor.id.equals(p.id) && f.createdAt != null
                                        && !f.createdAt.isBefore(desde))
                                .count(),
                        (int) avaliacoes.stream().filter(a -> a.profissional != null && a.profissional.id.equals(p.id)).count(),
                        (int) atendimentos.stream().filter(a -> a.profissional.id.equals(p.id)).count(),
                        (int) aulasDadas.stream().filter(a -> a.professor() != null && a.professor().id().equals(p.id)).count(),
                        numero(vendas.stream()
                                .filter(v -> v.profissional.id.equals(p.id))
                                .map(Financeiro::comissao)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))))
                .sorted(Comparator.comparing(ProfissionalRelatorio::nome, ALFABETICA))
                .toList();
    }
}
