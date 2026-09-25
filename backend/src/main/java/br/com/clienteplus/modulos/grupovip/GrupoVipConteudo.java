package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Um conteúdo publicado nos grupos.
@Entity
@Table(name = "grupo_vip_conteudos")
public class GrupoVipConteudo extends EntidadeDaLoja {

    public String titulo;
    public int acessos;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
