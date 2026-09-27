package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Um grupo liberado por um plano do Cliente Plus.
@Entity(name = "GrupoVipPlanoGrupo")
@Table(name = "grupo_vip_plano_grupos")
public class PlanoGrupo extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "plano_id")
    public Plano plano;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;
}
