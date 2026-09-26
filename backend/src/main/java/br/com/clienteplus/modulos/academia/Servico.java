package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Serviço avulso vendido pela academia (personal, nutricionista, day use...).
@Entity
@Table(name = "academia_servicos")
public class Servico extends EntidadeDaLoja {

    public String nome;
    public String descricao;
    // "personal" | "avaliacao" | "nutricao" | "fisioterapia" | "massagem" | "aula_avulsa" | "day_use" | "outro"
    public String categoria;
    public BigDecimal preco;
    // null = não é agendado
    public Integer duracaoMinutos;

    // quem costuma atender
    @ManyToOne
    @JoinColumn(name = "profissional_id")
    public Profissional profissional;

    // % do valor que vai para o profissional que atendeu
    public BigDecimal comissaoPct;
    // gera comissão de indicação no Cliente Plus?
    public boolean participaIndicacoes;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
