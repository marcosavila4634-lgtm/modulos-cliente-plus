package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Venda de um serviço a um aluno. A situação é a do pagamento ligado.
@Entity
@Table(name = "academia_vendas")
public class Venda extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "servico_id")
    public Servico servico;

    // quem atendeu (recebe a comissão)
    @ManyToOne
    @JoinColumn(name = "profissional_id")
    public Profissional profissional;

    public int quantidade;
    public BigDecimal valor;
    // copiada do serviço no momento da venda
    public BigDecimal comissaoPct;

    @ManyToOne
    @JoinColumn(name = "pagamento_id")
    public Pagamento pagamento;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
