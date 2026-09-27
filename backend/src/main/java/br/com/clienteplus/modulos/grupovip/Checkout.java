package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Uma compra feita pela página de vendas.
@Entity(name = "GrupoVipCheckout")
@Table(name = "grupo_vip_checkouts")
public class Checkout extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "plano_id")
    public Plano plano;

    @ManyToOne
    @JoinColumn(name = "pagamento_id")
    public Pagamento pagamento;

    @ManyToOne
    @JoinColumn(name = "cupom_id")
    public Cupom cupom;

    public BigDecimal preco;
    public BigDecimal desconto;
    public String indicadoPorCodigo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
