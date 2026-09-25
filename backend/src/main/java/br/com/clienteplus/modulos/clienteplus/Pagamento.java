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

// Uma mensalidade de uma assinatura. Os pagamentos com status "pago" são os
// pagamentos confirmados que geram comissões de indicação no Cliente Plus.
@Entity
@Table(name = "cp_pagamentos")
public class Pagamento extends EntidadeDaLoja {

    public static final String PENDENTE = "pendente";
    public static final String PAGO = "pago";
    public static final String CANCELADO = "cancelado";

    @ManyToOne
    @JoinColumn(name = "assinatura_id")
    public Assinatura assinatura;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public BigDecimal valor;
    public LocalDate vencimento;
    public String status;
    public OffsetDateTime pagoEm;
    // "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto"
    public String formaPagamento;
    // módulo que registrou o pagamento (ex.: "academia")
    public String origem;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
