package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Bloqueio manual do acesso de um aluno. Ativo enquanto removidoEm for nulo.
@Entity
@Table(name = "academia_bloqueios")
public class Bloqueio extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public String motivo;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    public OffsetDateTime removidoEm;
}
