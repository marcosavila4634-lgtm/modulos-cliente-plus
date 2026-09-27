package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Live ou evento. grupo vazio = para todos os grupos.
@Entity(name = "GrupoVipEvento")
@Table(name = "grupo_vip_eventos")
public class Evento extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    public String titulo;
    public String descricao;
    public String foto;
    public String link;
    public OffsetDateTime comecaEm;
    public int duracaoMinutos;
    public int avisoMinutos;
    public OffsetDateTime avisadoEm;
    public boolean cancelado;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    // "cancelado" | "encerrado" | "ao_vivo" | "agendado"
    public String status() {
        if (cancelado) return "cancelado";
        OffsetDateTime agora = OffsetDateTime.now();
        if (agora.isAfter(comecaEm.plusMinutes(duracaoMinutos))) return "encerrado";
        if (!agora.isBefore(comecaEm)) return "ao_vivo";
        return "agendado";
    }
}
