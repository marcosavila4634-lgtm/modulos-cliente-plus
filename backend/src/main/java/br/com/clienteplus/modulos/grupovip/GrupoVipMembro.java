package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.OffsetDateTime;

// Um membro que assinou um plano para entrar em um grupo.
@Entity
@Table(name = "grupo_vip_membros")
public class GrupoVipMembro extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public GrupoVipGrupo grupo;

    public String nome;
    public String foto;
    // "Básico" | "VIP" | "Premium" | "Cortesia"
    public String plano;
    // "ativo" | "pendente"
    public String status;
    public OffsetDateTime entrouEm;
}
