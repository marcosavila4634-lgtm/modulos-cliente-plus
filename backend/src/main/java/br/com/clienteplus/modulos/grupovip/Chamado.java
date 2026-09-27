package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Conversa de suporte entre um membro e a equipe.
@Entity(name = "GrupoVipChamado")
@Table(name = "grupo_vip_chamados")
public class Chamado extends EntidadeDaLoja {

    public static final String ABERTO = "aberto";
    public static final String RESPONDIDO = "respondido";
    public static final String RESOLVIDO = "resolvido";

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public String assunto;
    public String status;
    // "area" (área do membro) | "telegram" (conversa com o robô)
    public String origem;
    public OffsetDateTime createdAt;
    public OffsetDateTime atualizadoEm;
}
