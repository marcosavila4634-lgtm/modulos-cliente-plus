package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Uma live ou evento agendado.
@Entity
@Table(name = "grupo_vip_eventos")
public class GrupoVipEvento extends EntidadeDaLoja {

    public String titulo;
    public String foto;
    // "ao_vivo" | "em_breve"
    public String status;
    public OffsetDateTime comecaEm;
}
