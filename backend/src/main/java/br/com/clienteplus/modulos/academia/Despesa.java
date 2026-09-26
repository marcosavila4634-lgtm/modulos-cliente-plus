package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Despesa da academia (aluguel, salários, energia...).
@Entity
@Table(name = "academia_despesas")
public class Despesa extends EntidadeDaLoja {

    public static final String PENDENTE = "pendente";
    public static final String PAGA = "paga";
    public static final String CANCELADA = "cancelada";

    public String descricao;
    public String categoria;
    public String fornecedor;
    public BigDecimal valor;
    public LocalDate vencimento;
    // "pendente" | "paga" | "cancelada" ("atrasada" = pendente vencida, calculado)
    public String status;
    public OffsetDateTime pagoEm;
    public String formaPagamento;
    // mensal: ao pagar, cria a do mês seguinte
    public boolean recorrente;
    public String observacao;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
