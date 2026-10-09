package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Técnica do currículo de uma faixa.
@Entity(name = "ArtesMarciaisTecnica")
@Table(name = "artes_marciais_tecnicas")
public class Tecnica extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    public Modalidade modalidade;

    @ManyToOne
    @JoinColumn(name = "faixa_id")
    public Faixa faixa;

    public String categoria;
    public String nome;
    public String descricao;
    public String videoUrl;
    public int ordem;
}
