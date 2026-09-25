package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// Cabeçalho do painel: nome da academia, gestor e frase motivacional.
@Entity
@Table(name = "academia_painel")
public class AcademiaPainel extends EntidadeDaLoja {

    public String nomeAcademia;
    public String gestorNome;
    public String gestorCargo;
    public String frase;
}
