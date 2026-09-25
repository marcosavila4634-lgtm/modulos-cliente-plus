package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Avaliação física de um aluno.
@Entity
@Table(name = "academia_avaliacoes")
public class Avaliacao extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "profissional_id")
    public Profissional profissional;

    public LocalDate data;
    // "M" | "F"
    public String sexo;
    public Integer idade;
    public BigDecimal peso;
    public BigDecimal alturaCm;
    // "nenhum" | "bioimpedancia" | "dobras_pollock7"
    public String metodoGordura;
    public BigDecimal gorduraPct;

    // dobras cutâneas (mm)
    public BigDecimal dobraPeitoral;
    public BigDecimal dobraAxilar;
    public BigDecimal dobraTriceps;
    public BigDecimal dobraSubescapular;
    public BigDecimal dobraAbdominal;
    public BigDecimal dobraSuprailiaca;
    public BigDecimal dobraCoxa;

    // circunferências (cm)
    public BigDecimal medidaPeitoral;
    public BigDecimal medidaCintura;
    public BigDecimal medidaAbdomen;
    public BigDecimal medidaQuadril;
    public BigDecimal medidaBracoDireito;
    public BigDecimal medidaBracoEsquerdo;
    public BigDecimal medidaCoxaDireita;
    public BigDecimal medidaCoxaEsquerda;
    public BigDecimal medidaPanturrilha;

    public Integer pressaoSistolica;
    public Integer pressaoDiastolica;
    public Integer fcRepouso;
    public String objetivo;
    // lesões, doenças, medicamentos
    public String restricoes;
    public String observacoes;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
