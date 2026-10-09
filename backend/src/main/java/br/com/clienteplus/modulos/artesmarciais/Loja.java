package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.hoje;
import static br.com.clienteplus.modulos.artesmarciais.Lutas.ref;
import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.Matriculas;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Uniformes e loja: produtos com tamanhos e estoque, vendas aos alunos
// (viram cobrança avulsa no Cliente Plus) e movimentos de estoque.
@ApplicationScoped
public class Loja {

    static final Set<String> CATEGORIAS = Set.of("kimono", "faixa", "rashguard", "bermuda", "luvas", "protecao",
            "camiseta", "acessorio", "outro");

    @Inject
    Matriculas matriculas;

    public Produto produto(UUID storeId, UUID id) {
        Produto p = id != null ? Produto.findById(id) : null;
        if (p == null || !p.storeId.equals(storeId)) throw Erro.naoEncontrado("Produto não encontrado");
        return p;
    }

    static ProdutoJson json(Produto p, int vendidosMes) {
        List<TamanhoJson> ts = p.tamanhos.stream()
                .map(t -> new TamanhoJson(t.id, t.tamanho, t.estoque, t.estoqueMinimo))
                .toList();
        return new ProdutoJson(p.id, p.nome, p.categoria, p.descricao, numero(p.preco), numero(p.custo), p.foto,
                p.participaIndicacoes, p.ativo, ts, ts.stream().mapToInt(TamanhoJson::estoque).sum(),
                p.ativo && p.tamanhos.stream().anyMatch(t -> t.estoque <= t.estoqueMinimo), vendidosMes);
    }

    static VendaJson json(VendaLoja v) {
        return new VendaJson(v.id, ref(v.cliente),
                v.itens.stream().map(i -> new ItemVendaJson(i.nome, i.tamanho, i.quantidade, numero(i.precoUnitario))).toList(),
                numero(v.total), Lutas.cobranca(v.pagamento), v.status, v.entregue, v.observacao, v.createdAt);
    }

    public PainelLoja painel(UUID storeId) {
        YearMonth mes = YearMonth.from(hoje());
        OffsetDateTime inicioMes = mes.atDay(1).atStartOfDay(FUSO).toOffsetDateTime();
        List<VendaLoja> vendas = VendaLoja.list("storeId = ?1 order by createdAt desc", storeId);

        Map<UUID, Integer> vendidos = new HashMap<>();
        BigDecimal vendido = BigDecimal.ZERO;
        BigDecimal custo = BigDecimal.ZERO;
        for (VendaLoja v : vendas) {
            if (!"ativa".equals(v.status) || v.createdAt.isBefore(inicioMes)) continue;
            vendido = vendido.add(v.total);
            for (VendaLojaItem i : v.itens) {
                vendidos.merge(i.produto.id, i.quantidade, Integer::sum);
                custo = custo.add(i.produto.custo.multiply(BigDecimal.valueOf(i.quantidade)));
            }
        }
        List<Produto> produtos = Produto.list("storeId = ?1 order by categoria, nome", storeId);
        List<ProdutoJson> lista = produtos.stream().map(p -> json(p, vendidos.getOrDefault(p.id, 0))).toList();
        BigDecimal emEstoque = produtos.stream()
                .filter(p -> p.ativo)
                .map(p -> p.custo.multiply(BigDecimal.valueOf(p.tamanhos.stream().mapToInt(t -> Math.max(0, t.estoque)).sum())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PainelLoja(lista, vendas.stream().limit(60).map(Loja::json).toList(), numero(vendido),
                numero(vendido.subtract(custo)), (int) lista.stream().filter(ProdutoJson::estoqueBaixo).count(),
                numero(emEstoque));
    }

    public List<ProdutoJson> vitrine(UUID storeId) {
        return Produto.<Produto>list("storeId = ?1 and ativo = true order by categoria, nome", storeId).stream()
                .map(p -> json(p, 0))
                .toList();
    }

    @Transactional
    public Produto salvar(UUID storeId, UUID id, DadosProduto d) {
        if (d == null) throw Erro.invalido("Dados do produto");
        Produto p;
        if (id == null) {
            p = new Produto();
            p.storeId = storeId;
            p.ativo = true;
        } else {
            p = produto(storeId, id);
        }
        p.nome = Lutas.obrigatorio(d.nome(), "Dê um nome para o produto");
        p.categoria = d.categoria() != null && CATEGORIAS.contains(d.categoria()) ? d.categoria() : "outro";
        p.descricao = Lutas.texto(d.descricao());
        if (d.preco() == null) throw Erro.invalido("Informe o preço");
        p.preco = Lutas.dinheiro(d.preco());
        p.custo = Lutas.dinheiro(d.custo());
        String foto = Lutas.texto(d.foto());
        if (!foto.isEmpty() && !foto.startsWith("/") && !foto.matches("https?://.+")) throw Erro.invalido("Foto inválida");
        p.foto = foto;
        p.participaIndicacoes = Boolean.TRUE.equals(d.participaIndicacoes());
        if (d.ativo() != null) p.ativo = d.ativo();

        // Tamanhos: mantém os que continuam (com o estoque), cria os novos e
        // apaga os removidos que não têm estoque nem vendas.
        List<DadosTamanho> pedidos = d.tamanhos() != null && !d.tamanhos().isEmpty() ? d.tamanhos()
                : List.of(new DadosTamanho(null, "Único", 1));
        Set<UUID> mantidos = new HashSet<>();
        Set<String> nomes = new HashSet<>();
        int ordem = 0;
        for (DadosTamanho dt : pedidos) {
            String nome = Lutas.obrigatorio(dt.tamanho(), "Preencha o nome de cada tamanho");
            if (!nomes.add(nome.toUpperCase())) throw Erro.invalido("Tamanho repetido: " + nome);
            ProdutoTamanho t = dt.id() != null
                    ? p.tamanhos.stream().filter(x -> x.id.equals(dt.id())).findFirst().orElse(null) : null;
            if (t == null) {
                t = new ProdutoTamanho();
                t.storeId = storeId;
                t.produto = p;
                t.estoque = 0;
                p.tamanhos.add(t);
            } else {
                mantidos.add(t.id);
            }
            t.tamanho = nome;
            t.estoqueMinimo = dt.estoqueMinimo() != null && dt.estoqueMinimo() >= 0 ? dt.estoqueMinimo() : 1;
            t.ordem = ordem++;
        }
        List<ProdutoTamanho> remover = new ArrayList<>();
        for (ProdutoTamanho t : p.tamanhos) {
            if (t.id == null || mantidos.contains(t.id)) continue;
            if (t.estoque != 0 || VendaLojaItem.count("tamanhoProduto", t) > 0) {
                throw Erro.conflito("O tamanho " + t.tamanho + " tem estoque ou vendas. Zere o estoque antes de tirar.");
            }
            remover.add(t);
        }
        remover.forEach(t -> {
            MovimentoEstoque.delete("tamanhoProduto", t);
            p.tamanhos.remove(t);
        });
        p.persistAndFlush();
        return p;
    }

    @Transactional
    public void movimentar(UUID storeId, UUID produtoId, DadosMovimento d) {
        Produto p = produto(storeId, produtoId);
        if (d == null || d.tamanhoId() == null) throw Erro.invalido("Escolha o tamanho");
        ProdutoTamanho t = p.tamanhos.stream().filter(x -> x.id.equals(d.tamanhoId())).findFirst()
                .orElseThrow(() -> Erro.naoEncontrado("Tamanho não encontrado"));
        if (d.quantidade() == null || d.quantidade() == 0) throw Erro.invalido("Informe a quantidade");
        String motivo = "ajuste".equals(d.motivo()) ? "ajuste" : "entrada";
        if ("entrada".equals(motivo) && d.quantidade() < 0) throw Erro.invalido("Na entrada, a quantidade é positiva");
        if (t.estoque + d.quantidade() < 0) throw Erro.conflito("O estoque não pode ficar negativo");
        t.estoque += d.quantidade();
        movimento(storeId, t, d.quantidade(), motivo, Lutas.texto(d.observacao()));
    }

    private static void movimento(UUID storeId, ProdutoTamanho t, int qtd, String motivo, String obs) {
        MovimentoEstoque m = new MovimentoEstoque();
        m.storeId = storeId;
        m.tamanhoProduto = t;
        m.quantidade = qtd;
        m.motivo = motivo;
        m.observacao = obs;
        m.persist();
    }

    @Transactional
    public VendaLoja vender(UUID storeId, NovaVenda d) {
        if (d == null || d.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        if (d.itens() == null || d.itens().isEmpty()) throw Erro.invalido("Coloque pelo menos um produto");
        Cliente aluno = matriculas.aluno(storeId, d.alunoId());
        boolean pago = Boolean.TRUE.equals(d.pago());

        VendaLoja v = new VendaLoja();
        v.storeId = storeId;
        v.cliente = aluno;
        v.status = "ativa";
        v.entregue = !Boolean.FALSE.equals(d.entregue());
        v.observacao = Lutas.texto(d.observacao());
        BigDecimal total = BigDecimal.ZERO;
        List<String> nomes = new ArrayList<>();
        for (ItemPedido ip : d.itens()) {
            Produto p = produto(storeId, ip.produtoId());
            if (!p.ativo) throw Erro.conflito(p.nome + " está fora de venda");
            int qtd = ip.quantidade() != null ? ip.quantidade() : 1;
            if (qtd < 1 || qtd > 100) throw Erro.invalido("Quantidade: de 1 a 100");
            ProdutoTamanho t = p.tamanhos.stream().filter(x -> x.id.equals(ip.tamanhoId())).findFirst()
                    .orElseThrow(() -> Erro.invalido("Escolha o tamanho de " + p.nome));
            if (t.estoque < qtd) {
                throw Erro.conflito(p.nome + " (" + t.tamanho + "): só " + Math.max(0, t.estoque) + " em estoque");
            }
            t.estoque -= qtd;
            VendaLojaItem i = new VendaLojaItem();
            i.storeId = storeId;
            i.venda = v;
            i.produto = p;
            i.tamanhoProduto = t;
            i.nome = p.nome;
            i.tamanho = t.tamanho;
            i.quantidade = qtd;
            i.precoUnitario = p.preco;
            v.itens.add(i);
            total = total.add(p.preco.multiply(BigDecimal.valueOf(qtd)));
            nomes.add(p.nome + (qtd > 1 ? " (" + qtd + "x)" : ""));
        }
        BigDecimal desconto = Lutas.dinheiro(d.desconto());
        if (desconto.compareTo(total) > 0) throw Erro.invalido("O desconto é maior que o total");
        v.total = total.subtract(desconto);
        v.pagamento = Lutas.cobrar(storeId, aluno, v.total, "Loja: " + String.join(", ", nomes), pago,
                d.formaPagamento(), d.vencimento());
        v.persistAndFlush();
        for (VendaLojaItem i : v.itens) movimento(storeId, i.tamanhoProduto, -i.quantidade, "venda", "");
        return v;
    }

    VendaLoja venda(UUID storeId, UUID id) {
        VendaLoja v = VendaLoja.findById(id);
        if (v == null || !v.storeId.equals(storeId)) throw Erro.naoEncontrado("Venda não encontrada");
        return v;
    }

    // Cancela a venda: os produtos voltam para o estoque.
    @Transactional
    public void cancelar(UUID storeId, UUID id) {
        VendaLoja v = venda(storeId, id);
        if (!"ativa".equals(v.status)) throw Erro.conflito("Esta venda já foi cancelada");
        if (Pagamento.PAGO.equals(v.pagamento.status)) {
            throw Erro.conflito("Esta venda já foi paga. Registre a devolução em Despesas antes de cancelar.");
        }
        v.pagamento.status = Pagamento.CANCELADO;
        v.status = "cancelada";
        for (VendaLojaItem i : v.itens) {
            if (i.tamanhoProduto == null) continue;
            i.tamanhoProduto.estoque += i.quantidade;
            movimento(storeId, i.tamanhoProduto, i.quantidade, "cancelamento", "");
        }
    }

    @Transactional
    public void entregar(UUID storeId, UUID id) {
        venda(storeId, id).entregue = true;
    }
}
