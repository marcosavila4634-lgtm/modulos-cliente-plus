package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Um grupo vendido, no Telegram ou no WhatsApp.
@Entity
@Table(name = "grupo_vip_grupos")
public class GrupoVipGrupo extends EntidadeDaLoja {

    public String nome;
    // "telegram" | "whatsapp"
    public String plataforma;
    public int membros;
    // "blue" | "sky" | "violet" | "indigo" | "amber"
    public String cor;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
