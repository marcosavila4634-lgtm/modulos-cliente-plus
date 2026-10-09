package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Aluno menor ligado a um responsável.
@Entity(name = "ArtesMarciaisDependente")
@Table(name = "artes_marciais_dependentes")
public class Dependente extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "responsavel_id")
    public Responsavel responsavel;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public String parentesco;
}
