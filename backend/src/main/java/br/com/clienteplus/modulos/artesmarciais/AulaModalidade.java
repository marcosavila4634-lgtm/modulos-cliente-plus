package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.academia.Aula;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Modalidade de uma aula do módulo Academia.
@Entity(name = "ArtesMarciaisAulaModalidade")
@Table(name = "artes_marciais_aula_modalidades")
public class AulaModalidade extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "aula_id")
    public Aula aula;

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    public Modalidade modalidade;

    public String publico;
}
