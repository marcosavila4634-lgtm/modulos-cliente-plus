package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Tópico de um grupo do Telegram no modo fórum.
@Entity(name = "GrupoVipTopico")
@Table(name = "grupo_vip_telegram_topicos")
public class Topico extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    public String nome;
    // message_thread_id no Telegram
    public long threadId;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
