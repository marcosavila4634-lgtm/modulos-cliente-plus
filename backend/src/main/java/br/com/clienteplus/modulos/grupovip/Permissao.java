package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Permissões de um membro em um grupo do Telegram (Permissoes.java).
@Entity(name = "GrupoVipPermissao")
@Table(name = "grupo_vip_permissoes")
public class Permissao extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    // escolhido pelo dono: "completo" | "sem_midia" | "leitura"; null = segue o plano
    public String nivel;
    // até quando vale o nível escolhido (null = sem prazo)
    public OffsetDateTime nivelAte;
    public boolean administrador;
    // direitos de administrador, separados por vírgula (ex.: "can_delete_messages,can_pin_messages")
    public String direitos = "";
    // aparece ao lado do nome no grupo (só administradores)
    public String titulo;
    // o que o robô já aplicou no Telegram (null = nunca mexeu)
    public String aplicado;
    public OffsetDateTime tentadoEm;
    public String erro;
}
