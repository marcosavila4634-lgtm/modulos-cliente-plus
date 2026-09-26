package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.AgendaContrato.*;
import br.com.clienteplus.modulos.academia.AlunosContrato.Cobranca;
import br.com.clienteplus.modulos.academia.TreinosContrato.Referencia;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

// Regras dos serviços avulsos e das vendas.
//
// - Vender = criar um pagamento no Cliente Plus (sem assinatura) com a
//   descrição do serviço. Ele aparece no Faturamento e é recebido como uma
//   mensalidade (sem gerar a próxima).
// - A comissão do profissional (% do serviço, copiada na venda) só conta
//   depois que o pagamento é recebido.
@ApplicationScoped
public class Servicos {

    static final Set<String> CATEGORIAS = Set.of("personal", "avaliacao", "nutricao", "fisioterapia", "massagem",
            "aula_avulsa", "day_use", "outro");

    // ---------- Conversões ----------

    static ServicoJson json(Servico s, int vendasMes, BigDecimal receitaMes) {
        return new ServicoJson(
                s.id,
                s.nome,
                s.descricao,
                s.categoria,
                numero(s.preco),
                s.duracaoMinutos,
                s.profissional != null ? new Referencia(s.profissional.id, s.profissional.nome) : null,
                numero(s.comissaoPct),
                s.participaIndicacoes,
                s.ativo,
                vendasMes,
                numero(receitaMes));
    }

    static VendaJson json(Venda v) {
        Cobranca c = Matriculas.cobranca(v.pagamento);
        return new VendaJson(
                v.id,
                new Referencia(v.cliente.id, v.cliente.nome),
                new Referencia(v.servico.id, v.servico.nome),
                v.profissional != null ? new Referencia(v.profissional.id, v.profissional.nome) : null,
                v.quantidade,
                numero(v.valor),
                numero(v.comissaoPct),
                c.status(),
                c.vencimento(),
                c.pagoEm(),
                c.formaPagamento(),
                v.pagamento.id,
                v.createdAt);
    }

    // ---------- Serviços ----------

    public Servico servico(UUID storeId, UUID id) {
        Servico s = Servico.findById(id);
        if (s == null || !s.storeId.equals(storeId)) throw Erro.naoEncontrado("Serviço não encontrado");
        return s;
    }

    @Transactional
    public Servico salvar(UUID storeId, UUID id, DadosServico d) {
        Servico s;
        if (id == null) {
            s = new Servico();
            s.storeId = storeId;
            s.ativo = true;
        } else {
            s = servico(storeId, id);
        }
        if (d == null || d.nome() == null || d.nome().isBlank()) throw Erro.invalido("Dê um nome para o serviço");
        if (d.categoria() == null || !CATEGORIAS.contains(d.categoria())) throw Erro.invalido("Escolha a categoria");
        if (d.preco() == null || d.preco().signum() < 0) throw Erro.invalido("Informe o preço");
        if (d.duracaoMinutos() != null && (d.duracaoMinutos() < 5 || d.duracaoMinutos() > 480)) {
            throw Erro.invalido("Duração: de 5 a 480 minutos");
        }
        BigDecimal comissao = d.comissaoPct() != null ? d.comissaoPct() : BigDecimal.ZERO;
        if (comissao.signum() < 0 || comissao.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw Erro.invalido("Comissão do profissional: de 0 a 100%");
        }
        Profissional prof = null;
        if (d.profissionalId() != null) {
            prof = Profissional.findById(d.profissionalId());
            if (prof == null || !prof.storeId.equals(storeId)) throw Erro.invalido("Profissional não encontrado");
        }
        s.nome = d.nome().trim();
        s.descricao = d.descricao() != null ? d.descricao().trim() : "";
        s.categoria = d.categoria();
        s.preco = d.preco().setScale(2, RoundingMode.HALF_UP);
        s.duracaoMinutos = d.duracaoMinutos();
        s.profissional = prof;
        s.comissaoPct = comissao.setScale(2, RoundingMode.HALF_UP);
        s.participaIndicacoes = Boolean.TRUE.equals(d.participaIndicacoes());
        if (d.ativo() != null) s.ativo = d.ativo();
        s.persist();
        return s;
    }

    // ---------- Vendas ----------

    @Transactional
    public Venda vender(UUID storeId, Cliente aluno, NovaVenda d) {
        if (d == null || d.servicoId() == null) throw Erro.invalido("Escolha o serviço");
        Servico s = servico(storeId, d.servicoId());
        if (!s.ativo) throw Erro.conflito("Este serviço está desativado");
        int qtd = d.quantidade() != null ? d.quantidade() : 1;
        if (qtd < 1 || qtd > 100) throw Erro.invalido("Quantidade: de 1 a 100");
        BigDecimal valor = d.valor() != null ? d.valor() : s.preco.multiply(BigDecimal.valueOf(qtd));
        if (valor.signum() < 0) throw Erro.invalido("Valor inválido");

        Profissional prof = s.profissional;
        if (d.profissionalId() != null) {
            prof = Profissional.findById(d.profissionalId());
            if (prof == null || !prof.storeId.equals(storeId)) throw Erro.invalido("Profissional não encontrado");
        }

        boolean receber = Boolean.TRUE.equals(d.receberAgora());
        if (receber && (d.formaPagamento() == null || !Matriculas.FORMAS_PAGAMENTO.contains(d.formaPagamento()))) {
            throw Erro.invalido("Escolha a forma de pagamento");
        }

        Pagamento p = new Pagamento();
        p.storeId = storeId;
        p.cliente = aluno;
        p.valor = valor.setScale(2, RoundingMode.HALF_UP);
        p.vencimento = d.vencimento() != null ? d.vencimento() : Matriculas.hoje();
        p.status = receber ? Pagamento.PAGO : Pagamento.PENDENTE;
        p.pagoEm = receber ? OffsetDateTime.now() : null;
        p.formaPagamento = receber ? d.formaPagamento() : null;
        p.origem = "academia";
        p.descricao = s.nome + (qtd > 1 ? " (" + qtd + "x)" : "");
        p.persist();

        Venda v = new Venda();
        v.storeId = storeId;
        v.cliente = aluno;
        v.servico = s;
        v.profissional = prof;
        v.quantidade = qtd;
        v.valor = p.valor;
        v.comissaoPct = s.comissaoPct;
        v.pagamento = p;
        v.persistAndFlush();
        return v;
    }

    @Transactional
    public void cancelar(UUID storeId, UUID vendaId) {
        Venda v = Venda.findById(vendaId);
        if (v == null || !v.storeId.equals(storeId)) throw Erro.naoEncontrado("Venda não encontrada");
        if (Pagamento.PAGO.equals(v.pagamento.status)) {
            throw Erro.conflito("Esta venda já foi paga. Para devolver, registre a saída em Despesas.");
        }
        v.pagamento.status = Pagamento.CANCELADO;
    }
}
