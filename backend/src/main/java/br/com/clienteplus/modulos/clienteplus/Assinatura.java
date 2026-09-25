package br.com.clienteplus.modulos.clienteplus;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Assinatura de um plano por um cliente. No módulo Academia, é a matrícula.
@Entity
@Table(name = "cp_assinaturas")
public class Assinatura extends EntidadeDaLoja {

    public static final String ATIVA = "ativa";
    public static final String CANCELADA = "cancelada";

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "plano_id")
    public Plano plano;

    // preço do plano no dia da matrícula
    public BigDecimal valor;
    public String status;
    public LocalDate inicio;
    public OffsetDateTime canceladaEm;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
