package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Responsável por alunos menores.
@Entity(name = "ArtesMarciaisResponsavel")
@Table(name = "artes_marciais_responsaveis")
public class Responsavel extends EntidadeDaLoja {

    public String nome;
    public String telefone;
    public String email;
    public String cpf;
    public String codigo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
