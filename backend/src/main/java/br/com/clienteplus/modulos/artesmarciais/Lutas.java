package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.Matriculas;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.text.Collator;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

// Utilidades do módulo Artes Marciais: conversões para o JSON, idade, códigos
// e pagamentos avulsos no Cliente Plus.
public final class Lutas {

    private Lutas() {}

    // Pagamentos gerados pelo módulo (taxas, inscrições, loja).
    public static final String ORIGEM = "artes-marciais";
    public static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));
    static final Set<String> FORMAS = Set.of("dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto");

    private static final SecureRandom SORTEIO = new SecureRandom();
    private static final String LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static LocalDate hoje() {
        return Matriculas.hoje();
    }

    // Código curto, sem letras que se confundem (O/0, I/1).
    public static String codigo(int tamanho) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < tamanho; i++) sb.append(LETRAS.charAt(SORTEIO.nextInt(LETRAS.length())));
        return sb.toString();
    }

    public static Integer idade(Cliente c) {
        if (c.dataNascimento == null) return null;
        return Period.between(c.dataNascimento, hoje()).getYears();
    }

    public static String texto(String s) {
        return s == null ? "" : s.trim();
    }

    public static String obrigatorio(String s, String mensagem) {
        if (s == null || s.isBlank()) throw Erro.invalido(mensagem);
        return s.trim();
    }

    public static String cor(String s) {
        if (s == null || !s.matches("#[0-9a-fA-F]{6}")) return null;
        return s.toLowerCase();
    }

    public static BigDecimal dinheiro(BigDecimal v) {
        if (v == null) return BigDecimal.ZERO;
        if (v.signum() < 0) throw Erro.invalido("Valor não pode ser negativo");
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    public static String forma(String forma) {
        if (forma == null || !FORMAS.contains(forma)) throw Erro.invalido("Escolha a forma de pagamento");
        return forma;
    }

    // Pagamento avulso no Cliente Plus (sem assinatura). Pago = pagamento
    // confirmado, que o motor de comissões consome.
    public static Pagamento cobrar(UUID storeId, Cliente aluno, BigDecimal valor, String descricao, boolean pago,
            String formaPagamento, LocalDate vencimento) {
        Pagamento p = new Pagamento();
        p.storeId = storeId;
        p.cliente = aluno;
        p.valor = dinheiro(valor);
        p.vencimento = vencimento != null ? vencimento : hoje();
        p.status = pago ? Pagamento.PAGO : Pagamento.PENDENTE;
        p.pagoEm = pago ? OffsetDateTime.now() : null;
        p.formaPagamento = pago ? forma(formaPagamento) : null;
        p.origem = ORIGEM;
        p.descricao = descricao;
        p.persist();
        return p;
    }

    // "paga" | "pendente" | "atrasada" | "cancelada" | null (sem cobrança)
    public static String situacao(Pagamento p) {
        if (p == null) return null;
        return switch (p.status) {
            case Pagamento.PAGO -> "paga";
            case Pagamento.CANCELADO -> "cancelada";
            default -> p.vencimento.isBefore(hoje()) ? "atrasada" : "pendente";
        };
    }

    public static CobrancaJson cobranca(Pagamento p) {
        if (p == null) return null;
        return new CobrancaJson(p.id, numero(p.valor), p.vencimento, situacao(p), p.formaPagamento);
    }

    public static RefFaixa ref(Faixa f) {
        if (f == null) return null;
        return new RefFaixa(f.id, f.nome, f.cor, f.corPonta);
    }

    public static RefModalidade ref(Modalidade m) {
        if (m == null) return null;
        return new RefModalidade(m.id, m.nome, m.cor);
    }

    public static RefAluno ref(Cliente c) {
        return new RefAluno(c.id, c.nome, c.telefone, idade(c));
    }

    public static FaixaJson json(Faixa f) {
        return new FaixaJson(f.id, f.modalidade.id, f.nome, f.cor, f.corPonta, f.publico, f.ordem, f.grausMaximos,
                f.mesesMinimos, f.aulasMinimas, f.aulasPorGrau, f.idadeMinima, numero(f.taxaExame), f.ativo);
    }

    // "Azul · 2 graus"
    public static String faixaComGrau(Faixa f, int grau) {
        if (grau <= 0) return f.nome;
        return f.nome + " · " + grau + (grau == 1 ? " grau" : " graus");
    }
}
