package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.mesAbreviado;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.Plano;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Relatórios: entradas e saídas por mês, retenção, receita por grupo e plano,
// de onde vêm os membros, inadimplência e conteúdos mais vistos.
// Contrato com o frontend: frontend/src/lib/grupo-vip-relatorios.ts
@ApplicationScoped
public class Relatorios {

    @Inject
    Membros membros;

    @Inject
    Financeiro financeiro;

    public record Mes(String mes, String rotulo, int novos, int saidas, int ativos, Number receita) {}

    public record PlanoRetencao(String plano, int ativos, Number mediaMeses, Number receitaTotal) {}

    public record Retencao(Number mediaMeses, Number cancelamentoMes, List<PlanoRetencao> porPlano) {}

    public record GrupoReceita(String grupo, String plataforma, Number receita, int membros) {}

    public record Origem(String origem, int quantidade) {}

    public record Devedor(UUID clienteId, String nome, String telefone, String plano, Number valor, LocalDate vencimento,
                          int dias, String situacao) {}

    public record ConteudoVisto(String titulo, String categoria, java.time.OffsetDateTime publicadoEm, int visualizacoes,
                                int pessoas) {}

    public record RelatorioGrupoVip(
            List<Mes> meses,
            Retencao retencao,
            List<GrupoReceita> receitaPorGrupo,
            List<Origem> origens,
            List<Devedor> inadimplencia,
            List<ConteudoVisto> conteudos,
            List<FinanceiroContrato.Indicador> indicadores) {}

    public RelatorioGrupoVip montar(UUID storeId, int quantidadeMeses) {
        Membros.Base base = membros.base(storeId);
        LocalDate hoje = Membros.hoje();
        YearMonth atual = YearMonth.from(hoje);

        // Início e fim de cada assinatura que já teve pagamento.
        Map<UUID, LocalDate> inicioPago = new HashMap<>();
        Map<UUID, LocalDate> saida = new HashMap<>();
        for (Assinatura a : base.assinaturas) {
            List<Pagamento> pagos = base.pagamentosDa(a).stream().filter(p -> Pagamento.PAGO.equals(p.status)).toList();
            if (pagos.isEmpty()) continue;
            inicioPago.put(a.id, pagos.stream()
                    .map(p -> p.pagoEm != null ? Financeiro.dia(p.pagoEm) : p.vencimento)
                    .min(Comparator.naturalOrder())
                    .orElse(a.inicio));
            LocalDate ate = base.pagoAte(a);
            if (Assinatura.CANCELADA.equals(a.status) && ate != null && !ate.isAfter(hoje)) {
                saida.put(a.id, ate);
            } else if (Assinatura.ATIVA.equals(a.status) && ate != null) {
                LocalDate corte = ate.plusDays(base.config.toleranciaDias + 1L);
                if (!corte.isAfter(hoje)) saida.put(a.id, corte);
            }
        }

        List<Mes> meses = new ArrayList<>();
        for (int i = quantidadeMeses - 1; i >= 0; i--) {
            YearMonth ym = atual.minusMonths(i);
            int novos = (int) inicioPago.values().stream().filter(d -> YearMonth.from(d).equals(ym)).count();
            int saidas = (int) saida.values().stream().filter(d -> YearMonth.from(d).equals(ym)).count();
            LocalDate fim = i == 0 ? hoje : ym.atEndOfMonth();
            BigDecimal receita = base.pagamentos.stream()
                    .filter(p -> Pagamento.PAGO.equals(p.status) && p.pagoEm != null
                            && YearMonth.from(Financeiro.dia(p.pagoEm)).equals(ym))
                    .map(p -> p.valor)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            meses.add(new Mes(ym.toString(), mesAbreviado(ym.atDay(1)), novos, saidas, base.ativosEm(fim), numero(receita)));
        }

        // Retenção: meses pagos por assinatura.
        Map<UUID, List<Assinatura>> porPlano = base.assinaturas.stream().collect(Collectors.groupingBy(a -> a.plano.id));
        List<PlanoRetencao> planos = new ArrayList<>();
        double somaMeses = 0;
        int qtd = 0;
        for (Plano p : Plano.<Plano>list("storeId = ?1 order by preco", storeId)) {
            List<Assinatura> doPlano = porPlano.getOrDefault(p.id, List.of());
            double soma = 0;
            int n = 0;
            BigDecimal receita = BigDecimal.ZERO;
            for (Assinatura a : doPlano) {
                long pagos = base.pagamentosDa(a).stream().filter(x -> Pagamento.PAGO.equals(x.status)).count();
                receita = receita.add(base.pagamentosDa(a).stream()
                        .filter(x -> Pagamento.PAGO.equals(x.status))
                        .map(x -> x.valor)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
                if (pagos == 0) continue;
                soma += pagos * a.plano.duracaoMeses;
                n++;
            }
            somaMeses += soma;
            qtd += n;
            int ativos = (int) base.estados.values().stream()
                    .filter(e -> e.temAcesso() && e.plano() != null && e.plano().id.equals(p.id))
                    .count();
            planos.add(new PlanoRetencao(p.nome, ativos, numero(n == 0 ? BigDecimal.ZERO : umaCasa(soma / n)),
                    numero(receita)));
        }
        Mes passado = meses.size() >= 2 ? meses.get(meses.size() - 2) : null;
        int ativosAntes = base.ativosEm(atual.minusMonths(2).atEndOfMonth());
        BigDecimal cancelamento = passado == null || ativosAntes == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(passado.saidas() * 100.0 / ativosAntes).setScale(1, RoundingMode.HALF_UP);
        Retencao retencao = new Retencao(numero(qtd == 0 ? BigDecimal.ZERO : umaCasa(somaMeses / qtd)),
                numero(cancelamento), planos);

        // Receita dos últimos meses por grupo (o valor do plano é dividido
        // entre os grupos que ele libera).
        LocalDate desde = atual.minusMonths(quantidadeMeses - 1L).atDay(1);
        Map<UUID, BigDecimal> porGrupo = new LinkedHashMap<>();
        for (Pagamento p : base.pagamentos) {
            if (!Pagamento.PAGO.equals(p.status) || p.assinatura == null || p.pagoEm == null) continue;
            if (Financeiro.dia(p.pagoEm).isBefore(desde)) continue;
            List<Grupo> grupos = base.gruposDoPlano(p.assinatura.plano);
            if (grupos.isEmpty()) continue;
            BigDecimal parte = p.valor.divide(BigDecimal.valueOf(grupos.size()), 2, RoundingMode.HALF_UP);
            grupos.forEach(g -> porGrupo.merge(g.id, parte, BigDecimal::add));
        }
        List<GrupoReceita> receitaPorGrupo = base.grupos.stream()
                .map(g -> new GrupoReceita(g.nome, g.plataforma, numero(porGrupo.getOrDefault(g.id, BigDecimal.ZERO)),
                        Membros.comAcesso(base, g.id).size()))
                .sorted(Comparator.comparing((GrupoReceita r) -> new BigDecimal(r.receita().toString())).reversed())
                .toList();

        // De onde vêm os membros.
        int indicacao = 0;
        int pagina = 0;
        int manual = 0;
        for (Membros.Estado e : base.estados.values()) {
            if (e.cliente().indicadoPor != null) indicacao++;
            else if (e.membro() != null && "pagina".equals(e.membro().origem)) pagina++;
            else manual++;
        }
        List<Origem> origens = List.of(new Origem("Indicação de membros", indicacao),
                new Origem("Página de vendas", pagina), new Origem("Cadastro pela equipe", manual));

        List<Devedor> devedores = base.estados.values().stream()
                .filter(e -> e.proxima() != null && e.diasAtraso() > 0 && e.pagoAte() != null)
                .map(e -> new Devedor(e.cliente().id, e.cliente().nome, e.cliente().telefone,
                        e.plano() != null ? e.plano().nome : "", numero(e.proxima().valor), e.proxima().vencimento,
                        e.diasAtraso(), e.situacao()))
                .sorted(Comparator.comparing(Devedor::dias).reversed())
                .toList();

        Map<UUID, List<ConteudoView>> views = ConteudoView.<ConteudoView>list("storeId", storeId).stream()
                .collect(Collectors.groupingBy(v -> v.conteudo.id));
        List<ConteudoVisto> conteudos = Conteudo.<Conteudo>list("storeId = ?1 and status = ?2", storeId, Conteudo.PUBLICADO)
                .stream()
                .map(c -> {
                    List<ConteudoView> v = views.getOrDefault(c.id, List.of());
                    return new ConteudoVisto(c.titulo, c.categoria != null ? c.categoria.nome : null, c.publicadoEm,
                            v.size(), (int) v.stream().map(x -> x.cliente.id).distinct().count());
                })
                .sorted(Comparator.comparing(ConteudoVisto::visualizacoes).reversed())
                .limit(20)
                .toList();

        return new RelatorioGrupoVip(meses, retencao, receitaPorGrupo, origens, devedores, conteudos,
                financeiro.saques(storeId).indicadores());
    }

    private static BigDecimal umaCasa(double v) {
        return BigDecimal.valueOf(v).setScale(1, RoundingMode.HALF_UP);
    }
}
