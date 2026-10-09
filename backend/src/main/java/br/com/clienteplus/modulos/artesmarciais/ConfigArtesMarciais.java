package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Ajustes do módulo (uma linha por loja).
@Entity(name = "ArtesMarciaisConfig")
@Table(name = "artes_marciais_config")
public class ConfigArtesMarciais extends EntidadeDaLoja {

    // "aulas" (presença nas aulas da modalidade) | "checkins" (dias com entrada)
    public String contarAulasPor;
    public int idadeAdulto;
    public String lema;
    public String codigoPresenca;
    public OffsetDateTime updatedAt;
}
