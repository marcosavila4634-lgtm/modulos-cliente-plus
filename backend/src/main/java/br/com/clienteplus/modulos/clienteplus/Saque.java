package br.com.clienteplus.modulos.clienteplus;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Saque de comissão pedido por um cliente (menu "Saques" do Cliente Plus).
@Entity
@Table(name = "cp_saques")
public class Saque extends EntidadeDaLoja {

    public static final String SOLICITADO = "solicitado";
    public static final String PAGO = "pago";
    public static final String RECUSADO = "recusado";

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public BigDecimal valor;
    public String chavePix;
    public String status;
    public String motivo;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    public OffsetDateTime pagoEm;
}
