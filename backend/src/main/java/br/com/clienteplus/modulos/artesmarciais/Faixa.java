package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

// Faixa/nível de uma modalidade. Requisitos valem para SAIR dela.
@Entity(name = "ArtesMarciaisFaixa")
@Table(name = "artes_marciais_faixas")
public class Faixa extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    public Modalidade modalidade;

    public String nome;
    public String cor;
    public String corPonta;
    // "adulto" | "infantil" | "todos"
    public String publico;
    public int ordem;
    public int grausMaximos;
    public int mesesMinimos;
    public int aulasMinimas;
    public int aulasPorGrau;
    public Integer idadeMinima;
    public BigDecimal taxaExame;
    public boolean ativo;
}
