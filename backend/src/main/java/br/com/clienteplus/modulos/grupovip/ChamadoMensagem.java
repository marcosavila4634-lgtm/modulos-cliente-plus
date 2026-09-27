package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity(name = "GrupoVipChamadoMensagem")
@Table(name = "grupo_vip_chamado_mensagens")
public class ChamadoMensagem extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "chamado_id")
    public Chamado chamado;

    // "membro" | "equipe"
    public String autor;
    public String texto;
    public OffsetDateTime createdAt;
}
