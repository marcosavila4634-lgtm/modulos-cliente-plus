package br.com.clienteplus.modulos.clienteplus;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Plano/produto do lojista (ex.: Mensal, Trimestral).
@Entity
@Table(name = "cp_planos")
public class Plano extends EntidadeDaLoja {

    public String nome;
    public String descricao;
    public BigDecimal preco;
    // de quantos em quantos meses é cobrado
    public int duracaoMeses;
    // se gera comissão de indicação
    public boolean participaIndicacoes;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
