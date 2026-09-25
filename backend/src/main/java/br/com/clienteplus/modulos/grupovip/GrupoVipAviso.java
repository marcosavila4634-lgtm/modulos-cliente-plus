package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Um aviso enviado aos membros.
@Entity
@Table(name = "grupo_vip_avisos")
public class GrupoVipAviso extends EntidadeDaLoja {

    // "conteudo" | "manutencao" | "live" | "material"
    public String tipo;
    public String titulo;
    // "enviado"
    public String status;
    public OffsetDateTime enviadoEm;
}
