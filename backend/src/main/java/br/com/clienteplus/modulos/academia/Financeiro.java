package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.FinanceiroContrato.*;
import br.com.clienteplus.modulos.academia.TreinosContrato.Referencia;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.ProgramaIndicacao;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.comum.Formatos;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Collator;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// Regras financeiras: despesas, resultado do mês e comissões.
//
// - Regime de caixa: receita = pagamentos recebidos no mês (data do
//   pagamento); despesa = despesas pagas no mês.
// - Despesa recorrente: ao pagar, cria a do mês seguinte (mesmo dia).
// - Comissão do profissional = % do serviço (copiado na venda) sobre as
//   vendas pagas no mês. Pagar a comissão cria uma despesa "comissoes".
// - Comissão de indicação: SIMULAÇÃO do motor do Cliente Plus. Cada pagamento
//   recebido de um plano/serviço que participa das indicações rende o % de
//   cada nível (até 3) para quem indicou o pagante, subindo na rede.
@ApplicationScoped
public class Financeiro {

    static final Set<String> CATEGORIAS = Set.of("aluguel", "salarios", "comissoes", "energia", "agua", "internet",
            "equipamentos", "manutencao", "limpeza", "marketing", "impostos", "sistemas", "outros");
    static final Set<String> FORMAS = Set.of("dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto",
            "transferencia");
    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final Collator ALFABETICA = Collator.getInstance(PT_BR);

    static YearMonth mes(OffsetDateTime instante) {
        return YearMonth.from(instante.atZoneSameInstant(FUSO));
    }

    static YearMonth competencia(String texto) {
        if (texto == null || texto.isBlank()) return YearMonth.from(Matriculas.hoje());
        try {
            return YearMonth.parse(texto);
        } catch (Exception e) {
            throw Erro.invalido("Mês inválido: use AAAA-MM");
        }
    }

    static String nomeMes(YearMonth m) {
        String nome = m.getMonth().getDisplayName(TextStyle.FULL, PT_BR);
        return Character.toUpperCase(nome.charAt(0)) + nome.substring(1) + "/" + m.getYear();
    }

    private static BigDecimal soma(List<BigDecimal> valores) {
        return valores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ---------- Despesas ----------

    static DespesaJson json(Despesa d) {
        String status = Despesa.PENDENTE.equals(d.status) && d.vencimento.isBefore(Matriculas.hoje()) ? "atrasada" : d.status;
        return new DespesaJson(d.id, d.descricao, d.categoria, d.fornecedor, numero(d.valor), d.vencimento, status,
                d.pagoEm, d.formaPagamento, d.recorrente, d.observacao);
    }

    public Despesa despesa(UUID storeId, UUID id) {
        Despesa d = Despesa.findById(id);
        if (d == null || !d.storeId.equals(storeId)) throw Erro.naoEncontrado("Despesa não encontrada");
        return d;
    }

    public PainelDespesas painelDespesas(UUID storeId) {
        List<DespesaJson> lista = Despesa.<Despesa>list(
                        "storeId = ?1 and status <> ?2 order by vencimento desc", storeId, Despesa.CANCELADA)
                .stream()
                .map(Financeiro::json)
                .toList();
        YearMonth m = YearMonth.from(Matriculas.hoje());
        List<DespesaJson> pagas = lista.stream()
                .filter(d -> "paga".equals(d.status()) && d.pagoEm() != null && mes(d.pagoEm()).equals(m))
                .toList();
        List<DespesaJson> aPagar = lista.stream()
                .filter(d -> "pendente".equals(d.status()) && YearMonth.from(d.vencimento()).equals(m))
                .toList();
        List<DespesaJson> atrasadas = lista.stream().filter(d -> "atrasada".equals(d.status())).toList();
        return new PainelDespesas(
                new ResumoDespesas(total(pagas), pagas.size(), total(aPagar), aPagar.size(), total(atrasadas),
                        atrasadas.size()),
                lista);
    }

    private static Number total(List<DespesaJson> lista) {
        return numero(soma(lista.stream().map(d -> new BigDecimal(d.valor().toString())).toList()));
    }

    @Transactional
    public Despesa salvarDespesa(UUID storeId, UUID id, DadosDespesa d) {
        Despesa x;
        if (id == null) {
            x = new Despesa();
            x.storeId = storeId;
            x.status = Despesa.PENDENTE;
        } else {
            x = despesa(storeId, id);
            if (Despesa.CANCELADA.equals(x.status)) throw Erro.conflito("Esta despesa foi cancelada");
        }
        if (d == null || d.descricao() == null || d.descricao().isBlank()) throw Erro.invalido("Descreva a despesa");
        if (d.categoria() == null || !CATEGORIAS.contains(d.categoria())) throw Erro.invalido("Escolha a categoria");
        if (d.valor() == null || d.valor().signum() <= 0) throw Erro.invalido("Informe o valor");
        if (d.vencimento() == null) throw Erro.invalido("Informe o vencimento");
        x.descricao = d.descricao().trim();
        x.categoria = d.categoria();
        x.fornecedor = d.fornecedor() != null ? d.fornecedor().trim() : "";
        x.valor = d.valor().setScale(2, RoundingMode.HALF_UP);
        x.vencimento = d.vencimento();
        x.recorrente = Boolean.TRUE.equals(d.recorrente());
        x.observacao = d.observacao() != null ? d.observacao().trim() : "";
        x.persist();
        return x;
    }

    @Transactional
    public Despesa pagar(UUID storeId, UUID id, PagarDespesa p) {
        Despesa d = despesa(storeId, id);
        if (!Despesa.PENDENTE.equals(d.status)) throw Erro.conflito("Esta despesa já foi paga ou cancelada");
        String forma = p != null ? p.formaPagamento() : null;
        if (forma == null || !FORMAS.contains(forma)) throw Erro.invalido("Escolha a forma de pagamento");
        LocalDate data = p.data() != null ? p.data() : Matriculas.hoje();
        if (data.isAfter(Matriculas.hoje())) throw Erro.invalido("A data do pagamento não pode ser no futuro");
        d.status = Despesa.PAGA;
        d.formaPagamento = forma;
        d.pagoEm = data.equals(Matriculas.hoje()) ? OffsetDateTime.now() : data.atTime(12, 0).atZone(FUSO).toOffsetDateTime();

        if (d.recorrente) {
            LocalDate proximo = d.vencimento.plusMonths(1);
            boolean existe = Despesa.count("storeId = ?1 and descricao = ?2 and vencimento = ?3 and status <> ?4",
                    storeId, d.descricao, proximo, Despesa.CANCELADA) > 0;
            if (!existe) {
                Despesa n = new Despesa();
                n.storeId = storeId;
                n.descricao = d.descricao;
                n.categoria = d.categoria;
                n.fornecedor = d.fornecedor;
                n.valor = d.valor;
                n.vencimento = proximo;
                n.status = Despesa.PENDENTE;
                n.recorrente = true;
                n.observacao = d.observacao;
                n.persist();
            }
        }
        return d;
    }

    @Transactional
    public void cancelar(UUID storeId, UUID id) {
        Despesa d = despesa(storeId, id);
        if (Despesa.PAGA.equals(d.status)) throw Erro.conflito("Despesa já paga não pode ser cancelada");
        d.status = Despesa.CANCELADA;
    }

    // Despesas pagas por mês (para o Dashboard).
    public Map<YearMonth, BigDecimal> despesasPorMes(UUID storeId) {
        Map<YearMonth, BigDecimal> mapa = new HashMap<>();
        for (Despesa d : Despesa.<Despesa>list("storeId = ?1 and status = ?2", storeId, Despesa.PAGA)) {
            mapa.merge(mes(d.pagoEm), d.valor, BigDecimal::add);
        }
        return mapa;
    }

    // ---------- Resultado ----------

    public Resultado resultado(UUID storeId, int meses) {
        YearMonth atual = YearMonth.from(Matriculas.hoje());
        List<Pagamento> pagos = Pagamento.list("storeId = ?1 and status = ?2", storeId, Pagamento.PAGO);
        Map<YearMonth, BigDecimal> despesas = despesasPorMes(storeId);

        List<ResultadoMes> lista = new ArrayList<>();
        for (int i = meses - 1; i >= 0; i--) {
            YearMonth m = atual.minusMonths(i);
            BigDecimal mensalidades = soma(pagos.stream()
                    .filter(p -> p.assinatura != null && mes(p.pagoEm).equals(m))
                    .map(p -> p.valor)
                    .toList());
            BigDecimal servicos = soma(pagos.stream()
                    .filter(p -> p.assinatura == null && mes(p.pagoEm).equals(m))
                    .map(p -> p.valor)
                    .toList());
            BigDecimal receita = mensalidades.add(servicos);
            BigDecimal desp = despesas.getOrDefault(m, BigDecimal.ZERO);
            lista.add(new ResultadoMes(Formatos.mesAbreviado(m.atDay(1)), m.getYear(), m.getMonthValue(),
                    numero(mensalidades), numero(servicos), numero(receita), numero(desp), numero(receita.subtract(desp))));
        }

        Map<String, BigDecimal> porCategoria = new HashMap<>();
        for (Despesa d : Despesa.<Despesa>list("storeId = ?1 and status = ?2", storeId, Despesa.PAGA)) {
            if (mes(d.pagoEm).equals(atual)) porCategoria.merge(d.categoria, d.valor, BigDecimal::add);
        }
        Map<String, BigDecimal> porForma = new HashMap<>();
        for (Pagamento p : pagos) {
            if (mes(p.pagoEm).equals(atual)) porForma.merge(p.formaPagamento != null ? p.formaPagamento : "outros", p.valor, BigDecimal::add);
        }
        return new Resultado(lista, ordenar(porCategoria), ordenar(porForma));
    }

    private static List<ValorCategoria> ordenar(Map<String, BigDecimal> mapa) {
        return mapa.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .map(e -> new ValorCategoria(e.getKey(), numero(e.getValue())))
                .toList();
    }

    // ---------- Comissão dos profissionais ----------

    public ComissoesProfissionais comissoesProfissionais(UUID storeId, YearMonth m) {
        List<Venda> vendas = Venda.<Venda>list("storeId = ?1 and profissional is not null", storeId).stream()
                .filter(v -> Pagamento.PAGO.equals(v.pagamento.status) && v.pagamento.pagoEm != null
                        && mes(v.pagamento.pagoEm).equals(m))
                .toList();
        Map<UUID, ComissaoPaga> pagas = ComissaoPaga.<ComissaoPaga>list("storeId = ?1 and competencia = ?2", storeId, m.atDay(1))
                .stream()
                .collect(Collectors.toMap(c -> c.profissional.id, Function.identity()));

        Map<UUID, List<Venda>> porProfissional = vendas.stream().collect(Collectors.groupingBy(v -> v.profissional.id));
        List<ComissaoProfissional> lista = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal pago = BigDecimal.ZERO;
        for (Profissional p : Profissional.<Profissional>list("storeId", storeId)) {
            List<Venda> vs = porProfissional.getOrDefault(p.id, List.of());
            ComissaoPaga cp = pagas.get(p.id);
            if (vs.isEmpty() && cp == null) continue;
            List<ItemComissao> itens = vs.stream()
                    .sorted(Comparator.comparing((Venda v) -> v.pagamento.pagoEm).reversed())
                    .map(v -> new ItemComissao(v.id, Acessos.dia(v.pagamento.pagoEm), v.cliente.nome, v.servico.nome,
                            numero(v.valor), numero(v.comissaoPct), numero(comissao(v))))
                    .toList();
            BigDecimal vendido = soma(vs.stream().map(v -> v.valor).toList());
            BigDecimal comissao = cp != null ? cp.valor : soma(vs.stream().map(Financeiro::comissao).toList());
            total = total.add(comissao);
            if (cp != null) pago = pago.add(cp.valor);
            lista.add(new ComissaoProfissional(new Referencia(p.id, p.nome), vs.size(), numero(vendido), numero(comissao),
                    cp != null, cp != null ? cp.createdAt : null, itens));
        }
        lista.sort(Comparator.comparing((ComissaoProfissional c) -> new BigDecimal(c.comissao().toString())).reversed());
        return new ComissoesProfissionais(m.toString(), numero(total), numero(pago), lista);
    }

    static BigDecimal comissao(Venda v) {
        return v.valor.multiply(v.comissaoPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    @Transactional
    public void pagarComissao(UUID storeId, UUID profissionalId, YearMonth m, String forma) {
        Profissional p = Profissional.findById(profissionalId);
        if (p == null || !p.storeId.equals(storeId)) throw Erro.naoEncontrado("Profissional não encontrado");
        if (m.isAfter(YearMonth.from(Matriculas.hoje()))) throw Erro.invalido("Este mês ainda não chegou");
        if (ComissaoPaga.count("profissional = ?1 and competencia = ?2", p, m.atDay(1)) > 0) {
            throw Erro.conflito("A comissão de " + nomeMes(m) + " já foi paga");
        }
        String f = forma != null ? forma : "pix";
        if (!FORMAS.contains(f)) throw Erro.invalido("Forma de pagamento inválida");
        ComissaoProfissional c = comissoesProfissionais(storeId, m).profissionais().stream()
                .filter(x -> x.profissional().id().equals(profissionalId))
                .findFirst()
                .orElseThrow(() -> Erro.conflito("Sem comissão a pagar neste mês"));
        BigDecimal valor = new BigDecimal(c.comissao().toString());
        if (valor.signum() <= 0) throw Erro.conflito("Sem comissão a pagar neste mês");

        Despesa d = new Despesa();
        d.storeId = storeId;
        d.descricao = "Comissão de " + p.nome + " (" + nomeMes(m) + ")";
        d.categoria = "comissoes";
        d.fornecedor = p.nome;
        d.valor = valor;
        d.vencimento = Matriculas.hoje();
        d.status = Despesa.PAGA;
        d.pagoEm = OffsetDateTime.now();
        d.formaPagamento = f;
        d.observacao = c.atendimentos() + " atendimentos, " + Formatos.numero(new BigDecimal(c.vendido().toString())) + " vendidos";
        d.recorrente = false;
        d.persist();

        ComissaoPaga cp = new ComissaoPaga();
        cp.storeId = storeId;
        cp.profissional = p;
        cp.competencia = m.atDay(1);
        cp.valor = valor;
        cp.despesa = d;
        cp.persist();
    }

    // ---------- Comissão de indicações (simulação do Cliente Plus) ----------

    public ComissoesIndicacoes indicacoes(UUID storeId, YearMonth m) {
        ProgramaIndicacao prog = ProgramaIndicacao.<ProgramaIndicacao>find("storeId", storeId).firstResult();
        BigDecimal[] pct = prog != null
                ? new BigDecimal[] {prog.nivel1Pct, prog.nivel2Pct, prog.nivel3Pct}
                : new BigDecimal[] {BigDecimal.TEN, BigDecimal.valueOf(5), BigDecimal.valueOf(2)};

        Map<UUID, Venda> vendaPorPagamento = Venda.<Venda>list("storeId", storeId).stream()
                .collect(Collectors.toMap(v -> v.pagamento.id, Function.identity(), (a, b) -> a));

        List<LinhaIndicacao> linhas = new ArrayList<>();
        Set<UUID> pagamentosComComissao = new HashSet<>();
        for (Pagamento p : Pagamento.<Pagamento>list("storeId = ?1 and status = ?2", storeId, Pagamento.PAGO)) {
            if (p.pagoEm == null || !mes(p.pagoEm).equals(m)) continue;
            String origem;
            boolean participa;
            if (p.assinatura != null) {
                participa = p.assinatura.plano.participaIndicacoes;
                origem = "Mensalidade " + p.assinatura.plano.nome;
            } else {
                Venda v = vendaPorPagamento.get(p.id);
                participa = v != null && v.servico.participaIndicacoes;
                origem = v != null ? v.servico.nome : p.descricao;
            }
            if (!participa) continue;
            Cliente beneficiario = p.cliente.indicadoPor;
            for (int nivel = 1; nivel <= 3 && beneficiario != null; nivel++) {
                BigDecimal percentual = pct[nivel - 1];
                if (percentual.signum() > 0) {
                    linhas.add(new LinhaIndicacao(Acessos.dia(p.pagoEm), new Referencia(p.cliente.id, p.cliente.nome),
                            new Referencia(beneficiario.id, beneficiario.nome), nivel, origem, numero(p.valor),
                            numero(percentual),
                            numero(p.valor.multiply(percentual).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))));
                    pagamentosComComissao.add(p.id);
                }
                beneficiario = beneficiario.indicadoPor;
            }
        }
        linhas.sort(Comparator.comparing(LinhaIndicacao::data).reversed());

        // Ranking: comissão do mês, indicados diretos ativos e tamanho da rede.
        Set<UUID> ativos = Assinatura.<Assinatura>list("storeId = ?1 and status = ?2", storeId, Assinatura.ATIVA).stream()
                .map(a -> a.cliente.id)
                .collect(Collectors.toSet());
        List<Cliente> clientes = Cliente.list("storeId", storeId);
        Map<UUID, List<Cliente>> indicadosPor = clientes.stream()
                .filter(c -> c.indicadoPor != null)
                .collect(Collectors.groupingBy(c -> c.indicadoPor.id));
        Map<UUID, BigDecimal> comissaoPor = new HashMap<>();
        Map<UUID, String> nomes = new HashMap<>();
        for (LinhaIndicacao l : linhas) {
            comissaoPor.merge(l.beneficiario().id(), new BigDecimal(l.comissao().toString()), BigDecimal::add);
            nomes.put(l.beneficiario().id(), l.beneficiario().nome());
        }
        for (Cliente c : clientes) if (indicadosPor.containsKey(c.id)) nomes.putIfAbsent(c.id, c.nome);

        List<Indicador> ranking = nomes.entrySet().stream()
                .map(e -> new Indicador(
                        new Referencia(e.getKey(), e.getValue()),
                        (int) indicadosPor.getOrDefault(e.getKey(), List.of()).stream().filter(c -> ativos.contains(c.id)).count(),
                        tamanhoRede(e.getKey(), indicadosPor, 1),
                        numero(comissaoPor.getOrDefault(e.getKey(), BigDecimal.ZERO))))
                .sorted(Comparator.comparing((Indicador i) -> new BigDecimal(i.comissaoMes().toString())).reversed()
                        .thenComparing(i -> i.aluno().nome(), ALFABETICA))
                .toList();

        return new ComissoesIndicacoes(
                m.toString(),
                List.of(numero(pct[0]), numero(pct[1]), numero(pct[2])),
                numero(soma(linhas.stream().map(l -> new BigDecimal(l.comissao().toString())).toList())),
                pagamentosComComissao.size(),
                (int) ranking.stream().filter(i -> new BigDecimal(i.comissaoMes().toString()).signum() > 0).count(),
                ranking,
                linhas);
    }

    private static int tamanhoRede(UUID id, Map<UUID, List<Cliente>> indicadosPor, int nivel) {
        if (nivel > 3) return 0;
        int n = 0;
        for (Cliente c : indicadosPor.getOrDefault(id, List.of())) n += 1 + tamanhoRede(c.id, indicadosPor, nivel + 1);
        return n;
    }
}
