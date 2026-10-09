package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Modalidade ensinada (Jiu-Jitsu, Muay Thai...).
@Entity(name = "ArtesMarciaisModalidade")
@Table(name = "artes_marciais_modalidades")
public class Modalidade extends EntidadeDaLoja {

    public String nome;
    public String cor;
    public int ordem;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
