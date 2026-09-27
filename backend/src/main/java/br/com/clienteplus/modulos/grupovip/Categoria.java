package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity(name = "GrupoVipCategoria")
@Table(name = "grupo_vip_categorias")
public class Categoria extends EntidadeDaLoja {

    public String nome;
    // "orange" | "sky" | "violet" | "emerald" | "rose" | "amber"
    public String cor;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
