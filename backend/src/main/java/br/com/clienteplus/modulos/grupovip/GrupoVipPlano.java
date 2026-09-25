package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// Percentual de membros em um plano.
@Entity
@Table(name = "grupo_vip_planos")
public class GrupoVipPlano extends EntidadeDaLoja {

    public String nome;
    public int percentualMembros;
    public int ordem;
}
