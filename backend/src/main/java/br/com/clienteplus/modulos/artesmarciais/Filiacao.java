package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Filiação do aluno a uma federação.
@Entity(name = "ArtesMarciaisFiliacao")
@Table(name = "artes_marciais_filiacoes")
public class Filiacao extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public String entidade;
    public String numero;
    public LocalDate validade;
    public String observacao;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
