package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Livro pedido ao robô por um membro.
@Entity(name = "GrupoVipLivroPedido")
@Table(name = "grupo_vip_livro_pedidos")
public class LivroPedido extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "livro_id")
    public Livro livro;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public OffsetDateTime momento;
}
