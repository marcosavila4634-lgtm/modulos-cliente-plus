package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Um membro abriu um conteúdo na área do membro.
@Entity(name = "GrupoVipConteudoView")
@Table(name = "grupo_vip_conteudo_views")
public class ConteudoView extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "conteudo_id")
    public Conteudo conteudo;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public OffsetDateTime vistoEm;
}
