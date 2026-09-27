package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Situação de um membro em um grupo.
@Entity(name = "GrupoVipAcesso")
@Table(name = "grupo_vip_acessos")
public class Acesso extends EntidadeDaLoja {

    public static final String CONVIDADO = "convidado";
    public static final String NO_GRUPO = "no_grupo";
    public static final String REMOVIDO = "removido";

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    // "convidado" | "no_grupo" | "removido"
    public String status;
    public String conviteLink;
    public OffsetDateTime conviteCriadoEm;
    public OffsetDateTime entrouEm;
    public OffsetDateTime removidoEm;
    public OffsetDateTime atualizadoEm;
}
