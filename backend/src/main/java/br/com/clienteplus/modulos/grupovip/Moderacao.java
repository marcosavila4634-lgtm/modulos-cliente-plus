package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Mensagem apagada pela moderação automática do robô.
@Entity(name = "GrupoVipModeracao")
@Table(name = "grupo_vip_moderacao")
public class Moderacao extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    public long telegramUsuarioId;
    public String nome;
    // "link" | "palavra"
    public String motivo;
    public String detalhe;
    public String texto;
    public OffsetDateTime silenciadoAte;
    public OffsetDateTime momento;
}
