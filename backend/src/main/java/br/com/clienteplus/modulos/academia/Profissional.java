package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Professor ou outro profissional da academia.
@Entity
@Table(name = "academia_profissionais")
public class Profissional extends EntidadeDaLoja {

    public String nome;
    public String especialidade;
    public String telefone;
    public String email;
    // ex.: CREF
    public String registro;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
