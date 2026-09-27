package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Dados do cliente que são só do módulo Grupos VIP.
@Entity(name = "GrupoVipMembro")
@Table(name = "grupo_vip_membros")
public class Membro extends EntidadeDaLoja {

    @OneToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    // link de indicação e acesso à área do membro
    public String codigo;
    // @usuario do Telegram, sem o @
    public String telegramUsuario;
    // preenchido quando a pessoa fala com o robô
    public Long telegramId;
    // bloqueio manual: perde o acesso mesmo pagando
    public boolean bloqueado;
    public String observacoes;
    // "manual" | "pagina"
    public String origem;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
