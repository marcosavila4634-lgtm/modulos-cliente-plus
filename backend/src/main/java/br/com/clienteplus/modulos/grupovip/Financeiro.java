package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.ProgramaIndicacao;
import br.com.clienteplus.modulos.clienteplus.Saque;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.FinanceiroContrato.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Collator;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Financeiro do módulo: receitas (pagamentos do Cliente Plus com origem
// grupo-vip), assinaturas e saques de comissão de indicação.
@ApplicationScoped
public class Financeiro {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    @Inject
    Membros membros;

    @Inject
    Indicacoes indicacoes;

    public static String statusCobranca(Pagamento p) {
        return switch (p.status) {
            case Pagamento.PAGO -> "paga";
            case Pagamento.CANCELADO -> "cancelada";
            default -> p.vencimento.isBefore(Membros.hoje()) ? "atrasada" : "pendente";
        };
    }

    public static Cobranca cobranca(Pagamento p, Set<UUID> daPagina) {
        return new Cobranca(
                p.id,
                p.cliente.id,
                p.cliente.nome,
                p.assinatura != null ? p.assinatura.plano.nome : p.descricao,
                numero(p.valor),
                p.vencimento,
                statusCobranca(p),
                p.pagoEm,
                p.formaPagamento,
                daPagina.contains(p.id) ? "pagina" : "painel");
    }

    static Set<UUID> pagamentosDaPagina(UUID storeId) {
        return Checkout.<Checkout>list("storeId", storeId).stream().map(c -> c.pagamento.id).collect(Collectors.toSet());
    }

    static LocalDate dia(OffsetDateTime t) {
        return t.atZoneSameInstant(FUSO).toLocalDate();
    }

    // ---------- Receitas ----------

    public Receitas receitas(UUID storeId, YearMonth mes) {
        List<Pagamento> todos = Pagamento.list("storeId = ?1 order by vencimento", storeId);
        Set<UUID> daPagina = pagamentosDaPagina(storeId);
        LocalDate hoje = Membros.hoje();

        List<Pagamento> recebidos = todos.stream()
                .filter(p -> Pagamento.PAGO.equals(p.status) && p.pagoEm != null && YearMonth.from(dia(p.pagoEm)).equals(mes))
                .sorted(Comparator.comparing((Pagamento p) -> p.pagoEm).reversed())
                .toList();
        BigDecimal anterior = todos.stream()
                .filter(p -> Pagamento.PAGO.equals(p.status) && p.pagoEm != null
                        && YearMonth.from(dia(p.pagoEm)).equals(mes.minusMonths(1)))
                .map(p -> p.valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Pagamento> aReceber = todos.stream()
                .filter(p -> Pagamento.PENDENTE.equals(p.status) && YearMonth.from(p.vencimento).equals(mes)
                        && !p.vencimento.isBefore(hoje))
                .toList();
        List<Pagamento> atrasados = todos.stream()
                .filter(p -> Pagamento.PENDENTE.equals(p.status) && p.vencimento.isBefore(hoje))
                .toList();

        BigDecimal recebido = soma(recebidos);
        BigDecimal ticket = recebidos.isEmpty() ? BigDecimal.ZERO
                : recebido.divide(BigDecimal.valueOf(recebidos.size()), 2, RoundingMode.HALF_UP);

        Map<Integer, BigDecimal> porDia = new LinkedHashMap<>();
        for (int d = 1; d <= mes.lengthOfMonth(); d++) porDia.put(d, BigDecimal.ZERO);
        recebidos.forEach(p -> porDia.merge(dia(p.pagoEm).getDayOfMonth(), p.valor, BigDecimal::add));

        List<Cobranca> emAberto = new ArrayList<>();
        atrasados.forEach(p -> emAberto.add(cobranca(p, daPagina)));
        aReceber.forEach(p -> emAberto.add(cobranca(p, daPagina)));

        return new Receitas(
                mes.toString(),
                new ResumoReceitas(numero(recebido), recebidos.size(), numero(anterior), numero(soma(aReceber)),
                        aReceber.size(), numero(soma(atrasados)), atrasados.size(), numero(ticket)),
                porDia.entrySet().stream()
                        .map(e -> new ValorDia(String.format("%02d", e.getKey()), numero(e.getValue())))
                        .toList(),
                agrupar(recebidos, p -> p.assinatura != null ? p.assinatura.plano.nome : "Avulso"),
                agrupar(recebidos, p -> p.formaPagamento != null ? p.formaPagamento : "cortesia"),
                recebidos.stream().map(p -> cobranca(p, daPagina)).toList(),
                emAberto);
    }

    private static BigDecimal soma(List<Pagamento> lista) {
        return lista.stream().map(p -> p.valor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static List<ValorPor> agrupar(List<Pagamento> lista, java.util.function.Function<Pagamento, String> chave) {
        Map<String, List<Pagamento>> grupos = lista.stream().collect(Collectors.groupingBy(chave));
        return grupos.entrySet().stream()
                .map(e -> new ValorPor(e.getKey(), numero(soma(e.getValue())), e.getValue().size()))
                .sorted(Comparator.comparing((ValorPor v) -> new BigDecimal(v.valor().toString())).reversed())
                .toList();
    }

    // ---------- Assinaturas ----------

    public Assinaturas assinaturas(UUID storeId) {
        Membros.Base base = membros.base(storeId);
        List<AssinaturaLinha> linhas = new ArrayList<>();
        BigDecimal mensal = BigDecimal.ZERO;
        LocalDate hoje = Membros.hoje();

        for (Membros.Estado e : base.estados.values()) {
            // Mostra a assinatura que vale agora; se não há, a última que existiu.
            Assinatura a = e.assinatura();
            if (a == null) {
                List<Assinatura> doCliente = base.assinaturasPorCliente.getOrDefault(e.cliente().id, List.of());
                if (doCliente.isEmpty()) continue;
                a = doCliente.get(doCliente.size() - 1);
            }
            if (Assinatura.ATIVA.equals(a.status) && e.temAcesso()) {
                mensal = mensal.add(a.valor.divide(BigDecimal.valueOf(a.plano.duracaoMeses), 2, RoundingMode.HALF_UP));
            }
            Pagamento prox = e.proxima();
            linhas.add(new AssinaturaLinha(
                    e.cliente().id,
                    e.cliente().nome,
                    e.cliente().telefone,
                    a.plano.nome,
                    numero(a.valor),
                    a.plano.duracaoMeses,
                    a.inicio,
                    e.situacao(),
                    prox != null ? prox.vencimento : null,
                    prox != null ? prox.id : null,
                    prox != null ? numero(prox.valor) : null,
                    e.pagoAte(),
                    a.canceladaEm));
        }
        linhas.sort(Comparator.comparing(AssinaturaLinha::nome, ALFABETICA));

        BigDecimal previsao = base.pagamentos.stream()
                .filter(p -> Pagamento.PENDENTE.equals(p.status) && !p.vencimento.isAfter(hoje.plusDays(30)))
                .map(p -> p.valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        YearMonth mes = YearMonth.from(hoje);
        int canceladasMes = (int) base.assinaturas.stream()
                .filter(a -> a.canceladaEm != null && YearMonth.from(dia(a.canceladaEm)).equals(mes))
                .count();
        int ativas = (int) linhas.stream().filter(l -> Membros.COM_ACESSO.contains(l.situacao())).count();
        return new Assinaturas(linhas, numero(mensal), numero(previsao), ativas, canceladasMes);
    }

    // ---------- Saques e indicações ----------

    public Saques saques(UUID storeId) {
        List<Indicacoes.Comissao> comissoes = indicacoes.comissoes(storeId);
        Map<UUID, Indicacoes.Saldo> saldos = indicacoes.saldos(storeId, comissoes);
        YearMonth mes = YearMonth.from(Membros.hoje());

        List<SaqueJson> lista = Saque.<Saque>list("storeId = ?1 order by createdAt desc", storeId).stream()
                .map(s -> new SaqueJson(s.id, s.cliente.id, s.cliente.nome, s.cliente.telefone, numero(s.valor),
                        s.chavePix, s.status, s.motivo, s.createdAt, s.pagoEm,
                        numero(saldos.containsKey(s.cliente.id) ? saldos.get(s.cliente.id).disponivel() : BigDecimal.ZERO)))
                .toList();
        BigDecimal aPagar = Saque.<Saque>list("storeId = ?1 and status = ?2", storeId, Saque.SOLICITADO).stream()
                .map(s -> s.valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pagoMes = Saque.<Saque>list("storeId = ?1 and status = ?2", storeId, Saque.PAGO).stream()
                .filter(s -> s.pagoEm != null && YearMonth.from(dia(s.pagoEm)).equals(mes))
                .map(s -> s.valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal comissoesMes = comissoes.stream()
                .filter(c -> YearMonth.from(c.data()).equals(mes))
                .map(Indicacoes.Comissao::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Ranking de quem indica.
        Membros.Base base = membros.base(storeId);
        Map<UUID, List<Cliente>> indicadosPor = base.clientes.stream()
                .filter(c -> c.indicadoPor != null)
                .collect(Collectors.groupingBy(c -> c.indicadoPor.id));
        Set<UUID> pessoas = new HashSet<>(indicadosPor.keySet());
        comissoes.forEach(c -> pessoas.add(c.beneficiario().id));
        List<Indicador> ranking = new ArrayList<>();
        for (UUID id : pessoas) {
            Cliente c = base.clientes.stream().filter(x -> x.id.equals(id)).findFirst().orElse(null);
            if (c == null) continue;
            List<Cliente> diretos = indicadosPor.getOrDefault(id, List.of());
            BigDecimal doMes = comissoes.stream()
                    .filter(x -> x.beneficiario().id.equals(id) && YearMonth.from(x.data()).equals(mes))
                    .map(Indicacoes.Comissao::valor)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Indicacoes.Saldo s = saldos.get(id);
            ranking.add(new Indicador(id, c.nome, diretos.size(),
                    (int) diretos.stream().filter(d -> base.estado(d.id).temAcesso()).count(),
                    numero(doMes),
                    numero(s != null ? s.ganho() : BigDecimal.ZERO),
                    numero(s != null ? s.disponivel() : BigDecimal.ZERO)));
        }
        ranking.sort(Comparator.comparing((Indicador i) -> new BigDecimal(i.comissaoTotal().toString())).reversed()
                .thenComparing(Indicador::nome, ALFABETICA));

        List<ComissaoLinha> recentes = comissoes.reversed().stream()
                .limit(30)
                .map(c -> new ComissaoLinha(c.data(), c.beneficiario().nome, c.pagador().nome, c.nivel(),
                        numero(c.percentual()), numero(c.valorPagamento()), numero(c.valor())))
                .toList();

        ProgramaIndicacao prog = ProgramaIndicacao.<ProgramaIndicacao>find("storeId", storeId).firstResult();
        List<Number> pct = prog == null ? List.of(10, 5, 2)
                : List.of(numero(prog.nivel1Pct), numero(prog.nivel2Pct), numero(prog.nivel3Pct));
        return new Saques(lista, numero(aPagar), numero(pagoMes), numero(comissoesMes), ranking, recentes, pct);
    }

    public void pagarSaque(UUID storeId, UUID id) {
        Saque s = saque(storeId, id);
        if (!Saque.SOLICITADO.equals(s.status)) throw Erro.conflito("Este saque já foi resolvido");
        s.status = Saque.PAGO;
        s.pagoEm = OffsetDateTime.now();
    }

    public void recusarSaque(UUID storeId, UUID id, String motivo) {
        Saque s = saque(storeId, id);
        if (!Saque.SOLICITADO.equals(s.status)) throw Erro.conflito("Este saque já foi resolvido");
        String m = Membros.limpo(motivo);
        if (m == null) throw Erro.invalido("Explique o motivo da recusa");
        s.status = Saque.RECUSADO;
        s.motivo = m;
    }

    private static Saque saque(UUID storeId, UUID id) {
        Saque s = Saque.findById(id);
        if (s == null || !s.storeId.equals(storeId)) throw Erro.naoEncontrado("Saque não encontrado");
        return s;
    }

    // Pedido de saque feito pelo membro (área do membro).
    public Saque pedirSaque(UUID storeId, Cliente c, BigDecimal valor, String chavePix) {
        if (valor == null || valor.compareTo(BigDecimal.valueOf(10)) < 0) throw Erro.invalido("Saque mínimo de R$ 10,00");
        String chave = Membros.limpo(chavePix);
        if (chave == null) throw Erro.invalido("Informe sua chave Pix");
        Indicacoes.Saldo saldo = indicacoes.saldo(storeId, c.id);
        if (valor.compareTo(saldo.disponivel()) > 0) throw Erro.invalido("Valor maior que o saldo disponível");
        Saque s = new Saque();
        s.storeId = storeId;
        s.cliente = c;
        s.valor = valor.setScale(2, RoundingMode.HALF_UP);
        s.chavePix = chave;
        s.status = Saque.SOLICITADO;
        s.persist();
        return s;
    }
}
